import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  generateContent, 
  buildMusePrompt, 
  buildEditorPrompt, 
  buildCoachPrompt,
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
} from "@shared/schema";

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
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData, userId);
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

      const validatedData = insertWorldbuildingEntrySchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      
      const entry = await storage.createWorldbuildingEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating worldbuilding entry:", error);
      res.status(500).json({ message: "Failed to create worldbuilding entry" });
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
      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { intent, persona, project_id, context_refs, params, userPrompt } = req.body;

      // Validate project access
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
      }

      const aiRequest: AiRequest = {
        intent,
        persona,
        project_id,
        context_refs,
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

  // Specialized AI endpoint helpers
  app.post('/api/ai/muse', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, sceneData } = req.body;
      const userPrompt = buildMusePrompt(sceneData);
      
      const aiRequest: AiRequest = {
        intent: "draft_scene",
        persona: "muse",
        project_id: projectId,
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
      const userPrompt = buildEditorPrompt(editData);
      
      const aiRequest: AiRequest = {
        intent: "edit_paragraph",
        persona: "editor",
        project_id: projectId,
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
      const userPrompt = buildCoachPrompt(outlineData);
      
      const aiRequest: AiRequest = {
        intent: "generate_outline",
        persona: "coach",
        project_id: projectId,
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
      const premiumFormats = ['pdf', 'epub'];
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
