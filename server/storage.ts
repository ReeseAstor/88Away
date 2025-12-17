import {
  sessions,
  users,
  projects,
  characters,
  worldbuildingEntries,
  timelineEvents,
  documents,
  documentVersions,
  documentBranches,
  branchMergeEvents,
  projectCollaborators,
  aiGenerations,
  documentCollaborationStates,
  documentComments,
  collaborationPresence,
  notifications,
  activities,
  prompts,
  userFavoritePrompts,
  ocrRecords,
  revenueEntries,
  kdpMetadata,
  newsletterSubscribers,
  newsletterEditions,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Character,
  type InsertCharacter,
  type WorldbuildingEntry,
  type InsertWorldbuildingEntry,
  type TimelineEvent,
  type InsertTimelineEvent,
  type Document,
  type InsertDocument,
  type DocumentVersion,
  type InsertDocumentVersion,
  type DocumentBranch,
  type InsertDocumentBranch,
  type BranchMergeEvent,
  type InsertBranchMergeEvent,
  type ProjectCollaborator,
  type InsertProjectCollaborator,
  type AiGeneration,
  type ProjectWithCollaborators,
  type DocumentWithVersions,
  type DocumentBranchWithVersions,
  type DocumentCollaborationState,
  type DocumentComment,
  type InsertDocumentComment,
  type CollaborationPresence,
  type InsertCollaborationPresence,
  type Notification,
  type InsertNotification,
  type OnboardingProgress,
  type Activity,
  type InsertActivity,
  type SearchResult,
  type Prompt,
  type UserFavoritePrompt,
  type OCRRecord,
  type InsertOCRRecord,
  type RevenueEntry,
  type InsertRevenueEntry,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type NewsletterEdition,
  type InsertNewsletterEdition,
} from "@shared/schema";
import { calculateWordCount } from "@shared/utils";
import { db } from "./db";
import { eq, and, desc, asc, lt, sql, or, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Session operations
  getSession(sessionId: string): Promise<{ sid: string; sess: any; expire: Date } | undefined>;
  
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  getUserOnboarding(userId: string): Promise<OnboardingProgress | undefined>;
  updateUserOnboarding(userId: string, progress: Partial<OnboardingProgress>): Promise<User>;

  // Project operations
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<ProjectWithCollaborators | undefined>;
  createProject(project: InsertProject, ownerId: string): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Collaboration operations
  addProjectCollaborator(data: InsertProjectCollaborator): Promise<ProjectCollaborator>;
  removeProjectCollaborator(projectId: string, userId: string): Promise<void>;
  getUserRole(projectId: string, userId: string): Promise<string | undefined>;

  // Character operations
  getProjectCharacters(projectId: string): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<InsertCharacter>): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;

  // Worldbuilding operations
  getProjectWorldbuilding(projectId: string): Promise<WorldbuildingEntry[]>;
  getWorldbuildingEntry(id: string): Promise<WorldbuildingEntry | undefined>;
  createWorldbuildingEntry(entry: InsertWorldbuildingEntry): Promise<WorldbuildingEntry>;
  updateWorldbuildingEntry(id: string, updates: Partial<InsertWorldbuildingEntry>): Promise<WorldbuildingEntry>;
  deleteWorldbuildingEntry(id: string): Promise<void>;

  // Timeline operations
  getProjectTimeline(projectId: string): Promise<TimelineEvent[]>;
  getTimelineEvent(id: string): Promise<TimelineEvent | undefined>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: string, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent>;
  deleteTimelineEvent(id: string): Promise<void>;
  reorderTimelineEvents(projectId: string, eventId: string, newIndex: number, newDate?: string): Promise<TimelineEvent>;

  // Document operations
  getProjectDocuments(projectId: string): Promise<Document[]>;
  getDocument(id: string): Promise<DocumentWithVersions | undefined>;
  createDocument(document: InsertDocument & { authorId: string }): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>, authorId: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // AI generation operations
  saveAiGeneration(generation: {
    projectId: string;
    userId: string;
    persona: string;
    prompt: string;
    response: string;
    metadata?: any;
  }): Promise<AiGeneration>;
  getUserAiGenerations(userId: string, limit?: number): Promise<AiGeneration[]>;
  getUserAiUsage(userId: string, startDate: Date): Promise<{
    count: number;
    totalTokens: number;
  }>;

  // Analysis cache operations
  saveAnalysisCache(key: string, data: any): Promise<void>;
  getAnalysisCache(key: string): Promise<{ data: any; timestamp: Date } | undefined>;
  clearAnalysisCache(projectId: string): Promise<void>;

  // Comment CRUD operations
  createComment(documentId: string, authorId: string, content: string, range?: { start: number; end: number }): Promise<DocumentComment>;
  getDocumentComments(documentId: string): Promise<DocumentComment[]>;
  updateComment(commentId: string, updates: { content?: string; resolved?: boolean }): Promise<DocumentComment>;
  deleteComment(commentId: string): Promise<void>;
  resolveComment(commentId: string): Promise<DocumentComment>;

  // Collaboration state persistence
  saveCollaborationState(documentId: string, ydocState: string): Promise<DocumentCollaborationState>;
  getCollaborationState(documentId: string): Promise<DocumentCollaborationState | undefined>;

  // Presence management
  updatePresence(projectId: string, userId: string, documentId: string | null, status: 'online' | 'offline' | 'away', cursorPos?: { line: number; column: number }, color?: string): Promise<CollaborationPresence>;
  getProjectPresence(projectId: string): Promise<CollaborationPresence[]>;
  cleanupStalePresence(): Promise<void>;

  // Branch operations
  createBranch(documentId: string, name: string, description: string | null, parentBranchId: string | null, userId: string): Promise<DocumentBranch>;
  getBranches(documentId: string): Promise<DocumentBranch[]>;
  getBranch(branchId: string): Promise<DocumentBranch | undefined>;
  updateBranch(branchId: string, updates: Partial<InsertDocumentBranch>): Promise<DocumentBranch>;
  deleteBranch(branchId: string): Promise<void>;
  getBranchHead(branchId: string): Promise<DocumentVersion | undefined>;

  // Version operations
  createBranchVersion(branchId: string, content: string, ydocState: string | null, userId: string, wordCount?: number): Promise<DocumentVersion>;
  getBranchVersions(branchId: string, limit?: number): Promise<DocumentVersion[]>;
  getVersion(versionId: string): Promise<DocumentVersion | undefined>;
  rollbackBranch(branchId: string, targetVersionId: string, userId: string): Promise<DocumentVersion>;

  // Merge operations
  createMergeEvent(sourceBranchId: string, targetBranchId: string, userId: string): Promise<BranchMergeEvent>;
  updateMergeEvent(mergeEventId: string, status: 'pending' | 'completed' | 'failed' | 'conflicted', metadata?: any): Promise<BranchMergeEvent>;
  getMergeEvents(documentId: string): Promise<BranchMergeEvent[]>;
  findCommonAncestor(branch1Id: string, branch2Id: string): Promise<DocumentVersion | undefined>;

  // Template operations
  applyProjectTemplate(projectId: string, template: string, authorId: string): Promise<void>;

  // Notifications
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;

  // Activities
  getProjectActivities(projectId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Search
  searchContent(userId: string, query: string, limit?: number): Promise<SearchResult[]>;

  // Prompt methods
  getAllPrompts(): Promise<Prompt[]>;
  getPromptsByCategory(category: string): Promise<Prompt[]>;
  getPromptsByPersona(persona: string): Promise<Prompt[]>;
  getFeaturedPrompts(): Promise<Prompt[]>;
  searchPrompts(query: string): Promise<Prompt[]>;
  incrementPromptUsage(promptId: number): Promise<void>;

  // User favorites methods
  getUserFavoritePrompts(userId: string): Promise<Prompt[]>;
  addFavoritePrompt(userId: string, promptId: number): Promise<UserFavoritePrompt>;
  removeFavoritePrompt(userId: string, promptId: number): Promise<void>;

  // OCR methods
  createOCRRecord(data: { userId: string; projectId?: string; expertMode?: string; extractedText: string; metadata: any }): Promise<any>;
  getOCRHistory(userId: string, projectId?: string, limit?: number): Promise<any[]>;
  
  // AI Usage tracking
  getUserAIUsageCount(userId: string): Promise<number>;
  incrementAIUsage(userId: string, projectId: string | null, type: string): Promise<void>;

  // Revenue and monetization operations
  createRevenueEntry(data: any, userId: string): Promise<any>;
  getRomanceRevenue(userId: string, timeframe?: string): Promise<any>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;

  // Newsletter (public)
  upsertNewsletterSubscriber(email: string, metadata?: Record<string, any>): Promise<NewsletterSubscriber>;
  unsubscribeNewsletterSubscriberByToken(token: string): Promise<NewsletterSubscriber | null>;
  listNewsletterSubscribers(status?: 'subscribed' | 'unsubscribed'): Promise<NewsletterSubscriber[]>;
  createNewsletterEdition(data: InsertNewsletterEdition): Promise<NewsletterEdition>;
  getNewsletterEditionBySlug(slug: string): Promise<NewsletterEdition | undefined>;
  getNewsletterEditionByIssueDate(issueDate: string): Promise<NewsletterEdition | undefined>;
  getLatestNewsletterEdition(): Promise<NewsletterEdition | undefined>;
  listNewsletterEditions(limit?: number): Promise<NewsletterEdition[]>;
}

