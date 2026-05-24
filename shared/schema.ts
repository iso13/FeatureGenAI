/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const DOMAIN_VALUES = [
  "ai",
  "biotech",
  "crypto",
  "ecommerce",
  "finance",
  "healthcare",
  "infrastructure",
  "insurance",
  "performance",
  "rag",
  "salesforce",
  "security"
] as const;

export type Domain = typeof DOMAIN_VALUES[number];

export const ROLES = [
  "admin",
  "product_manager", 
  "business_analyst",
  "developer",
  "tester",
  "stakeholder"
] as const;

export type Role = typeof ROLES[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  role: text("role").default("developer").notNull(),
  requestedRole: text("requested_role"), // For approval workflow
  roleApproved: boolean("role_approved").default(true).notNull(), // False for pending approvals
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  used: boolean("used").default(false).notNull(),
});

export const LIFECYCLE_STAGES = [
  'draft',
  'review',
  'approved',
  'implemented',
  'tested',
  'deployed'
] as const;

export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  scenarioCount: integer("scenario_count").notNull(),
  generatedContent: text("generated_content"),
  manuallyEdited: boolean("manually_edited").default(false).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  status: text("status").default("backlog").notNull(),
  domain: text("domain").default("generic"),
  epicId: integer("epic_id").references(() => epics.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  lifecycleStage: text("lifecycle_stage").default('draft'),
  stageHistory: text("stage_history").default('{}'),
  analysisJson: text("analysis_json"),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(), // active, on-hold, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const epics = pgTable("epics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(), // active, on-hold, completed, cancelled
  projectId: integer("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  title: text("title"),
  scenarioCount: integer("scenario_count"),
  successful: boolean("successful").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  recommendations: json("recommendations"),
});

// Role approval requests table
export const roleApprovalRequests = pgTable("role_approval_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  requestedRole: text("requested_role").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
});

