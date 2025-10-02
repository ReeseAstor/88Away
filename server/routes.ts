import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { documentComments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  generateContent, 
  buildMusePrompt, 
  buildEditorPrompt, 
  buildCoachPrompt,
  fetchProjectContext,
  analyzeWritingStyle,
  analyzePlotConsistency,
  analyzeCharacterDevelopment,
  analyzeNarrativeFlow,
  type AiRequest,
  type StyleAnalysisRequest,
  type PlotConsistencyRequest,
  type CharacterDevelopmentRequest,
  type NarrativeFlowRequest
} from "./openai";
import { AnalyticsService } from "./analytics";
import { 
  insertProjectSchema,
  insertCharacterSchema,
  insertWorldbuildingEntrySchema,
  insertTimelineEventSchema,
  insertDocumentSchema,
  insertProjectCollaboratorSchema,
  insertDocumentBranchSchema,
  insertDocumentVersionSchema,
  insertBranchMergeEventSchema,
} from "@shared/schema";
import { z } from "zod";
import * as Y from 'yjs';
import { CollaborationService } from "./collaboration";

let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe API key is not configured. Please set the STRIPE_SECRET_KEY environment variable.');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access (owner or collaborator)
      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { template, ...projectData } = req.body;
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData, userId);
      
      if (template && template !== 'blank') {
        await storage.applyProjectTemplate(project.id, template, userId);
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      const updated = await storage.updateProject(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Analytics routes
  app.get('/api/projects/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await AnalyticsService.getProjectAnalytics(req.params.id, userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      if (error instanceof Error && error.message.includes('Access denied')) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    }
  });

  // Character routes
  app.get('/api/projects/:projectId/characters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const characters = await storage.getProjectCharacters(req.params.projectId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.post('/api/projects/:projectId/characters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(req.params.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertCharacterSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      
      const character = await storage.createCharacter(validatedData);
      res.json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(500).json({ message: "Failed to create character" });
    }
  });

  app.put('/api/characters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacter(req.params.id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const project = await storage.getProject(character.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(character.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertCharacterSchema.partial().parse(req.body);
      const updated = await storage.updateCharacter(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ message: "Failed to update character" });
    }
  });

  app.delete('/api/characters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacter(req.params.id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const project = await storage.getProject(character.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(character.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteCharacter(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting character:", error);
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  // Worldbuilding routes
  app.get('/api/projects/:projectId/worldbuilding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const entries = await storage.getProjectWorldbuilding(req.params.projectId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching worldbuilding:", error);
      res.status(500).json({ message: "Failed to fetch worldbuilding entries" });
    }
  });

  app.post('/api/projects/:projectId/worldbuilding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(req.params.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Normalize tags if provided as string
      const normalizedBody = { ...req.body };
      if (normalizedBody.tags && typeof normalizedBody.tags === 'string') {
        normalizedBody.tags = normalizedBody.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      const validatedData = insertWorldbuildingEntrySchema.parse({
        ...normalizedBody,
        projectId: req.params.projectId
      });
      
      const entry = await storage.createWorldbuildingEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating worldbuilding entry:", error);
      res.status(500).json({ message: "Failed to create worldbuilding entry" });
    }
  });

  app.put('/api/worldbuilding/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.getWorldbuildingEntry(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Worldbuilding entry not found" });
      }

      const project = await storage.getProject(entry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(entry.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Normalize tags if provided as string
      const normalizedBody = { ...req.body };
      if (normalizedBody.tags && typeof normalizedBody.tags === 'string') {
        normalizedBody.tags = normalizedBody.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      // Prevent projectId changes - override with existing entry's projectId
      const validatedData = insertWorldbuildingEntrySchema.partial().parse({
        ...normalizedBody,
        projectId: entry.projectId
      });

      const updated = await storage.updateWorldbuildingEntry(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating worldbuilding entry:", error);
      res.status(500).json({ message: "Failed to update worldbuilding entry" });
    }
  });

  app.delete('/api/worldbuilding/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.getWorldbuildingEntry(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Worldbuilding entry not found" });
      }

      const project = await storage.getProject(entry.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(entry.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteWorldbuildingEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting worldbuilding entry:", error);
      res.status(500).json({ message: "Failed to delete worldbuilding entry" });
    }
  });

  // Timeline routes
  app.get('/api/projects/:projectId/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const events = await storage.getProjectTimeline(req.params.projectId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline events" });
    }
  });

  app.post('/api/projects/:projectId/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(req.params.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertTimelineEventSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      
      const event = await storage.createTimelineEvent(validatedData);
      res.json(event);
    } catch (error) {
      console.error("Error creating timeline event:", error);
      res.status(500).json({ message: "Failed to create timeline event" });
    }
  });

  app.put('/api/timeline/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const event = await storage.getTimelineEvent(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Timeline event not found" });
      }

      const project = await storage.getProject(event.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(event.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Normalize array fields if provided as strings
      const normalizedBody = { ...req.body };
      if (normalizedBody.tags && typeof normalizedBody.tags === 'string') {
        normalizedBody.tags = normalizedBody.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }
      if (normalizedBody.relatedCharacters && typeof normalizedBody.relatedCharacters === 'string') {
        normalizedBody.relatedCharacters = normalizedBody.relatedCharacters.split(',').map((char: string) => char.trim()).filter(Boolean);
      }
      if (normalizedBody.relatedLocations && typeof normalizedBody.relatedLocations === 'string') {
        normalizedBody.relatedLocations = normalizedBody.relatedLocations.split(',').map((loc: string) => loc.trim()).filter(Boolean);
      }

      // Prevent projectId changes - override with existing event's projectId
      const validatedData = insertTimelineEventSchema.partial().parse({
        ...normalizedBody,
        projectId: event.projectId
      });

      const updated = await storage.updateTimelineEvent(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating timeline event:", error);
      res.status(500).json({ message: "Failed to update timeline event" });
    }
  });

  app.delete('/api/timeline/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const event = await storage.getTimelineEvent(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Timeline event not found" });
      }

      const project = await storage.getProject(event.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(event.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteTimelineEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      res.status(500).json({ message: "Failed to delete timeline event" });
    }
  });

  // Document routes
  app.get('/api/projects/:projectId/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const documents = await storage.getProjectDocuments(req.params.projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post('/api/projects/:projectId/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(req.params.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      
      const document = await storage.createDocument({
        ...validatedData,
        authorId: userId
      });
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const updated = await storage.updateDocument(req.params.id, validatedData, userId);
      
      // Recalculate project's total word count
      const allDocuments = await storage.getProjectDocuments(document.projectId);
      const totalWordCount = allDocuments.reduce((sum, doc) => sum + (doc.wordCount || 0), 0);
      await storage.updateProject(document.projectId, { currentWordCount: totalWordCount });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // ==================== BRANCH MANAGEMENT ENDPOINTS ====================

  // GET /api/documents/:id/branches - List all branches for a document
  app.get('/api/documents/:id/branches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      const branches = await storage.getBranches(req.params.id);
      
      // Include branch head version and metadata for each branch
      const branchesWithMetadata = await Promise.all(
        branches.map(async (branch) => {
          const headVersion = await storage.getBranchHead(branch.id);
          return {
            ...branch,
            headVersion: headVersion ? {
              id: headVersion.id,
              wordCount: headVersion.wordCount,
              createdAt: headVersion.createdAt,
              authorId: headVersion.authorId
            } : null,
          };
        })
      );

      res.json(branchesWithMetadata);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  // POST /api/documents/:id/branches - Create new branch
  app.post('/api/documents/:id/branches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can create branches
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const branchSchema = z.object({
        name: z.string(),
        description: z.string().nullable().optional(),
        parentBranchId: z.string().nullable().optional(),
      });

      const validatedData = branchSchema.parse(req.body);
      
      const branch = await storage.createBranch(
        req.params.id,
        validatedData.name,
        validatedData.description || null,
        validatedData.parentBranchId || null,
        userId
      );

      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  // PUT /api/branches/:branchId - Update branch metadata
  app.put('/api/branches/:branchId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const branch = await storage.getBranch(req.params.branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const document = await storage.getDocument(branch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can update branches
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertDocumentBranchSchema.partial().parse(req.body);
      const updated = await storage.updateBranch(req.params.branchId, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  // DELETE /api/branches/:branchId - Delete branch (owner/editor only)
  app.delete('/api/branches/:branchId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const branch = await storage.getBranch(req.params.branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Prevent deletion of main branch
      if (branch.name === 'main') {
        return res.status(400).json({ message: "Cannot delete main branch" });
      }

      const document = await storage.getDocument(branch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can delete branches
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteBranch(req.params.branchId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ message: "Failed to delete branch" });
    }
  });

  // POST /api/documents/:id/branches/switch - Switch active branch for user session
  app.post('/api/documents/:id/branches/switch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      const switchSchema = z.object({
        branchId: z.string(),
      });

      const { branchId } = switchSchema.parse(req.body);
      
      const branch = await storage.getBranch(branchId);
      if (!branch || branch.documentId !== req.params.id) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Store active branch in session
      if (!req.session) {
        req.session = {};
      }
      if (!req.session.activeBranches) {
        req.session.activeBranches = {};
      }
      req.session.activeBranches[req.params.id] = branchId;

      // Update collaboration context if user is in a collaboration session
      const collaborationService = CollaborationService.getInstance();
      // Note: This would need to be implemented in CollaborationService
      // collaborationService.updateUserBranch(userId, document.projectId, req.params.id, branchId);

      res.json({ 
        success: true, 
        activeBranch: branch,
        message: "Active branch switched successfully" 
      });
      
      // Set header for active branch
      res.setHeader('X-Active-Branch', branchId);
    } catch (error) {
      console.error("Error switching branch:", error);
      res.status(500).json({ message: "Failed to switch branch" });
    }
  });

  // ==================== VERSION OPERATIONS ENDPOINTS ====================

  // GET /api/branches/:branchId/versions - List versions in a branch
  app.get('/api/branches/:branchId/versions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const branch = await storage.getBranch(req.params.branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const document = await storage.getDocument(branch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const versions = await storage.getBranchVersions(req.params.branchId, limit);
      
      res.json(versions);
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  // GET /api/versions/:versionId - Get specific version details
  app.get('/api/versions/:versionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const version = await storage.getVersion(req.params.versionId);
      
      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }

      const document = await storage.getDocument(version.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(version);
    } catch (error) {
      console.error("Error fetching version:", error);
      res.status(500).json({ message: "Failed to fetch version" });
    }
  });

  // POST /api/branches/:branchId/rollback - Rollback branch to specific version
  app.post('/api/branches/:branchId/rollback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const branch = await storage.getBranch(req.params.branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const document = await storage.getDocument(branch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can rollback
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const rollbackSchema = z.object({
        targetVersionId: z.string(),
      });

      const { targetVersionId } = rollbackSchema.parse(req.body);
      
      const targetVersion = await storage.getVersion(targetVersionId);
      if (!targetVersion || targetVersion.branchId !== req.params.branchId) {
        return res.status(404).json({ message: "Target version not found in this branch" });
      }

      const newVersion = await storage.rollbackBranch(req.params.branchId, targetVersionId, userId);
      
      // Invalidate cache for this document
      await storage.clearAnalysisCache(document.projectId);

      res.json({
        success: true,
        newVersion,
        message: `Branch rolled back to version ${targetVersionId}`
      });
    } catch (error) {
      console.error("Error rolling back branch:", error);
      res.status(500).json({ message: "Failed to rollback branch" });
    }
  });

  // GET /api/branches/:branchId/diff - Compare branch with another branch or version
  app.get('/api/branches/:branchId/diff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const branch = await storage.getBranch(req.params.branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const document = await storage.getDocument(branch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { compareToBranchId, compareToVersionId } = req.query;
      
      if (!compareToBranchId && !compareToVersionId) {
        return res.status(400).json({ message: "Must provide either compareToBranchId or compareToVersionId" });
      }

      let sourceVersion = await storage.getBranchHead(req.params.branchId);
      let targetVersion: any = null;

      if (compareToVersionId) {
        targetVersion = await storage.getVersion(compareToVersionId as string);
        if (!targetVersion) {
          return res.status(404).json({ message: "Compare version not found" });
        }
      } else if (compareToBranchId) {
        const compareBranch = await storage.getBranch(compareToBranchId as string);
        if (!compareBranch || compareBranch.documentId !== branch.documentId) {
          return res.status(404).json({ message: "Compare branch not found" });
        }
        targetVersion = await storage.getBranchHead(compareToBranchId as string);
      }

      if (!sourceVersion || !targetVersion) {
        return res.status(404).json({ message: "No versions to compare" });
      }

      // Compare Yjs states if available
      let stateDiff = null;
      if (sourceVersion.ydocState && targetVersion.ydocState) {
        try {
          const sourceDoc = new Y.Doc();
          const targetDoc = new Y.Doc();
          
          // Apply states to documents
          Y.applyUpdate(sourceDoc, Buffer.from(sourceVersion.ydocState, 'base64'));
          Y.applyUpdate(targetDoc, Buffer.from(targetVersion.ydocState, 'base64'));
          
          // Get text content for comparison
          const sourceText = sourceDoc.getText('content').toString();
          const targetText = targetDoc.getText('content').toString();
          
          stateDiff = {
            source: sourceText,
            target: targetText,
            hasConflicts: sourceText !== targetText
          };
        } catch (error) {
          console.error("Error comparing Yjs states:", error);
        }
      }

      res.json({
        sourceBranch: branch,
        sourceVersion: sourceVersion,
        targetVersion: targetVersion,
        diff: {
          contentChanged: sourceVersion.content !== targetVersion.content,
          wordCountDiff: (sourceVersion.wordCount || 0) - (targetVersion.wordCount || 0),
          stateDiff,
        }
      });
    } catch (error) {
      console.error("Error comparing branches:", error);
      res.status(500).json({ message: "Failed to compare branches" });
    }
  });

  // ==================== MERGE OPERATIONS ENDPOINTS ====================

  // POST /api/branches/:branchId/merge - Initiate merge from source to target branch
  app.post('/api/branches/:branchId/merge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sourceBranch = await storage.getBranch(req.params.branchId);
      
      if (!sourceBranch) {
        return res.status(404).json({ message: "Source branch not found" });
      }

      const document = await storage.getDocument(sourceBranch.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can merge
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const mergeSchema = z.object({
        targetBranchId: z.string(),
      });

      const { targetBranchId } = mergeSchema.parse(req.body);
      
      const targetBranch = await storage.getBranch(targetBranchId);
      if (!targetBranch || targetBranch.documentId !== sourceBranch.documentId) {
        return res.status(404).json({ message: "Target branch not found" });
      }

      // Find common ancestor
      const commonAncestor = await storage.findCommonAncestor(req.params.branchId, targetBranchId);
      
      // Get head versions
      const sourceHead = await storage.getBranchHead(req.params.branchId);
      const targetHead = await storage.getBranchHead(targetBranchId);

      if (!sourceHead || !targetHead) {
        return res.status(400).json({ message: "Cannot merge: branches have no versions" });
      }

      // Create merge event
      const mergeEvent = await storage.createMergeEvent(req.params.branchId, targetBranchId, userId);

      // Detect conflicts
      let hasConflicts = false;
      let conflictData = null;

      if (sourceHead.ydocState && targetHead.ydocState && commonAncestor?.ydocState) {
        try {
          const sourceDoc = new Y.Doc();
          const targetDoc = new Y.Doc();
          const ancestorDoc = new Y.Doc();
          
          Y.applyUpdate(sourceDoc, Buffer.from(sourceHead.ydocState, 'base64'));
          Y.applyUpdate(targetDoc, Buffer.from(targetHead.ydocState, 'base64'));
          Y.applyUpdate(ancestorDoc, Buffer.from(commonAncestor.ydocState, 'base64'));
          
          const sourceText = sourceDoc.getText('content').toString();
          const targetText = targetDoc.getText('content').toString();
          const ancestorText = ancestorDoc.getText('content').toString();
          
          // Simple conflict detection: both changed from ancestor
          if (sourceText !== ancestorText && targetText !== ancestorText) {
            hasConflicts = true;
            conflictData = {
              source: sourceText,
              target: targetText,
              ancestor: ancestorText,
              conflictMarkers: [
                {
                  type: 'content_conflict',
                  sourceContent: sourceText,
                  targetContent: targetText,
                  ancestorContent: ancestorText,
                }
              ]
            };
          }
        } catch (error) {
          console.error("Error detecting conflicts:", error);
        }
      } else {
        // Fallback to simple content comparison
        if (sourceHead.content !== targetHead.content) {
          hasConflicts = true;
          conflictData = {
            source: sourceHead.content,
            target: targetHead.content,
            ancestor: commonAncestor?.content || '',
            conflictMarkers: [
              {
                type: 'content_conflict',
                sourceContent: sourceHead.content,
                targetContent: targetHead.content,
              }
            ]
          };
        }
      }

      // Update merge event with conflict status
      const status = hasConflicts ? 'conflicted' : 'completed';
      await storage.updateMergeEvent(mergeEvent.id, status, conflictData);

      // If no conflicts, automatically merge
      if (!hasConflicts) {
        // Create new version in target branch with merged content
        const mergedVersion = await storage.createBranchVersion(
          targetBranchId,
          sourceHead.content,
          sourceHead.ydocState,
          userId,
          sourceHead.wordCount || undefined
        );

        await storage.updateMergeEvent(mergeEvent.id, 'completed', {
          mergedVersionId: mergedVersion.id,
          ...conflictData
        });
      }

      res.status(201).json({
        mergeEvent,
        hasConflicts,
        conflictData,
        sourceBranch,
        targetBranch,
        commonAncestor: commonAncestor ? {
          id: commonAncestor.id,
          createdAt: commonAncestor.createdAt,
        } : null,
      });
    } catch (error) {
      console.error("Error initiating merge:", error);
      res.status(500).json({ message: "Failed to initiate merge" });
    }
  });

  // GET /api/merge-events/:mergeEventId - Get merge status and conflicts
  app.get('/api/merge-events/:mergeEventId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mergeEvents = await storage.getMergeEvents(''); // We need to fetch all and filter
      const mergeEvent = mergeEvents.find(e => e.id === req.params.mergeEventId);
      
      if (!mergeEvent) {
        return res.status(404).json({ message: "Merge event not found" });
      }

      // Get document and check permissions
      const document = await storage.getDocument(mergeEvent.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(mergeEvent);
    } catch (error) {
      console.error("Error fetching merge event:", error);
      res.status(500).json({ message: "Failed to fetch merge event" });
    }
  });

  // PATCH /api/merge-events/:mergeEventId/resolve - Resolve merge conflicts
  app.patch('/api/merge-events/:mergeEventId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mergeEvents = await storage.getMergeEvents(''); // We need to fetch all and filter
      const mergeEvent = mergeEvents.find(e => e.id === req.params.mergeEventId);
      
      if (!mergeEvent) {
        return res.status(404).json({ message: "Merge event not found" });
      }

      if (mergeEvent.status !== 'conflicted') {
        return res.status(400).json({ message: "Merge event has no conflicts to resolve" });
      }

      // Get document and check permissions
      const document = await storage.getDocument(mergeEvent.documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Only owner and editor can resolve conflicts
      if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const resolveSchema = z.object({
        resolvedContent: z.string(),
        resolvedYdocState: z.string().nullable().optional(),
        wordCount: z.number().optional(),
      });

      const validatedData = resolveSchema.parse(req.body);
      
      // Create merged version in target branch
      const mergedVersion = await storage.createBranchVersion(
        mergeEvent.targetBranchId,
        validatedData.resolvedContent,
        validatedData.resolvedYdocState || null,
        userId,
        validatedData.wordCount
      );

      // Update merge event as completed
      await storage.updateMergeEvent(req.params.mergeEventId, 'completed', {
        ...(mergeEvent.metadata as any),
        mergedVersionId: mergedVersion.id,
        resolvedBy: userId,
        resolvedAt: new Date(),
      });

      res.json({
        success: true,
        mergedVersion,
        message: "Merge conflicts resolved successfully"
      });
    } catch (error) {
      console.error("Error resolving merge conflicts:", error);
      res.status(500).json({ message: "Failed to resolve merge conflicts" });
    }
  });

  // GET /api/documents/:id/merge-history - Get document merge history
  app.get('/api/documents/:id/merge-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      // Reader role has no access to version control features
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Access denied" });
      }

      const mergeEvents = await storage.getMergeEvents(req.params.id);
      
      // Enrich merge events with branch information
      const enrichedEvents = await Promise.all(
        mergeEvents.map(async (event) => {
          const sourceBranch = await storage.getBranch(event.sourceBranchId);
          const targetBranch = await storage.getBranch(event.targetBranchId);
          return {
            ...event,
            sourceBranch: sourceBranch ? { id: sourceBranch.id, name: sourceBranch.name } : null,
            targetBranch: targetBranch ? { id: targetBranch.id, name: targetBranch.name } : null,
          };
        })
      );

      res.json(enrichedEvents);
    } catch (error) {
      console.error("Error fetching merge history:", error);
      res.status(500).json({ message: "Failed to fetch merge history" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { intent, persona, project_id, context_refs, params, userPrompt } = req.body;

      // Get user info to check subscription plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check usage limits
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const usage = await storage.getUserAiUsage(userId, startOfMonth);
      const { AI_LIMITS } = await import('./openai');
      const userPlan = (user.subscriptionPlan || 'free') as keyof typeof AI_LIMITS;
      const limit = AI_LIMITS[userPlan]?.monthly_generations || AI_LIMITS.free.monthly_generations;
      
      // Enforce limit (unless unlimited)
      if (limit !== -1 && usage.count >= limit) {
        return res.status(429).json({ 
          message: "AI usage limit reached for this month",
          used: usage.count,
          limit: limit
        });
      }

      // Validate project access and fetch project context
      let projectContext;
      if (project_id) {
        const project = await storage.getProject(project_id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        const hasAccess = project.ownerId === userId || 
          project.collaborators.some(c => c.userId === userId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Fetch project context (characters, worldbuilding, timeline)
        projectContext = await fetchProjectContext(project_id, storage);
      }

      const aiRequest: AiRequest = {
        intent,
        persona,
        project_id,
        context_refs,
        project_context: projectContext,
        params
      };

      const result = await generateContent(aiRequest, userPrompt);

      // Save generation to database
      await storage.saveAiGeneration({
        projectId: project_id,
        userId,
        persona,
        prompt: userPrompt,
        response: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        metadata: result.metadata
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // GET /api/ai/usage - Get user's current AI usage and limits
  app.get('/api/ai/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const usage = await storage.getUserAiUsage(userId, startOfMonth);
      const { AI_LIMITS } = await import('./openai');
      const userPlan = (user.subscriptionPlan || 'free') as keyof typeof AI_LIMITS;
      const limit = AI_LIMITS[userPlan]?.monthly_generations || AI_LIMITS.free.monthly_generations;
      
      // Calculate reset date (first day of next month)
      const resetDate = new Date(startOfMonth);
      resetDate.setMonth(resetDate.getMonth() + 1);
      
      res.json({
        used: usage.count,
        limit: limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - usage.count),
        tokens_used: usage.totalTokens,
        resetDate: resetDate.toISOString(),
        plan: userPlan
      });
    } catch (error) {
      console.error("Error fetching AI usage:", error);
      res.status(500).json({ message: "Failed to fetch AI usage" });
    }
  });

  // Specialized AI endpoint helpers
  app.post('/api/ai/muse', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, sceneData } = req.body;
      
      // Fetch project context
      const projectContext = projectId ? await fetchProjectContext(projectId, storage) : undefined;
      
      // Pass project context to the prompt builder
      const userPrompt = buildMusePrompt({
        ...sceneData,
        projectContext
      });
      
      const aiRequest: AiRequest = {
        intent: "draft_scene",
        persona: "muse",
        project_id: projectId,
        project_context: projectContext,
        params: {
          max_tokens: 800
        }
      };

      const result = await generateContent(aiRequest, userPrompt);
      res.json(result);
    } catch (error) {
      console.error("Error with Muse generation:", error);
      res.status(500).json({ message: "Failed to generate scene" });
    }
  });

  app.post('/api/ai/editor', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, editData } = req.body;
      
      // Fetch project context
      const projectContext = projectId ? await fetchProjectContext(projectId, storage) : undefined;
      
      // Pass project context to the prompt builder
      const userPrompt = buildEditorPrompt({
        ...editData,
        projectContext
      });
      
      const aiRequest: AiRequest = {
        intent: "edit_paragraph",
        persona: "editor",
        project_id: projectId,
        project_context: projectContext,
        params: {
          max_tokens: 400
        }
      };

      const result = await generateContent(aiRequest, userPrompt);
      res.json(result);
    } catch (error) {
      console.error("Error with Editor generation:", error);
      res.status(500).json({ message: "Failed to edit content" });
    }
  });

  app.post('/api/ai/coach', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, outlineData } = req.body;
      
      // Fetch project context
      const projectContext = projectId ? await fetchProjectContext(projectId, storage) : undefined;
      
      // Pass project context to the prompt builder
      const userPrompt = buildCoachPrompt({
        ...outlineData,
        projectContext
      });
      
      const aiRequest: AiRequest = {
        intent: "generate_outline",
        persona: "coach",
        project_id: projectId,
        project_context: projectContext,
        params: {
          max_tokens: 600
        }
      };

      const result = await generateContent(aiRequest, userPrompt);
      res.json(result);
    } catch (error) {
      console.error("Error with Coach generation:", error);
      res.status(500).json({ message: "Failed to generate outline" });
    }
  });

  // Advanced Analysis Routes
  app.post('/api/projects/:id/analysis/style', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      
      // Check project access and premium status
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check premium subscription
      const user = await storage.getUser(userId);
      console.log('User subscription check:', { userId, subscriptionPlan: user?.subscriptionPlan, subscriptionStatus: user?.subscriptionStatus });
      if (!user?.subscriptionPlan || !['professional', 'enterprise'].includes(user.subscriptionPlan)) {
        return res.status(403).json({ 
          message: "This feature requires a Professional or Enterprise subscription",
          requiresUpgrade: true
        });
      }

      // Check if we have cached results (within 24 hours)
      const cacheKey = `style_analysis_${projectId}`;
      const cached = await storage.getAnalysisCache(cacheKey);
      if (cached && cached.timestamp && new Date(cached.timestamp).getTime() > Date.now() - 86400000) {
        return res.json(cached.data);
      }

      // Get project documents
      const documents = await storage.getProjectDocuments(projectId);
      if (!documents || documents.length === 0) {
        return res.status(400).json({ message: "No documents found for analysis" });
      }

      // Perform style analysis
      const analysisRequest: StyleAnalysisRequest = {
        documents: documents.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content || ''
        })),
        projectContext: project.genre || undefined
      };
      
      console.log('Analysis request documents count:', analysisRequest.documents.length);
      console.log('First document sample:', analysisRequest.documents[0]?.content?.substring(0, 100));

      const result = await analyzeWritingStyle(analysisRequest);
      console.log('Analysis result data keys:', Object.keys(result.data || {}));
      console.log('Analysis result recommendations count:', result.recommendations?.length || 0);

      // Cache the results
      await storage.saveAnalysisCache(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error("Error in style analysis:", error);
      res.status(500).json({ message: "Failed to analyze writing style" });
    }
  });

  app.post('/api/projects/:id/analysis/plot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      
      // Check project access and premium status
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check premium subscription
      const user = await storage.getUser(userId);
      console.log('User subscription check:', { userId, subscriptionPlan: user?.subscriptionPlan, subscriptionStatus: user?.subscriptionStatus });
      if (!user?.subscriptionPlan || !['professional', 'enterprise'].includes(user.subscriptionPlan)) {
        return res.status(403).json({ 
          message: "This feature requires a Professional or Enterprise subscription",
          requiresUpgrade: true
        });
      }

      // Check cache
      const cacheKey = `plot_analysis_${projectId}`;
      const cached = await storage.getAnalysisCache(cacheKey);
      if (cached && cached.timestamp && new Date(cached.timestamp).getTime() > Date.now() - 86400000) {
        return res.json(cached.data);
      }

      // Get project data
      const documents = await storage.getProjectDocuments(projectId);
      const timeline = await storage.getProjectTimeline(projectId);
      const characters = await storage.getProjectCharacters(projectId);

      if (!documents || documents.length === 0) {
        return res.status(400).json({ message: "No documents found for analysis" });
      }

      // Perform plot consistency analysis
      const analysisRequest: PlotConsistencyRequest = {
        documents: documents.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content || '',
          orderIndex: d.orderIndex || 0
        })),
        timeline: timeline.map(t => ({
          title: t.title,
          date: t.date || '',
          description: t.description || ''
        })),
        characters: characters.map(c => ({
          name: c.name,
          description: c.description || ''
        }))
      };

      const result = await analyzePlotConsistency(analysisRequest);

      // Cache results
      await storage.saveAnalysisCache(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error("Error in plot consistency analysis:", error);
      res.status(500).json({ message: "Failed to analyze plot consistency" });
    }
  });

  app.post('/api/projects/:id/analysis/character/:characterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      const characterId = req.params.characterId;
      
      // Check project access and premium status
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check premium subscription
      const user = await storage.getUser(userId);
      console.log('User subscription check:', { userId, subscriptionPlan: user?.subscriptionPlan, subscriptionStatus: user?.subscriptionStatus });
      if (!user?.subscriptionPlan || !['professional', 'enterprise'].includes(user.subscriptionPlan)) {
        return res.status(403).json({ 
          message: "This feature requires a Professional or Enterprise subscription",
          requiresUpgrade: true
        });
      }

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character || character.projectId !== projectId) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check cache
      const cacheKey = `character_analysis_${characterId}`;
      const cached = await storage.getAnalysisCache(cacheKey);
      if (cached && cached.timestamp && new Date(cached.timestamp).getTime() > Date.now() - 86400000) {
        return res.json(cached.data);
      }

      // Get project documents
      const documents = await storage.getProjectDocuments(projectId);

      if (!documents || documents.length === 0) {
        return res.status(400).json({ message: "No documents found for analysis" });
      }

      // Perform character development analysis
      const analysisRequest: CharacterDevelopmentRequest = {
        character: {
          name: character.name,
          description: character.description || '',
          background: character.background || undefined
        },
        documents: documents.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content || '',
          orderIndex: d.orderIndex || 0
        }))
      };

      const result = await analyzeCharacterDevelopment(analysisRequest);

      // Cache results
      await storage.saveAnalysisCache(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error("Error in character development analysis:", error);
      res.status(500).json({ message: "Failed to analyze character development" });
    }
  });

  app.post('/api/projects/:id/analysis/narrative', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      
      // Check project access and premium status
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check premium subscription
      const user = await storage.getUser(userId);
      console.log('User subscription check:', { userId, subscriptionPlan: user?.subscriptionPlan, subscriptionStatus: user?.subscriptionStatus });
      if (!user?.subscriptionPlan || !['professional', 'enterprise'].includes(user.subscriptionPlan)) {
        return res.status(403).json({ 
          message: "This feature requires a Professional or Enterprise subscription",
          requiresUpgrade: true
        });
      }

      // Check cache
      const cacheKey = `narrative_analysis_${projectId}`;
      const cached = await storage.getAnalysisCache(cacheKey);
      if (cached && cached.timestamp && new Date(cached.timestamp).getTime() > Date.now() - 86400000) {
        return res.json(cached.data);
      }

      // Get project documents
      const documents = await storage.getProjectDocuments(projectId);

      if (!documents || documents.length === 0) {
        return res.status(400).json({ message: "No documents found for analysis" });
      }

      // Perform narrative flow analysis
      const analysisRequest: NarrativeFlowRequest = {
        documents: documents.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content || '',
          orderIndex: d.orderIndex || 0
        })),
        genre: project.genre || undefined,
        targetPacing: req.body.targetPacing || 'moderate'
      };

      const result = await analyzeNarrativeFlow(analysisRequest);

      // Cache results
      await storage.saveAnalysisCache(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error("Error in narrative flow analysis:", error);
      res.status(500).json({ message: "Failed to analyze narrative flow" });
    }
  });

  // Get cached analysis results
  app.get('/api/projects/:id/analysis/cache/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      const analysisType = req.params.type;
      
      // Validate analysis type
      const validTypes = ['style', 'plot', 'narrative'];
      if (!validTypes.includes(analysisType)) {
        return res.status(400).json({ message: "Invalid analysis type" });
      }

      // Check project access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get cached analysis
      const cacheKey = `${analysisType}_analysis_${projectId}`;
      const cached = await storage.getAnalysisCache(cacheKey);

      if (!cached) {
        return res.status(404).json({ message: "No cached analysis found" });
      }

      res.json(cached);
    } catch (error) {
      console.error("Error fetching cached analysis:", error);
      res.status(500).json({ message: "Failed to fetch cached analysis" });
    }
  });

  // Collaboration routes
  app.post('/api/projects/:projectId/collaborators', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Only project owners can add collaborators" });
      }

      const validatedData = insertProjectCollaboratorSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      
      const collaborator = await storage.addProjectCollaborator(validatedData);
      res.json(collaborator);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });

  app.delete('/api/projects/:projectId/collaborators/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project || project.ownerId !== currentUserId) {
        return res.status(403).json({ message: "Only project owners can remove collaborators" });
      }

      await storage.removeProjectCollaborator(req.params.projectId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  // Export route with multiple format support
  app.get('/api/projects/:projectId/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format || 'json'; // Default to JSON
      const project = await storage.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check project access - user must own or be collaborator
      const hasProjectAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasProjectAccess) {
        return res.status(403).json({ message: "Access denied - not authorized for this project" });
      }

      // Check premium format access for subscription plans
      const premiumFormats = ['pdf', 'epub', 'docx'];
      if (premiumFormats.includes(format.toLowerCase())) {
        const user = await storage.getUser(userId);
        const userPlan = user?.subscriptionPlan || 'starter';
        const hasAccessToPremium = ['professional', 'enterprise', 'pro'].includes(userPlan);
        
        if (!hasAccessToPremium) {
          return res.status(403).json({ 
            message: "Premium feature", 
            description: `${format.toUpperCase()} export is available for Professional plan subscribers. Upgrade to access advanced export formats.`,
            upgradeRequired: true 
          });
        }
      }

      // Prepare export data
      const exportData = {
        project: {
          title: project.title,
          description: project.description,
          genre: project.genre,
          targetWordCount: project.targetWordCount,
          currentWordCount: project.currentWordCount,
        },
        characters: project.characters,
        worldbuilding: project.worldbuildingEntries,
        timeline: project.timelineEvents,
        documents: project.documents,
        exportedAt: new Date().toISOString(),
      };

      const filename = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      switch (format.toLowerCase()) {
        case 'pdf':
          // PDF format - requires Professional plan or above
          const { ExportGenerator } = await import('./export-utils');
          const pdfBuffer = await ExportGenerator.generatePDF(exportData);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}_export.pdf"`);
          res.send(pdfBuffer);
          break;

        case 'epub':
          // ePub format - requires Professional plan or above
          const { ExportGenerator: EpubGenerator } = await import('./export-utils');
          const epubBuffer = await EpubGenerator.generateEPub(exportData);
          res.setHeader('Content-Type', 'application/epub+zip');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}_export.epub"`);
          res.send(epubBuffer);
          break;

        case 'docx':
          // DOCX format - requires Professional plan or above
          const { ExportGenerator: DocxGenerator } = await import('./export-utils');
          const docxBuffer = await DocxGenerator.generateDOCX(exportData);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}_export.docx"`);
          res.send(docxBuffer);
          break;

        case 'html':
          // HTML format
          const { ExportGenerator: HtmlGenerator } = await import('./export-utils');
          const htmlContent = await HtmlGenerator.generateHTML(exportData);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}_export.html"`);
          res.send(htmlContent);
          break;

        case 'json':
        default:
          // JSON format (default)
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}_export.json"`);
          res.json(exportData);
          break;
      }
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // Collaboration REST endpoints
  
  // Get initial Yjs document collaboration state
  app.get('/api/documents/:id/collaboration-state', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const state = await storage.getCollaborationState(req.params.id);
      res.json({ 
        state: state?.ydocState || null,
        documentId: req.params.id,
        projectId: document.projectId 
      });
    } catch (error) {
      console.error("Error fetching collaboration state:", error);
      res.status(500).json({ message: "Failed to fetch collaboration state" });
    }
  });

  // Get document comments
  app.get('/api/documents/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const comments = await storage.getDocumentComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create new comment
  app.post('/api/documents/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, range } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
      
      if (!userRole || userRole === 'reader') {
        return res.status(403).json({ message: "Insufficient permissions to add comments" });
      }

      const comment = await storage.createComment(req.params.id, userId, content, range);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Update comment
  app.put('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, resolved } = req.body;
      
      // Get comment to check permissions
      const comments = await db.select().from(documentComments).where(eq(documentComments.id, req.params.id));
      const comment = comments[0];
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns the comment or has edit permissions
      if (comment.authorId !== userId) {
        const document = await storage.getDocument(comment.documentId);
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        const project = await storage.getProject(document.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
        if (!userRole || userRole === 'reader') {
          return res.status(403).json({ message: "Insufficient permissions to update comment" });
        }
      }

      const updated = await storage.updateComment(req.params.id, { content, resolved });
      res.json(updated);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // Delete comment
  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get comment to check permissions
      const comments = await db.select().from(documentComments).where(eq(documentComments.id, req.params.id));
      const comment = comments[0];
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns the comment or has owner/editor permissions
      if (comment.authorId !== userId) {
        const document = await storage.getDocument(comment.documentId);
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        const project = await storage.getProject(document.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const userRole = project.ownerId === userId ? 'owner' : await storage.getUserRole(document.projectId, userId);
        if (!userRole || (userRole !== 'owner' && userRole !== 'editor')) {
          return res.status(403).json({ message: "Insufficient permissions to delete comment" });
        }
      }

      await storage.deleteComment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Get online users in project
  app.get('/api/projects/:id/presence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const presence = await storage.getProjectPresence(req.params.id);
      res.json(presence);
    } catch (error) {
      console.error("Error fetching presence:", error);
      res.status(500).json({ message: "Failed to fetch presence" });
    }
  });

  // Stripe subscription routes
  app.get('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    const user = req.user;

    if (user.stripeSubscriptionId) {
      const stripeClient = getStripeClient();
      const subscription = await stripeClient.subscriptions.retrieve(user.stripeSubscriptionId);

      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice && typeof subscription.latest_invoice === 'object' && 'payment_intent' in subscription.latest_invoice && subscription.latest_invoice.payment_intent && typeof subscription.latest_invoice.payment_intent === 'object' && 'client_secret' in subscription.latest_invoice.payment_intent ? subscription.latest_invoice.payment_intent.client_secret : undefined,
      });

      return;
    }
    
    if (!user.email) {
      throw new Error('No user email on file');
    }

    try {
      const stripeClient = getStripeClient();
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      await storage.updateUserStripeInfo(user.claims.sub, customer.id, '');

      const subscription = await stripeClient.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.claims.sub, customer.id, subscription.id);
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice && typeof subscription.latest_invoice === 'object' && 'payment_intent' in subscription.latest_invoice && subscription.latest_invoice.payment_intent && typeof subscription.latest_invoice.payment_intent === 'object' && 'client_secret' in subscription.latest_invoice.payment_intent ? subscription.latest_invoice.payment_intent.client_secret : undefined,
      });
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
