import type { Workflow, WorkflowAction } from './workflowEngine';
import { ActionType, WorkflowStatus } from './workflowEngine';
import { EventCategory } from '../events/eventSchema';

/**
 * Pre-built Workflow Templates
 * Common automation scenarios ready to use
 */

/**
 * Auto-save and backup workflow
 * Triggered on every 100 words written
 */
export const autoSaveWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Auto-Save and Backup',
  description: 'Automatically save document and create backup every 100 words',
  trigger: {
    type: 'event',
    eventCategory: EventCategory.WRITING,
    eventType: 'writing.word_added',
    conditions: {
      'payload.word_count_delta': 100,
    },
  },
  actions: [
    {
      id: 'save_document',
      type: ActionType.DATABASE_OPERATION,
      name: 'Save Document',
      config: {
        operation: 'update',
        table: 'documents',
        conditions: { id: '{{triggerData.event.document_id}}' },
        data: { content: '{{triggerData.event.payload.content}}', updatedAt: 'NOW()' },
      },
    },
    {
      id: 'create_backup',
      type: ActionType.FILE_OPERATION,
      name: 'Create Backup',
      config: {
        operation: 'copy',
        source: '{{triggerData.event.document_id}}',
        destination: 'backups/{{triggerData.event.document_id}}_{{timestamp}}',
      },
      dependsOn: ['save_document'],
    },
    {
      id: 'notify_user',
      type: ActionType.NOTIFICATION,
      name: 'Notify User',
      config: {
        userId: '{{triggerData.event.user_id}}',
        category: 'workflow',
        priority: 'low',
        title: 'Document Saved',
        message: 'Your document has been auto-saved and backed up.',
        channels: ['in_app'],
      },
      dependsOn: ['create_backup'],
      onError: 'continue',
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Book publication workflow
 * Triggered when book status changes to "ready_for_review"
 */
export const bookPublicationWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Book Publication Pipeline',
  description: 'Automated workflow for publishing books to KDP',
  trigger: {
    type: 'event',
    eventCategory: EventCategory.PUBLISHING,
    eventType: 'publishing.status_changed',
    conditions: {
      'payload.new_status': 'ready_for_review',
    },
  },
  actions: [
    {
      id: 'validate_content',
      type: ActionType.HTTP_REQUEST,
      name: 'Validate Content',
      config: {
        url: '/api/publishing/validate',
        method: 'POST',
        body: {
          projectId: '{{triggerData.event.project_id}}',
        },
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffMs: 2000,
        exponential: true,
      },
    },
    {
      id: 'generate_metadata',
      type: ActionType.AI_GENERATION,
      name: 'Generate Metadata',
      config: {
        prompt: 'Generate SEO-optimized metadata for book',
        projectId: '{{triggerData.event.project_id}}',
      },
      dependsOn: ['validate_content'],
    },
    {
      id: 'format_document',
      type: ActionType.FILE_OPERATION,
      name: 'Format for KDP',
      config: {
        operation: 'convert',
        format: 'epub',
        projectId: '{{triggerData.event.project_id}}',
      },
      dependsOn: ['validate_content'],
    },
    {
      id: 'upload_to_kdp',
      type: ActionType.HTTP_REQUEST,
      name: 'Upload to KDP',
      config: {
        url: '/api/kdp/upload',
        method: 'POST',
        body: {
          projectId: '{{triggerData.event.project_id}}',
          metadata: '{{results.generate_metadata.output}}',
          file: '{{results.format_document.output}}',
        },
      },
      dependsOn: ['generate_metadata', 'format_document'],
      timeout: 120000, // 2 minutes
      retryPolicy: {
        maxAttempts: 5,
        backoffMs: 5000,
        exponential: true,
      },
    },
    {
      id: 'notify_success',
      type: ActionType.NOTIFICATION,
      name: 'Notify Publication Success',
      config: {
        userId: '{{triggerData.event.user_id}}',
        category: 'publishing_milestone',
        priority: 'high',
        title: '🎉 Book Uploaded to KDP!',
        message: 'Your book has been successfully uploaded and is now in review.',
        channels: ['in_app', 'email'],
        actionUrl: '/projects/{{triggerData.event.project_id}}/publishing',
        actionLabel: 'View Publishing Status',
      },
      dependsOn: ['upload_to_kdp'],
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Daily writing goal reminder
 * Scheduled workflow that runs every day
 */
export const dailyGoalReminderWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Daily Writing Goal Reminder',
  description: 'Send reminder if daily writing goal not met',
  trigger: {
    type: 'schedule',
    schedule: '0 20 * * *', // 8 PM every day
  },
  actions: [
    {
      id: 'check_daily_progress',
      type: ActionType.DATABASE_OPERATION,
      name: 'Check Daily Progress',
      config: {
        operation: 'query',
        query: 'SELECT SUM(words_written) as total FROM writing_sessions WHERE user_id = {{userId}} AND DATE(created_at) = CURRENT_DATE',
      },
    },
    {
      id: 'evaluate_goal',
      type: ActionType.CONDITION,
      name: 'Check if Goal Met',
      config: {
        expression: 'results.check_daily_progress.output.total < 1000', // Default goal: 1000 words
      },
      dependsOn: ['check_daily_progress'],
    },
    {
      id: 'send_reminder',
      type: ActionType.NOTIFICATION,
      name: 'Send Reminder',
      config: {
        userId: '{{userId}}',
        category: 'analytics_insight',
        priority: 'medium',
        title: '✍️ Daily Writing Goal',
        message: "You've written {{results.check_daily_progress.output.total}} words today. Keep going to reach your 1000-word goal!",
        channels: ['in_app', 'email'],
      },
      dependsOn: ['evaluate_goal'],
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Sales spike alert workflow
 * Triggered when sales increase significantly
 */
export const salesSpikeAlertWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Sales Spike Alert',
  description: 'Alert when book sales spike above normal',
  trigger: {
    type: 'event',
    eventCategory: EventCategory.PUBLISHING,
    eventType: 'publishing.sales_updated',
  },
  actions: [
    {
      id: 'calculate_baseline',
      type: ActionType.DATABASE_OPERATION,
      name: 'Calculate 7-Day Average',
      config: {
        operation: 'query',
        query: 'SELECT AVG(daily_sales) as baseline FROM sales_history WHERE project_id = {{triggerData.event.project_id}} AND date >= CURRENT_DATE - INTERVAL 7 DAY',
      },
    },
    {
      id: 'check_spike',
      type: ActionType.CONDITION,
      name: 'Detect Spike',
      config: {
        expression: 'triggerData.event.payload.sales_count > (results.calculate_baseline.output.baseline * 2)',
      },
      dependsOn: ['calculate_baseline'],
    },
    {
      id: 'notify_spike',
      type: ActionType.NOTIFICATION,
      name: 'Alert User',
      config: {
        userId: '{{triggerData.event.user_id}}',
        category: 'revenue_event',
        priority: 'high',
        title: '📈 Sales Spike Detected!',
        message: 'Your book is selling {{triggerData.event.payload.sales_count}} copies today - 2x your weekly average!',
        channels: ['in_app', 'email', 'sms'],
        actionUrl: '/analytics/sales',
      },
      dependsOn: ['check_spike'],
    },
    {
      id: 'log_event',
      type: ActionType.DATABASE_OPERATION,
      name: 'Log Analytics Event',
      config: {
        operation: 'insert',
        table: 'analytics_events',
        data: {
          type: 'sales_spike',
          projectId: '{{triggerData.event.project_id}}',
          data: {
            currentSales: '{{triggerData.event.payload.sales_count}}',
            baseline: '{{results.calculate_baseline.output.baseline}}',
          },
        },
      },
      dependsOn: ['notify_spike'],
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Collaboration conflict resolution workflow
 * Triggered when edit conflict is detected
 */
export const conflictResolutionWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Collaboration Conflict Resolution',
  description: 'Notify and help resolve editing conflicts',
  trigger: {
    type: 'event',
    eventCategory: EventCategory.COLLABORATION,
    eventType: 'collaboration.conflict_detected',
  },
  actions: [
    {
      id: 'notify_user1',
      type: ActionType.NOTIFICATION,
      name: 'Notify First User',
      config: {
        userId: '{{triggerData.event.user_id}}',
        category: 'collaboration',
        priority: 'medium',
        title: '⚠️ Edit Conflict Detected',
        message: '{{triggerData.event.payload.suggestion}}',
        channels: ['in_app'],
      },
    },
    {
      id: 'notify_user2',
      type: ActionType.NOTIFICATION,
      name: 'Notify Second User',
      config: {
        userId: '{{triggerData.event.payload.other_user_id}}',
        category: 'collaboration',
        priority: 'medium',
        title: '⚠️ Another User is Editing Nearby',
        message: 'You and another collaborator are editing nearby areas. Consider coordinating.',
        channels: ['in_app'],
      },
    },
    {
      id: 'create_conflict_log',
      type: ActionType.DATABASE_OPERATION,
      name: 'Log Conflict',
      config: {
        operation: 'insert',
        table: 'conflict_logs',
        data: {
          documentId: '{{triggerData.event.document_id}}',
          user1Id: '{{triggerData.event.user_id}}',
          user2Id: '{{triggerData.event.payload.other_user_id}}',
          conflictType: '{{triggerData.event.payload.conflict_type}}',
          severity: '{{triggerData.event.payload.severity}}',
          resolvedAt: null,
        },
      },
      dependsOn: ['notify_user1', 'notify_user2'],
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Weekly analytics digest workflow
 * Scheduled to run every Monday morning
 */
export const weeklyAnalyticsDigestWorkflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount' | 'failureCount'> = {
  name: 'Weekly Analytics Digest',
  description: 'Send weekly summary of writing progress and insights',
  trigger: {
    type: 'schedule',
    schedule: '0 9 * * 1', // 9 AM every Monday
  },
  actions: [
    {
      id: 'gather_writing_stats',
      type: ActionType.HTTP_REQUEST,
      name: 'Get Writing Statistics',
      config: {
        url: '/api/analytics/user/{{userId}}/weekly',
        method: 'GET',
      },
    },
    {
      id: 'gather_project_stats',
      type: ActionType.HTTP_REQUEST,
      name: 'Get Project Statistics',
      config: {
        url: '/api/analytics/user/{{userId}}/projects',
        method: 'GET',
      },
    },
    {
      id: 'generate_insights',
      type: ActionType.AI_GENERATION,
      name: 'Generate AI Insights',
      config: {
        prompt: 'Analyze weekly writing data and generate personalized insights',
        data: {
          writingStats: '{{results.gather_writing_stats.output}}',
          projectStats: '{{results.gather_project_stats.output}}',
        },
      },
      dependsOn: ['gather_writing_stats', 'gather_project_stats'],
    },
    {
      id: 'send_digest_email',
      type: ActionType.EMAIL_SEND,
      name: 'Send Digest Email',
      config: {
        to: ['{{userEmail}}'],
        subject: '📊 Your Weekly Writing Digest',
        htmlContent: `
          <h1>Your Writing Week in Review</h1>
          <p>Words Written: {{results.gather_writing_stats.output.totalWords}}</p>
          <p>Writing Sessions: {{results.gather_writing_stats.output.sessionCount}}</p>
          <p>Average WPM: {{results.gather_writing_stats.output.averageWPM}}</p>
          <h2>AI Insights</h2>
          <p>{{results.generate_insights.output}}</p>
        `,
      },
      dependsOn: ['generate_insights'],
    },
  ],
  status: WorkflowStatus.PENDING,
  enabled: true,
};

/**
 * Export all workflow templates
 */
export const workflowTemplates = {
  autoSave: autoSaveWorkflow,
  bookPublication: bookPublicationWorkflow,
  dailyGoalReminder: dailyGoalReminderWorkflow,
  salesSpikeAlert: salesSpikeAlertWorkflow,
  conflictResolution: conflictResolutionWorkflow,
  weeklyAnalyticsDigest: weeklyAnalyticsDigestWorkflow,
};

/**
 * Get all template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(workflowTemplates);
}

/**
 * Get template by name
 */
export function getTemplate(name: keyof typeof workflowTemplates): typeof autoSaveWorkflow {
  return workflowTemplates[name];
}
