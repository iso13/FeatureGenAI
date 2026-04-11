/**
 * FeatureGen AI — MCP Server
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.FEATUREGEN_API_URL ?? "http://localhost:5000";

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

let sessionCookie = "";

async function ensureAuth() {
  if (sessionCookie) return;
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MCP_EMAIL,
      password: process.env.MCP_PASSWORD,
    }),
  });
  const cookie = res.headers.get("set-cookie");
  if (cookie) {
    sessionCookie = cookie.split(";")[0];
    console.error("FeatureGenAI MCP authenticated successfully");
  } else {
    console.error("FeatureGenAI MCP auth failed — check MCP_EMAIL and MCP_PASSWORD");
  }
}

// ─────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json;
}

const server = new McpServer({
  name: "FeatureGenAI",
  version: "1.0.0",
});

// ─────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────

server.tool(
  "generate_feature",
  "Generate a BDD feature file with Gherkin scenarios using AI.",
  {
    title: z.string().describe("Feature title"),
    story: z.string().describe("User story or description of the feature"),
    scenarioCount: z.number().int().min(1).max(10).default(3).describe("Number of scenarios to generate"),
    epicId: z.number().int().optional().describe("Epic ID to associate this feature with"),
  },
  async ({ title, story, scenarioCount, epicId }) => {
    try {
      const feature = await api("POST", "/api/features/generate", {
        title,
        story,
        scenarioCount,
        epicId,
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, feature }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_features",
  "List all BDD features in FeatureGenAI",
  {
    includeDeleted: z.boolean().default(false).describe("Include archived/deleted features"),
  },
  async ({ includeDeleted }) => {
    try {
      const features = await api("GET", `/api/features?includeDeleted=${includeDeleted}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: features.length, features }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_feature",
  "Get a specific BDD feature including its full generated Gherkin content",
  {
    id: z.number().int().describe("Feature ID"),
  },
  async ({ id }) => {
    try {
      const features = await api("GET", "/api/features");
      const feature = features.find((f: any) => f.id === id);
      if (!feature) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Feature not found" }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, feature }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "suggest_titles",
  "Suggest feature titles based on a user story or description",
  {
    story: z.string().describe("User story or description"),
  },
  async ({ story }) => {
    try {
      const result = await api("POST", "/api/features/suggest-titles", { story });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, titles: result.titles }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "infer_domains",
  "Infer relevant business domains from a feature title and story",
  {
    title: z.string().describe("Feature title"),
    story: z.string().describe("User story or description"),
  },
  async ({ title, story }) => {
    try {
      const result = await api("POST", "/api/features/infer-domains", { title, story });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, domains: result.domains }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

server.tool(
  "list_projects",
  "List all projects in FeatureGenAI",
  {},
  async () => {
    try {
      const projects = await api("GET", "/api/projects");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: projects.length, projects }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_project",
  "Create a new project in FeatureGenAI",
  {
    name: z.string().describe("Project name"),
    description: z.string().optional().describe("Project description"),
  },
  async ({ name, description }) => {
    try {
      await ensureAuth();
      const project = await api("POST", "/api/projects", { name, description, status: "active" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, project }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────
// EPICS
// ─────────────────────────────────────────────

server.tool(
  "list_epics",
  "List all epics, optionally filtered by project",
  {
    projectId: z.number().int().optional().describe("Filter epics by project ID"),
  },
  async ({ projectId }) => {
    try {
      const path = projectId ? `/api/epics?projectId=${projectId}` : "/api/epics";
      const epics = await api("GET", path);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: epics.length, epics }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_epic",
  "Create a new epic within a project",
  {
    name: z.string().describe("Epic name"),
    description: z.string().optional().describe("Epic description"),
    projectId: z.number().int().optional().describe("Project ID to associate this epic with"),
  },
  async ({ name, description, projectId }) => {
    try {
      await ensureAuth();
      const epic = await api("POST", "/api/epics", { name, description, status: "active", projectId });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, epic }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_epic_features",
  "Get all BDD features belonging to a specific epic",
  {
    epicId: z.number().int().describe("Epic ID"),
  },
  async ({ epicId }) => {
    try {
      const features = await api("GET", `/api/epics/${epicId}/features`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: features.length, features }) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FeatureGenAI MCP server running on stdio");
  await ensureAuth();
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});