export const customDomains = pgTable("custom_domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "retail-banking"
  displayName: text("display_name").notNull(), // e.g., "Retail Banking"
  description: text("description").notNull(), // Required description
  primaryActors: text("primary_actors").notNull(), // e.g., "Member, Provider, Compliance Officer"
  businessUseCases: text("business_use_cases").notNull(), // e.g., "Enroll Member, Submit Claim"
  complianceContext: json("compliance_context").notNull(), // Array of compliance requirements
  stepStyle: text("step_style").default("Declarative").notNull(), // Declarative, Imperative, Hybrid
  auditabilityRequired: boolean("auditability_required").default(false).notNull(),
  instructions: text("instructions").notNull(), // Required domain-specific instructions for AI generation
  isPublic: boolean("is_public").default(false).notNull(), // Whether other users can use this domain
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add company_id to users table for multi-tenancy
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Domain Knowledge Tables
export const domainGlossary = pgTable("domain_glossary", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  weight: integer("weight").default(1).notNull(), // 1-10 priority
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const domainProcesses = pgTable("domain_processes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // "process" | "policy"
  weight: integer("weight").default(1).notNull(), // 1-10 priority
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const domainExamples = pgTable("domain_examples", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  tags: text("tags").notNull(), // comma-separated
  featureContent: text("feature_content").notNull(), // Gherkin content
  weight: integer("weight").default(1).notNull(), // 1-10 priority
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Self-registration safe roles (auto-approved)
export const AUTO_APPROVED_ROLES = [
  'developer',
  'tester', 
  'business_analyst',
  'stakeholder'
] as const;

// Roles that require admin approval
export const APPROVAL_REQUIRED_ROLES = [
  'product_manager'
] as const;

// All roles available for self-registration
export const SELF_REGISTRATION_ROLES = [
  ...AUTO_APPROVED_ROLES,
  ...APPROVAL_REQUIRED_ROLES
] as const;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(SELF_REGISTRATION_ROLES).default('developer'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertFeatureSchema = createInsertSchema(features)
  .pick({
    title: true,
    story: true,
    scenarioCount: true,
    epicId: true,
    domain: true,
  })
  .extend({
    title: z.string().min(1, "Title is required"),
    story: z.string().min(10, "Story must be at least 10 characters"),
    scenarioCount: z.number().min(1).max(10),
    epicId: z.number().optional(),
    domain: z.enum(DOMAIN_VALUES).optional(),
    generatedContent: z.string().optional(),
  });

export const updateFeatureSchema = insertFeatureSchema.partial().extend({
  generatedContent: z.string().min(1, "Feature content is required"),
  lifecycleStage: z.enum(LIFECYCLE_STAGES).optional(),
  stageHistory: z.string().optional(),
});

export const insertProjectSchema = createInsertSchema(projects)
  .pick({
    name: true,
    description: true,
    status: true,
    userId: true,
  })
  .extend({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum(["active", "on-hold", "completed", "cancelled"]).default("active"),
    userId: z.number().optional(),
  });

export const insertEpicSchema = createInsertSchema(epics)
  .pick({
    name: true,
    description: true,
    status: true,
    projectId: true,
    userId: true,
  })
  .extend({
    name: z.string().min(1, "Epic name is required"),
    description: z.string().optional(),
    status: z.enum(["active", "on-hold", "completed", "cancelled"]).default("active"),
    projectId: z.number().optional(),
    userId: z.number().optional(),
  });

export const insertAnalyticsSchema = createInsertSchema(analytics)
.pick({
  eventType: true,
  title: true,
  scenarioCount: true,
  successful: true,
  errorMessage: true,
  recommendations: true,
});

export const insertCustomDomainSchema = createInsertSchema(customDomains)
  .pick({
    name: true,
    displayName: true,
    description: true,
    primaryActors: true,
    businessUseCases: true,
    complianceContext: true,
    stepStyle: true,
    auditabilityRequired: true,
    instructions: true,
    isPublic: true,
  })
  .extend({
    name: z.string().min(2, "Domain key is required").max(50).regex(/^[a-z0-9-]+$/, "Domain key can only contain lowercase letters, numbers, and hyphens"),
    displayName: z.string().min(2, "Display name is required").max(100),
    description: z.string().min(10, "Description is required").max(500),
    primaryActors: z.string().min(1, "Primary actors are required"),
    businessUseCases: z.string().min(1, "Key use cases are required"),
    complianceContext: z.array(z.string()).min(1, "Select at least one compliance standard"),
    stepStyle: z.enum(["Declarative", "Imperative", "Hybrid"]).default("Declarative"),
    auditabilityRequired: z.boolean().default(false),
    instructions: z.string().min(20, "AI instructions are required (minimum 20 characters)").max(2000),
    isPublic: z.boolean().default(false),
  });

// Domain Knowledge Schemas
export const insertCompanySchema = createInsertSchema(companies)
  .pick({
    name: true,
    slug: true,
  })
  .extend({
    name: z.string().min(1, "Company name is required"),
    slug: z.string().min(1, "Company slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  });

export const insertGlossarySchema = createInsertSchema(domainGlossary)
  .pick({
    term: true,
    definition: true,
    weight: true,
  })
  .extend({
    term: z.string().min(1, "Term is required").max(100),
    definition: z.string().min(1, "Definition is required").max(1000),
    weight: z.number().min(1).max(10).default(1),
  });

export const insertProcessSchema = createInsertSchema(domainProcesses)
  .pick({
    title: true,
    content: true,
    category: true,
    weight: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200),
    content: z.string().min(1, "Content is required").max(5000),
    category: z.enum(["process", "policy"]),
    weight: z.number().min(1).max(10).default(1),
  });

export const insertExampleSchema = createInsertSchema(domainExamples)
  .pick({
    title: true,
    tags: true,
    featureContent: true,
    weight: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200),
    tags: z.string().min(1, "Tags are required"),
    featureContent: z.string().min(1, "Feature content is required").max(5000),
    weight: z.number().min(1).max(10).default(1),
  });

export const insertUserSchema = createInsertSchema(users)
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    passwordHash: true,
    isAdmin: true,
    role: true,
    requestedRole: true,
    roleApproved: true,
  })
  .extend({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    passwordHash: z.string().min(1, "Password hash is required"),
    isAdmin: z.boolean().default(false),
    role: z.enum(ROLES).default("developer"),
    requestedRole: z.string().optional(),
    roleApproved: z.boolean().default(true),
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Epic = typeof epics.$inferSelect;
export type InsertEpic = z.infer<typeof insertEpicSchema>;

// Role-based permissions configuration
export const ROLE_PERMISSIONS = {
  admin: {
    canCreateUsers: true,
    canManageProjects: true,
    canManageEpics: true,
    canManageFeatures: true,
    canViewAnalytics: true,
    canConfigureTeam: true,
    canDeleteFeatures: true,
    canChangeLifecycleStages: true,
    canViewAllFeatures: true,
  },
  product_manager: {
    canCreateUsers: false,
    canManageProjects: true,
    canManageEpics: true,
    canManageFeatures: true,
    canViewAnalytics: true,
    canConfigureTeam: true,
    canDeleteFeatures: true,
    canChangeLifecycleStages: true,
    canViewAllFeatures: true,
  },
  business_analyst: {
    canCreateUsers: false,
    canManageProjects: false,
    canManageEpics: false,
    canManageFeatures: true,
    canViewAnalytics: true,
    canConfigureTeam: false,
    canDeleteFeatures: false,
    canChangeLifecycleStages: false,
    canViewAllFeatures: true,
  },
  developer: {
    canCreateUsers: false,
    canManageProjects: false,
    canManageEpics: false,
    canManageFeatures: true,
    canViewAnalytics: false,
    canConfigureTeam: false,
    canDeleteFeatures: false,
    canChangeLifecycleStages: true,
    canViewAllFeatures: false,
  },
  tester: {
    canCreateUsers: false,
    canManageProjects: false,
    canManageEpics: false,
    canManageFeatures: false,
    canViewAnalytics: false,
    canConfigureTeam: false,
    canDeleteFeatures: false,
    canChangeLifecycleStages: true,
    canViewAllFeatures: false,
  },
  stakeholder: {
    canCreateUsers: false,
    canManageProjects: false,
    canManageEpics: false,
    canManageFeatures: false,
    canViewAnalytics: true,
    canConfigureTeam: false,
    canDeleteFeatures: false,
    canChangeLifecycleStages: false,
    canViewAllFeatures: true,
  },
} as const;
export type UpdateFeature = z.infer<typeof updateFeatureSchema>;
export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;

// Domain Knowledge Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type DomainGlossary = typeof domainGlossary.$inferSelect;
export type InsertGlossary = z.infer<typeof insertGlossarySchema>;

export type DomainProcess = typeof domainProcesses.$inferSelect;
export type InsertProcess = z.infer<typeof insertProcessSchema>;

export type DomainExample = typeof domainExamples.$inferSelect;
export type InsertExample = z.infer<typeof insertExampleSchema>;

export type SortOption = "title" | "date" | "domain";
export type FeatureFilter = "all" | "active" | "deleted";
