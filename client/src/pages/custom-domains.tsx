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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  MoreHorizontal,
  Globe,
  Lock,
  Edit,
  Trash2,
  User,
  Users,
  Calendar,
  Target,
  Info,
  BookOpen,
  Settings,
  Shield,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomDomainSchema, type CustomDomain } from "@shared/schema";
import CreateCustomDomainForm from "@/components/CreateCustomDomainForm";
import { z } from "zod";

type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;

export default function CustomDomains() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialogs and UI
  const [newDomainDialog, setNewDomainDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CustomDomain | null>(null);

  // Data queries
  const { data: allDomains = [] } = useQuery({
    queryKey: ["/api/custom-domains"],
    enabled: !!user,
  });

  const { data: myDomains = [] } = useQuery({
    queryKey: ["/api/custom-domains/my"],
    enabled: !!user,
  });

  // Forms
  const domainForm = useForm<InsertCustomDomain>({
    resolver: zodResolver(insertCustomDomainSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      primaryActors: "",
      businessUseCases: "",
      complianceContext: ["None"],
      stepStyle: "Declarative",
      auditabilityRequired: false,
      instructions: "",
      isPublic: false,
    },
  });

  const editDomainForm = useForm<InsertCustomDomain>({
    resolver: zodResolver(insertCustomDomainSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      primaryActors: "",
      businessUseCases: "",
      complianceContext: ["None"],
      stepStyle: "Declarative",
      auditabilityRequired: false,
      instructions: "",
      isPublic: false,
    },
  });

  // Mutations
  const createDomainMutation = useMutation({
    mutationFn: async (data: InsertCustomDomain) => {
      const res = await apiRequest("POST", "/api/custom-domains", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create custom domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains/my"] });
      toast({
        title: "Success",
        description: "Custom domain created successfully",
        duration: 3000,
      });
      setNewDomainDialog(false);
      domainForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ domainId, data }: { domainId: number; data: Partial<InsertCustomDomain> }) => {
      const res = await apiRequest("PATCH", `/api/custom-domains/${domainId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update custom domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains/my"] });
      setEditingDomain(null);
      toast({
        title: "Domain Updated",
        description: "Custom domain has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await apiRequest("DELETE", `/api/custom-domains/${domainId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete custom domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains/my"] });
      toast({
        title: "Domain Deleted",
        description: "Custom domain has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Submit handlers
  const onSubmitDomain = (data: InsertCustomDomain) => {
    createDomainMutation.mutate(data);
  };

  const onSubmitEditDomain = (data: InsertCustomDomain) => {
    if (!editingDomain) return;
    updateDomainMutation.mutate({ domainId: editingDomain.id, data });
  };

  const handleEditDomain = (domain: CustomDomain) => {
    setEditingDomain(domain);
    editDomainForm.reset({
      name: domain.name,
      displayName: domain.displayName,
      description: domain.description || "",
      primaryActors: domain.primaryActors || "",
      businessUseCases: domain.businessUseCases || "",
      complianceContext: domain.complianceContext || ["None"],
      stepStyle: domain.stepStyle || "Declarative",
      auditabilityRequired: domain.auditabilityRequired || false,
      instructions: domain.instructions,
      isPublic: domain.isPublic,
    });
  };

  const handleDeleteDomain = (domainId: number) => {
    if (confirm("Are you sure you want to delete this custom domain?")) {
      deleteDomainMutation.mutate(domainId);
    }
  };

  if (!user) {
    return <div>Please log in to manage custom domains.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Domains</h1>
          <p className="text-muted-foreground">
            Create domain-specific contexts to improve AI feature generation accuracy.
          </p>
        </div>

        {/* Instructions and Best Practices Section */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Info className="h-5 w-5" />
              Best Practices for Custom Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-blue-800 dark:text-blue-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Domain Name & Display</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use kebab-case for domain names (e.g., "retail-banking")</li>
                  <li>• Keep display names clear and professional</li>
                  <li>• Include specific industry or use case context</li>
                </ul>

                <h4 className="font-semibold">Primary Actors</h4>
                <ul className="space-y-1 text-sm">
                  <li>• List key user roles who interact with the system</li>
                  <li>• Use business terminology, not technical roles</li>
                  <li>• Examples: "Customer, Agent, Manager, Admin"</li>
                </ul>

                <h4 className="font-semibold">Business Use Cases</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Focus on high-level business workflows</li>
                  <li>• Use action-oriented language</li>
                  <li>• Examples: "Process Payment, Generate Report, Approve Loan"</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Compliance Context</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Select all relevant regulatory frameworks</li>
                  <li>• This affects tone and terminology in scenarios</li>
                  <li>• Influences audit trail and logging requirements</li>
                </ul>

                <h4 className="font-semibold">AI Instructions</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Be specific about domain terminology</li>
                  <li>• Include common data elements and workflows</li>
                  <li>• Mention integration patterns or constraints</li>
                  <li>• Specify any domain-specific testing approaches</li>
                </ul>

                <h4 className="font-semibold">Step Style</h4>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Declarative:</strong> Focus on business outcomes</li>
                  <li>• <strong>Imperative:</strong> Include technical steps</li>
                  <li>• <strong>Hybrid:</strong> Mix business and technical details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples Section */}
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <BookOpen className="h-5 w-5" />
              Example Custom Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-green-800 dark:text-green-200">
            <div className="grid gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold mb-2">Healthcare EMR System</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Primary Actors:</strong> Patient, Physician, Nurse, Administrator<br/>
                    <strong>Use Cases:</strong> Schedule Appointment, Record Vitals, Prescribe Medication, Generate Report
                  </div>
                  <div>
                    <strong>Compliance:</strong> HIPAA<br/>
                    <strong>Instructions:</strong> "Focus on patient privacy, PHI handling, consent workflows, and audit trails. Include error scenarios for invalid patient IDs and access violations."
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold mb-2">Financial Trading Platform</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Primary Actors:</strong> Trader, Risk Manager, Compliance Officer, Client<br/>
                    <strong>Use Cases:</strong> Execute Trade, Monitor Positions, Generate P&L, Verify Compliance
                  </div>
                  <div>
                    <strong>Compliance:</strong> SOX, SEC<br/>
                    <strong>Instructions:</strong> "Emphasize real-time data validation, trade settlement processes, risk limits, and regulatory reporting. Include market data feed scenarios and latency considerations."
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold mb-2">E-Learning Platform</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Primary Actors:</strong> Student, Instructor, Administrator, Parent<br/>
                    <strong>Use Cases:</strong> Enroll Course, Submit Assignment, Grade Assessment, Track Progress
                  </div>
                  <div>
                    <strong>Compliance:</strong> GDPR, FERPA<br/>
                    <strong>Instructions:</strong> "Focus on learning outcomes, progress tracking, content delivery, and student privacy. Include scenarios for offline access, mobile devices, and accessibility requirements."
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Create and manage custom domains for more accurate feature generation
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              <User className="w-3 h-3 mr-1" />
              {myDomains.length} My Domains
            </Badge>
            <Badge variant="outline">
              <Globe className="w-3 h-3 mr-1" />
              {allDomains.length} Available Domains
            </Badge>
          </div>
        </div>
        <Dialog open={newDomainDialog} onOpenChange={setNewDomainDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Domain</DialogTitle>
              <DialogDescription>
                Create a new custom domain to improve feature generation accuracy for your specific business context.
              </DialogDescription>
            </DialogHeader>
            <CreateCustomDomainForm 
              onSuccess={() => setNewDomainDialog(false)}
              onCancel={() => setNewDomainDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* My Domains */}
        {myDomains.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              My Domains
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDomains.map((domain: CustomDomain) => (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {domain.isPublic ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                          <CardTitle className="text-lg">{domain.displayName}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDomain(domain)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDomain(domain.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="text-sm">
                        {domain.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          {domain.name}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(domain.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {domain.instructions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Available Public Domains */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Available Public Domains
          </h2>
          {allDomains.filter((d: CustomDomain) => d.isPublic && d.createdBy !== user.id).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDomains
                .filter((d: CustomDomain) => d.isPublic && d.createdBy !== user.id)
                .map((domain: CustomDomain) => (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <CardTitle className="text-lg">{domain.displayName}</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {domain.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs">
                            {domain.name}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Created {new Date(domain.createdAt).toLocaleDateString()}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {domain.instructions}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No public domains available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Domain Dialog */}
      <Dialog open={!!editingDomain} onOpenChange={() => setEditingDomain(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Custom Domain</DialogTitle>
              <DialogDescription>
                Update your custom domain settings and instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-4xl mx-auto">
              <Form {...editDomainForm}>
                <form onSubmit={editDomainForm.handleSubmit(onSubmitEditDomain)} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={editDomainForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Domain Key *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="healthcare-emr" 
                                className="focus:ring-2 focus:ring-blue-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editDomainForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Display Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Healthcare EMR System" 
                                className="focus:ring-2 focus:ring-blue-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editDomainForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this domain covers and its key characteristics..." 
                              rows={3}
                              className="focus:ring-2 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Domain Context Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Users className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Domain Context</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={editDomainForm.control}
                        name="primaryActors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Primary Actors *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Patient, Doctor, Nurse" 
                                className="focus:ring-2 focus:ring-blue-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editDomainForm.control}
                        name="businessUseCases"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Key Use Cases *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., Schedule Appointment, Record Vitals, Prescribe Medication" 
                                rows={3}
                                className="focus:ring-2 focus:ring-blue-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* AI Instructions Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">AI Instructions</h3>
                    </div>

                    <FormField
                      control={editDomainForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">AI Generation Instructions *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed instructions for how AI should generate feature files in this domain..." 
                              rows={8}
                              className="focus:ring-2 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Advanced Settings */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    </div>

                    <FormField
                      control={editDomainForm.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">Public Domain</FormLabel>
                            <div className="text-xs text-gray-600">
                              Allow other users to use this domain for feature generation
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" disabled={updateDomainMutation.isPending} className="flex-1">
                      {updateDomainMutation.isPending ? "Updating..." : "Update Domain"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingDomain(null)} className="px-8">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}