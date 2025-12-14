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
  serial,
  unique,
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

// Romance-specific enums
export const romanceHeatLevelEnum = pgEnum('romance_heat_level', [
  'sweet', 'warm', 'steamy', 'scorching'
]);

export const romanceSubgenreEnum = pgEnum('romance_subgenre', [
  'contemporary', 'historical', 'paranormal', 'fantasy', 'sci_fi', 
  'romantic_suspense', 'military', 'sports', 'billionaire', 'small_town',
  'second_chance', 'enemies_to_lovers', 'fake_relationship', 'single_parent'
]);

export const publicationStatusEnum = pgEnum('publication_status', [
  'draft', 'in_progress', 'ready_for_review', 'approved', 
  'formatted', 'published', 'archived'
]);

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'romantic_interest', 'ex_lover', 'family', 'friend', 'rival', 
  'mentor', 'ally', 'enemy', 'colleague'
]);

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  genre: varchar("genre"),
  // Romance-specific fields
  romanceSubgenre: romanceSubgenreEnum("romance_subgenre"),
  heatLevel: romanceHeatLevelEnum("heat_level"),
  tropeTags: text("trope_tags").array(), // Array of romance trope tags
  seriesId: varchar("series_id").references(() => romanceSeries.id),
  bookNumber: integer("book_number"), // Position in series
  targetWordCount: integer("target_word_count"),
  currentWordCount: integer("current_word_count").default(0),
  deadline: timestamp("deadline"),
  publicationStatus: publicationStatusEnum("publication_status").default('draft'),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Romance Series table for multi-book series management
