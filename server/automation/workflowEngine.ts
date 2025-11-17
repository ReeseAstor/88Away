import { EventStreamService } from '../events/eventStream';
import { NotificationService } from '../events/notificationService';
import type { BaseEvent } from '../events/eventSchema';
import { EventCategory } from '../events/eventSchema';
import Redis from 'ioredis';

/**
 * Workflow Orchestration Engine
 * Automates routine tasks and coordinates complex multi-step processes
 */

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ActionType {
  HTTP_REQUEST = 'http_request',
  DATABASE_OPERATION = 'database_operation',
  EMAIL_SEND = 'email_send',
  SMS_SEND = 'sms_send',
  NOTIFICATION = 'notification',
  AI_GENERATION = 'ai_generation',
  FILE_OPERATION = 'file_operation',
  DELAY = 'delay',
  CONDITION = 'condition',
  LOOP = 'loop',
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual' | 'webhook';
  eventType?: string;
  eventCategory?: EventCategory;
  schedule?: string; // Cron expression
  conditions?: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, any>;
  dependsOn?: string[]; // IDs of actions that must complete first
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
  };
  timeout?: number; // milliseconds
  onError?: 'fail' | 'continue' | 'retry' | 'rollback';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  status: WorkflowStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  enabled: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  triggerData: Record<string, any>;
  actionResults: Map<string, ActionResult>;
  error?: string;
  logs: WorkflowLog[];
}

