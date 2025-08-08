/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  // Create admin user
  try {
    const user = await storage.createUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@cucumber-gen.com',
      passwordHash,
      isAdmin: true,
      role: 'admin'
    });
    console.log('Admin user created successfully:', user.id);
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

createAdminUser();
