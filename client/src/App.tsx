/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import Auth from "@/pages/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { RoleBadge } from "@/components/ui/role-badge";
import { usePermissions } from "@/hooks/use-permissions";
import { type Role } from "@shared/schema";

function Navigation() {
  const { user, logoutMutation } = useAuth();
  const permissions = usePermissions();

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm z-50">
      <nav>
        <a href="/" className="mr-4 hover:text-primary">Home</a>
        <a href="/templates" className="mr-4 hover:text-primary">Templates</a>
        <a href="/export" className="mr-4 hover:text-primary">Export</a>
        <a href="/analytics" className="mr-4 hover:text-primary">Analytics</a>
        {permissions?.hasPermission('canCreateUsers') && (
          <>
            <a href="/users" className="mr-4 hover:text-primary">Users</a>
            <a href="/role-approvals" className="mr-4 hover:text-primary">Role Approvals</a>
          </>
        )}
        <a href="/info" className="mr-4 hover:text-primary">Info</a>
      </nav>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
          </span>
          <RoleBadge role={(user.role as Role) || "developer"} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/templates" component={() => {
        const Templates = lazy(() => import("@/pages/templates"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Templates />
          </Suspense>
        );
      }} />
      <Route path="/export" component={() => {
        const Export = lazy(() => import("@/pages/export"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Export />
          </Suspense>
        );
      }} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/users" component={() => {
        const Users = lazy(() => import("./pages/users"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Users />
          </Suspense>
        );
      }} />
      <Route path="/role-approvals" component={() => {
        const RoleApprovals = lazy(() => import("./pages/role-approvals"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <RoleApprovals />
          </Suspense>
        );
      }} />
      <Route path="/info" component={() => {
        const Info = lazy(() => import("./pages/info"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Info />
          </Suspense>
        );
      }} />
      <Route path="/scrum-board" component={() => {
        const ScrumBoard = lazy(() => import("@/pages/scrum-board"));
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <ScrumBoard />
          </Suspense>
        );
      }} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="*">
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="feature-generator-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <div className="pt-16">
              <Router />
            </div>
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;