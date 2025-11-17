/**
 * Automation System
 * Exports workflow engine and templates
 */

export * from './workflowEngine';
export * from './workflowTemplates';

// Re-export commonly used types and enums
export type { Workflow, WorkflowAction, WorkflowExecution, WorkflowTrigger } from './workflowEngine';
export { WorkflowStatus, ActionType, WorkflowEngine } from './workflowEngine';
export { workflowTemplates, getTemplateNames, getTemplate } from './workflowTemplates';
