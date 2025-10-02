import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  subscriptionPlan: varchar("subscription_plan"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingProgress: jsonb("onboarding_progress").$type<{
    welcomeShown: boolean;
    steps: {
      createProject: boolean;
      useAI: boolean;
      addCharacter: boolean;
      viewAnalytics: boolean;
      tryExport: boolean;
    };
    tourCompleted: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role enum for collaboration
export const roleEnum = pgEnum('role', ['owner', 'editor', 'reviewer', 'reader']);

// Character role enum
export const characterRoleEnum = pgEnum('character_role', [
  'protagonist', 
  'antagonist', 
  'supporting', 
  'minor', 
  'other'
]);

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  genre: varchar("genre"),
  targetWordCount: integer("target_word_count"),
  currentWordCount: integer("current_word_count").default(0),
  deadline: timestamp("deadline"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project collaborators
export const projectCollaborators = pgTable("project_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Characters table
export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  background: text("background"),
  personality: text("personality"),
  appearance: text("appearance"),
  relationships: jsonb("relationships"),
  notes: text("notes"),
  role: characterRoleEnum("role"),
  importance: integer("importance").default(3),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worldbuilding entries
export const worldbuildingEntries = pgTable("worldbuilding_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  type: varchar("type").notNull(), // location, culture, magic_system, etc.
  description: text("description"),
  details: jsonb("details"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timeline events
export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  date: varchar("date"), // Flexible date format for fictional timelines
  importance: integer("importance").default(1), // 1-5 scale
  orderIndex: integer("order_index").default(0), // For drag-and-drop ordering
  tags: text("tags").array(),
  relatedCharacters: text("related_characters").array(),
  relatedLocations: text("related_locations").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents/chapters
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  content: text("content"),
  type: varchar("type").default("chapter"), // chapter, scene, note
  orderIndex: integer("order_index").default(0),
  wordCount: integer("word_count").default(0),
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document branches for version control
export const documentBranches = pgTable("document_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull(),
  description: text("description"),
  parentBranchId: varchar("parent_branch_id").references(() => documentBranches.id),
  baseVersionId: varchar("base_version_id"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_branches_doc_name").on(table.documentId, table.name),
]);

// Document versions for history tracking (extended for branching)
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  branchId: varchar("branch_id").references(() => documentBranches.id, { onDelete: 'cascade' }),
  parentVersionId: varchar("parent_version_id").references(() => documentVersions.id),
  content: text("content").notNull(),
  ydocState: text("ydoc_state"),
  wordCount: integer("word_count").default(0),
  changeDescription: text("change_description"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_doc_versions_branch").on(table.documentId, table.branchId, table.createdAt),
]);

// Merge status enum
export const mergeStatusEnum = pgEnum('merge_status', ['pending', 'completed', 'failed', 'conflicted']);

// Branch merge events for tracking merge operations
export const branchMergeEvents = pgTable("branch_merge_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  sourceBranchId: varchar("source_branch_id").notNull().references(() => documentBranches.id),
  targetBranchId: varchar("target_branch_id").notNull().references(() => documentBranches.id),
  mergedVersionId: varchar("merged_version_id").references(() => documentVersions.id),
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  status: mergeStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
});

// AI generation history
export const aiGenerations = pgTable("ai_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  persona: varchar("persona").notNull(), // muse, editor, coach
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Writing sessions for detailed activity tracking
export const writingSessions = pgTable("writing_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentId: varchar("document_id").references(() => documents.id, { onDelete: 'cascade' }),
  wordsWritten: integer("words_written").default(0),
  duration: integer("duration").default(0), // in minutes
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  sessionType: varchar("session_type").default("writing"), // writing, editing, planning
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log for detailed user actions
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar("action").notNull(), // created, updated, deleted, viewed
  entityType: varchar("entity_type").notNull(), // document, character, worldbuilding, timeline
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document collaboration states for real-time collaboration
export const documentCollaborationStates = pgTable("document_collaboration_states", {
  documentId: varchar("document_id").primaryKey().references(() => documents.id, { onDelete: 'cascade' }),
  ydocState: text("ydoc_state").notNull(), // Yjs CRDT state as base64 string
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document comments for collaborative feedback
export const documentComments = pgTable("document_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  range: jsonb("range"), // { start: number, end: number } for text selection
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaboration presence status enum
export const presenceStatusEnum = pgEnum('presence_status', ['online', 'offline', 'away']);

// Collaboration presence for real-time user tracking
export const collaborationPresence = pgTable("collaboration_presence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentId: varchar("document_id").references(() => documents.id, { onDelete: 'cascade' }),
  status: presenceStatusEnum("status").notNull(),
  cursorPos: jsonb("cursor_pos"), // { line: number, column: number } or similar
  color: varchar("color"), // Hex color for cursor/selection highlight
  lastSeen: timestamp("last_seen").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  collaborations: many(projectCollaborators),
  documents: many(documents),
  documentVersions: many(documentVersions),
  documentBranches: many(documentBranches),
  documentComments: many(documentComments),
  aiGenerations: many(aiGenerations),
  writingSessions: many(writingSessions),
  activityLogs: many(activityLogs),
  collaborationPresence: many(collaborationPresence),
  branchMergeEvents: many(branchMergeEvents),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  collaborators: many(projectCollaborators),
  characters: many(characters),
  worldbuildingEntries: many(worldbuildingEntries),
  timelineEvents: many(timelineEvents),
  documents: many(documents),
  aiGenerations: many(aiGenerations),
  writingSessions: many(writingSessions),
  activityLogs: many(activityLogs),
  collaborationPresence: many(collaborationPresence),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  project: one(projects, {
    fields: [characters.projectId],
    references: [projects.id],
  }),
}));

export const worldbuildingEntriesRelations = relations(worldbuildingEntries, ({ one }) => ({
  project: one(projects, {
    fields: [worldbuildingEntries.projectId],
    references: [projects.id],
  }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  project: one(projects, {
    fields: [timelineEvents.projectId],
    references: [projects.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [documents.authorId],
    references: [users.id],
  }),
  branches: many(documentBranches),
  versions: many(documentVersions),
  comments: many(documentComments),
  mergeEvents: many(branchMergeEvents),
  collaborationState: one(documentCollaborationStates, {
    fields: [documents.id],
    references: [documentCollaborationStates.documentId],
  }),
}));

// Document branches relations
export const documentBranchesRelations = relations(documentBranches, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentBranches.documentId],
    references: [documents.id],
  }),
  createdBy: one(users, {
    fields: [documentBranches.createdBy],
    references: [users.id],
  }),
  parentBranch: one(documentBranches, {
    fields: [documentBranches.parentBranchId],
    references: [documentBranches.id],
  }),
  childBranches: many(documentBranches),
  versions: many(documentVersions),
  sourceMergeEvents: many(branchMergeEvents),
  targetMergeEvents: many(branchMergeEvents),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
  branch: one(documentBranches, {
    fields: [documentVersions.branchId],
    references: [documentBranches.id],
  }),
  parentVersion: one(documentVersions, {
    fields: [documentVersions.parentVersionId],
    references: [documentVersions.id],
  }),
  childVersions: many(documentVersions),
  author: one(users, {
    fields: [documentVersions.authorId],
    references: [users.id],
  }),
}));

// Branch merge events relations
export const branchMergeEventsRelations = relations(branchMergeEvents, ({ one }) => ({
  document: one(documents, {
    fields: [branchMergeEvents.documentId],
    references: [documents.id],
  }),
  sourceBranch: one(documentBranches, {
    fields: [branchMergeEvents.sourceBranchId],
    references: [documentBranches.id],
  }),
  targetBranch: one(documentBranches, {
    fields: [branchMergeEvents.targetBranchId],
    references: [documentBranches.id],
  }),
  mergedVersion: one(documentVersions, {
    fields: [branchMergeEvents.mergedVersionId],
    references: [documentVersions.id],
  }),
  initiator: one(users, {
    fields: [branchMergeEvents.initiatorId],
    references: [users.id],
  }),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  project: one(projects, {
    fields: [aiGenerations.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [aiGenerations.userId],
    references: [users.id],
  }),
}));

export const writingSessionsRelations = relations(writingSessions, ({ one }) => ({
  project: one(projects, {
    fields: [writingSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [writingSessions.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [writingSessions.documentId],
    references: [documents.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Collaboration tables relations
export const documentCollaborationStatesRelations = relations(documentCollaborationStates, ({ one }) => ({
  document: one(documents, {
    fields: [documentCollaborationStates.documentId],
    references: [documents.id],
  }),
}));

export const documentCommentsRelations = relations(documentComments, ({ one }) => ({
  document: one(documents, {
    fields: [documentComments.documentId],
    references: [documents.id],
  }),
  author: one(users, {
    fields: [documentComments.authorId],
    references: [users.id],
  }),
}));

export const collaborationPresenceRelations = relations(collaborationPresence, ({ one }) => ({
  project: one(projects, {
    fields: [collaborationPresence.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [collaborationPresence.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [collaborationPresence.documentId],
    references: [documents.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  ownerId: true,
  currentWordCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorldbuildingEntrySchema = createInsertSchema(worldbuildingEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  authorId: true,
  wordCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectCollaboratorSchema = createInsertSchema(projectCollaborators).omit({
  id: true,
  createdAt: true,
});

export const insertWritingSessionSchema = createInsertSchema(writingSessions).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Collaboration insert schemas
export const insertDocumentCommentSchema = createInsertSchema(documentComments).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationPresenceSchema = createInsertSchema(collaborationPresence).omit({
  id: true,
  lastSeen: true,
});

// Branching insert schemas
export const insertDocumentBranchSchema = createInsertSchema(documentBranches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

export const insertBranchMergeEventSchema = createInsertSchema(branchMergeEvents).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Worldbuilding details interface
export interface WorldbuildingDetails {
  content?: string;
  [key: string]: any; // Allow additional properties
}

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertWorldbuildingEntry = z.infer<typeof insertWorldbuildingEntrySchema>;
export type WorldbuildingEntry = typeof worldbuildingEntries.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type InsertProjectCollaborator = z.infer<typeof insertProjectCollaboratorSchema>;
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type AiGeneration = typeof aiGenerations.$inferSelect;
export type InsertWritingSession = z.infer<typeof insertWritingSessionSchema>;
export type WritingSession = typeof writingSessions.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Collaboration types
export type DocumentCollaborationState = typeof documentCollaborationStates.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;
export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertCollaborationPresence = z.infer<typeof insertCollaborationPresenceSchema>;
export type CollaborationPresence = typeof collaborationPresence.$inferSelect;

// Branching types
export type DocumentBranch = typeof documentBranches.$inferSelect;
export type InsertDocumentBranch = z.infer<typeof insertDocumentBranchSchema>;
export type BranchMergeEvent = typeof branchMergeEvents.$inferSelect;
export type InsertBranchMergeEvent = z.infer<typeof insertBranchMergeEventSchema>;

// Extended types with relations
export type ProjectWithCollaborators = Project & {
  collaborators: (ProjectCollaborator & { user: User })[];
  characters: Character[];
  worldbuildingEntries: WorldbuildingEntry[];
  timelineEvents: TimelineEvent[];
  documents: Document[];
};

export type DocumentWithVersions = Document & {
  versions: DocumentVersion[];
  author: User;
};

export type DocumentBranchWithVersions = DocumentBranch & {
  versions: DocumentVersion[];
  document: Document;
};

export type BranchWithChildren = DocumentBranch & {
  childBranches: DocumentBranch[];
  parentBranch?: DocumentBranch | null;
};

export type OnboardingProgress = {
  welcomeShown: boolean;
  steps: {
    createProject: boolean;
    useAI: boolean;
    addCharacter: boolean;
    viewAnalytics: boolean;
    tryExport: boolean;
  };
  tourCompleted: boolean;
};
