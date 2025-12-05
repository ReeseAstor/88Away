import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { CollaborationService } from "./collaboration";
import { storage } from "./storage";
import { startEmailScheduler, stopEmailScheduler } from "./emailScheduler";
import { WebSocketGateway } from "./events/websocketGateway";
import { EventStreamService } from "./events/eventStream";

const app = express();

// Enable gzip compression for all responses
// Note: Custom header 'x-no-compression' can be used to bypass compression if needed
app.use(compression({
  filter: (req, res) => {
    // Allow bypassing compression with custom header for specific use cases
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression speed and ratio
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error handled:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    startEmailScheduler();
    
    // Initialize event stream service
    const eventStream = EventStreamService.getInstance();
    log('Event stream service initialized');
    
    // Initialize enhanced WebSocket gateway (handles multiple paths)
    const wsGateway = WebSocketGateway.getInstance();
    wsGateway.initialize(server);
    log('WebSocket gateway initialized');
    
    // Keep legacy collaboration service for backward compatibility
    // It will eventually be migrated to use the new event system
    const collaborationService = CollaborationService.getInstance();
    
    // Cleanup on shutdown
    process.on('SIGTERM', async () => {
      log('Shutting down gracefully...');
      stopEmailScheduler();
      collaborationService.destroy();
      await wsGateway.destroy();
      await eventStream.destroy();
      log('Shutdown complete');
    });
  });
})();
