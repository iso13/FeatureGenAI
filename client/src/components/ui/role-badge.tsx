/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { Badge } from "./badge";
import { Shield, Users, FileText, Code, TestTube, Eye } from "lucide-react";
import { type Role } from "@shared/schema";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Shield,
    variant: "destructive" as const,
    color: "bg-red-500"
  },
  product_manager: {
    label: "Product Manager",
    icon: Users,
    variant: "default" as const,
    color: "bg-blue-500"
  },
  business_analyst: {
    label: "Business Analyst",
    icon: FileText,
    variant: "secondary" as const,
    color: "bg-purple-500"
  },
  developer: {
    label: "Developer",
    icon: Code,
    variant: "outline" as const,
    color: "bg-green-500"
  },
  tester: {
    label: "Tester",
    icon: TestTube,
    variant: "secondary" as const,
    color: "bg-orange-500"
  },
  stakeholder: {
    label: "Stakeholder",
    icon: Eye,
    variant: "outline" as const,
    color: "bg-gray-500"
  }
};

export function RoleBadge({ role, size = "sm", showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}