import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { documentComments, activities as activitiesTable, users } from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";
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
import { kdpService } from "./kdp-integration";
import { stripeMarketplace } from "./stripe-marketplace";
import { subscriptionService } from "./subscription-service";
import { checkUsageLimit, requireFeature, checkExportFormat } from "./subscription-middleware";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
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
  insertEmailSchema,
  insertSmsSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as Y from 'yjs';
import { CollaborationService } from "./collaboration";
import { notifyProjectCollaborators } from "./notifications";
import { logActivity, getUserDisplayName } from "./activities";
import { 
  sendEmail, 
  sendBatchEmails, 
  scheduleEmail, 
  getEmailStatus, 
  listUserEmails 
} from "./brevoService";
import { processScheduledEmails } from "./emailScheduler";
import {
  sendSms,
  sendBatchSms,
  listUserSms,
  getSmsById,
} from "./brevoSmsService";
import realtimeRouter from './realtime-api';

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

  // Register real-time API routes
  app.use(realtimeRouter);

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

  // Onboarding routes
  app.get('/api/user/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserOnboarding(userId);
      res.json(progress || {
        welcomeShown: false,
        steps: {
          createProject: false,
          useAI: false,
          addCharacter: false,
          viewAnalytics: false,
          tryExport: false,
        },
        tourCompleted: false,
      });
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.patch('/api/user/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressSchema = z.object({
        welcomeShown: z.boolean().optional(),
        steps: z.object({
          createProject: z.boolean().optional(),
          useAI: z.boolean().optional(),
          addCharacter: z.boolean().optional(),
          viewAnalytics: z.boolean().optional(),
          tryExport: z.boolean().optional(),
        }).optional(),
        tourCompleted: z.boolean().optional(),
      });
      
      const validatedData = progressSchema.parse(req.body);
      const user = await storage.updateUserOnboarding(userId, validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  // Romance-specific API endpoints
  
  // Romance series management
  app.get('/api/romance/series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const series = await storage.getUserRomanceSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching romance series:", error);
      res.status(500).json({ message: "Failed to fetch romance series" });
    }
  });

  app.post('/api/romance/series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seriesData = req.body;
      const series = await storage.createRomanceSeries(seriesData, userId);
      res.json(series);
    } catch (error) {
      console.error("Error creating romance series:", error);
      res.status(500).json({ message: "Failed to create romance series" });
    }
  });

  // Romance tropes management
  app.get('/api/romance/tropes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tropes = await storage.getUserRomanceTropes(userId);
      res.json(tropes);
    } catch (error) {
      console.error("Error fetching romance tropes:", error);
      res.status(500).json({ message: "Failed to fetch romance tropes" });
    }
  });

  app.post('/api/romance/tropes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tropeData = req.body;
      const trope = await storage.createRomanceTrope(tropeData, userId);
      res.json(trope);
    } catch (error) {
      console.error("Error creating romance trope:", error);
      res.status(500).json({ message: "Failed to create romance trope" });
    }
  });

  // Romance analytics
  app.get('/api/romance/analytics/:projectId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.params.projectId;
      const analytics = await AnalyticsService.getRomanceAnalytics(projectId, userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching romance analytics:", error);
      res.status(500).json({ message: "Failed to fetch romance analytics" });
    }
  });

  // Romance market trends
  app.get('/api/romance/market-trends', isAuthenticated, async (req: any, res) => {
    try {
      const timeframe = req.query.timeframe || 'quarter';
      const region = req.query.region || 'global';
      const trends = await storage.getRomanceMarketTrends(timeframe, region);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching market trends:", error);
      res.status(500).json({ message: "Failed to fetch market trends" });
    }
  });

  // Romance client portfolio
  app.get('/api/romance/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getRomanceClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching romance clients:", error);
      res.status(500).json({ message: "Failed to fetch romance clients" });
    }
  });

  app.post('/api/romance/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = req.body;
      const client = await storage.createRomanceClient(clientData, userId);
      res.json(client);
    } catch (error) {
      console.error("Error creating romance client:", error);
      res.status(500).json({ message: "Failed to create romance client" });
    }
  });

  // Romance publishing pipeline
  app.post('/api/romance/covers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const coverData = req.body;
      const cover = await storage.createRomanceCover(coverData, userId);
      res.json(cover);
    } catch (error) {
      console.error("Error creating romance cover:", error);
      res.status(500).json({ message: "Failed to create romance cover" });
    }
  });

  app.post('/api/romance/blurbs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const blurbData = req.body;
      const blurb = await storage.createRomanceBlurb(blurbData, userId);
      res.json(blurb);
    } catch (error) {
      console.error("Error creating romance blurb:", error);
      res.status(500).json({ message: "Failed to create romance blurb" });
    }
  });

  // Romance revenue tracking (enhanced)
  
  // Get revenue overview with analytics
  app.get('/api/romance/revenue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeframe = req.query.timeframe || 'month';
      const revenue = await storage.getRomanceRevenue(userId, timeframe as string);
      res.json(revenue);
    } catch (error) {
      console.error("Error fetching romance revenue:", error);
      res.status(500).json({ message: "Failed to fetch romance revenue" });
    }
  });

  // Create revenue entry
  app.post('/api/romance/revenue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const revenueData = req.body;
      const revenue = await storage.createRevenueEntry(revenueData, userId);
      res.json(revenue);
    } catch (error) {
      console.error("Error creating revenue entry:", error);
      res.status(500).json({ message: "Failed to create revenue entry" });
    }
  });

  // Get detailed revenue analytics
  app.get('/api/revenue/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe = 'month', groupBy = 'source' } = req.query;
      
      const revenueData = await storage.getRomanceRevenue(userId, timeframe as string);
      
      // Calculate analytics
      const analytics = {
        summary: {
          totalRevenue: revenueData.totalRevenue,
          bookSales: revenueData.bookSales,
          royalties: revenueData.royalties,
          subscriptions: revenueData.subscriptions,
          averageTransaction: revenueData.entries.length > 0 
            ? revenueData.totalRevenue / revenueData.entries.length 
            : 0,
          transactionCount: revenueData.entries.length,
        },
        bySource: {} as Record<string, { total: number; count: number; average: number }>,
        byProject: revenueData.projectRevenue,
        timeline: [] as any[],
        growth: {
          percentChange: 0,
          trend: 'stable' as 'up' | 'down' | 'stable',
        },
      };

      // Group by source
      revenueData.entries.forEach((entry: any) => {
        const source = entry.source || 'unknown';
        if (!analytics.bySource[source]) {
          analytics.bySource[source] = { total: 0, count: 0, average: 0 };
        }
        analytics.bySource[source].total += entry.amount || 0;
        analytics.bySource[source].count += 1;
      });

      // Calculate averages
      Object.keys(analytics.bySource).forEach(source => {
        const data = analytics.bySource[source];
        data.average = data.count > 0 ? data.total / data.count : 0;
      });

      // Build timeline
      const entriesByDate = revenueData.entries.reduce((acc: any, entry: any) => {
        const date = new Date(entry.transactionDate).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += entry.amount || 0;
        acc[date].count += 1;
        return acc;
      }, {});
      
      analytics.timeline = Object.values(entriesByDate).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Get revenue by project
  app.get('/api/revenue/by-project/:projectId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      const { timeframe = 'month' } = req.query;
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const revenueData = await storage.getRomanceRevenue(userId, timeframe as string);
      const projectEntries = revenueData.entries.filter((e: any) => e.projectId === projectId);
      const totalRevenue = projectEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      res.json({
        projectId,
        totalRevenue,
        entries: projectEntries,
        timeframe,
      });
    } catch (error) {
      console.error("Error fetching project revenue:", error);
      res.status(500).json({ message: "Failed to fetch project revenue" });
    }
  });

  // Export revenue data
  app.get('/api/revenue/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe = 'year', format = 'json' } = req.query;
      
      const revenueData = await storage.getRomanceRevenue(userId, timeframe as string);
      
      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Date', 'Source', 'Amount', 'Currency', 'Description'];
        const rows = revenueData.entries.map((entry: any) => [
          new Date(entry.transactionDate).toISOString(),
          entry.source,
          (entry.amount / 100).toFixed(2),
          entry.currency || 'USD',
          entry.description || '',
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=revenue-${timeframe}.csv`);
        res.send(csv);
      } else {
        res.json(revenueData);
      }
    } catch (error) {
      console.error("Error exporting revenue data:", error);
      res.status(500).json({ message: "Failed to export revenue data" });
    }
  });

  // Existing routes continue...
  
  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow images and PDFs for covers and manuscripts
      if (file.mimetype.match(/^(image|application\/pdf)/)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  });

  // KDP Integration routes
  app.get('/api/kdp/credentials/validate', isAuthenticated, async (req: any, res) => {
    try {
      const isValid = await kdpService.validateCredentials();
      res.json({ valid: isValid });
    } catch (error) {
      console.error('Error validating KDP credentials:', error);
      res.status(500).json({ message: 'Failed to validate KDP credentials' });
    }
  });

  app.post('/api/kdp/books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { metadata, projectId } = req.body;

      // Validate metadata
      const validation = await kdpService.validateMetadata(metadata);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }

      // Create book on KDP
      const result = await kdpService.createBook(metadata);
      if (!result.success) {
        return res.status(400).json({ errors: result.errors });
      }

      // Store metadata in our database
      const kdpMetadata = await storage.createKDPMetadata({
        projectId,
        kdpBookId: result.bookId!,
        status: 'draft',
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.json({ bookId: result.bookId, metadata: kdpMetadata });
    } catch (error) {
      console.error('Error creating KDP book:', error);
      res.status(500).json({ message: 'Failed to create KDP book' });
    }
  });

  app.post('/api/kdp/books/:bookId/cover', isAuthenticated, upload.single('cover'), async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const { format } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Cover file is required' });
      }

      const result = await kdpService.uploadCover(bookId, req.file.path, format);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (!result.success) {
        return res.status(400).json({ errors: result.errors });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error uploading cover:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Failed to upload cover' });
    }
  });

  app.post('/api/kdp/books/:bookId/manuscript', isAuthenticated, upload.single('manuscript'), async (req: any, res) => {
    try {
      const { bookId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Manuscript file is required' });
      }

      const result = await kdpService.uploadManuscript(bookId, req.file.path);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (!result.success) {
        return res.status(400).json({ errors: result.errors });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error uploading manuscript:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Failed to upload manuscript' });
    }
  });

  app.put('/api/kdp/books/:bookId/pricing', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const { pricing } = req.body;

      const result = await kdpService.setPricing(bookId, pricing);
      
      if (!result.success) {
        return res.status(400).json({ errors: result.errors });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error setting pricing:', error);
      res.status(500).json({ message: 'Failed to set pricing' });
    }
  });

  app.post('/api/kdp/books/:bookId/submit', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;

      const result = await kdpService.submitForReview(bookId);
      
      if (!result.success) {
        return res.status(400).json({ errors: result.errors });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting for review:', error);
      res.status(500).json({ message: 'Failed to submit for review' });
    }
  });

  app.get('/api/kdp/books/:bookId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;

      const status = await kdpService.getPublishingStatus(bookId);
      
      if (!status) {
        return res.status(404).json({ message: 'Book not found' });
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting book status:', error);
      res.status(500).json({ message: 'Failed to get book status' });
    }
  });

  app.get('/api/kdp/books/:bookId/sales', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const salesData = await kdpService.getSalesData(bookId, start, end);
      
      if (!salesData) {
        return res.status(404).json({ message: 'Sales data not available' });
      }

      res.json(salesData);
    } catch (error) {
      console.error('Error getting sales data:', error);
      res.status(500).json({ message: 'Failed to get sales data' });
    }
  });

  app.get('/api/kdp/cover-requirements/:format', isAuthenticated, async (req: any, res) => {
    try {
      const { format } = req.params;
      
      if (format !== 'ebook' && format !== 'paperback') {
        return res.status(400).json({ message: 'Invalid format. Must be "ebook" or "paperback"' });
      }

      const requirements = await kdpService.getCoverRequirements(format);
      res.json(requirements);
    } catch (error) {
      console.error('Error getting cover requirements:', error);
      res.status(500).json({ message: 'Failed to get cover requirements' });
    }
  });

  app.post('/api/kdp/keywords/optimize', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, subgenres, tropes } = req.body;

      const keywords = await kdpService.generateOptimizedKeywords(genre, subgenres, tropes);
      res.json({ keywords });
    } catch (error) {
      console.error('Error optimizing keywords:', error);
      res.status(500).json({ message: 'Failed to optimize keywords' });
    }
  });

  app.get('/api/kdp/projects/:projectId/metadata', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;

      // Verify project access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const metadata = await storage.getProjectKDPMetadata(projectId);
      res.json(metadata);
    } catch (error) {
      console.error('Error getting project KDP metadata:', error);
      res.status(500).json({ message: 'Failed to get KDP metadata' });
    }
  });

  // Stripe Marketplace routes
  app.post('/api/marketplace/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: 'User email is required' });
      }

      const { businessType } = req.body;
      const result = await stripeMarketplace.createConnectedAccount(user.email, businessType);
      
      // Store account ID in user record
      await storage.updateUser(userId, { stripeAccountId: result.accountId });
      
      res.json(result);
    } catch (error) {
      console.error('Error creating connected account:', error);
      res.status(500).json({ message: 'Failed to create connected account' });
    }
  });

  app.post('/api/marketplace/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productData = req.body;
      
      const product = await stripeMarketplace.createProduct({
        ...productData,
        metadata: {
          ...productData.metadata,
          authorId: userId,
        },
      });
      
      res.json(product);
    } catch (error) {
      console.error('Error creating marketplace product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.post('/api/marketplace/prices', isAuthenticated, async (req: any, res) => {
    try {
      const priceData = req.body;
      const price = await stripeMarketplace.createPrice(priceData);
      res.json(price);
    } catch (error) {
      console.error('Error creating price:', error);
      res.status(500).json({ message: 'Failed to create price' });
    }
  });

  app.post('/api/marketplace/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const {
        priceId,
        sellerId,
        sellerAccountId,
        successUrl,
        cancelUrl,
        metadata,
      } = req.body;
      
      const feeStructure = await stripeMarketplace.getMarketplaceFeeStructure();
      
      const session = await stripeMarketplace.createCheckoutSession({
        priceId,
        buyerId: userId,
        sellerId,
        sellerAccountId,
        platformFeePercent: feeStructure.platformFeePercent,
        successUrl,
        cancelUrl,
        metadata,
      });
      
      res.json(session);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  app.post('/api/marketplace/webhook', async (req: any, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;
      
      await stripeMarketplace.handleWebhook(payload, signature);
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(400).json({ message: 'Webhook error' });
    }
  });

  // Stripe subscription webhook handler
  app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      
      if (!signature || !webhookSecret) {
        return res.status(400).json({ message: 'Missing signature or webhook secret' });
      }

      // Construct Stripe event
      const stripe = getStripeClient();
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
      
      // Handle subscription webhook events
      await subscriptionService.handleWebhook(event);
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling subscription webhook:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/marketplace/analytics/:sellerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sellerId } = req.params;
      const { period } = req.query;
      
      // Check if user can access this seller's analytics
      if (userId !== sellerId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const analytics = await stripeMarketplace.getSellerAnalytics(
        sellerId,
        period as 'week' | 'month' | 'year'
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error getting seller analytics:', error);
      res.status(500).json({ message: 'Failed to get analytics' });
    }
  });

  app.post('/api/marketplace/refund', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId, amount } = req.body;
      const refund = await stripeMarketplace.createRefund(paymentIntentId, amount);
      res.json(refund);
    } catch (error) {
      console.error('Error creating refund:', error);
      res.status(500).json({ message: 'Failed to create refund' });
    }
  });

  app.get('/api/marketplace/fees/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const { amount } = req.query;
      const fees = await stripeMarketplace.calculateFees(parseInt(amount as string));
      res.json(fees);
    } catch (error) {
      console.error('Error calculating fees:', error);
      res.status(500).json({ message: 'Failed to calculate fees' });
    }
  });

  app.get('/api/marketplace/fees/structure', isAuthenticated, async (req: any, res) => {
    try {
      const feeStructure = await stripeMarketplace.getMarketplaceFeeStructure();
      res.json(feeStructure);
    } catch (error) {
      console.error('Error getting fee structure:', error);
      res.status(500).json({ message: 'Failed to get fee structure' });
    }
  });

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

  app.post('/api/projects', isAuthenticated, checkUsageLimit('projects'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { template, ...projectData } = req.body;
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData, userId);
      
      if (template && template !== 'blank') {
        await storage.applyProjectTemplate(project.id, template, userId);
      }
      
      await logActivity(storage, project.id, userId, {
        type: "project_created",
        description: `${getUserDisplayName(await storage.getUser(userId))} created the project`,
      });
      
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
      
      await logActivity(storage, updated.id, userId, {
        type: "project_updated",
        description: `${getUserDisplayName(await storage.getUser(userId))} updated project settings`,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about new character
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, character.projectId, userId, {
          type: "character_created",
          title: "New Character Added",
          message: `${displayName} added character "${character.name}"`,
          entityType: "character",
          entityId: character.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, character.projectId, userId, {
        type: "character_created",
        description: `${getUserDisplayName(user)} added a new character`,
        entityType: "character",
        entityId: character.id,
        entityName: character.name,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about character update
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, character.projectId, userId, {
          type: "character_updated",
          title: "Character Updated",
          message: `${displayName} updated character "${updated.name}"`,
          entityType: "character",
          entityId: updated.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, character.projectId, userId, {
        type: "character_updated",
        description: `${getUserDisplayName(user)} updated a character`,
        entityType: "character",
        entityId: updated.id,
        entityName: updated.name,
      });
      
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

      const characterName = character.name;
      const user = await storage.getUser(userId);
      
      await storage.deleteCharacter(req.params.id);
      
      // Notify collaborators about character deletion
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, character.projectId, userId, {
          type: "character_deleted",
          title: "Character Deleted",
          message: `${displayName} deleted character "${characterName}"`,
          entityType: "character",
          entityId: req.params.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, character.projectId, userId, {
        type: "character_deleted",
        description: `${getUserDisplayName(user)} deleted a character`,
        entityType: "character",
        entityId: req.params.id,
        entityName: characterName,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about new worldbuilding entry
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, entry.projectId, userId, {
          type: "worldbuilding_created",
          title: "New Worldbuilding Entry",
          message: `${displayName} added "${entry.title}"`,
          entityType: "worldbuilding",
          entityId: entry.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, entry.projectId, userId, {
        type: "worldbuilding_created",
        description: `${getUserDisplayName(user)} added worldbuilding entry`,
        entityType: "worldbuilding",
        entityId: entry.id,
        entityName: entry.title,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about worldbuilding update
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, entry.projectId, userId, {
          type: "worldbuilding_updated",
          title: "Worldbuilding Entry Updated",
          message: `${displayName} updated "${updated.title}"`,
          entityType: "worldbuilding",
          entityId: updated.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, entry.projectId, userId, {
        type: "worldbuilding_updated",
        description: `${getUserDisplayName(user)} updated worldbuilding entry`,
        entityType: "worldbuilding",
        entityId: updated.id,
        entityName: updated.title,
      });
      
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

      const entryTitle = entry.title;
      const user = await storage.getUser(userId);
      
      await storage.deleteWorldbuildingEntry(req.params.id);
      
      // Notify collaborators about worldbuilding deletion
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, entry.projectId, userId, {
          type: "worldbuilding_deleted",
          title: "Worldbuilding Entry Deleted",
          message: `${displayName} deleted "${entryTitle}"`,
          entityType: "worldbuilding",
          entityId: req.params.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, entry.projectId, userId, {
        type: "worldbuilding_deleted",
        description: `${getUserDisplayName(user)} deleted worldbuilding entry`,
        entityType: "worldbuilding",
        entityId: req.params.id,
        entityName: entryTitle,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about new timeline event
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, event.projectId, userId, {
          type: "timeline_created",
          title: "New Timeline Event",
          message: `${displayName} added "${event.title}"`,
          entityType: "timeline",
          entityId: event.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, event.projectId, userId, {
        type: "timeline_created",
        description: `${getUserDisplayName(user)} added a timeline event`,
        entityType: "timeline",
        entityId: event.id,
        entityName: event.title,
      });
      
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about timeline event update
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, event.projectId, userId, {
          type: "timeline_updated",
          title: "Timeline Event Updated",
          message: `${displayName} updated "${updated.title}"`,
          entityType: "timeline",
          entityId: updated.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, event.projectId, userId, {
        type: "timeline_updated",
        description: `${getUserDisplayName(user)} updated a timeline event`,
        entityType: "timeline",
        entityId: updated.id,
        entityName: updated.title,
      });
      
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

      const eventTitle = event.title;
      const user = await storage.getUser(userId);
      
      await storage.deleteTimelineEvent(req.params.id);
      
      // Notify collaborators about timeline event deletion
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, event.projectId, userId, {
          type: "timeline_deleted",
          title: "Timeline Event Deleted",
          message: `${displayName} deleted "${eventTitle}"`,
          entityType: "timeline",
          entityId: req.params.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, event.projectId, userId, {
        type: "timeline_deleted",
        description: `${getUserDisplayName(user)} deleted a timeline event`,
        entityType: "timeline",
        entityId: req.params.id,
        entityName: eventTitle,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      res.status(500).json({ message: "Failed to delete timeline event" });
    }
  });

  app.patch('/api/timeline/:id/reorder', isAuthenticated, async (req: any, res) => {
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

      const reorderSchema = z.object({
        orderIndex: z.number(),
        date: z.string().optional(),
      });
      
      const validatedData = reorderSchema.parse(req.body);
      const updated = await storage.reorderTimelineEvents(
        event.projectId,
        req.params.id,
        validatedData.orderIndex,
        validatedData.date
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Error reordering timeline event:", error);
      res.status(500).json({ message: "Failed to reorder timeline event" });
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about new document
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, document.projectId, userId, {
          type: "document_created",
          title: "New Document Created",
          message: `${displayName} created a new document "${document.title}"`,
          entityType: "document",
          entityId: document.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, document.projectId, userId, {
        type: "document_created",
        description: `${getUserDisplayName(user)} created a new document`,
        entityType: "document",
        entityId: document.id,
        entityName: document.title,
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
      
      const user = await storage.getUser(userId);
      
      // Notify collaborators about document update
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, document.projectId, userId, {
          type: "document_updated",
          title: "Document Updated",
          message: `${displayName} updated "${updated.title}"`,
          entityType: "document",
          entityId: updated.id,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, document.projectId, userId, {
        type: "document_updated",
        description: `${getUserDisplayName(user)} updated a document`,
        entityType: "document",
        entityId: updated.id,
        entityName: updated.title,
      });
      
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
  app.post('/api/ai/generate', isAuthenticated, checkUsageLimit('aiSessions'), async (req: any, res) => {
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

  // OCR Routes
  app.post('/api/ocr/extract', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageUrl, imageBase64, expertMode, extractTables, extractFormatting, language, projectId } = req.body;

      // Validate input
      if (!imageUrl && !imageBase64) {
        return res.status(400).json({ message: "Either imageUrl or imageBase64 must be provided" });
      }

      // Check user's AI usage limits
      const user = await storage.getUser(userId);
      const plan = user?.subscriptionPlan || 'free';
      const usageCount = await storage.getUserAIUsageCount(userId);
      
      const { AI_LIMITS } = await import("./openai");
      const limit = AI_LIMITS[plan as keyof typeof AI_LIMITS].monthly_generations;
      
      if (limit !== -1 && usageCount >= limit) {
        return res.status(403).json({ 
          message: `Monthly AI usage limit reached (${limit} generations). Please upgrade your plan.`,
          requiresUpgrade: true
        });
      }

      // Perform OCR
      const { performOCR } = await import("./ocr");
      const result = await performOCR({
        imageUrl,
        imageBase64,
        expertMode,
        extractTables,
        extractFormatting,
        language
      });

      // Store OCR result
      if (projectId) {
        await storage.createOCRRecord({
          userId,
          projectId,
          expertMode,
          extractedText: result.text,
          metadata: result.metadata
        });
      }

      // Increment AI usage
      await storage.incrementAIUsage(userId, projectId || null, 'ocr');

      res.json(result);
    } catch (error) {
      console.error("OCR extraction failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to extract text from image" 
      });
    }
  });

  app.post('/api/ocr/batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requests, projectId } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ message: "Requests array is required" });
      }

      if (requests.length > 10) {
        return res.status(400).json({ message: "Maximum 10 images per batch" });
      }

      // Check user's AI usage limits
      const user = await storage.getUser(userId);
      const plan = user?.subscriptionPlan || 'free';
      const usageCount = await storage.getUserAIUsageCount(userId);
      
      const { AI_LIMITS } = await import("./openai");
      const limit = AI_LIMITS[plan as keyof typeof AI_LIMITS].monthly_generations;
      
      if (limit !== -1 && usageCount + requests.length > limit) {
        return res.status(403).json({ 
          message: `Batch would exceed monthly AI usage limit (${limit} generations). Please upgrade your plan.`,
          requiresUpgrade: true
        });
      }

      // Perform batch OCR
      const { performBatchOCR } = await import("./ocr");
      const results = await performBatchOCR(requests);

      // Store successful OCR results
      if (projectId) {
        for (const result of results) {
          if (result.success) {
            await storage.createOCRRecord({
              userId,
              projectId,
              expertMode: result.metadata.expertMode,
              extractedText: result.text,
              metadata: result.metadata
            });
          }
        }
      }

      // Increment AI usage for each request
      for (let i = 0; i < requests.length; i++) {
        await storage.incrementAIUsage(userId, projectId || null, 'ocr');
      }

      res.json({ results });
    } catch (error) {
      console.error("Batch OCR failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process batch OCR" 
      });
    }
  });

  app.get('/api/ocr/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId, limit = 50 } = req.query;

      const history = await storage.getOCRHistory(userId, projectId, parseInt(limit as string));
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch OCR history:", error);
      res.status(500).json({ message: "Failed to fetch OCR history" });
    }
  });

  app.get('/api/expert-modes', isAuthenticated, async (req: any, res) => {
    try {
      const { getAllLanguagePackages } = await import("./languages");
      const packages = getAllLanguagePackages();
      
      // Return simplified package info
      const simplified = packages.map(pkg => ({
        mode: pkg.mode,
        displayName: pkg.displayName,
        description: pkg.description,
        terminology: {
          commonCount: pkg.terminology.common.length,
          advancedCount: pkg.terminology.advanced.length,
          examples: pkg.terminology.common.slice(0, 5)
        }
      }));

      res.json(simplified);
    } catch (error) {
      console.error("Failed to fetch expert modes:", error);
      res.status(500).json({ message: "Failed to fetch expert modes" });
    }
  });

  app.post('/api/expert-modes/validate', isAuthenticated, async (req: any, res) => {
    try {
      const { text, mode } = req.body;

      if (!text || !mode) {
        return res.status(400).json({ message: "Text and mode are required" });
      }

      const { validateExpertModeText } = await import("./languages");
      const validation = validateExpertModeText(text, mode);

      res.json(validation);
    } catch (error) {
      console.error("Text validation failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to validate text" 
      });
    }
  });

  app.post('/api/expert-modes/enhance', isAuthenticated, async (req: any, res) => {
    try {
      const { text, mode } = req.body;

      if (!text || !mode) {
        return res.status(400).json({ message: "Text and mode are required" });
      }

      const { enhanceForExpertMode } = await import("./languages");
      const enhanced = enhanceForExpertMode(text, mode);

      res.json({ enhanced });
    } catch (error) {
      console.error("Text enhancement failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to enhance text" 
      });
    }
  });

  // Image Upscale Routes
  app.post('/api/upscale', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageBase64, scale, width, height, quality, format, enhanceSharpness, denoise } = req.body;

      // Validate input
      if (!imageBase64) {
        return res.status(400).json({ message: "imageBase64 is required" });
      }

      // Check user's AI usage limits (upscaling counts as a generation)
      const user = await storage.getUser(userId);
      const plan = user?.subscriptionPlan || 'free';
      const usageCount = await storage.getUserAIUsageCount(userId);
      
      const { AI_LIMITS } = await import("./openai");
      const limit = AI_LIMITS[plan as keyof typeof AI_LIMITS].monthly_generations;
      
      if (limit !== -1 && usageCount >= limit) {
        return res.status(403).json({ 
          message: `Monthly usage limit reached (${limit} generations). Please upgrade your plan.`,
          requiresUpgrade: true
        });
      }

      // Perform upscaling
      const { upscaleImage } = await import("./upscale");
      const result = await upscaleImage({
        imageBase64,
        scale: scale || 2,
        width,
        height,
        quality: quality || 90,
        format: format || 'jpeg',
        enhanceSharpness: enhanceSharpness || false,
        denoise: denoise || false,
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Upscaling failed" });
      }

      // Increment usage
      await storage.incrementAIUsage(userId, null, 'upscale');

      res.json(result);
    } catch (error) {
      console.error("Image upscaling failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upscale image" 
      });
    }
  });

  app.post('/api/upscale/batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { images } = req.body;

      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: "Images array is required" });
      }

      if (images.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images per batch (serverless limit)" });
      }

      // Check user's usage limits
      const user = await storage.getUser(userId);
      const plan = user?.subscriptionPlan || 'free';
      const usageCount = await storage.getUserAIUsageCount(userId);
      
      const { AI_LIMITS } = await import("./openai");
      const limit = AI_LIMITS[plan as keyof typeof AI_LIMITS].monthly_generations;
      
      if (limit !== -1 && usageCount + images.length > limit) {
        return res.status(403).json({ 
          message: `Batch would exceed monthly usage limit (${limit} generations). Please upgrade your plan.`,
          requiresUpgrade: true
        });
      }

      // Perform batch upscaling
      const { batchUpscaleImages } = await import("./upscale");
      const results = await batchUpscaleImages(images);

      // Increment usage for each image
      for (let i = 0; i < images.length; i++) {
        await storage.incrementAIUsage(userId, null, 'upscale');
      }

      res.json({ results });
    } catch (error) {
      console.error("Batch upscaling failed:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process batch upscaling" 
      });
    }
  });

  app.get('/api/upscale/options', isAuthenticated, async (req: any, res) => {
    try {
      const { getUpscaleOptions } = await import("./upscale");
      const options = getUpscaleOptions();
      res.json(options);
    } catch (error) {
      console.error("Failed to fetch upscale options:", error);
      res.status(500).json({ message: "Failed to fetch upscale options" });
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
      
      const user = await storage.getUser(userId);
      const addedUser = await storage.getUser(req.body.userId);
      
      // Notify collaborators about new collaborator added
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, req.params.projectId, userId, {
          type: "collaborator_added",
          title: "New Collaborator Added",
          message: `${displayName} added a new collaborator`,
          actorId: userId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, req.params.projectId, userId, {
        type: "collaborator_added",
        description: `${getUserDisplayName(user)} added ${getUserDisplayName(addedUser)} as a collaborator`,
      });
      
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

      const removedUser = await storage.getUser(req.params.userId);
      
      await storage.removeProjectCollaborator(req.params.projectId, req.params.userId);
      
      const user = await storage.getUser(currentUserId);
      
      // Notify collaborators about collaborator removal
      try {
        const displayName = user?.firstName || user?.email || 'A user';
        await notifyProjectCollaborators(storage, req.params.projectId, currentUserId, {
          type: "collaborator_removed",
          title: "Collaborator Removed",
          message: `${displayName} removed a collaborator`,
          actorId: currentUserId,
        });
      } catch (error) {
        console.error("Failed to create notifications:", error);
      }
      
      await logActivity(storage, req.params.projectId, currentUserId, {
        type: "collaborator_removed",
        description: `${getUserDisplayName(user)} removed ${getUserDisplayName(removedUser)} as a collaborator`,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  // Export route with multiple format support
  app.get('/api/projects/:projectId/export', isAuthenticated, checkExportFormat, async (req: any, res) => {
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
      
      // Enrich comments with author information
      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
          return {
            ...comment,
            author: author || null
          };
        })
      );
      
      res.json(enrichedComments);
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

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteNotification(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity routes
  app.get('/api/projects/:projectId/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || 
        project.collaborators.some(c => c.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getProjectActivities(projectId, limit);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching project activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const userProjects = await storage.getUserProjects(userId);
      const projectIds = userProjects.map(p => p.id);
      
      if (projectIds.length === 0) {
        return res.json([]);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const activities = await db
        .select()
        .from(activitiesTable)
        .where(inArray(activitiesTable.projectId, projectIds))
        .orderBy(desc(activitiesTable.createdAt))
        .limit(limit);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Search route
  app.get('/api/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }

      const results = await storage.searchContent(userId, query.trim(), limit);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  // Prompt Library routes
  app.get("/api/prompts", async (req, res) => {
    try {
      const prompts = await storage.getAllPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const prompts = await storage.getPromptsByCategory(category);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts by category:", error);
      res.status(500).json({ error: "Failed to fetch prompts by category" });
    }
  });

  app.get("/api/prompts/persona/:persona", async (req, res) => {
    try {
      const { persona } = req.params;
      const prompts = await storage.getPromptsByPersona(persona);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts by persona:", error);
      res.status(500).json({ error: "Failed to fetch prompts by persona" });
    }
  });

  app.get("/api/prompts/featured", async (req, res) => {
    try {
      const prompts = await storage.getFeaturedPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching featured prompts:", error);
      res.status(500).json({ error: "Failed to fetch featured prompts" });
    }
  });

  app.get("/api/prompts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      
      const prompts = await storage.searchPrompts(query.trim());
      res.json(prompts);
    } catch (error) {
      console.error("Error searching prompts:", error);
      res.status(500).json({ error: "Failed to search prompts" });
    }
  });

  app.post("/api/prompts/:id/use", isAuthenticated, async (req: any, res) => {
    try {
      const promptId = parseInt(req.params.id);
      await storage.incrementPromptUsage(promptId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing prompt usage:", error);
      res.status(500).json({ error: "Failed to track prompt usage" });
    }
  });

  app.get("/api/user/favorite-prompts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompts = await storage.getUserFavoritePrompts(userId);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching favorite prompts:", error);
      res.status(500).json({ error: "Failed to fetch favorite prompts" });
    }
  });

  app.post("/api/user/favorite-prompts/:promptId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const promptId = parseInt(req.params.promptId);
      const favorite = await storage.addFavoritePrompt(userId, promptId);
      res.json(favorite);
    } catch (error: any) {
      console.error("Error adding favorite prompt:", error);
      if (error.code === '23505') {
        return res.status(400).json({ error: "Prompt already in favorites" });
      }
      res.status(500).json({ error: "Failed to add favorite prompt" });
    }
  });

  app.delete("/api/user/favorite-prompts/:promptId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const promptId = parseInt(req.params.promptId);
      await storage.removeFavoritePrompt(userId, promptId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite prompt:", error);
      res.status(500).json({ error: "Failed to remove favorite prompt" });
    }
  });

  // Email routes
  app.post('/api/emails/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = insertEmailSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          error: validationError.message,
          details: validationResult.error.errors 
        });
      }

      const { data } = validationResult;
      const emailRecord = await sendEmail({
        userId: data.userId,
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        templateId: data.templateId || undefined,
        templateParams: (data.templateParams && typeof data.templateParams === 'object' && !Array.isArray(data.templateParams)) 
          ? data.templateParams as Record<string, any>
          : undefined,
      });

      res.json(emailRecord);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post('/api/emails/batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emails: emailList } = req.body;

      if (!Array.isArray(emailList)) {
        return res.status(400).json({ message: "emails must be an array" });
      }

      const validatedEmails = [];
      const validationErrors = [];

      for (let i = 0; i < emailList.length; i++) {
        const validationResult = insertEmailSchema.safeParse({
          ...emailList[i],
          userId,
        });

        if (!validationResult.success) {
          const validationError = fromZodError(validationResult.error);
          validationErrors.push({
            index: i,
            message: validationError.message,
            details: validationResult.error.errors,
          });
        } else {
          validatedEmails.push(validationResult.data);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation failed for one or more emails",
          errors: validationErrors,
        });
      }

      const cleanedEmails = validatedEmails.map(data => ({
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        templateId: data.templateId || undefined,
        templateParams: (data.templateParams && typeof data.templateParams === 'object' && !Array.isArray(data.templateParams))
          ? data.templateParams as Record<string, any>
          : undefined,
      }));

      const results = await sendBatchEmails({
        userId,
        emails: cleanedEmails,
      });

      res.json(results);
    } catch (error) {
      console.error("Error sending batch emails:", error);
      res.status(500).json({ message: "Failed to send batch emails" });
    }
  });

  app.post('/api/emails/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.body.scheduledAt) {
        return res.status(400).json({ 
          message: "scheduledAt is required for scheduling emails" 
        });
      }

      const scheduledAtDate = new Date(req.body.scheduledAt);
      if (isNaN(scheduledAtDate.getTime())) {
        return res.status(400).json({ 
          message: "scheduledAt must be a valid date" 
        });
      }

      const validationResult = insertEmailSchema.safeParse({
        ...req.body,
        userId,
        scheduledAt: scheduledAtDate,
      });

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          error: validationError.message,
          details: validationResult.error.errors 
        });
      }

      const { data } = validationResult;
      const emailRecord = await scheduleEmail({
        userId: data.userId,
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        templateId: data.templateId || undefined,
        templateParams: (data.templateParams && typeof data.templateParams === 'object' && !Array.isArray(data.templateParams))
          ? data.templateParams as Record<string, any>
          : undefined,
        scheduledAt: scheduledAtDate,
      });

      res.json(emailRecord);
    } catch (error) {
      console.error("Error scheduling email:", error);
      res.status(500).json({ message: "Failed to schedule email" });
    }
  });

  app.get('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emailId = req.params.id;

      const emailRecord = await getEmailStatus(emailId, userId);

      if (!emailRecord) {
        return res.status(404).json({ message: "Email not found" });
      }

      res.json(emailRecord);
    } catch (error: any) {
      console.error("Error getting email status:", error);
      res.status(500).json({ message: "Failed to get email status" });
    }
  });

  app.get('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, startDate, endDate, page, limit } = req.query;

      const filters: any = {};

      if (status) {
        filters.status = status as 'draft' | 'scheduled' | 'sent' | 'failed';
      }

      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) {
          filters.dateRange.from = new Date(startDate as string);
        }
        if (endDate) {
          filters.dateRange.to = new Date(endDate as string);
        }
      }

      if (limit) {
        filters.limit = parseInt(limit as string);
      }

      if (page) {
        const pageNum = parseInt(page as string);
        const pageSize = filters.limit || 50;
        filters.offset = (pageNum - 1) * pageSize;
      }

      const result = await listUserEmails(userId, filters);

      res.json(result);
    } catch (error) {
      console.error("Error listing emails:", error);
      res.status(500).json({ message: "Failed to list emails" });
    }
  });

  app.post('/api/emails/process-scheduled', isAuthenticated, async (req: any, res) => {
    try {
      const summary = await processScheduledEmails();
      res.json(summary);
    } catch (error) {
      console.error("Error processing scheduled emails:", error);
      res.status(500).json({ message: "Failed to process scheduled emails" });
    }
  });

  // SMS routes
  app.post('/api/sms/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = insertSmsSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          error: validationError.message,
          details: validationResult.error.errors 
        });
      }

      const { data } = validationResult;
      const smsRecord = await sendSms({
        userId: data.userId,
        to: data.recipient,
        message: data.message,
        sender: data.sender || undefined,
      });

      res.json(smsRecord);
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  app.post('/api/sms/batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messages: messageList } = req.body;

      if (!Array.isArray(messageList)) {
        return res.status(400).json({ message: "messages must be an array" });
      }

      const validatedMessages = [];
      const validationErrors = [];

      for (let i = 0; i < messageList.length; i++) {
        const validationResult = insertSmsSchema.safeParse({
          ...messageList[i],
          userId,
        });

        if (!validationResult.success) {
          const validationError = fromZodError(validationResult.error);
          validationErrors.push({
            index: i,
            message: validationError.message,
            details: validationResult.error.errors,
          });
        } else {
          validatedMessages.push(validationResult.data);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation failed for one or more messages",
          errors: validationErrors,
        });
      }

      const cleanedMessages = validatedMessages.map(data => ({
        to: data.recipient,
        message: data.message,
        sender: data.sender || undefined,
      }));

      const results = await sendBatchSms({
        userId,
        messages: cleanedMessages,
      });

      res.json({ results });
    } catch (error) {
      console.error("Error sending batch SMS:", error);
      res.status(500).json({ message: "Failed to send batch SMS" });
    }
  });

  app.get('/api/sms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const smsId = parseInt(req.params.id);

      const smsRecord = await getSmsById(smsId, userId);

      if (!smsRecord) {
        return res.status(404).json({ message: "SMS not found" });
      }

      res.json(smsRecord);
    } catch (error) {
      console.error("Error fetching SMS:", error);
      res.status(500).json({ message: "Failed to fetch SMS details" });
    }
  });

  app.get('/api/sms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, startDate, endDate, page, limit } = req.query;

      const filters: any = {};

      if (status && (status === 'sent' || status === 'failed')) {
        filters.status = status;
      }

      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) {
          filters.dateRange.from = new Date(startDate as string);
        }
        if (endDate) {
          filters.dateRange.to = new Date(endDate as string);
        }
      }

      if (limit) {
        filters.limit = parseInt(limit as string);
      }

      if (page) {
        const pageNum = parseInt(page as string);
        const pageSize = filters.limit || 50;
        filters.offset = (pageNum - 1) * pageSize;
      }

      const result = await listUserSms(userId, filters);

      const totalPages = Math.ceil(result.total / (filters.limit || 50));

      res.json({
        sms: result.sms,
        total: result.total,
        totalPages,
        currentPage: page ? parseInt(page as string) : 1,
      });
    } catch (error) {
      console.error("Error listing SMS:", error);
      res.status(500).json({ message: "Failed to list SMS" });
    }
  });

  // Stripe subscription routes (enhanced)
  
  // Get all available subscription plans
  app.get('/api/subscription/plans', (req, res) => {
    try {
      const plans = subscriptionService.getPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get current subscription details
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const details = await subscriptionService.getSubscription(userId);
      res.json(details);
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription details" });
    }
  });

  // Create new subscription
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const result = await subscriptionService.createSubscription(userId, planId);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // Update subscription (upgrade/downgrade)
  app.put('/api/subscription/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const subscription = await subscriptionService.updateSubscription(userId, planId);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to update subscription" });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { immediately } = req.body;
      
      const subscription = await subscriptionService.cancelSubscription(userId, immediately);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel subscription" });
    }
  });

  // Reactivate canceled subscription
  app.post('/api/subscription/reactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await subscriptionService.reactivateSubscription(userId);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to reactivate subscription" });
    }
  });

  // Create billing portal session
  app.post('/api/subscription/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { returnUrl } = req.body;
      
      const url = await subscriptionService.createPortalSession(
        userId, 
        returnUrl || `${process.env.CLIENT_URL}/subscription`
      );
      res.json({ url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: error.message || "Failed to create portal session" });
    }
  });

  // Check usage limits
  app.get('/api/subscription/usage/:limitType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limitType } = req.params;
      
      if (!['aiSessions', 'projects', 'collaborators'].includes(limitType)) {
        return res.status(400).json({ message: "Invalid limit type" });
      }

      const usage = await subscriptionService.checkUsageLimit(userId, limitType as any);
      res.json(usage);
    } catch (error: any) {
      console.error("Error checking usage:", error);
      res.status(500).json({ message: "Failed to check usage limits" });
    }
  });

  // Legacy endpoint (for backward compatibility)
  app.get('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await subscriptionService.createSubscription(userId, 'professional');
      res.json(result);
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
