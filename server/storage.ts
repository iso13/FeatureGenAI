/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import {
  users,
  features,
  projects,
  epics,
  analytics,
  passwordResetTokens,
  roleApprovalRequests,
  customDomains,
  companies,
  domainGlossary,
  domainProcesses,
  domainExamples,
  type User,
  type Feature,
  type Project,
  type Epic,
  type Analytics,
  type InsertFeature,
  type InsertAnalytics,
  type InsertProject,
  type InsertEpic,
  type Company,
  type DomainGlossary,
  type DomainProcess,
  type DomainExample,
  type InsertCompany,
  type InsertGlossary,
  type InsertProcess,
  type InsertExample,
} from "@shared/schema";
import { eq, ilike, desc, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create a new postgres client with SSL configuration
const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

const client = postgres(connectionString!, {
  ssl: isLocal ? false : {
    require: true,
    rejectUnauthorized: false
  },
});
const db = drizzle(client);

export interface IStorage {
  // User management
  createUser(user: { firstName: string; lastName: string; email: string; passwordHash: string; isAdmin: boolean; role?: string; requestedRole?: string | null; roleApproved?: boolean; }): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Project management
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Epic management
  createEpic(epic: InsertEpic): Promise<Epic>;
  getEpic(id: number): Promise<Epic | undefined>;
  getAllEpics(projectId?: number): Promise<Epic[]>;
  updateEpic(id: number, epic: Partial<InsertEpic>): Promise<Epic>;
  deleteEpic(id: number): Promise<void>;

  // Feature management
  createFeature(feature: CreateFeatureInput): Promise<Feature>;
  getFeature(id: number): Promise<Feature | undefined>;
  getAllFeatures(includeDeleted?: boolean): Promise<Feature[]>;
  getFeaturesByEpic(epicId: number): Promise<Feature[]>;
  updateFeature(id: number, feature: Partial<UpdateFeatureInput>): Promise<Feature>;
  softDeleteFeature(id: number): Promise<Feature>;
  restoreFeature(id: number): Promise<Feature>;
  findFeatureByTitle(title: string): Promise<Feature | undefined>;

  // Analytics
  trackEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalytics(): Promise<Analytics[]>;

  // Custom Domain management
  createCustomDomain(data: any): Promise<any>;
  getAllCustomDomains(userId?: number): Promise<any[]>;
  getCustomDomain(id: number): Promise<any | null>;
  updateCustomDomain(id: number, data: any): Promise<any>;
  deleteCustomDomain(id: number): Promise<void>;
  getUserCustomDomains(userId: number): Promise<any[]>;

  // Company management
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;

  // Domain Knowledge management
  createGlossaryTerm(companyId: number, data: InsertGlossary & { createdBy: number }): Promise<DomainGlossary>;
  getGlossaryTerms(companyId: number, search?: string, limit?: number): Promise<DomainGlossary[]>;
  updateGlossaryTerm(id: number, data: Partial<InsertGlossary>): Promise<DomainGlossary>;
  deleteGlossaryTerm(id: number): Promise<void>;

  createProcess(companyId: number, data: InsertProcess & { createdBy: number }): Promise<DomainProcess>;
  getProcesses(companyId: number, search?: string, category?: string, limit?: number): Promise<DomainProcess[]>;
  updateProcess(id: number, data: Partial<InsertProcess>): Promise<DomainProcess>;
  deleteProcess(id: number): Promise<void>;

  createExample(companyId: number, data: InsertExample & { createdBy: number }): Promise<DomainExample>;
  getExamples(companyId: number, search?: string, tags?: string, limit?: number): Promise<DomainExample[]>;
  updateExample(id: number, data: Partial<InsertExample>): Promise<DomainExample>;
  deleteExample(id: number): Promise<void>;

  // Retrieval for generation
  getRelevantDomainKnowledge(companyId: number, searchText: string, limit?: number): Promise<{
    glossary: DomainGlossary[];
    processes: DomainProcess[];
    examples: DomainExample[];
  }>;
}

type CreateFeatureInput = InsertFeature & {
  generatedContent: string;
  manuallyEdited?: boolean;
  analysisJson?: string;
  deleted?: boolean;
};

type UpdateFeatureInput = InsertFeature & {
  generatedContent?: string;
  manuallyEdited?: boolean;
  analysisJson?: string;
  deleted?: boolean;
};

export class PostgresStorage implements IStorage {
  // User management methods
  async createUser(user: { firstName: string; lastName: string; email: string; passwordHash: string; isAdmin: boolean; role?: string; requestedRole?: string | null; roleApproved?: boolean; }): Promise<User> {
    const [newUser] = await db.insert(users).values({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordHash: user.passwordHash,
      isAdmin: user.isAdmin,
      role: user.role || 'developer',
      requestedRole: user.requestedRole || null,
      roleApproved: user.roleApproved ?? true
    }).returning();
    return newUser;
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  // Password reset methods
  async createPasswordResetToken(userId: number, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: number; expiresAt: Date } | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return null;
    }

    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt,
    };
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    // Delete user's data in the correct order to avoid foreign key constraints

    // Delete password reset tokens first
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));

    // Delete role approval requests
    await db.delete(roleApprovalRequests).where(eq(roleApprovalRequests.userId, id));

    // Delete analytics records
    await db.delete(analytics).where(eq(analytics.userId, id));

    // Clear user references from features (set to null instead of deleting features)
    await db.update(features).set({ userId: null }).where(eq(features.userId, id));

    // Clear user references from epics
    await db.update(epics).set({ userId: null }).where(eq(epics.userId, id));

    // Clear user references from projects
    await db.update(projects).set({ userId: null }).where(eq(projects.userId, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Role approval methods
  async createRoleApprovalRequest(data: { userId: number; requestedRole: string }) {
    const [request] = await db.insert(roleApprovalRequests).values(data).returning();
    return request;
  }

  async getPendingRoleApprovals() {
    return await db
      .select({
        id: roleApprovalRequests.id,
        userId: roleApprovalRequests.userId,
        requestedRole: roleApprovalRequests.requestedRole,
        requestedAt: roleApprovalRequests.requestedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(roleApprovalRequests)
      .innerJoin(users, eq(roleApprovalRequests.userId, users.id))
      .where(eq(roleApprovalRequests.status, 'pending'));
  }

  async approveRoleRequest(requestId: number, reviewerId: number, approved: boolean, notes?: string) {
    const [request] = await db
      .select()
      .from(roleApprovalRequests)
      .where(eq(roleApprovalRequests.id, requestId))
      .limit(1);

    if (!request) throw new Error('Request not found');

    const status = approved ? 'approved' : 'rejected';

    // Update the approval request
    await db
      .update(roleApprovalRequests)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
      })
      .where(eq(roleApprovalRequests.id, requestId));

    // If approved, update the user's role
    if (approved) {
      await db
        .update(users)
        .set({
          role: request.requestedRole,
          roleApproved: true,
          requestedRole: null,
        })
        .where(eq(users.id, request.userId));
    }

    return request;
  }

  // Project management methods
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    // First, unassign all epics from this project (set their projectId to null)
    await db.update(epics).set({ projectId: null }).where(eq(epics.projectId, id));

    // Then delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Epic management methods
  async createEpic(insertEpic: InsertEpic): Promise<Epic> {
    const [epic] = await db.insert(epics).values(insertEpic).returning();
    return epic;
  }

  async getEpic(id: number): Promise<Epic | undefined> {
    const [epic] = await db.select().from(epics).where(eq(epics.id, id));
    return epic;
  }

  async getAllEpics(projectId?: number): Promise<Epic[]> {
    const query = db.select().from(epics).orderBy(desc(epics.createdAt));
    if (projectId) {
      return await query.where(eq(epics.projectId, projectId));
    }
    return await query;
  }

  async updateEpic(id: number, updateData: Partial<InsertEpic>): Promise<Epic> {
    const [epic] = await db.update(epics).set(updateData).where(eq(epics.id, id)).returning();
    return epic;
  }

  async deleteEpic(id: number): Promise<void> {
    // First, unassign all features from this epic (set their epicId to null)
    await db.update(features).set({ epicId: null }).where(eq(features.epicId, id));

    // Then delete the epic
    await db.delete(epics).where(eq(epics.id, id));
  }

  // Feature management methods
  async createFeature(insertFeature: CreateFeatureInput): Promise<Feature> {
    const [feature] = await db.insert(features).values(insertFeature).returning();
    return feature;
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    const [feature] = await db.select().from(features).where(eq(features.id, id));
    return feature;
  }

  async getAllFeatures(includeDeleted: boolean = false): Promise<Feature[]> {
    const query = db.select().from(features);
    if (!includeDeleted) {
      return await query.where(eq(features.deleted, false));
    }
    return await query;
  }

  async getFeaturesByEpic(epicId: number): Promise<Feature[]> {
    return await db.select().from(features)
      .where(eq(features.epicId, epicId))
      .orderBy(desc(features.createdAt));
  }

  async updateFeature(id: number, updateData: Partial<UpdateFeatureInput>): Promise<Feature> {
    const [feature] = await db.update(features).set(updateData).where(eq(features.id, id)).returning();
    return feature;
  }

  async softDeleteFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ deleted: true })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async restoreFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ deleted: false })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async findFeatureByTitle(title: string): Promise<Feature | undefined> {
    const [feature] = await db
      .select()
      .from(features)
      .where(ilike(features.title, title))
      .limit(1);
    return feature;
  }

  // Analytics methods
  async trackEvent(event: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db
      .insert(analytics)
      .values({
        ...event,
        title: event.title || null,
        createdAt: new Date(),
      })
      .returning();
    return analytic;
  }

  async getAnalytics(): Promise<Analytics[]> {
    return await db.select().from(analytics).orderBy(desc(analytics.createdAt)).execute();
  }

  // Custom Domain methods
  async createCustomDomain(data: any): Promise<any> {
    // Ensure complianceContext is properly JSON stringified if it's an array
    if (Array.isArray(data.complianceContext)) {
      data.complianceContext = JSON.stringify(data.complianceContext);
    }

    // Set current timestamp for updatedAt
    data.updatedAt = new Date();

    const [domain] = await db.insert(customDomains).values(data).returning();

    // Parse complianceContext back to array for response
    if (domain.complianceContext) {
      try {
        domain.complianceContext = JSON.parse(domain.complianceContext);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }

    return domain;
  }

  async getAllCustomDomains(userId?: number): Promise<any[]> {
    try {
      // Check if the table exists and has data
      const domains = await db.select().from(customDomains).limit(1);

      let query = db.select().from(customDomains);

      if (userId) {
        // Show user's own domains plus public domains
        query = query.where(
          or(
            eq(customDomains.createdBy, userId),
            eq(customDomains.isPublic, true)
          )
        );
      } else {
        // Show only public domains if no user
        query = query.where(eq(customDomains.isPublic, true));
      }

      const result = await query.orderBy(desc(customDomains.createdAt));

      return result.map(domain => ({
        ...domain,
        complianceContext: domain.complianceContext ?
          (typeof domain.complianceContext === 'string' ?
            JSON.parse(domain.complianceContext) :
            domain.complianceContext) :
          []
      }));
    } catch (error) {
      console.error("Error fetching custom domains:", error);
      // Return empty array if there's any database error
      return [];
    }
  }

  async getCustomDomain(id: number): Promise<any | null> {
    const [domain] = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.id, id));
    return domain || null;
  }

  async updateCustomDomain(id: number, data: any): Promise<any> {
    // Ensure complianceContext is properly JSON stringified if it's an array
    if (Array.isArray(data.complianceContext)) {
      data.complianceContext = JSON.stringify(data.complianceContext);
    }

    const [updated] = await db
      .update(customDomains)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customDomains.id, id))
      .returning();

    // Parse complianceContext back to array for response
    if (updated.complianceContext) {
      try {
        updated.complianceContext = JSON.parse(updated.complianceContext);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }

    return updated;
  }

  async deleteCustomDomain(id: number): Promise<void> {
    await db.delete(customDomains).where(eq(customDomains.id, id));
  }

  async getUserCustomDomains(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.createdBy, userId))
      .orderBy(desc(customDomains.createdAt));
  }

  // Company management
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  // Domain Glossary
  async createGlossaryTerm(companyId: number, data: InsertGlossary & { createdBy: number }): Promise<DomainGlossary> {
    const [term] = await db.insert(domainGlossary).values({
      companyId,
      ...data
    }).returning();
    return term;
  }

  async getGlossaryTerms(companyId: number, search?: string, limit = 50): Promise<DomainGlossary[]> {
    let query = db.select().from(domainGlossary)
      .where(eq(domainGlossary.companyId, companyId))
      .orderBy(desc(domainGlossary.weight), desc(domainGlossary.createdAt));

    if (search) {
      query = query.where(or(
        ilike(domainGlossary.term, `%${search}%`),
        ilike(domainGlossary.definition, `%${search}%`)
      ));
    }

    return await query.limit(limit);
  }

  async updateGlossaryTerm(id: number, data: Partial<InsertGlossary>): Promise<DomainGlossary> {
    const [term] = await db.update(domainGlossary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(domainGlossary.id, id))
      .returning();
    return term;
  }

  async deleteGlossaryTerm(id: number): Promise<void> {
    await db.delete(domainGlossary).where(eq(domainGlossary.id, id));
  }

  // Domain Processes
  async createProcess(companyId: number, data: InsertProcess & { createdBy: number }): Promise<DomainProcess> {
    const [process] = await db.insert(domainProcesses).values({
      companyId,
      ...data
    }).returning();
    return process;
  }

  async getProcesses(companyId: number, search?: string, category?: string, limit = 50): Promise<DomainProcess[]> {
    let query = db.select().from(domainProcesses)
      .where(eq(domainProcesses.companyId, companyId))
      .orderBy(desc(domainProcesses.weight), desc(domainProcesses.createdAt));

    if (search) {
      query = query.where(or(
        ilike(domainProcesses.title, `%${search}%`),
        ilike(domainProcesses.content, `%${search}%`)
      ));
    }

    if (category) {
      query = query.where(eq(domainProcesses.category, category));
    }

    return await query.limit(limit);
  }

  async updateProcess(id: number, data: Partial<InsertProcess>): Promise<DomainProcess> {
    const [process] = await db.update(domainProcesses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(domainProcesses.id, id))
      .returning();
    return process;
  }

  async deleteProcess(id: number): Promise<void> {
    await db.delete(domainProcesses).where(eq(domainProcesses.id, id));
  }

  // Domain Examples
  async createExample(companyId: number, data: InsertExample & { createdBy: number }): Promise<DomainExample> {
    const [example] = await db.insert(domainExamples).values({
      companyId,
      ...data
    }).returning();
    return example;
  }

  async getExamples(companyId: number, search?: string, tags?: string, limit = 50): Promise<DomainExample[]> {
    let query = db.select().from(domainExamples)
      .where(eq(domainExamples.companyId, companyId))
      .orderBy(desc(domainExamples.weight), desc(domainExamples.createdAt));

    if (search) {
      query = query.where(or(
        ilike(domainExamples.title, `%${search}%`),
        ilike(domainExamples.featureContent, `%${search}%`)
      ));
    }

    if (tags) {
      query = query.where(ilike(domainExamples.tags, `%${tags}%`));
    }

    return await query.limit(limit);
  }

  async updateExample(id: number, data: Partial<InsertExample>): Promise<DomainExample> {
    const [example] = await db.update(domainExamples)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(domainExamples.id, id))
      .returning();
    return example;
  }

  async deleteExample(id: number): Promise<void> {
    await db.delete(domainExamples).where(eq(domainExamples.id, id));
  }

  // Retrieval for generation
  async getRelevantDomainKnowledge(companyId: number, searchText: string, limit = 10): Promise<{
    glossary: DomainGlossary[];
    processes: DomainProcess[];
    examples: DomainExample[];
  }> {
    const searchTerm = `%${searchText.toLowerCase()}%`;

    const glossary = await db.select().from(domainGlossary)
      .where(
        eq(domainGlossary.companyId, companyId)
      )
      .orderBy(desc(domainGlossary.weight), desc(domainGlossary.createdAt))
      .limit(limit);

    const processes = await db.select().from(domainProcesses)
      .where(
        eq(domainProcesses.companyId, companyId)
      )
      .orderBy(desc(domainProcesses.weight), desc(domainProcesses.createdAt))
      .limit(limit);

    const examples = await db.select().from(domainExamples)
      .where(
        eq(domainExamples.companyId, companyId)
      )
      .orderBy(desc(domainExamples.weight), desc(domainExamples.createdAt))
      .limit(limit);

    return { glossary, processes, examples };
  }
}

export const storage = new PostgresStorage();