/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

// shared/types/express-session.d.ts
import "express-session";
declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: {
      id: number;
      email: string;
      isAdmin: boolean;
      role: string;
    };
  }
}