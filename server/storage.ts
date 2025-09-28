import {
  users,
  projects,
  characters,
  worldbuildingEntries,
  timelineEvents,
  documents,
  documentVersions,
  projectCollaborators,
  aiGenerations,
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
  type ProjectCollaborator,
  type InsertProjectCollaborator,
  type AiGeneration,
  type ProjectWithCollaborators,
  type DocumentWithVersions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
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
    const [newEvent] = await db
      .insert(timelineEvents)
      .values(event)
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
    const wordCount = document.content ? document.content.split(/\s+/).length : 0;
    const [newDocument] = await db
      .insert(documents)
      .values({ ...document, wordCount })
      .returning();
    return newDocument;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>, authorId: string): Promise<Document> {
    const wordCount = updates.content ? updates.content.split(/\s+/).length : undefined;
    
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
}

export const storage = new DatabaseStorage();
