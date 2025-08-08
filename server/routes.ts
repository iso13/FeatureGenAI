/**
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
import { generateFeature, suggestTitle, analyzeFeatureComplexity } from "./openai";
import bcrypt from "bcryptjs";

import { insertFeatureSchema, insertEpicSchema, analytics } from "@shared/schema";
import { db } from "./db";
import { requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

      const content = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount,
        data.domain
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
      const id = parseInt(req.params.id);
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

  app.post("/api/features/:id/archive", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/:id/restore", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.restoreFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Alias route to support existing frontend calls to `/delete`
  app.post("/api/features/:id/delete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/features/:id/regenerate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertFeatureSchema.parse(req.body);

      const content = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount,
        data.domain
      );

      // Just return the generated content without creating a new feature
      res.json({ generatedContent: content });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/features/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      
      const newUser = await storage.createUser({
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

      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features/export/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const feature = await storage.updateFeature(id, updateData);
      res.json(feature);
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
      const epics = await storage.getAllEpics();
      res.json(epics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/epics/:id/features", async (req, res) => {
    try {
      const epicId = parseInt(req.params.id);
      const features = await storage.getFeaturesByEpic(epicId);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/epics/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const epic = await storage.updateEpic(id, updateData);
      res.json(epic);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/epics/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

      const userId = parseInt(req.params.id);
      
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

      const requestId = parseInt(req.params.id);
      const { approved, notes } = req.body;

      await storage.approveRoleRequest(requestId, user.id, approved, notes);
      res.json({ message: approved ? "Role approved" : "Role request rejected" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return createServer(app);
}