export const romanceSeries = pgTable("romance_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  subgenre: romanceSubgenreEnum("subgenre"),
  heatLevel: romanceHeatLevelEnum("heat_level"),
  plannedBooks: integer("planned_books"),
  publishedBooks: integer("published_books").default(0),
  seriesArc: text("series_arc"), // Overall series storyline
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Romance Tropes tracking table
export const romanceTropes = pgTable("romance_tropes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tropeName: varchar("trope_name").notNull(),
  category: varchar("category").notNull(), // relationship, plot, character, setting
  description: text("description"),
  isCore: boolean("is_core").default(false), // Core vs secondary trope
  conflictsWith: text("conflicts_with").array(), // Array of conflicting trope names
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Character Relationships for romance dynamics
export const characterRelationships = pgTable("character_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  character1Id: varchar("character1_id").notNull().references(() => characters.id, { onDelete: 'cascade' }),
  character2Id: varchar("character2_id").notNull().references(() => characters.id, { onDelete: 'cascade' }),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  intensity: integer("intensity").default(5), // 1-10 scale
  dynamics: text("dynamics"), // Description of relationship dynamics
  tension: text("tension"), // Types of tension (sexual, romantic, conflict)
  development: text("development"), // How relationship evolves
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cover Designs for publishing pipeline
export const coverDesigns = pgTable("cover_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  imageUrl: varchar("image_url"),
  designData: jsonb("design_data"), // Design parameters and settings
  isSelected: boolean("is_selected").default(false),
  version: integer("version").default(1),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blurbs/Marketing Copy for books
export const bookBlurbs = pgTable("book_blurbs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // back_cover, amazon_description, short_pitch
  content: text("content").notNull(),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(false),
  keywords: text("keywords").array(), // SEO keywords
  hooks: text("hooks").array(), // Marketing hooks
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// KDP Publishing Metadata
export const kdpMetadata = pgTable("kdp_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  asin: varchar("asin"), // Amazon Standard Identification Number
  categories: text("categories").array(),
  keywords: text("keywords").array(),
  price: integer("price"), // Price in cents
  royaltyRate: integer("royalty_rate"), // Percentage
  territories: text("territories").array(), // Publishing territories
  drm: boolean("drm").default(false),
  publishingRights: varchar("publishing_rights"),
  ageGuidance: varchar("age_guidance"),
  publicationDate: timestamp("publication_date"),
  lastSynced: timestamp("last_synced"),
  kdpStatus: varchar("kdp_status"), // live, in_review, blocked, etc.
  salesData: jsonb("sales_data"), // Sales metrics from KDP
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Portfolios for enterprise/agency management
export const clientPortfolios = pgTable("client_portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contractType: varchar("contract_type"), // ghostwriting, editing, publishing
  retainerAmount: integer("retainer_amount"), // Monthly retainer in cents
  commissionRate: integer("commission_rate"), // Percentage
  activeProjects: integer("active_projects").default(0),
  totalRevenue: integer("total_revenue").default(0), // Total revenue in cents
  status: varchar("status").default('active'), // active, paused, completed
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue Tracking for detailed financial analytics
export const revenueEntries = pgTable("revenue_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  clientPortfolioId: varchar("client_portfolio_id").references(() => clientPortfolios.id),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default('USD'),
  source: varchar("source").notNull(), // kdp, client_payment, retainer, etc.
  description: text("description"),
  transactionDate: timestamp("transaction_date").notNull(),
  metadata: jsonb("metadata"), // Additional transaction details
  createdAt: timestamp("created_at").defaultNow(),
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
  // Romance-specific character fields
  romanticArchetype: varchar("romantic_archetype"), // alpha, beta, cinnamon_roll, etc.
  attractionFactors: text("attraction_factors").array(), // What makes them attractive
  romanticGoals: text("romantic_goals"), // What they want in love
  romanticConflicts: text("romantic_conflicts"), // Internal romantic conflicts
  pastRelationships: text("past_relationships"), // Relationship history
  lovestyle: varchar("lovestyle"), // How they express/receive love
  intimacyComfort: integer("intimacy_comfort").default(5), // 1-10 comfort with intimacy
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
  parentId: varchar("parent_id").references(() => documentComments.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  range: jsonb("range"), // { start: number, end: number } for text selection
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaboration presence status enum
export const presenceStatusEnum = pgEnum('presence_status', ['online', 'offline', 'away']);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'document_created',
  'document_updated',
  'document_deleted',
  'character_created',
  'character_updated',
  'character_deleted',
  'worldbuilding_created',
  'worldbuilding_updated',
  'worldbuilding_deleted',
  'timeline_created',
  'timeline_updated',
  'timeline_deleted',
  'collaborator_added',
  'collaborator_removed',
  'comment_added'
]);

// Activity type enum
export const activityTypeEnum = pgEnum('activity_type', [
  'project_created',
  'project_updated',
  'document_created',
  'document_updated',
  'document_deleted',
  'character_created',
  'character_updated',
  'character_deleted',
  'worldbuilding_created',
  'worldbuilding_updated',
  'worldbuilding_deleted',
  'timeline_created',
  'timeline_updated',
  'timeline_deleted',
  'collaborator_added',
  'collaborator_removed'
]);

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

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: 'cascade' }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: activityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  entityName: varchar("entity_name"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prompts table for writing prompt library
export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  tags: text("tags").array(),
  persona: varchar("persona", { length: 50 }).notNull(),
  targetRole: varchar("target_role", { length: 100 }).notNull(),
  isFeatured: boolean("is_featured").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User favorite prompts for tracking saved prompts
export const userFavoritePrompts = pgTable("user_favorite_prompts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  promptId: integer("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPrompt: unique().on(table.userId, table.promptId),
}));

// Email status enum
export const emailStatusEnum = pgEnum('email_status', ['draft', 'scheduled', 'sent', 'failed']);

// Emails table for Brevo email tracking
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  to: text("to").array().notNull(),
  cc: text("cc").array(),
  bcc: text("bcc").array(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateId: integer("template_id"),
  templateParams: jsonb("template_params"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: emailStatusEnum("status").notNull().default('draft'),
  brevoMessageId: varchar("brevo_message_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS status enum
export const smsStatusEnum = pgEnum('sms_status', ['sent', 'failed']);

// SMS table for Brevo SMS tracking
export const sms = pgTable("sms", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  sender: text("sender"),
  status: smsStatusEnum("status").notNull(),
  brevoMessageId: text("brevo_message_id"),
  error: text("error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter subscriber status enum (public newsletter audience)
export const newsletterSubscriberStatusEnum = pgEnum('newsletter_subscriber_status', [
  'subscribed',
  'unsubscribed',
]);

// Newsletter subscribers (public email list)
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  status: newsletterSubscriberStatusEnum("status").notNull().default('subscribed'),
  unsubscribeToken: varchar("unsubscribe_token").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter editions (blog/archive + email content)
export const newsletterEditions = pgTable("newsletter_editions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // e.g. "kdp-fiction-trends-2025-12-14"
  slug: varchar("slug").notNull().unique(),
  issueDate: varchar("issue_date").notNull(), // YYYY-MM-DD
  title: text("title").notNull(),
  summary: text("summary"),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_newsletter_editions_issue_date").on(table.issueDate),
]);

// Expert mode enum
export const expertModeEnum = pgEnum('expert_mode', ['academic', 'finance', 'law', 'marketing']);

// OCR records table for tracking OCR extractions
export const ocrRecords = pgTable("ocr_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  expertMode: expertModeEnum("expert_mode"),
  extractedText: text("extracted_text").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
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
  notifications: many(notifications),
  triggeredNotifications: many(notifications),
  activities: many(activities),
  emails: many(emails),
  sms: many(sms),
  ocrRecords: many(ocrRecords),
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
  notifications: many(notifications),
  activities: many(activities),
  ocrRecords: many(ocrRecords),
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

export const charactersRelations = relations(characters, ({ one, many }) => ({
  project: one(projects, {
    fields: [characters.projectId],
    references: [projects.id],
  }),
  // Romance relationship connections
  relationshipsAsCharacter1: many(characterRelationships, { relationName: 'Character1Relationships' }),
  relationshipsAsCharacter2: many(characterRelationships, { relationName: 'Character2Relationships' }),
}));

// Romance Series Relations
export const romanceSeriesRelations = relations(romanceSeries, ({ one, many }) => ({
  owner: one(users, {
    fields: [romanceSeries.ownerId],
    references: [users.id],
  }),
  books: many(projects),
}));

// Romance Tropes Relations
export const romanceTropesRelations = relations(romanceTropes, ({ one }) => ({
  project: one(projects, {
    fields: [romanceTropes.projectId],
    references: [projects.id],
  }),
}));

// Character Relationships Relations
export const characterRelationshipsRelations = relations(characterRelationships, ({ one }) => ({
  project: one(projects, {
    fields: [characterRelationships.projectId],
    references: [projects.id],
  }),
  character1: one(characters, {
    fields: [characterRelationships.character1Id],
    references: [characters.id],
    relationName: 'Character1Relationships',
  }),
  character2: one(characters, {
    fields: [characterRelationships.character2Id],
    references: [characters.id],
    relationName: 'Character2Relationships',
  }),
}));

// Cover Designs Relations
export const coverDesignsRelations = relations(coverDesigns, ({ one }) => ({
  project: one(projects, {
    fields: [coverDesigns.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [coverDesigns.createdBy],
    references: [users.id],
  }),
}));

// Book Blurbs Relations
export const bookBlurbsRelations = relations(bookBlurbs, ({ one }) => ({
  project: one(projects, {
    fields: [bookBlurbs.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [bookBlurbs.createdBy],
    references: [users.id],
  }),
}));

// KDP Metadata Relations
export const kdpMetadataRelations = relations(kdpMetadata, ({ one }) => ({
  project: one(projects, {
    fields: [kdpMetadata.projectId],
    references: [projects.id],
  }),
}));

// Client Portfolios Relations
export const clientPortfoliosRelations = relations(clientPortfolios, ({ one, many }) => ({
  agency: one(users, {
    fields: [clientPortfolios.agencyId],
    references: [users.id],
    relationName: 'AgencyToClient',
  }),
  client: one(users, {
    fields: [clientPortfolios.clientId],
    references: [users.id],
    relationName: 'ClientToAgency',
  }),
  revenueEntries: many(revenueEntries),
}));

// Revenue Entries Relations
export const revenueEntriesRelations = relations(revenueEntries, ({ one }) => ({
  project: one(projects, {
    fields: [revenueEntries.projectId],
    references: [projects.id],
  }),
  clientPortfolio: one(clientPortfolios, {
    fields: [revenueEntries.clientPortfolioId],
    references: [clientPortfolios.id],
  }),
  user: one(users, {
    fields: [revenueEntries.userId],
    references: [users.id],
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
}));

export const smsRelations = relations(sms, ({ one }) => ({
  user: one(users, {
    fields: [sms.userId],
    references: [users.id],
  }),
}));

export const ocrRecordsRelations = relations(ocrRecords, ({ one }) => ({
  user: one(users, {
    fields: [ocrRecords.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [ocrRecords.projectId],
    references: [projects.id],
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

// Romance-specific insert schemas
export const insertRomanceSeriesSchema = createInsertSchema(romanceSeries).omit({
  id: true,
  publishedBooks: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRomanceTropeSchema = createInsertSchema(romanceTropes).omit({
  id: true,
  createdAt: true,
});

export const insertCharacterRelationshipSchema = createInsertSchema(characterRelationships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoverDesignSchema = createInsertSchema(coverDesigns).omit({
  id: true,
  createdAt: true,
});

export const insertBookBlurbSchema = createInsertSchema(bookBlurbs).omit({
  id: true,
  createdAt: true,
});

export const insertKdpMetadataSchema = createInsertSchema(kdpMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientPortfolioSchema = createInsertSchema(clientPortfolios).omit({
  id: true,
  activeProjects: true,
  totalRevenue: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueEntrySchema = createInsertSchema(revenueEntries).omit({
  id: true,
  createdAt: true,
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Prompt insert schemas
export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
});

export const insertUserFavoritePromptSchema = createInsertSchema(userFavoritePrompts).omit({
  id: true,
  createdAt: true,
});

// Email insert schema
export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SMS insert schema
export const insertSmsSchema = createInsertSchema(sms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Newsletter insert schemas
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsletterEditionSchema = createInsertSchema(newsletterEditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// OCR insert schema
export const insertOCRRecordSchema = createInsertSchema(ocrRecords).omit({
  id: true,
  createdAt: true,
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

// Romance-specific types
export type InsertRomanceSeries = z.infer<typeof insertRomanceSeriesSchema>;
export type RomanceSeries = typeof romanceSeries.$inferSelect;
export type InsertRomanceTrope = z.infer<typeof insertRomanceTropeSchema>;
export type RomanceTrope = typeof romanceTropes.$inferSelect;
export type InsertCharacterRelationship = z.infer<typeof insertCharacterRelationshipSchema>;
export type CharacterRelationship = typeof characterRelationships.$inferSelect;
export type InsertCoverDesign = z.infer<typeof insertCoverDesignSchema>;
export type CoverDesign = typeof coverDesigns.$inferSelect;
export type InsertBookBlurb = z.infer<typeof insertBookBlurbSchema>;
export type BookBlurb = typeof bookBlurbs.$inferSelect;
export type InsertKdpMetadata = z.infer<typeof insertKdpMetadataSchema>;
export type KdpMetadata = typeof kdpMetadata.$inferSelect;
export type InsertClientPortfolio = z.infer<typeof insertClientPortfolioSchema>;
export type ClientPortfolio = typeof clientPortfolios.$inferSelect;
export type InsertRevenueEntry = z.infer<typeof insertRevenueEntrySchema>;
export type RevenueEntry = typeof revenueEntries.$inferSelect;

// Collaboration types
export type DocumentCollaborationState = typeof documentCollaborationStates.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;
export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertCollaborationPresence = z.infer<typeof insertCollaborationPresenceSchema>;
export type CollaborationPresence = typeof collaborationPresence.$inferSelect;

// Notification types
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Activity types
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Branching types
export type DocumentBranch = typeof documentBranches.$inferSelect;
export type InsertDocumentBranch = z.infer<typeof insertDocumentBranchSchema>;
export type BranchMergeEvent = typeof branchMergeEvents.$inferSelect;
export type InsertBranchMergeEvent = z.infer<typeof insertBranchMergeEventSchema>;

// Prompt types
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type UserFavoritePrompt = typeof userFavoritePrompts.$inferSelect;
export type InsertUserFavoritePrompt = z.infer<typeof insertUserFavoritePromptSchema>;

// Email types
export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

// SMS types
export type Sms = typeof sms.$inferSelect;
export type InsertSms = z.infer<typeof insertSmsSchema>;

// Newsletter types
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterEdition = typeof newsletterEditions.$inferSelect;
export type InsertNewsletterEdition = z.infer<typeof insertNewsletterEditionSchema>;

// OCR types
export type OCRRecord = typeof ocrRecords.$inferSelect;
export type InsertOCRRecord = z.infer<typeof insertOCRRecordSchema>;

// Extended types with relations
export type ProjectWithCollaborators = Project & {
  collaborators: (ProjectCollaborator & { user: User })[];
  characters: Character[];
  worldbuildingEntries: WorldbuildingEntry[];
  timelineEvents: TimelineEvent[];
  documents: Document[];
  // Romance-specific relations
  series?: RomanceSeries | null;
  tropes: RomanceTrope[];
  characterRelationships: CharacterRelationship[];
  coverDesigns: CoverDesign[];
  bookBlurbs: BookBlurb[];
  kdpMetadata: KdpMetadata[];
};

// Enhanced Character type with relationships
export type CharacterWithRelationships = Character & {
  relationshipsAsCharacter1: (CharacterRelationship & {
    character2: Character;
  })[];
  relationshipsAsCharacter2: (CharacterRelationship & {
    character1: Character;
  })[];
};

// Romance Series with books
export type RomanceSeriesWithBooks = RomanceSeries & {
  books: Project[];
  owner: User;
};

// Client Portfolio with revenue data
export type ClientPortfolioWithRevenue = ClientPortfolio & {
  agency: User;
  client: User;
  revenueEntries: RevenueEntry[];
};

// Enterprise dashboard types
export type EnterpriseMetrics = {
  totalClients: number;
  activeProjects: number;
  monthlyRevenue: number;
  completedBooks: number;
  averageProjectDuration: number;
  topGenres: { genre: string; count: number }[];
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

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  projectId: string;
  projectTitle: string;
  type: 'document' | 'character' | 'worldbuilding' | 'timeline';
  createdAt: Date;
}
