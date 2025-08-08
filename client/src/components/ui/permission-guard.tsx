/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { ROLE_PERMISSIONS, type Role } from "@shared/schema";

interface PermissionGuardProps {
  permission: keyof typeof ROLE_PERMISSIONS[Role];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const permissions = usePermissions();
  
  if (!permissions?.hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}