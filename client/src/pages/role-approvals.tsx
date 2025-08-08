/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RoleApprovalRequest {
  id: number;
  userId: number;
  requestedRole: string;
  requestedAt: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function RoleApprovalsPage() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const queryClient = useQueryClient();

  const { data: pendingRequests = [] } = useQuery<RoleApprovalRequest[]>({
    queryKey: ["/api/role-approvals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/role-approvals");
      if (!res.ok) throw new Error("Failed to fetch role approvals");
      return res.json();
    },
    enabled: permissions?.hasPermission('canCreateUsers')
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, approved, notes }: { requestId: number; approved: boolean; notes?: string }) => {
      const res = await apiRequest("POST", `/api/role-approvals/${requestId}/approve`, { approved, notes });
      if (!res.ok) throw new Error("Failed to process approval");
      return res.json();
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: approved ? "Role Approved" : "Role Request Rejected",
        description: approved 
          ? "The user has been granted the requested role."
          : "The role request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!permissions?.hasPermission('canCreateUsers')) {
    return (
      <div className="pt-16 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to manage role approvals. Contact an administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'product_manager': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="pt-16 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Approvals</h1>
          <p className="text-muted-foreground">Review and approve role upgrade requests</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pendingRequests.length} pending
        </Badge>
      </div>

      {pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No pending role approval requests at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">Requesting:</span>
                        <Badge className={getRoleBadgeColor(request.requestedRole)}>
                          {formatRoleName(request.requestedRole)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Role Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject {request.firstName} {request.lastName}'s request for {formatRoleName(request.requestedRole)} role?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => approveRequestMutation.mutate({ 
                              requestId: request.id, 
                              approved: false,
                              notes: "Request rejected by admin"
                            })}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reject Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" size="sm" className="text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Role Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to approve {request.firstName} {request.lastName} for the {formatRoleName(request.requestedRole)} role? This will grant them additional permissions immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => approveRequestMutation.mutate({ 
                              requestId: request.id, 
                              approved: true,
                              notes: "Request approved by admin"
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}