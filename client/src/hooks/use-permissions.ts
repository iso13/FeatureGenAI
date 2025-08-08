/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useAuth } from "./use-auth";
import { ROLE_PERMISSIONS, type Role } from "@shared/schema";

export function usePermissions() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  const userRole = (user.role as Role) || "developer";
  const permissions = ROLE_PERMISSIONS[userRole];

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS[Role]) => {
    return permissions[permission] || user.isAdmin;
  };

  return {
    role: userRole,
    permissions,
    hasPermission,
    isAdmin: user.isAdmin,
  };
}