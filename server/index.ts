/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import ConnectPgSimple from "connect-pg-simple";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const pgSession = ConnectPgSimple(session);
app.use(session({
  store: new pgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    },
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax'
  },
}));

// Logging middleware
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
  // Register auth routes before other routes
  await registerAuthRoutes(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // Custom domains routes
  app.get('/api/custom-domains', async (req, res) => {
    try {
      const userId = req.session.userId;
      const domains = await storage.getAllCustomDomains(userId);
      res.json(domains);
    } catch (error) {
      console.error('Error fetching custom domains:', error);
      res.status(500).json({ error: 'Failed to fetch custom domains' });
    }
  });

  app.post('/api/domains', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        domainKey,
        displayName,
        description,
        primaryActors,
        businessUseCases,
        complianceContext,
        stepStyle,
        auditabilityRequired,
        aiInstructions,
        isPublic
      } = req.body;

      // Validate required fields
      if (!domainKey || !displayName || !aiInstructions) {
        return res.status(400).json({ 
          error: 'Missing required fields: domainKey, displayName, and aiInstructions are required' 
        });
      }

      const domainData = {
        name: domainKey,
        displayName,
        description: description || null,
        primaryActors: primaryActors || null,
        businessUseCases: businessUseCases || null,
        complianceContext: complianceContext || [],
        stepStyle: stepStyle || 'Declarative',
        auditabilityRequired: auditabilityRequired || false,
        instructions: aiInstructions,
        isPublic: isPublic || false,
        createdBy: req.session.userId
      };

      const domain = await storage.createCustomDomain(domainData);
      res.status(201).json(domain);
    } catch (error) {
      console.error('Error creating custom domain:', error);
      res.status(500).json({ error: 'Failed to create custom domain' });
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "localhost",
  }, () => {
    log(`serving on port ${port}`);
  })
  .on('error', (err: any) => {
    if(err.code === 'EADDRINUSE') {
      log(`Port ${port} is busy, trying a different port`);
      // Try with a different port
      const newPort = typeof port === 'string' ? parseInt(port) + 1 : (port as number) + 1;
      server.listen(newPort, "localhost", () => {
        log(`serving on port ${newPort}`);
      });
    }
  })
  .on('listening', () => {
    log(`serving on port ${port}`);
  });
})();