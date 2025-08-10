/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";

import { storage } from "./storage";
import { generateFeature, suggestTitle, analyzeFeatureComplexity } from "./openai";
import { insertFeatureSchema, insertEpicSchema, analytics } from "@shared/schema";
import { db } from "./db";
import { requireAuth } from "./auth";

/* ----------------------------- helpers ----------------------------- */

function parseScenarioTitles(text?: string | null): string[] {
  if (!text) return [];
  const titles: string[] = [];
  const lines = text.split(/\r?\n/);
  for (const ln of lines) {
    const m = ln.match(/^\s*Scenario(?: Outline)?:\s*(.+)\s*$/);
    if (m && m[1]) titles.push(m[1].trim());
  }
  return titles;
}

function analysisTitlesFromJson(analysisJson?: string | null): string[] {
  if (!analysisJson) return [];
  try {
    const parsed = JSON.parse(analysisJson);
    const arr = parsed?.scenarios;
    if (!Array.isArray(arr)) return [];
    // Support either `title` or `name` keys coming from older/newer analyzers
    return arr.map((s: any) => {
      if (typeof s?.title === "string") return s.title;
      if (typeof s?.name === "string") return s.name;
      return "";
    });
  } catch {
    return [];
  }
}

/**
 * Normalize the analysis so:
 * - length matches the larger of (headings found in text) vs (desiredLenHint)
 * - scenario titles align to headings
 * - keep both `title` and `name` for UI compatibility
 */
function normalizeAnalysisToText(
  analysis: any,
  featureText: string,
  desiredLenHint?: number
) {
  const titles = parseScenarioTitles(featureText);
  const desiredLen = Math.max(
    titles.length,
    typeof desiredLenHint === "number" ? desiredLenHint : 0
  );

  let scenarios: any[] = Array.isArray(analysis?.scenarios) ? analysis.scenarios : [];

  if (scenarios.length < desiredLen) {
    const placeholders = Array.from({ length: desiredLen - scenarios.length }, (_v, i) => {
      const idx = scenarios.length + i;
      const title = titles[idx] ?? `Scenario ${idx + 1}`;
      return {
        title,
        name: title,
        complexity: "Unknown",
        details: "Pending analysis",
      };
    });
    scenarios = scenarios.concat(placeholders);
  } else if (scenarios.length > desiredLen) {
    scenarios = scenarios.slice(0, desiredLen);
  }

  scenarios = scenarios.map((s: any, i: number) => {
    const heading = titles[i] ?? s?.title ?? s?.name ?? `Scenario ${i + 1}`;
    return { ...s, title: heading, name: heading };
  });

  return { ...analysis, scenarios };
}

/** Decide if we must reanalyze: count or title drift, or edited content */
function needsReanalysis(args: {
  featureText: string | null | undefined;
  existingAnalysisJson: string | null | undefined;
  contentEdited: boolean;
  scenarioCountHintChanged: boolean;
}): boolean {
  const { featureText, existingAnalysisJson, contentEdited, scenarioCountHintChanged } = args;

  if (contentEdited || scenarioCountHintChanged) return true;

  const textTitles = parseScenarioTitles(featureText ?? undefined);
  const analysisTitles = analysisTitlesFromJson(existingAnalysisJson);

  if (textTitles.length !== analysisTitles.length) return true;
  for (let i = 0; i < textTitles.length; i++) {
    if (textTitles[i] !== analysisTitles[i]) return true;
  }
  return false;
}

