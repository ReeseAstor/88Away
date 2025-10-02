import express, { type Request, Response, NextFunction } from "express";
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { CollaborationService } from "./collaboration";
import { storage } from "./storage";

const app = express();
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
    throw err;
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
    
    // Set up WebSocket server for collaboration on a specific path
    const wss = new WebSocketServer({ 
      server,
      path: '/ws/collaboration'
    });
    const collaborationService = CollaborationService.getInstance();
    
    wss.on('connection', async (ws, req) => {
      try {
        // Parse query parameters from the URL
        const fullUrl = `http://localhost${req.url}`;
        const url = parse(fullUrl, true);
        const documentId = url.query.documentId as string;
        const projectId = url.query.projectId as string;
        
        if (!documentId || !projectId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Missing required parameters' }));
          ws.close();
          return;
        }
        
        // Parse cookies from request headers
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
          ws.send(JSON.stringify({ type: 'error', message: 'No session cookie found' }));
          ws.close();
          return;
        }
        
        // Parse cookie header to get session ID
        const cookies: Record<string, string> = {};
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          cookies[name] = rest.join('=');
        });
        
        const sessionCookie = cookies['connect.sid'];
        if (!sessionCookie) {
          ws.send(JSON.stringify({ type: 'error', message: 'Session cookie not found' }));
          ws.close();
          return;
        }
        
        // URL-decode the cookie and extract session ID from signed cookie (format: s:sessionId.signature)
        let sessionId: string;
        try {
          const decodedCookie = decodeURIComponent(sessionCookie);
          if (decodedCookie.startsWith('s:')) {
            // Signed cookie - remove 's:' prefix and keep the full signature intact
            sessionId = decodedCookie.slice(2);
          } else {
            // Unsigned cookie (shouldn't happen with express-session default config)
            sessionId = decodedCookie;
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to decode session cookie' }));
          ws.close();
          return;
        }
        
        // Verify session and get user
        const session = await storage.getSession(sessionId);
        if (!session || !session.sess || !session.sess.user) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid session' }));
          ws.close();
          return;
        }
        
        const user = await storage.getUser(session.sess.user.claims.sub);
        if (!user) {
          ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
          ws.close();
          return;
        }
        
        // Handle connection with collaboration service
        await collaborationService.handleConnection(ws, user, documentId, projectId);
        
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to establish connection' }));
        ws.close();
      }
    });
    
    // Cleanup on shutdown
    process.on('SIGTERM', () => {
      collaborationService.destroy();
      wss.close();
    });
  });
})();