export class DatabaseStorage implements IStorage {
  // Session operations
  async getSession(sessionId: string): Promise<{ sid: string; sess: any; expire: Date } | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sid, sessionId));
    return session;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserOnboarding(userId: string): Promise<OnboardingProgress | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.onboardingProgress as OnboardingProgress | undefined;
  }

  async updateUserOnboarding(userId: string, progress: Partial<OnboardingProgress>): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    const currentProgress = user?.onboardingProgress as OnboardingProgress | null;
    const updatedProgress: OnboardingProgress = {
      welcomeShown: progress.welcomeShown ?? currentProgress?.welcomeShown ?? false,
      steps: {
        createProject: progress.steps?.createProject ?? currentProgress?.steps?.createProject ?? false,
        useAI: progress.steps?.useAI ?? currentProgress?.steps?.useAI ?? false,
        addCharacter: progress.steps?.addCharacter ?? currentProgress?.steps?.addCharacter ?? false,
        viewAnalytics: progress.steps?.viewAnalytics ?? currentProgress?.steps?.viewAnalytics ?? false,
        tryExport: progress.steps?.tryExport ?? currentProgress?.steps?.tryExport ?? false,
      },
      tourCompleted: progress.tourCompleted ?? currentProgress?.tourCompleted ?? false,
    };

    const allStepsComplete = Object.values(updatedProgress.steps).every(step => step === true);

    const [updatedUser] = await db
      .update(users)
      .set({
        onboardingProgress: updatedProgress,
        hasCompletedOnboarding: allStepsComplete && updatedProgress.tourCompleted,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    const ownedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.updatedAt));

    const collaboratedProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        genre: projects.genre,
        targetWordCount: projects.targetWordCount,
        currentWordCount: projects.currentWordCount,
        deadline: projects.deadline,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectCollaborators, eq(projects.id, projectCollaborators.projectId))
      .where(eq(projectCollaborators.userId, userId))
      .orderBy(desc(projects.updatedAt));

    // Combine and deduplicate
    const allProjects = [...ownedProjects, ...collaboratedProjects];
    const uniqueProjects = allProjects.filter((project, index, self) =>
      index === self.findIndex(p => p.id === project.id)
    );

    return uniqueProjects;
  }

  async getProject(id: string): Promise<ProjectWithCollaborators | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const collaborators = await db
      .select({
        id: projectCollaborators.id,
        projectId: projectCollaborators.projectId,
        userId: projectCollaborators.userId,
        role: projectCollaborators.role,
        createdAt: projectCollaborators.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionPlan: users.subscriptionPlan,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(projectCollaborators)
      .innerJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, id));

    const projectCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.projectId, id))
      .orderBy(asc(characters.name));

    const projectWorldbuilding = await db
      .select()
      .from(worldbuildingEntries)
      .where(eq(worldbuildingEntries.projectId, id))
      .orderBy(asc(worldbuildingEntries.title));

    const projectTimeline = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.projectId, id))
      .orderBy(asc(timelineEvents.date));

    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, id))
      .orderBy(asc(documents.orderIndex));

    return {
      ...project,
      collaborators,
      characters: projectCharacters,
      worldbuildingEntries: projectWorldbuilding,
      timelineEvents: projectTimeline,
      documents: projectDocuments,
    };
  }

  async createProject(project: InsertProject, ownerId: string): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, ownerId })
      .returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Collaboration operations
  async addProjectCollaborator(data: InsertProjectCollaborator): Promise<ProjectCollaborator> {
    const [collaborator] = await db
      .insert(projectCollaborators)
      .values(data)
      .returning();
    return collaborator;
  }

  async removeProjectCollaborator(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
  }

  async getUserRole(projectId: string, userId: string): Promise<string | undefined> {
    const [collaborator] = await db
      .select({ role: projectCollaborators.role })
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return collaborator?.role;
  }

  // Character operations
  async getProjectCharacters(projectId: string): Promise<Character[]> {
    return await db
      .select()
      .from(characters)
      .where(eq(characters.projectId, projectId))
      .orderBy(asc(characters.name));
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [newCharacter] = await db
      .insert(characters)
      .values(character)
      .returning();
    return newCharacter;
  }

  async updateCharacter(id: string, updates: Partial<InsertCharacter>): Promise<Character> {
    const [updated] = await db
      .update(characters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return updated;
  }

  async deleteCharacter(id: string): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }

  // Worldbuilding operations
  async getProjectWorldbuilding(projectId: string): Promise<WorldbuildingEntry[]> {
    return await db
      .select()
      .from(worldbuildingEntries)
      .where(eq(worldbuildingEntries.projectId, projectId))
      .orderBy(asc(worldbuildingEntries.title));
  }

  async getWorldbuildingEntry(id: string): Promise<WorldbuildingEntry | undefined> {
    const [entry] = await db.select().from(worldbuildingEntries).where(eq(worldbuildingEntries.id, id));
    return entry;
  }

  async createWorldbuildingEntry(entry: InsertWorldbuildingEntry): Promise<WorldbuildingEntry> {
    const [newEntry] = await db
      .insert(worldbuildingEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateWorldbuildingEntry(id: string, updates: Partial<InsertWorldbuildingEntry>): Promise<WorldbuildingEntry> {
    const [updated] = await db
      .update(worldbuildingEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(worldbuildingEntries.id, id))
      .returning();
    return updated;
  }

  async deleteWorldbuildingEntry(id: string): Promise<void> {
    await db.delete(worldbuildingEntries).where(eq(worldbuildingEntries.id, id));
  }

  // Timeline operations
  async getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
    return await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.projectId, projectId))
      .orderBy(asc(timelineEvents.date));
  }

  async getTimelineEvent(id: string): Promise<TimelineEvent | undefined> {
    const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id));
    return event;
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    let orderIndex = event.orderIndex ?? 0;
    
    if (orderIndex === 0 && event.projectId) {
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${timelineEvents.orderIndex}), -1)` })
        .from(timelineEvents)
        .where(eq(timelineEvents.projectId, event.projectId));
      
      orderIndex = (maxOrderResult[0]?.maxOrder ?? -1) + 1;
    }
    
    const [newEvent] = await db
      .insert(timelineEvents)
      .values({ ...event, orderIndex })
      .returning();
    return newEvent;
  }

  async updateTimelineEvent(id: string, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent> {
    const [updated] = await db
      .update(timelineEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timelineEvents.id, id))
      .returning();
    return updated;
  }

  async deleteTimelineEvent(id: string): Promise<void> {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }

  async reorderTimelineEvents(projectId: string, eventId: string, newIndex: number, newDate?: string): Promise<TimelineEvent> {
    return await db.transaction(async (tx) => {
      // 1. SECURITY: Verify event belongs to project
      const [event] = await tx
        .select()
        .from(timelineEvents)
        .where(
          and(
            eq(timelineEvents.id, eventId),
            eq(timelineEvents.projectId, projectId)
          )
        )
        .limit(1);

      if (!event) {
        throw new Error("Event not found or access denied");
      }

      // 2. Get ALL events in the project, sorted by current order
      const allEvents = await tx
        .select()
        .from(timelineEvents)
        .where(eq(timelineEvents.projectId, projectId))
        .orderBy(timelineEvents.orderIndex, timelineEvents.createdAt);

      // 3. CRITICAL: Rearrange array to reflect drag-and-drop
      // Remove the moved event from its current position
      const movedEvent = allEvents.find(e => e.id === eventId);
      if (!movedEvent) {
        throw new Error("Event not found in project events");
      }

      const eventsWithoutMoved = allEvents.filter(e => e.id !== eventId);
      
      // Insert the moved event at the new position
      eventsWithoutMoved.splice(newIndex, 0, movedEvent);

      // 4. Resequence the rearranged array with contiguous indices
      for (let i = 0; i < eventsWithoutMoved.length; i++) {
        const evt = eventsWithoutMoved[i];
        
        // Prepare update data
        const updateData: any = {
          orderIndex: i,
        };
        
        // If this is the moved event AND date should change, update it
        if (evt.id === eventId && newDate !== undefined) {
          updateData.date = newDate;
        }
        
        // Only update if something changed
        const needsUpdate = 
          evt.orderIndex !== i || 
          (evt.id === eventId && newDate !== undefined && evt.date !== newDate);
        
        if (needsUpdate) {
          await tx
            .update(timelineEvents)
            .set(updateData)
            .where(eq(timelineEvents.id, evt.id));
        }
      }

      // 5. Return the updated event
      const [finalEvent] = await tx
        .select()
        .from(timelineEvents)
        .where(eq(timelineEvents.id, eventId))
        .limit(1);

      return finalEvent!;
    });
  }

  // Document operations
  async getProjectDocuments(projectId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(asc(documents.orderIndex));
  }

  async getDocument(id: string): Promise<DocumentWithVersions | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    if (!document) return undefined;

    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, id))
      .orderBy(desc(documentVersions.createdAt));

    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, document.authorId));

    return {
      ...document,
      versions,
      author,
    };
  }

  async createDocument(document: InsertDocument & { authorId: string }): Promise<Document> {
    const wordCount = calculateWordCount(document.content || '');
    const [newDocument] = await db
      .insert(documents)
      .values({ ...document, wordCount })
      .returning();
    return newDocument;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>, authorId: string): Promise<Document> {
    const wordCount = updates.content ? calculateWordCount(updates.content) : undefined;
    
    // Save version history
    if (updates.content) {
      const [currentDoc] = await db.select().from(documents).where(eq(documents.id, id));
      if (currentDoc) {
        await db.insert(documentVersions).values({
          documentId: id,
          content: currentDoc.content || "",
          changeDescription: "Auto-saved version",
          authorId,
        });
      }
    }

    const [updated] = await db
      .update(documents)
      .set({ 
        ...updates, 
        ...(wordCount !== undefined && { wordCount }),
        updatedAt: new Date() 
      })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // AI generation operations
  async saveAiGeneration(generation: {
    projectId: string;
    userId: string;
    persona: string;
    prompt: string;
    response: string;
    metadata?: any;
  }): Promise<AiGeneration> {
    const [newGeneration] = await db
      .insert(aiGenerations)
      .values(generation)
      .returning();
    return newGeneration;
  }

  async getUserAiGenerations(userId: string, limit = 50): Promise<AiGeneration[]> {
    return await db
      .select()
      .from(aiGenerations)
      .where(eq(aiGenerations.userId, userId))
      .orderBy(desc(aiGenerations.createdAt))
      .limit(limit);
  }

  async getUserAiUsage(userId: string, startDate: Date): Promise<{
    count: number;
    totalTokens: number;
  }> {
    const generations = await db
      .select()
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.userId, userId),
          sql`${aiGenerations.createdAt} >= ${startDate}`
        )
      );

    let totalTokens = 0;
    for (const gen of generations) {
      if (gen.metadata && typeof gen.metadata === 'object') {
        const metadata = gen.metadata as any;
        const tokensIn = metadata.tokens_in || 0;
        const tokensOut = metadata.tokens_out || 0;
        totalTokens += tokensIn + tokensOut;
      }
    }

    return {
      count: generations.length,
      totalTokens
    };
  }

  // Analysis cache operations  
  private analysisCache = new Map<string, { data: any; timestamp: Date }>();

  async saveAnalysisCache(key: string, data: any): Promise<void> {
    this.analysisCache.set(key, {
      data,
      timestamp: new Date()
    });
  }

  async getAnalysisCache(key: string): Promise<{ data: any; timestamp: Date } | undefined> {
    return this.analysisCache.get(key);
  }

  async clearAnalysisCache(projectId: string): Promise<void> {
    // Clear all cache entries related to this project
    const keysToDelete: string[] = [];
    const keys = Array.from(this.analysisCache.keys());
    for (const key of keys) {
      if (key.includes(projectId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.analysisCache.delete(key));
  }

  // Comment CRUD operations
  async createComment(documentId: string, authorId: string, content: string, range?: { start: number; end: number }): Promise<DocumentComment> {
    // Check if user has access to the document
    const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!document) {
      throw new Error("Document not found");
    }

    // Check user has access to the project
    const hasAccess = await this.checkProjectAccess(document.projectId, authorId);
    if (!hasAccess) {
      throw new Error("User does not have access to this project");
    }

    const [comment] = await db
      .insert(documentComments)
      .values({
        documentId,
        authorId,
        content,
        range: range || null,
      })
      .returning();
    return comment;
  }

  async getDocumentComments(documentId: string): Promise<DocumentComment[]> {
    return await db
      .select()
      .from(documentComments)
      .where(eq(documentComments.documentId, documentId))
      .orderBy(asc(documentComments.createdAt));
  }

  async updateComment(commentId: string, updates: { content?: string; resolved?: boolean }): Promise<DocumentComment> {
    const [updated] = await db
      .update(documentComments)
      .set(updates)
      .where(eq(documentComments.id, commentId))
      .returning();
    
    if (!updated) {
      throw new Error("Comment not found");
    }
    
    return updated;
  }

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(documentComments).where(eq(documentComments.id, commentId));
  }

  async resolveComment(commentId: string): Promise<DocumentComment> {
    const [resolved] = await db
      .update(documentComments)
      .set({ resolved: true })
      .where(eq(documentComments.id, commentId))
      .returning();
    
    if (!resolved) {
      throw new Error("Comment not found");
    }
    
    return resolved;
  }

  // Collaboration state persistence
  async saveCollaborationState(documentId: string, ydocState: string): Promise<DocumentCollaborationState> {
    const [state] = await db
      .insert(documentCollaborationStates)
      .values({
        documentId,
        ydocState,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: documentCollaborationStates.documentId,
        set: {
          ydocState,
          updatedAt: new Date(),
        },
      })
      .returning();
    return state;
  }

  async getCollaborationState(documentId: string): Promise<DocumentCollaborationState | undefined> {
    const [state] = await db
      .select()
      .from(documentCollaborationStates)
      .where(eq(documentCollaborationStates.documentId, documentId));
    return state;
  }

  // Presence management
  async updatePresence(
    projectId: string,
    userId: string,
    documentId: string | null,
    status: 'online' | 'offline' | 'away',
    cursorPos?: { line: number; column: number },
    color?: string
  ): Promise<CollaborationPresence> {
    // Check user has access to the project
    const hasAccess = await this.checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      throw new Error("User does not have access to this project");
    }

    // First, try to find existing presence for this user in this project
    const [existingPresence] = await db
      .select()
      .from(collaborationPresence)
      .where(
        and(
          eq(collaborationPresence.projectId, projectId),
          eq(collaborationPresence.userId, userId)
        )
      );

    if (existingPresence) {
      // Update existing presence
      const [updated] = await db
        .update(collaborationPresence)
        .set({
          documentId,
          status,
          cursorPos: cursorPos || null,
          color: color || existingPresence.color,
          lastSeen: new Date(),
        })
        .where(eq(collaborationPresence.id, existingPresence.id))
        .returning();
      return updated;
    } else {
      // Create new presence
      const [newPresence] = await db
        .insert(collaborationPresence)
        .values({
          projectId,
          userId,
          documentId,
          status,
          cursorPos: cursorPos || null,
          color: color || this.generateUserColor(),
          lastSeen: new Date(),
        })
        .returning();
      return newPresence;
    }
  }

  async getProjectPresence(projectId: string): Promise<CollaborationPresence[]> {
    return await db
      .select()
      .from(collaborationPresence)
      .where(eq(collaborationPresence.projectId, projectId))
      .orderBy(desc(collaborationPresence.lastSeen));
  }

  async cleanupStalePresence(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await db
      .delete(collaborationPresence)
      .where(
        and(
          eq(collaborationPresence.status, 'online'),
          lt(collaborationPresence.lastSeen, fiveMinutesAgo)
        )
      );
  }

  // Helper method to check project access
  private async checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
    // Check if user is owner
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    
    if (!project) {
      return false;
    }
    
    if (project.ownerId === userId) {
      return true;
    }
    
    // Check if user is a collaborator
    const [collaborator] = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    
    return !!collaborator;
  }

  // Helper method to generate a color for user cursor
  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#F4A460', // Sandy
      '#98D8C8', // Mint
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Branch operations
  async createBranch(
    documentId: string, 
    name: string, 
    description: string | null, 
    parentBranchId: string | null, 
    userId: string
  ): Promise<DocumentBranch> {
    // Verify document exists and user has access
    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const hasAccess = await this.checkProjectAccess(document.projectId, userId);
    if (!hasAccess) {
      throw new Error("User does not have access to this project");
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Get base version ID if this is a child branch
    let baseVersionId: string | null = null;
    if (parentBranchId) {
      const parentBranch = await this.getBranchHead(parentBranchId);
      if (parentBranch) {
        baseVersionId = parentBranch.id;
      }
    }

    const [branch] = await db
      .insert(documentBranches)
      .values({
        documentId,
        name,
        slug,
        description,
        parentBranchId,
        baseVersionId,
        createdBy: userId,
      })
      .returning();

    return branch;
  }

  async getBranches(documentId: string): Promise<DocumentBranch[]> {
    return await db
      .select()
      .from(documentBranches)
      .where(eq(documentBranches.documentId, documentId))
      .orderBy(desc(documentBranches.createdAt));
  }

  async getBranch(branchId: string): Promise<DocumentBranch | undefined> {
    const [branch] = await db
      .select()
      .from(documentBranches)
      .where(eq(documentBranches.id, branchId));
    return branch;
  }

  async updateBranch(branchId: string, updates: Partial<InsertDocumentBranch>): Promise<DocumentBranch> {
    const [updated] = await db
      .update(documentBranches)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(documentBranches.id, branchId))
      .returning();
    
    if (!updated) {
      throw new Error("Branch not found");
    }
    
    return updated;
  }

  async deleteBranch(branchId: string): Promise<void> {
    await db
      .delete(documentBranches)
      .where(eq(documentBranches.id, branchId));
  }

  async getBranchHead(branchId: string): Promise<DocumentVersion | undefined> {
    const [latestVersion] = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.branchId, branchId))
      .orderBy(desc(documentVersions.createdAt))
      .limit(1);
    
    return latestVersion;
  }

  // Version operations
  async createBranchVersion(
    branchId: string, 
    content: string, 
    ydocState: string | null, 
    userId: string,
    wordCount: number = 0
  ): Promise<DocumentVersion> {
    // Get branch to verify it exists and get documentId
    const branch = await this.getBranch(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    // Get previous version to set as parent
    const previousVersion = await this.getBranchHead(branchId);
    
    const [version] = await db
      .insert(documentVersions)
      .values({
        documentId: branch.documentId,
        branchId,
        parentVersionId: previousVersion?.id || null,
        content,
        ydocState,
        wordCount,
        authorId: userId,
      })
      .returning();

    return version;
  }

  async getBranchVersions(branchId: string, limit: number = 50): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.branchId, branchId))
      .orderBy(desc(documentVersions.createdAt))
      .limit(limit);
  }

  async getVersion(versionId: string): Promise<DocumentVersion | undefined> {
    const [version] = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.id, versionId));
    return version;
  }

  async rollbackBranch(branchId: string, targetVersionId: string, userId: string): Promise<DocumentVersion> {
    // Get the target version to rollback to
    const targetVersion = await this.getVersion(targetVersionId);
    if (!targetVersion || targetVersion.branchId !== branchId) {
      throw new Error("Target version not found or does not belong to this branch");
    }

    // Create a new version with the content from the target version
    return await this.createBranchVersion(
      branchId,
      targetVersion.content,
      targetVersion.ydocState,
      userId,
      targetVersion.wordCount || 0
    );
  }

  // Merge operations
  async createMergeEvent(
    sourceBranchId: string, 
    targetBranchId: string, 
    userId: string
  ): Promise<BranchMergeEvent> {
    // Verify both branches exist and get their document IDs
    const [sourceBranch, targetBranch] = await Promise.all([
      this.getBranch(sourceBranchId),
      this.getBranch(targetBranchId)
    ]);

    if (!sourceBranch || !targetBranch) {
      throw new Error("Source or target branch not found");
    }

    if (sourceBranch.documentId !== targetBranch.documentId) {
      throw new Error("Branches belong to different documents");
    }

    const [mergeEvent] = await db
      .insert(branchMergeEvents)
      .values({
        documentId: sourceBranch.documentId,
        sourceBranchId,
        targetBranchId,
        initiatorId: userId,
        status: 'pending',
      })
      .returning();

    return mergeEvent;
  }

  async updateMergeEvent(
    mergeEventId: string, 
    status: 'pending' | 'completed' | 'failed' | 'conflicted',
    metadata?: any
  ): Promise<BranchMergeEvent> {
    const updates: any = {
      status,
      metadata: metadata || null,
    };

    if (status !== 'pending') {
      updates.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(branchMergeEvents)
      .set(updates)
      .where(eq(branchMergeEvents.id, mergeEventId))
      .returning();

    if (!updated) {
      throw new Error("Merge event not found");
    }

    return updated;
  }

  async getMergeEvents(documentId: string): Promise<BranchMergeEvent[]> {
    return await db
      .select()
      .from(branchMergeEvents)
      .where(eq(branchMergeEvents.documentId, documentId))
      .orderBy(desc(branchMergeEvents.createdAt));
  }

  async findCommonAncestor(branch1Id: string, branch2Id: string): Promise<DocumentVersion | undefined> {
    // Get all versions from both branches
    const [branch1Versions, branch2Versions] = await Promise.all([
      this.getBranchVersions(branch1Id, 100),
      this.getBranchVersions(branch2Id, 100)
    ]);

    // Create a set of version IDs and parent version IDs from branch1
    const branch1VersionIds = new Set<string>();
    const branch1ParentIds = new Set<string>();
    
    for (const version of branch1Versions) {
      branch1VersionIds.add(version.id);
      if (version.parentVersionId) {
        branch1ParentIds.add(version.parentVersionId);
      }
    }

    // Find the first version in branch2 that exists in branch1's history
    for (const version of branch2Versions) {
      if (branch1VersionIds.has(version.id)) {
        return version;
      }
      if (version.parentVersionId && branch1VersionIds.has(version.parentVersionId)) {
        return await this.getVersion(version.parentVersionId);
      }
    }

    // Check if branches share a common base version through their parent branches
    const [branch1, branch2] = await Promise.all([
      this.getBranch(branch1Id),
      this.getBranch(branch2Id)
    ]);

    if (branch1?.baseVersionId && branch2?.baseVersionId) {
      if (branch1.baseVersionId === branch2.baseVersionId) {
        return await this.getVersion(branch1.baseVersionId);
      }
    }

    return undefined;
  }

  async applyProjectTemplate(projectId: string, template: string, authorId: string): Promise<void> {
    const { getTemplate } = await import('./templates');
    const templateData = getTemplate(template as any);

    // Create documents
    for (const doc of templateData.documents) {
      await this.createDocument({
        ...doc,
        projectId,
        authorId,
      });
    }

    // Create characters
    for (const character of templateData.characters) {
      await this.createCharacter({
        ...character,
        projectId,
      });
    }

    // Create worldbuilding entries
    for (const entry of templateData.worldbuilding) {
      await this.createWorldbuildingEntry({
        ...entry,
        projectId,
      });
    }

    // Create timeline events
    for (const event of templateData.timeline) {
      await this.createTimelineEvent({
        ...event,
        projectId,
      });
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return notifs;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return newNotification;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return result[0]?.count || 0;
  }

  async getProjectActivities(projectId: string, limit: number = 50): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return created;
  }

  async searchContent(userId: string, query: string, limit: number = 20): Promise<SearchResult[]> {
    const projectIds = await db
      .select({ id: projects.id })
      .from(projects)
      .leftJoin(projectCollaborators, eq(projects.id, projectCollaborators.projectId))
      .where(
        or(
          eq(projects.ownerId, userId),
          and(
            eq(projectCollaborators.userId, userId),
            inArray(projectCollaborators.role, ["editor", "reviewer", "reader"])
          )
        )
      );

    const userProjectIds = projectIds.map(p => p.id);

    if (userProjectIds.length === 0) {
      return [];
    }

    const searchPattern = `%${query.toLowerCase()}%`;

    const documentResults = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        projectId: documents.projectId,
        projectTitle: projects.title,
        type: sql<string>`'document'`,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .innerJoin(projects, eq(documents.projectId, projects.id))
      .where(
        and(
          inArray(documents.projectId, userProjectIds),
          or(
            sql`LOWER(${documents.title}) LIKE ${searchPattern}`,
            sql`LOWER(${documents.content}) LIKE ${searchPattern}`
          )
        )
      )
      .limit(limit);

    const characterResults = await db
      .select({
        id: characters.id,
        title: characters.name,
        content: sql<string>`COALESCE(${characters.description}, '') || ' ' || COALESCE(${characters.notes}, '')`,
        projectId: characters.projectId,
        projectTitle: projects.title,
        type: sql<string>`'character'`,
        createdAt: characters.createdAt,
      })
      .from(characters)
      .innerJoin(projects, eq(characters.projectId, projects.id))
      .where(
        and(
          inArray(characters.projectId, userProjectIds),
          or(
            sql`LOWER(${characters.name}) LIKE ${searchPattern}`,
            sql`LOWER(${characters.description}) LIKE ${searchPattern}`,
            sql`LOWER(${characters.notes}) LIKE ${searchPattern}`
          )
        )
      )
      .limit(limit);

    const worldbuildingResults = await db
      .select({
        id: worldbuildingEntries.id,
        title: worldbuildingEntries.title,
        content: worldbuildingEntries.description,
        projectId: worldbuildingEntries.projectId,
        projectTitle: projects.title,
        type: sql<string>`'worldbuilding'`,
        createdAt: worldbuildingEntries.createdAt,
      })
      .from(worldbuildingEntries)
      .innerJoin(projects, eq(worldbuildingEntries.projectId, projects.id))
      .where(
        and(
          inArray(worldbuildingEntries.projectId, userProjectIds),
          or(
            sql`LOWER(${worldbuildingEntries.title}) LIKE ${searchPattern}`,
            sql`LOWER(${worldbuildingEntries.description}) LIKE ${searchPattern}`
          )
        )
      )
      .limit(limit);

    const timelineResults = await db
      .select({
        id: timelineEvents.id,
        title: timelineEvents.title,
        content: timelineEvents.description,
        projectId: timelineEvents.projectId,
        projectTitle: projects.title,
        type: sql<string>`'timeline'`,
        createdAt: timelineEvents.createdAt,
      })
      .from(timelineEvents)
      .innerJoin(projects, eq(timelineEvents.projectId, projects.id))
      .where(
        and(
          inArray(timelineEvents.projectId, userProjectIds),
          or(
            sql`LOWER(${timelineEvents.title}) LIKE ${searchPattern}`,
            sql`LOWER(${timelineEvents.description}) LIKE ${searchPattern}`
          )
        )
      )
      .limit(limit);

    const allResults = [
      ...documentResults,
      ...characterResults,
      ...worldbuildingResults,
      ...timelineResults,
    ];

    allResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const queryLower = query.toLowerCase();

      const aExact = aTitle === queryLower ? 1 : 0;
      const bExact = bTitle === queryLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aTitleMatch = aTitle.includes(queryLower) ? 1 : 0;
      const bTitleMatch = bTitle.includes(queryLower) ? 1 : 0;
      if (aTitleMatch !== bTitleMatch) return bTitleMatch - aTitleMatch;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return allResults.slice(0, limit);
  }

  // Prompt methods
  async getAllPrompts(): Promise<Prompt[]> {
    return db.select().from(prompts).orderBy(prompts.category, prompts.title);
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.category, category)).orderBy(prompts.title);
  }

  async getPromptsByPersona(persona: string): Promise<Prompt[]> {
    return db.select().from(prompts).where(
      or(eq(prompts.persona, persona), eq(prompts.persona, "any"))
    ).orderBy(prompts.category, prompts.title);
  }

  async getFeaturedPrompts(): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.isFeatured, true)).orderBy(desc(prompts.usageCount));
  }

  async searchPrompts(query: string): Promise<Prompt[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return db.select().from(prompts).where(
      or(
        sql`LOWER(${prompts.title}) LIKE ${searchPattern}`,
        sql`LOWER(${prompts.content}) LIKE ${searchPattern}`,
        sql`LOWER(${prompts.category}) LIKE ${searchPattern}`,
        sql`LOWER(${prompts.subcategory}) LIKE ${searchPattern}`
      )
    ).orderBy(prompts.category, prompts.title);
  }

  async incrementPromptUsage(promptId: number): Promise<void> {
    await db.update(prompts)
      .set({ usageCount: sql`${prompts.usageCount} + 1` })
      .where(eq(prompts.id, promptId));
  }

  // User favorites methods
  async getUserFavoritePrompts(userId: string): Promise<Prompt[]> {
    const favorites = await db
      .select({ prompt: prompts })
      .from(userFavoritePrompts)
      .innerJoin(prompts, eq(userFavoritePrompts.promptId, prompts.id))
      .where(eq(userFavoritePrompts.userId, userId))
      .orderBy(prompts.category, prompts.title);
    
    return favorites.map(f => f.prompt);
  }

  async addFavoritePrompt(userId: string, promptId: number): Promise<UserFavoritePrompt> {
    const [favorite] = await db.insert(userFavoritePrompts)
      .values({ userId, promptId })
      .returning();
    return favorite;
  }

  async removeFavoritePrompt(userId: string, promptId: number): Promise<void> {
    await db.delete(userFavoritePrompts)
      .where(
        and(
          eq(userFavoritePrompts.userId, userId),
          eq(userFavoritePrompts.promptId, promptId)
        )
      );
  }

  // OCR methods
  async createOCRRecord(data: { userId: string; projectId?: string; expertMode?: string; extractedText: string; metadata: any }): Promise<OCRRecord> {
    const [record] = await db.insert(ocrRecords)
      .values({
        userId: data.userId,
        projectId: data.projectId || null,
        expertMode: data.expertMode as any,
        extractedText: data.extractedText,
        metadata: data.metadata
      })
      .returning();
    return record;
  }

  async getOCRHistory(userId: string, projectId?: string, limit: number = 50): Promise<OCRRecord[]> {
    const conditions = [eq(ocrRecords.userId, userId)];
    
    if (projectId) {
      conditions.push(eq(ocrRecords.projectId, projectId));
    }

    return db.select()
      .from(ocrRecords)
      .where(and(...conditions))
      .orderBy(desc(ocrRecords.createdAt))
      .limit(limit);
  }

  // AI Usage tracking
  async getUserAIUsageCount(userId: string): Promise<number> {
    // Count AI generations from this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.userId, userId),
          sql`${aiGenerations.createdAt} >= ${startOfMonth.toISOString()}`
        )
      );

    return Number(result?.count || 0);
  }

  async incrementAIUsage(userId: string, projectId: string | null, type: string): Promise<void> {
    // Record the AI usage
    await db.insert(aiGenerations).values({
      userId,
      projectId: projectId || undefined,
      persona: type,
      prompt: `OCR extraction - ${type}`,
      response: 'OCR processed',
      metadata: { type, timestamp: new Date() }
    });
  }

  // Revenue and monetization operations
  async createRevenueEntry(data: InsertRevenueEntry, userId: string): Promise<RevenueEntry> {
    const [entry] = await db.insert(revenueEntries)
      .values({
        ...data,
        userId,
        transactionDate: data.transactionDate || new Date(),
      })
      .returning();
    return entry;
  }

  async getRomanceRevenue(userId: string, timeframe: string = 'month'): Promise<any> {
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get revenue entries
    const entries = await db
      .select()
      .from(revenueEntries)
      .where(
        and(
          eq(revenueEntries.userId, userId),
          sql`${revenueEntries.transactionDate} >= ${startDate.toISOString()}`
        )
      )
      .orderBy(desc(revenueEntries.transactionDate));

    // Calculate totals
    const totalRevenue = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const bookSales = entries
      .filter(e => e.source === 'kdp' || e.source === 'book_sale')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const royalties = entries
      .filter(e => e.source === 'royalty')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const subscriptions = entries
      .filter(e => e.source === 'subscription')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);

    // Get project-specific revenue
    const projectRevenue = await db
      .select({
        projectId: revenueEntries.projectId,
        amount: sql<number>`sum(${revenueEntries.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(revenueEntries)
      .where(
        and(
          eq(revenueEntries.userId, userId),
          sql`${revenueEntries.transactionDate} >= ${startDate.toISOString()}`,
          sql`${revenueEntries.projectId} IS NOT NULL`
        )
      )
      .groupBy(revenueEntries.projectId);

    // Get KDP sales data if available
    const kdpData = await db
      .select()
      .from(kdpMetadata)
      .innerJoin(projects, eq(kdpMetadata.projectId, projects.id))
      .where(eq(projects.ownerId, userId));

    return {
      totalRevenue,
      bookSales,
      royalties,
      subscriptions,
      entries,
      projectRevenue,
      kdpData,
      timeframe,
      startDate,
      endDate: now,
    };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Newsletter (public)
  async upsertNewsletterSubscriber(email: string, metadata: Record<string, any> = {}): Promise<NewsletterSubscriber> {
    const normalizedEmail = email.trim().toLowerCase();
    const unsubscribeToken = randomBytes(24).toString("hex");

    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values({
        email: normalizedEmail,
        status: 'subscribed',
        unsubscribeToken,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        metadata,
        updatedAt: new Date(),
      } as unknown as InsertNewsletterSubscriber)
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          status: 'subscribed',
          // rotate token to invalidate older unsubscribe links on re-subscribe
          unsubscribeToken,
          subscribedAt: sql`COALESCE(${newsletterSubscribers.subscribedAt}, NOW())`,
          unsubscribedAt: null,
          metadata,
          updatedAt: new Date(),
        },
      })
      .returning();

    return subscriber;
  }

  async unsubscribeNewsletterSubscriberByToken(token: string): Promise<NewsletterSubscriber | null> {
    const [updated] = await db
      .update(newsletterSubscribers)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.unsubscribeToken, token))
      .returning();

    return updated || null;
  }

  async listNewsletterSubscribers(status: 'subscribed' | 'unsubscribed' = 'subscribed'): Promise<NewsletterSubscriber[]> {
    return db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, status))
      .orderBy(desc(newsletterSubscribers.updatedAt));
  }

  async createNewsletterEdition(data: InsertNewsletterEdition): Promise<NewsletterEdition> {
    const [created] = await db
      .insert(newsletterEditions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    return created;
  }

  async getNewsletterEditionBySlug(slug: string): Promise<NewsletterEdition | undefined> {
    const [edition] = await db
      .select()
      .from(newsletterEditions)
      .where(eq(newsletterEditions.slug, slug))
      .limit(1);
    return edition;
  }

  async getNewsletterEditionByIssueDate(issueDate: string): Promise<NewsletterEdition | undefined> {
    const [edition] = await db
      .select()
      .from(newsletterEditions)
      .where(eq(newsletterEditions.issueDate, issueDate))
      .orderBy(desc(newsletterEditions.publishedAt))
      .limit(1);
    return edition;
  }

  async getLatestNewsletterEdition(): Promise<NewsletterEdition | undefined> {
    const [edition] = await db
      .select()
      .from(newsletterEditions)
      .orderBy(desc(newsletterEditions.publishedAt))
      .limit(1);
    return edition;
  }

  async listNewsletterEditions(limit: number = 30): Promise<NewsletterEdition[]> {
    return db
      .select()
      .from(newsletterEditions)
      .orderBy(desc(newsletterEditions.publishedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
