/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import {
  features,
  analytics,
  users,
  epics,
  passwordResetTokens,
  roleApprovalRequests,
  type Feature,
  type InsertFeature,
  type Analytics,
  type InsertAnalytics,
  type User,
  type Epic,
  type InsertEpic,
} from "@shared/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create a new postgres client with SSL configuration
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!, {
  ssl: {
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

  

  // Epic management methods
  async createEpic(insertEpic: InsertEpic): Promise<Epic> {
    const [epic] = await db.insert(epics).values(insertEpic).returning();
    return epic;
  }

  async getEpic(id: number): Promise<Epic | undefined> {
    const [epic] = await db.select().from(epics).where(eq(epics.id, id));
    return epic;
  }

  async getAllEpics(): Promise<Epic[]> {
    return await db.select().from(epics).orderBy(desc(epics.createdAt));
  }

  async updateEpic(id: number, updateData: Partial<InsertEpic>): Promise<Epic> {
    const [epic] = await db.update(epics).set(updateData).where(eq(epics.id, id)).returning();
    return epic;
  }

  async deleteEpic(id: number): Promise<void> {
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
}

export const storage = new PostgresStorage();