/* ------------------------------ routes ----------------------------- */

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate a brand new feature
  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

      const content = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount,
        data.domain
      );

      // Analyze immediately (best effort)
      let analysisJson: string | undefined = undefined;
      try {
        const raw = await analyzeFeatureComplexity(content);
        const norm = normalizeAnalysisToText(raw, content, data.scenarioCount);
        analysisJson = JSON.stringify(norm);
      } catch (e) {
        console.warn("Analyze on generate failed:", e);
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

  // Force re-analysis of an existing feature (left open for debugging; add requireAuth if desired)
  app.post("/api/features/:id/reanalyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);
      if (!feature || !feature.generatedContent) {
        return res
          .status(404)
          .json({ message: "Feature not found or has no content" });
      }
      const desiredLenHint = (feature as any).scenarioCount;
      const raw = await analyzeFeatureComplexity(feature.generatedContent);
      const norm = normalizeAnalysisToText(
        raw,
        feature.generatedContent,
        desiredLenHint
      );
      await storage.updateFeature(id, { analysisJson: JSON.stringify(norm) });
      res.json(norm);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Recompute complexity for current content (compat)
  app.post("/api/features/:id/complexity", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);
      if (!feature || !feature.generatedContent) {
        return res
          .status(404)
          .json({ message: "Feature not found or has no content" });
      }
      const desiredLenHint = (feature as any).scenarioCount;
      const raw = await analyzeFeatureComplexity(feature.generatedContent);
      const norm = normalizeAnalysisToText(
        raw,
        feature.generatedContent,
        desiredLenHint
      );
      await storage.updateFeature(id, { analysisJson: JSON.stringify(norm) });
      res.json(norm);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Title suggestions
  app.post("/api/features/suggest-titles", async (req, res) => {
    try {
      const { story } = req.body;
      const titles = await suggestTitle(story);
      res.json({ titles });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Archive / restore / soft delete
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

  // Alias delete -> archive
  app.post("/api/features/:id/delete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Regenerate content (no DB write)
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

      res.json({ generatedContent: content });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Save edits and re-analyze when needed (size by hint if provided)
  app.patch("/api/features/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Only persist provided keys (avoid writing undefined)
      const updateData = Object.fromEntries(
        Object.entries(req.body as Record<string, any>).filter(([, v]) => v !== undefined)
      );

      // 1) Save edits
      let updated = await storage.updateFeature(id, updateData);

      // 2) Evaluate if we need re-analysis
      const contentEdited = typeof updateData.generatedContent === "string";
      const scenarioCountHintChanged = typeof updateData.scenarioCount === "number";

      const mustReanalyze = needsReanalysis({
        featureText: updated.generatedContent ?? undefined,
        existingAnalysisJson: updated.analysisJson ?? undefined,
        contentEdited,
        scenarioCountHintChanged,
      });

      if (mustReanalyze) {
        try {
          const desiredLenHint =
            typeof updateData.scenarioCount === "number"
              ? updateData.scenarioCount
              : (updated as any).scenarioCount;

          const raw = await analyzeFeatureComplexity(updated.generatedContent ?? "");
          const norm = normalizeAnalysisToText(
            raw,
            updated.generatedContent ?? "",
            desiredLenHint
          );
          await storage.updateFeature(id, { analysisJson: JSON.stringify(norm) });
          updated = (await storage.getFeature(id)) ?? updated;
        } catch (e) {
          console.warn("Re-analysis after update failed:", e);
          // do not fail the patch if analysis fails
        }
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Single feature (needed so the UI/curl can fetch JSON, not the SPA shell)
  app.get("/api/features/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);
      if (!feature) return res.status(404).json({ message: "Feature not found" });
      res.json(feature);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // List & export
  app.get("/api/features", async (req, res) => {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const all = await storage.getAllFeatures(includeDeleted);
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features/export/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);
      if (!feature) return res.status(404).json({ message: "Feature not found" });

      const content = feature.generatedContent;
      if (!content) return res.status(400).json({ message: "No content to export" });

      res.setHeader("Content-Type", "application/msword");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${feature.title.replace(/[^a-zA-Z0-9]/g, "_")}.doc"`
      );
      res.send(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics
  app.get("/api/analytics", async (_req, res) => {
    try {
      const result = await storage.getAnalytics();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Users (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      if (user.role !== "admin" && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      if (user.role !== "admin" && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { firstName, lastName, email, password, role } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        firstName,
        lastName,
        email,
        passwordHash,
        isAdmin: role === "admin",
        role: role || "developer",
      });

      res.json(newUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id/role", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      if (user.role !== "admin" && !user.isAdmin) {
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

  // Epics
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

  app.get("/api/epics", async (_req, res) => {
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

  return createServer(app);
}