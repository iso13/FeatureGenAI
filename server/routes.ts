**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature, suggestTitle, analyzeFeatureComplexity, inferDomains } from "./openai";
import bcrypt from "bcryptjs";

import { 
  insertFeatureSchema, 
  insertProjectSchema, 
  insertEpicSchema, 
  insertCustomDomainSchema, 
  insertCompanySchema,
  insertGlossarySchema,
  insertProcessSchema,
  insertExampleSchema,
  analytics 
} from "@shared/schema";
import { db } from "./db";
import { requireAuth } from "./auth";

// Helper function to safely parse and validate integer IDs
function parseIdParam(id: string): number {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ID parameter: ${id}`);
  }
  return parsed;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);
      const userId = req.session?.user?.id;

      // Get domain knowledge if user has a company
      let domainKnowledge = null;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.companyId) {
          const searchText = `${data.title} ${data.story}`;
          domainKnowledge = await storage.getRelevantDomainKnowledge(user.companyId, searchText, 10);
        }
      }

      // Check if this is a custom domain
      let customDomainContext: any | undefined;
      if (data.domain && data.domain.startsWith('custom-')) {
        const customDomainId = parseIdParam(data.domain.replace('custom-', ''));
        const customDomain = await storage.getCustomDomain(customDomainId);
        if (customDomain) {
          customDomainContext = customDomain;
        }
      }

      const content = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount,
        customDomainContext,
        domainKnowledge
      );

      // Automatically analyze complexity for the generated content
      let analysisJson: string | undefined = undefined;
      try {
        const analysis = await analyzeFeatureComplexity(content);
        analysisJson = JSON.stringify(analysis);
      } catch (analysisError) {
        console.warn("Failed to analyze complexity during generation:", analysisError);
      }

      const feature = await storage.createFeature({
        ...data,
        generatedContent: content,
        analysisJson,
        manuallyEdited: false,
      });

      await db.insert(analytics).values({
        eventType: "feature_generation",
        title: data.title,
        scenarioCount: data.scenarioCount,
        successful: true,
        errorMessage: null,
        createdAt: new Date(),
        userId: req.session?.user?.id ?? null,
        recommendations: null,
      });

      res.json(feature);
    } catch (error: any) {
      await db.insert(analytics).values({
        eventType: "feature_generation",
        title: req.body?.title ?? null,
        scenarioCount: req.body?.scenarioCount ?? null,
        successful: false,
        errorMessage: error.message,
        createdAt: new Date(),
        userId: req.session?.user?.id ?? null,
        recommendations: null,
      });

      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/complexity", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const feature = await storage.getFeature(id);
      if (!feature || !feature.generatedContent) {
        return res.status(404).json({ message: "Feature not found or has no content" });
      }

      const analysis = await analyzeFeatureComplexity(feature.generatedContent);

      await storage.updateFeature(id, {
        analysisJson: JSON.stringify(analysis),
      });

      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/suggest-titles", async (req, res) => {
    try {
      const { story } = req.body;
      const titles = await suggestTitle(story);
      res.json({ titles });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/infer-domains", async (req, res) => {
    try {
      const { title, story } = req.body;
      const domains = await inferDomains(title, story);
      res.json({ domains });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/:id/archive", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/:id/restore", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const feature = await storage.restoreFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Alias route to support existing frontend calls to `/delete`
  app.post("/api/features/:id/delete", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/:id/regenerate", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const data = insertFeatureSchema.parse(req.body);
      const userId = req.session?.user?.id;

      // Get domain knowledge if user has a company
      let domainKnowledge = null;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.companyId) {
          const searchText = `${data.title} ${data.story}`;
          domainKnowledge = await storage.getRelevantDomainKnowledge(user.companyId, searchText, 10);
        }
      }

      // Check if this is a custom domain
      let customDomainContext: any | undefined;
      if (data.domain && data.domain.startsWith('custom-')) {
        const customDomainId = parseIdParam(data.domain.replace('custom-', ''));
        const customDomain = await storage.getCustomDomain(customDomainId);
        if (customDomain) {
          customDomainContext = customDomain;
        }
      }

      const content = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount,
        customDomainContext,
        domainKnowledge
      );

      // Just return the generated content without creating a new feature
      res.json({ generatedContent: content });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/features/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updateData = req.body;

      const feature = await storage.updateFeature(id, updateData);
      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features", async (req, res) => {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const all = await storage.getAllFeatures(includeDeleted);
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics", async (_req, res) => {
    try {
      const result = await storage.getAnalytics();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      // Get fresh user data to check current role
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins can view all users
      console.log('Checking admin access for user:', { id: user.id, role: user.role, isAdmin: user.isAdmin });
      if (user.role !== 'admin' && !user.isAdmin) {
        console.log('Access denied for user:', { id: user.id, role: user.role, isAdmin: user.isAdmin });
        return res.status(403).json({ message: "Access denied" });
      }
      console.log('Admin access granted');

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      // Get fresh user data to check current role
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins can create users
      if (user.role !== 'admin' && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { firstName, lastName, email, password, role } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await await storage.createUser({
        firstName,
        lastName,
        email,
        passwordHash,
        isAdmin: role === 'admin',
        role: role || 'developer'
      });

      res.json(newUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id/role", requireAuth, async (req, res) => {
    try {
      // Get fresh user data to check current role
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins can update user roles
      if (user.role !== 'admin' && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userId = parseIdParam(req.params.id);
      const { role } = req.body;

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features/export/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const feature = await storage.getFeature(id);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      const content = feature.generatedContent;
      if (!content) {
        return res.status(400).json({ message: "No content to export" });
      }

      // Since the generated content already contains the complete feature structure,
      // just return the content as-is to avoid any duplication
      let docContent = content;

      // Set headers for document download
      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', `attachment; filename="${feature.title.replace(/[^a-zA-Z0-9]/g, '_')}.doc"`);

      res.send(docContent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feature update route for drag-and-drop
  app.patch("/api/features/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updateData = req.body;
      const feature = await storage.updateFeature(id, updateData);
      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Project routes
  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...data,
        userId: req.session?.user?.id,
      });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updateData = req.body;
      const project = await storage.updateProject(id, updateData);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Epic routes
  app.post("/api/epics", requireAuth, async (req, res) => {
    try {
      const data = insertEpicSchema.parse(req.body);
      const epic = await storage.createEpic({
        ...data,
        userId: req.session?.user?.id,
      });
      res.json(epic);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/epics", async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const epics = await storage.getAllEpics(projectId);
      res.json(epics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/epics/:id/features", async (req, res) => {
    try {
      const epicId = parseIdParam(req.params.id);
      const features = await storage.getFeaturesByEpic(epicId);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/epics/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updateData = req.body;
      const epic = await storage.updateEpic(id, updateData);
      res.json(epic);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/epics/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      await storage.deleteEpic(id);
      res.json({ message: "Epic deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete user endpoint
  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      // Get fresh user data to check current role
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins can delete users
      if (user.role !== 'admin' && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userId = parseIdParam(req.params.id);

      // Prevent admin from deleting themselves
      if (userId === user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Role approval endpoints
  app.get("/api/role-approvals", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pendingRequests = await storage.getPendingRoleApprovals();
      res.json(pendingRequests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/role-approvals/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const requestId = parseIdParam(req.params.id);
      const { approved, notes } = req.body;

      await storage.approveRoleRequest(requestId, user.id, approved, notes);
      res.json({ message: approved ? "Role approved" : "Role request rejected" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Custom Domain routes - DISABLED
  // app.post("/api/custom-domains", requireAuth, async (req, res) => {
  //   res.status(503).json({ message: "Custom domains feature is disabled" });
  // });

  app.get("/api/custom-domains", async (req, res) => {
    res.json([]);
  });

  app.get("/api/custom-domains/my", requireAuth, async (req, res) => {
    res.json([]);
  });

  // app.patch("/api/custom-domains/:id", requireAuth, async (req, res) => {
  //   res.status(503).json({ message: "Custom domains feature is disabled" });
  // });

  // app.delete("/api/custom-domains/:id", requireAuth, async (req, res) => {
  //   res.status(503).json({ message: "Custom domains feature is disabled" });
  // });

  // Company management routes
  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(data);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Domain Knowledge routes - Glossary
  app.post("/api/domain/glossary", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertGlossarySchema.parse(req.body);
      const term = await storage.createGlossaryTerm(user.companyId, {
        ...data,
        createdBy: user.id
      });
      res.json(term);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/domain/glossary", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const search = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const terms = await storage.getGlossaryTerms(user.companyId, search, limit);
      res.json(terms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/domain/glossary/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      const data = insertGlossarySchema.partial().parse(req.body);
      const term = await storage.updateGlossaryTerm(id, data);
      res.json(term);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/domain/glossary/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      await storage.deleteGlossaryTerm(id);
      res.json({ message: "Glossary term deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Domain Knowledge routes - Processes
  app.post("/api/domain/processes", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertProcessSchema.parse(req.body);
      const process = await storage.createProcess(user.companyId, {
        ...data,
        createdBy: user.id
      });
      res.json(process);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/domain/processes", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const search = req.query.search as string;
      const category = req.query.category as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const processes = await storage.getProcesses(user.companyId, search, category, limit);
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/domain/processes/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      const data = insertProcessSchema.partial().parse(req.body);
      const process = await storage.updateProcess(id, data);
      res.json(process);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/domain/processes/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      await storage.deleteProcess(id);
      res.json({ message: "Process deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Domain Knowledge routes - Examples
  app.post("/api/domain/examples", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertExampleSchema.parse(req.body);
      const example = await storage.createExample(user.companyId, {
        ...data,
        createdBy: user.id
      });
      res.json(example);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/domain/examples", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin) || !user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const search = req.query.search as string;
      const tags = req.query.tags as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const examples = await storage.getExamples(user.companyId, search, tags, limit);
      res.json(examples);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/domain/examples/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      const data = insertExampleSchema.partial().parse(req.body);
      const example = await storage.updateExample(id, data);
      res.json(example);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/domain/examples/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseIdParam(req.params.id);
      await storage.deleteExample(id);
      res.json({ message: "Example deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cleanup route - remove in production
  app.post("/api/cleanup", requireAuth, async (req, res) => {
    try {
      // Clear all features by getting them and deleting each one
      const features = await storage.getAllFeatures(true);
      for (const feature of features) {
        await storage.updateFeature(feature.id, { deleted: true });
      }
      res.json({ success: true, message: "All features cleared" });
    } catch (error: any) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove generic references from existing features
  app.post("/api/cleanup-generic", async (req, res) => {
    try {
      const features = await storage.getAllFeatures();

      let updatedCount = 0;

      for (const feature of features) {
        if (feature.generatedContent && 
            (feature.generatedContent.includes('@generic') || 
             feature.generatedContent.includes('@Generic') ||
             feature.generatedContent.includes('Generic'))) {

          let cleanedContent = feature.generatedContent
            .replace(/@generic\s*/gi, '')
            .replace(/@Generic\s*/gi, '')
            .replace(/Generic\s*/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up extra newlines

          await storage.updateFeature(feature.id, {
            title: feature.title,
            story: feature.story,
            scenarioCount: feature.scenarioCount,
            generatedContent: cleanedContent
          });

          updatedCount++;
        }
      }

      res.json({ 
        success: true, 
        message: `Updated ${updatedCount} features`,
        updatedCount
      });
    } catch (error: any) {
      console.error("Generic cleanup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove duplicate features
  app.post("/api/cleanup-duplicates", requireAuth, async (req, res) => {
    try {
      const features = await storage.getAllFeatures(true); // Include deleted features
      console.log(`Found ${features.length} total features`);
      
      const titleMap = new Map<string, any[]>();

      // Group features by normalized title
      for (const feature of features) {
        const normalizedTitle = feature.title.toLowerCase().trim();
        if (!titleMap.has(normalizedTitle)) {
          titleMap.set(normalizedTitle, []);
        }
        titleMap.get(normalizedTitle)!.push(feature);
      }

      console.log(`Grouped into ${titleMap.size} unique titles`);

      let removedCount = 0;
      const duplicatesFound: string[] = [];

      // Process each group of features with the same title
      for (const [title, duplicateFeatures] of titleMap) {
        if (duplicateFeatures.length > 1) {
          console.log(`Found ${duplicateFeatures.length} duplicates for title: "${title}"`);
          duplicatesFound.push(title);

          // Sort by creation date (keep the oldest, remove newer duplicates)
          duplicateFeatures.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          console.log(`Keeping oldest: ID ${duplicateFeatures[0].id}, removing ${duplicateFeatures.length - 1} duplicates`);

          // Keep the first one, mark others as deleted
          for (let i = 1; i < duplicateFeatures.length; i++) {
            const duplicate = duplicateFeatures[i];
            if (!duplicate.deleted) {
              console.log(`Marking as deleted: ID ${duplicate.id} - "${duplicate.title}"`);
              await storage.updateFeature(duplicate.id, { deleted: true });
              removedCount++;
            } else {
              console.log(`Already deleted: ID ${duplicate.id} - "${duplicate.title}"`);
            }
          }
        }
      }

      console.log(`Cleanup complete: removed ${removedCount} duplicates`);

      res.json({ 
        success: true, 
        message: `Removed ${removedCount} duplicate features`,
        removedCount,
        duplicatesFound,
        totalFeatures: features.length,
        uniqueTitles: titleMap.size
      });
    } catch (error: any) {
      console.error("Duplicate cleanup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fix spacing issues in existing feature content (no auth required)
  app.post("/api/fix-spacing", async (req, res) => {
    try {
      const features = await storage.getAllFeatures();
      let updatedCount = 0;

      for (const feature of features) {
        if (feature.generatedContent) {
          let originalContent = feature.generatedContent;
          let cleanedContent = originalContent;

          // Remove extra empty lines between domain tags and Feature: line
          // Match pattern: @tag followed by one or more empty lines followed by Feature:
          cleanedContent = cleanedContent.replace(/(^@[^\n]+)\n\s*\n+(Feature:)/gm, '$1\n$2');

          // Also clean up any other excessive empty lines (more than 2 consecutive)
          cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          // Apply the same spacing fixes as the generator
          cleanedContent = cleanedContent.replace(/(Feature:.*\n(?:\s{2}.*\n)*?)(?=\s*(?:Background:|Scenario:))/g, '$1\n');
          cleanedContent = cleanedContent.replace(/(\S.*)\n(Background:)/g, '$1\n\n$2');
          cleanedContent = cleanedContent.replace(/(\S.*)\n(Scenario:)/g, '$1\n\n$2');
          cleanedContent = cleanedContent.replace(/(\nScenario:.*(?:\n\s+.*)*)\n\n\n+(Scenario:)/g, '$1\n\n$2');

          // Only update if content actually changed
          if (cleanedContent !== originalContent) {
            await storage.updateFeature(feature.id, {
              generatedContent: cleanedContent
            });
            updatedCount++;
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Fixed spacing in ${updatedCount} features`,
        updatedCount
      });
    } catch (error: any) {
      console.error("Spacing cleanup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return createServer(app);
