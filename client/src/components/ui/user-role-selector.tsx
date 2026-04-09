/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { UserCog, Shield } from "lucide-react";
import { RoleBadge } from "./role-badge";
import { usePermissions } from "@/hooks/use-permissions";
import { ROLES, type Role } from "@shared/schema";

interface UserRoleSelectorProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  disabled?: boolean;
}

export function UserRoleSelector({ currentRole, onRoleChange, disabled = false }: UserRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const permissions = usePermissions();

  const handleSave = () => {
    onRoleChange(selectedRole);
    setIsOpen(false);
  };

  if (!permissions?.hasPermission('canCreateUsers')) {
    return <RoleBadge role={currentRole} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={disabled}
        >
          <UserCog className="h-4 w-4" />
          <RoleBadge role={currentRole} showIcon={false} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Select the appropriate role for this user. This will determine their permissions and access level.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={role} showIcon={false} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}