export interface ActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt: Date;
  output?: any;
  error?: string;
  retries: number;
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  actionId?: string;
  data?: any;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private eventStream: EventStreamService;
  private notificationService: NotificationService;
  private redis: Redis;
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private actionHandlers: Map<ActionType, ActionHandler> = new Map();

  private constructor() {
    this.eventStream = EventStreamService.getInstance();
    this.notificationService = NotificationService.getInstance();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    
    this.setupActionHandlers();
    this.subscribeToTriggers();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Register a new workflow
   */
  public async registerWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'>): Promise<Workflow> {
    const fullWorkflow: Workflow = {
      ...workflow,
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
      successCount: 0,
      failureCount: 0,
    };

    this.workflows.set(fullWorkflow.id, fullWorkflow);

    // Store in Redis
    await this.redis.set(
      `workflow:${fullWorkflow.id}`,
      JSON.stringify(fullWorkflow)
    );

    return fullWorkflow;
  }

  /**
   * Execute a workflow
   */
  public async executeWorkflow(
    workflowId: string,
    triggeredBy: string,
    triggerData: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: WorkflowStatus.RUNNING,
      startedAt: new Date(),
      triggeredBy,
      triggerData,
      actionResults: new Map(),
      logs: [],
    };

    this.activeExecutions.set(execution.id, execution);

    this.log(execution, 'info', `Starting workflow execution: ${workflow.name}`);

    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(workflow.actions);
      
      // Execute actions in topological order
      await this.executeActionGraph(execution, workflow, dependencyGraph);

      execution.status = WorkflowStatus.COMPLETED;
      execution.completedAt = new Date();
      
      workflow.runCount++;
      workflow.successCount++;
      workflow.lastRunAt = new Date();

      this.log(execution, 'info', 'Workflow completed successfully');

    } catch (error: any) {
      execution.status = WorkflowStatus.FAILED;
      execution.completedAt = new Date();
      execution.error = error.message;
      
      workflow.runCount++;
      workflow.failureCount++;
      
      this.log(execution, 'error', `Workflow failed: ${error.message}`);

      // Send failure notification
      await this.notificationService.sendNotification({
        userId: workflow.createdBy,
        category: 'workflow' as any,
        priority: 'high' as any,
        title: 'Workflow Failed',
        message: `Workflow "${workflow.name}" failed: ${error.message}`,
        channels: ['in_app', 'email'] as any,
        data: { workflowId, executionId: execution.id, error: error.message },
      });
    }

    // Store execution result
    await this.storeExecution(execution);
    
    // Clean up active executions
    this.activeExecutions.delete(execution.id);

    return execution;
  }

  /**
   * Build dependency graph for actions
   */
  private buildDependencyGraph(actions: WorkflowAction[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const action of actions) {
      if (!graph.has(action.id)) {
        graph.set(action.id, new Set());
      }

      if (action.dependsOn) {
        for (const depId of action.dependsOn) {
          if (!graph.has(depId)) {
            graph.set(depId, new Set());
          }
          graph.get(depId)!.add(action.id);
        }
      }
    }

    return graph;
  }

  /**
   * Execute action graph in topological order
   */
  private async executeActionGraph(
    execution: WorkflowExecution,
    workflow: Workflow,
    graph: Map<string, Set<string>>
  ): Promise<void> {
    const actionMap = new Map(workflow.actions.map(a => [a.id, a]));
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees
    for (const action of workflow.actions) {
      inDegree.set(action.id, action.dependsOn?.length || 0);
      if (inDegree.get(action.id) === 0) {
        queue.push(action.id);
      }
    }

    // Execute in topological order
    while (queue.length > 0) {
      const actionId = queue.shift()!;
      const action = actionMap.get(actionId)!;

      // Execute action
      const result = await this.executeAction(execution, action);
      execution.actionResults.set(actionId, result);

      // If action failed and should stop workflow
      if (result.status === 'failed' && action.onError === 'fail') {
        throw new Error(`Action ${action.name} failed: ${result.error}`);
      }

      // Update dependent actions
      const dependents = graph.get(actionId) || new Set();
      for (const depId of dependents) {
        const currentDegree = inDegree.get(depId)!;
        inDegree.set(depId, currentDegree - 1);
        
        if (inDegree.get(depId) === 0) {
          queue.push(depId);
        }
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    execution: WorkflowExecution,
    action: WorkflowAction
  ): Promise<ActionResult> {
    const result: ActionResult = {
      actionId: action.id,
      status: 'success',
      startedAt: new Date(),
      completedAt: new Date(),
      retries: 0,
    };

    this.log(execution, 'info', `Executing action: ${action.name}`, action.id);

    const handler = this.actionHandlers.get(action.type);
    if (!handler) {
      result.status = 'failed';
      result.error = `No handler found for action type: ${action.type}`;
      this.log(execution, 'error', result.error, action.id);
      return result;
    }

    let lastError: Error | null = null;
    const maxAttempts = action.retryPolicy?.maxAttempts || 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Apply timeout
        const timeoutMs = action.timeout || 30000;
        const output = await this.withTimeout(
          handler(action.config, execution),
          timeoutMs
        );

        result.output = output;
        result.completedAt = new Date();
        
        this.log(execution, 'info', `Action completed successfully`, action.id);
        
        return result;

      } catch (error: any) {
        lastError = error;
        result.retries = attempt + 1;

        this.log(execution, 'warn', `Action attempt ${attempt + 1} failed: ${error.message}`, action.id);

        if (attempt < maxAttempts - 1) {
          // Calculate backoff delay
          const backoff = action.retryPolicy?.exponential
            ? (action.retryPolicy.backoffMs || 1000) * Math.pow(2, attempt)
            : (action.retryPolicy?.backoffMs || 1000);

          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    // All attempts failed
    result.status = 'failed';
    result.error = lastError?.message || 'Action failed';
    result.completedAt = new Date();
    
    this.log(execution, 'error', `Action failed after ${maxAttempts} attempts`, action.id);

    return result;
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Action timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Setup action handlers
   */
  private setupActionHandlers(): void {
    // HTTP Request handler
    this.actionHandlers.set(ActionType.HTTP_REQUEST, async (config) => {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });
      return await response.json();
    });

    // Email handler
    this.actionHandlers.set(ActionType.EMAIL_SEND, async (config) => {
      const { sendEmail } = await import('../brevoService');
      return await sendEmail({
        to: config.to,
        subject: config.subject,
        htmlContent: config.htmlContent,
      });
    });

    // Notification handler
    this.actionHandlers.set(ActionType.NOTIFICATION, async (config) => {
      return await this.notificationService.sendNotification({
        userId: config.userId,
        category: config.category,
        priority: config.priority,
        title: config.title,
        message: config.message,
        channels: config.channels,
        data: config.data,
      });
    });

    // Delay handler
    this.actionHandlers.set(ActionType.DELAY, async (config) => {
      await new Promise(resolve => setTimeout(resolve, config.durationMs));
      return { delayed: config.durationMs };
    });

    // Condition handler
    this.actionHandlers.set(ActionType.CONDITION, async (config, execution) => {
      const condition = new Function('context', `return ${config.expression}`);
      const context = {
        execution,
        results: Object.fromEntries(execution.actionResults),
        triggerData: execution.triggerData,
      };
      return { result: condition(context) };
    });
  }

  /**
   * Subscribe to event triggers
   */
  private async subscribeToTriggers(): void {
    // Subscribe to all event categories
    for (const category of Object.values(EventCategory)) {
      await this.eventStream.subscribe(category, async (event) => {
        await this.handleEventTrigger(event);
      });
    }
  }

  /**
   * Handle event-based workflow triggers
   */
  private async handleEventTrigger(event: BaseEvent): Promise<void> {
    for (const workflow of this.workflows.values()) {
      if (!workflow.enabled) continue;
      if (workflow.trigger.type !== 'event') continue;

      // Check if event matches trigger
      const matches = 
        (!workflow.trigger.eventCategory || workflow.trigger.eventCategory === event.category) &&
        (!workflow.trigger.eventType || workflow.trigger.eventType === event.event_type);

      if (matches) {
        // Check additional conditions
        if (workflow.trigger.conditions) {
          const conditionsMet = this.evaluateConditions(workflow.trigger.conditions, event);
          if (!conditionsMet) continue;
        }

        // Execute workflow
        await this.executeWorkflow(workflow.id, event.user_id, { event });
      }
    }
  }

  /**
   * Evaluate trigger conditions
   */
  private evaluateConditions(conditions: Record<string, any>, event: BaseEvent): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = this.getNestedValue(event, key);
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Log workflow execution event
   */
  private log(
    execution: WorkflowExecution,
    level: WorkflowLog['level'],
    message: string,
    actionId?: string,
    data?: any
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      message,
      actionId,
      data,
    });
  }

  /**
   * Store workflow execution
   */
  private async storeExecution(execution: WorkflowExecution): Promise<void> {
    const serialized = {
      ...execution,
      actionResults: Object.fromEntries(execution.actionResults),
    };

    await this.redis.setex(
      `workflow:execution:${execution.id}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(serialized)
    );

    // Add to workflow execution history
    await this.redis.lpush(
      `workflow:${execution.workflowId}:executions`,
      execution.id
    );
    await this.redis.ltrim(`workflow:${execution.workflowId}:executions`, 0, 99);
  }

  /**
   * Get workflow execution history
   */
  public async getWorkflowExecutions(workflowId: string, limit: number = 20): Promise<WorkflowExecution[]> {
    const executionIds = await this.redis.lrange(`workflow:${workflowId}:executions`, 0, limit - 1);
    
    const executions: WorkflowExecution[] = [];
    for (const id of executionIds) {
      const data = await this.redis.get(`workflow:execution:${id}`);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.actionResults = new Map(Object.entries(parsed.actionResults));
        executions.push(parsed);
      }
    }

    return executions;
  }

  /**
   * Get all workflows
   */
  public getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  public getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Update workflow
   */
  public async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    Object.assign(workflow, updates, { updatedAt: new Date() });

    await this.redis.set(
      `workflow:${workflowId}`,
      JSON.stringify(workflow)
    );

    return workflow;
  }

  /**
   * Delete workflow
   */
  public async deleteWorkflow(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId);
    await this.redis.del(`workflow:${workflowId}`);
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    this.workflows.clear();
    this.activeExecutions.clear();
    await this.redis.quit();
  }
}

type ActionHandler = (config: Record<string, any>, execution: WorkflowExecution) => Promise<any>;
