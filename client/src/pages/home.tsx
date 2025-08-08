/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight, Download, Loader2, X, Lightbulb, Trash2, Eye, Edit3, Clock, Calendar, User, Building2, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { insertFeatureSchema, type InsertFeature, type Feature, type SortOption, updateFeatureSchema } from "@shared/schema";
import * as z from 'zod';
import { useCheckDuplicateTitle } from "@/hooks/use-check-duplicate-title";
import { CucumberGuide } from "@/components/ui/cucumber-guide";
import { ScenarioComplexity } from "@/components/ui/scenario-complexity";
import { ComplexityInsights } from "@/components/ui/complexity-insights";
import { TeamConfig, TeamContextSummary, type TeamContext } from "@/components/ui/team-config";
import { ComplexityAnalysisLoader } from "@/components/ui/complexity-analysis-loader";
import { FeatureLifecyclePanel } from "@/components/feature-lifecycle-panel";
import { FeatureGenerationLoader } from "@/components/ui/feature-generation-loader";


import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/role-badge";

import { DOMAIN_VALUES, Domain } from "@shared/schema";

// Import SVG as URL
const FeatureGenLogo = "/src/assets/featuregen_logo.svg";

const domainLabels: Record<string, string> = {
  ai: "AI",
  biotech: "Biotech",
  crypto: "Crypto",
  ecommerce: "E-Commerce",
  finance: "Finance",
  generic: "Generic",
  healthcare: "Healthcare",
  infrastructure: "Infrastructure",
  insurance: "Insurance",
  performance: "Performance",
  rag: "RAG",
  salesforce: "Salesforce",
  security: "Security"
};

type FeatureFilter = "all" | "active" | "deleted";

function countScenariosInContent(content: string): number {
  // Count all scenario lines (both "Scenario:" and "Scenario Outline:")
  const scenarioMatches = content.match(/^\s*(Scenario|Scenario Outline):/gm);
  return scenarioMatches ? scenarioMatches.length : 0;
}

async function downloadFeature(feature: Feature) {
  try {
    const response = await fetch(`/api/features/export/${feature.id}`);
    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${feature.title.toLowerCase().replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

export default function Home() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isContentEdited, setIsContentEdited] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterOption, setFilterOption] = useState<FeatureFilter>("active");
  const [showGuide, setShowGuide] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [showInlineComplexityAnalysis, setShowInlineComplexityAnalysis] = useState(false);
  const [inlineComplexityFeatureId, setInlineComplexityFeatureId] = useState<number | null>(null);


  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const form = useForm<InsertFeature>({
    resolver: zodResolver(insertFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 1,
    },
    mode: "onChange",
  });

  const title = form.watch("title");
  const { isDuplicate, isChecking } = useCheckDuplicateTitle(title);

  // Check for template data and pre-fill form
  useEffect(() => {
    const templateData = localStorage.getItem('templateData');
    if (templateData) {
      try {
        const data = JSON.parse(templateData);
        form.reset({
          title: data.title || "",
          story: data.story || "",
          scenarioCount: data.scenarioCount || 1,
          domain: data.domain || undefined,
          epicId: data.epicId || undefined,
        });
        // Clear template data after using it
        localStorage.removeItem('templateData');
        
        toast({
          title: "Template Loaded",
          description: "Form has been pre-filled with template data. You can modify it before generating.",
        });
      } catch (error) {
        console.error('Error parsing template data:', error);
        localStorage.removeItem('templateData');
      }
    }
  }, [form, toast]);

  useEffect(() => {
    if (isDuplicate) {
      form.setError("title", {
        type: "manual",
        message: "A feature with this title already exists. Please use a different title."
      });
    } else {
      form.clearErrors("title");
    }
  }, [isDuplicate, form]);

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["/api/features", filterOption],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterOption === "all" || filterOption === "deleted") {
        params.append("includeDeleted", "true");
      }
      const res = await apiRequest("GET", `/api/features?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch features");
      }
      return res.json();
    },
  });



  const filteredAndSortedFeatures = useMemo(() => {
    // First filter by date to only show features from April 23rd onwards
    let filtered = features.filter(f => new Date(f.createdAt) >= new Date('2025-04-23'));
    
    // Then apply deleted/active filtering
    if (filterOption === 'deleted') {
      filtered = filtered.filter(f => f.deleted);
    } else if (filterOption === 'active') {
      filtered = filtered.filter(f => !f.deleted);
    }

    if (searchQuery) {
      filtered = filtered.filter(feature =>
        feature.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
    if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortOption === "domain") {
        return (a.domain || "").localeCompare(b.domain || "");
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [features, searchQuery, sortOption, filterOption]);

  const generateMutation = useMutation({
    mutationFn: async (data: InsertFeature) => {
      setIsGenerating(true);
      setGenerationStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setGenerationStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await apiRequest("POST", "/api/features/generate", data);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setGenerationStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      return res.json();
    },
    onSuccess: (data) => {
      setCurrentFeature(data);
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      form.reset({
        title: "",
        story: "",
        scenarioCount: 1,
        domain: undefined,
        epicId: undefined,
      });
      setFormResetKey(prev => prev + 1);
      toast({
        title: "Success",
        description: "Feature generated successfully",
        duration: 3000,
      });
      setIsGenerating(false);
      setGenerationStep(0);
    },
    onError: (error) => {
      toast({
        title: "Cannot Generate Feature",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
      setIsGenerating(false);
      setGenerationStep(0);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<InsertFeature & { generatedContent?: string }>) => {
      const res = await apiRequest(
        "PATCH",
        `/api/features/${data.id}`,
        {
          title: data.title,
          story: data.story,
          scenarioCount: data.scenarioCount,
          generatedContent: data.generatedContent,
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      
      // Check if this was a regeneration using the pending ID
      const wasRegenerated = pendingRegenerationFeatureId === data.id;
      console.log('Edit success - wasRegenerated:', wasRegenerated, 'data.id:', data.id, 'pendingId:', pendingRegenerationFeatureId);
      
      setEditingFeature(null);
      setIsContentEdited(false);
      
      // Auto-show inline complexity analysis if content was regenerated
      if (wasRegenerated && data.id) {
        console.log('Auto-showing inline complexity analysis for feature:', data.id);
        console.log('Setting inline analysis state: featureId =', data.id, 'show =', true);
        setInlineComplexityFeatureId(data.id);
        setShowInlineComplexityAnalysis(true);
        // Clear currentFeature to avoid showing analysis twice
        setCurrentFeature(null);
        
        // Scroll to the inline analysis section
        setTimeout(() => {
          const analysisElement = document.getElementById('inline-complexity-analysis');
          if (analysisElement) {
            analysisElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      
      // Clear pending regeneration ID
      setPendingRegenerationFeatureId(null);
      
      toast({
        title: "Success",
        description: wasRegenerated ? "Feature regenerated successfully" : "Feature updated successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Cannot Update Feature",
        description: error.message,
        duration: 5000,
      });
    },
  });

      const archiveMutation = useMutation({
        mutationFn: async (id: number) => {
          const res = await apiRequest("POST", `/api/features/${id}/archive`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Clear the current feature if it's the one that was just archived
      if (currentFeature && currentFeature.id === data.id) {
        setCurrentFeature(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Success",
        description: "Feature has been archived",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/features/${id}/restore`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Success",
        description: "Feature restored successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const editForm = useForm<InsertFeature & { generatedContent: string }>({
    resolver: zodResolver(updateFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 2,
      generatedContent: "",
    },
  });

  useEffect(() => {
    if (editingFeature) {
      editForm.reset({
        title: editingFeature.title,
        story: editingFeature.story,
        scenarioCount: editingFeature.scenarioCount,
        generatedContent: editingFeature.generatedContent || "",

      });
      setIsContentEdited(editingFeature.manuallyEdited || false);
    }
  }, [editingFeature, editForm]);

  const onSubmit = (data: InsertFeature) => {
    if (!data.domain) {
      form.setError("domain", {
        type: "manual",
        message: "Please select a domain"
      });
      return;
    }
    generateMutation.mutate(data);
  };

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [pendingRegenerationFeatureId, setPendingRegenerationFeatureId] = useState<number | null>(null);

  const onEdit = async (data: InsertFeature & { generatedContent: string }) => {
    if (!editingFeature || isRegenerating || editMutation.isPending) return;
    
    // Check if scenario count has changed
    const scenarioCountChanged = data.scenarioCount !== editingFeature.scenarioCount;
    
    if (scenarioCountChanged) {
      try {
        setIsRegenerating(true);
        setPendingRegenerationFeatureId(editingFeature.id);
        
        // Regenerate feature content with new scenario count
        const res = await apiRequest("POST", `/api/features/${editingFeature.id}/regenerate`, {
          title: data.title,
          story: data.story,
          scenarioCount: data.scenarioCount,
          domain: data.domain || editingFeature.domain,
        });
        
        if (res.ok) {
          const generatedData = await res.json();
          // Update with regenerated content
          editMutation.mutate({ 
            id: editingFeature.id, 
            ...data, 
            generatedContent: generatedData.generatedContent 
          });
        } else {
          // If regeneration fails, proceed with current content
          editMutation.mutate({ id: editingFeature.id, ...data });
          setPendingRegenerationFeatureId(null);
        }
      } catch (error) {
        // If regeneration fails, proceed with current content
        editMutation.mutate({ id: editingFeature.id, ...data });
        setPendingRegenerationFeatureId(null);
      } finally {
        setIsRegenerating(false);
      }
    } else {
      // No scenario count change, proceed normally
      editMutation.mutate({ id: editingFeature.id, ...data });
    }
  };


  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 py-8"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center relative">
            <img 
              src={FeatureGenLogo} 
              alt="Feature Generator AI" 
              className="h-48 w-auto"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full absolute left-1/2 transform translate-x-40"
                    onClick={() => setShowGuide(true)}
                  >
                    <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  Learn BDD with Cucumber
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generate New Feature</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  form.reset({
                    title: "",
                    story: "",
                    scenarioCount: 1,
                    domain: undefined,
                    epicId: undefined,
                  });
                  setFormResetKey(prev => prev + 1);
                }}
                className="text-xs"
              >
                Clear Form
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter feature title"
                            {...field}
                            className={`${isDuplicate ? "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500" : ""}`}
                          />
                          {isChecking && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <LoadingSpinner />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <div className={`${isDuplicate ? "text-red-500 dark:text-red-500" : ""}`}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Story</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter feature story"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Domain selection */}
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <Select
                        key={formResetKey}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOMAIN_VALUES.map((domain) => (
                            <SelectItem key={domain} value={domain}>
                              {domainLabels[domain] ?? domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scenarioCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Scenarios</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString() ?? "1"} // ← Fixes the crash
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner />
                      Generating...
                    </span>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Feature
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {currentFeature && (
          <motion.div
            data-selected-feature="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentFeature.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Story</h4>
                  <p className="text-sm text-muted-foreground">{currentFeature.story}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Generated Content</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                    {currentFeature.generatedContent}
                  </pre>
                </div>
                <div className="mt-6 border-t pt-6">
                  <ComplexityAnalysis featureId={currentFeature.id} autoAnalyze={false} feature={currentFeature} permissions={permissions} />
                </div>
                
                {/* Feature Lifecycle Panel Hidden */}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showInlineComplexityAnalysis && inlineComplexityFeatureId && (
          <motion.div
            id="inline-complexity-analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Regenerated Feature Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Updated complexity analysis for the regenerated feature
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const feature = features?.find(f => f.id === inlineComplexityFeatureId);
                  if (!feature || !inlineComplexityFeatureId) return null;
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Feature Title</h4>
                          <p className="text-sm font-medium">{feature.title}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Story</h4>
                          <p className="text-sm text-muted-foreground">{feature.story}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Generated Content</h4>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                          {feature.generatedContent}
                        </pre>
                      </div>
                      <div className="mt-6 border-t pt-6">
                        <ComplexityAnalysis 
                          featureId={inlineComplexityFeatureId}
                          autoAnalyze={false}
                          feature={feature}
                          permissions={permissions}
                        />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {filterOption === 'deleted' ? 'Archived Features' : 'Generated Features'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredAndSortedFeatures.length} feature{filteredAndSortedFeatures.length !== 1 ? 's' : ''} found
                </p>
              </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select
                value={filterOption}
                onValueChange={(value: FeatureFilter) => setFilterOption(value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="active">Active Features</SelectItem>
                  <SelectItem value="deleted">Archived Features</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOption("title")}>
                    Sort by Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("date")}>
                    Sort by Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("domain")}>
                    Sort by Domain
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredAndSortedFeatures.map((feature: Feature) => (
                  <motion.div
                    key={feature.id}
                    data-feature-id={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      currentFeature?.id === feature.id || inlineComplexityFeatureId === feature.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setCurrentFeature(feature);
                      // Clear inline analysis when clicking on a feature card
                      setShowInlineComplexityAnalysis(false);
                      setInlineComplexityFeatureId(null);
                      
                      // Scroll to show the selected feature
                      setTimeout(() => {
                        const selectedFeatureElement = document.querySelector('[data-selected-feature="true"]');
                        if (selectedFeatureElement) {
                          selectedFeatureElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <h3 className="text-lg font-semibold line-clamp-2 break-words pr-2">
                                {feature.title}
                              </h3>
                              {feature.domain && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  Domain: {feature.domain}
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{feature.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {feature.story}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-sm">{feature.story}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(feature.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (permissions?.hasPermission('canDeleteFeatures')) {
                                    feature.deleted
                                      ? restoreMutation.mutate(feature.id)
                                      : archiveMutation.mutate(feature.id);
                                  }
                                }}
                              >
                                {feature.deleted ? (
                                  <RefreshCw className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {feature.deleted ? "Restore Feature" : "Archive Feature"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFeature(feature);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Edit Feature
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFeature(feature);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Export Feature
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredAndSortedFeatures.length === 0 && (
                <div className="text-center text-muted-foreground col-span-full">
                  {searchQuery ? "No features found matching your search." : "No features generated yet. Try generating one above!"}
                </div>
              )}
            </div>
          </CardContent>
          </Card>

        <Dialog open={editingFeature !== null} onOpenChange={(open) => !open && setEditingFeature(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter feature title"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            const currentContent = editForm.getValues("generatedContent");
                            if (currentContent) {
                              const updatedContent = updateFeatureContent(currentContent, e.target.value);
                              editForm.setValue("generatedContent", updatedContent);
                              setIsContentEdited(true);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Story</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter feature story"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="scenarioCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Scenarios</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value, 10));
                          setIsContentEdited(true);
                        }}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of scenarios" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={editForm.control}
                  name="generatedContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter Gherkin feature content"
                          className="min-h-[300px] font-mono"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setIsContentEdited(true);
                            
                            // Auto-update scenario count based on content
                            const actualScenarioCount = countScenariosInContent(e.target.value);
                            if (actualScenarioCount > 0) {
                              editForm.setValue("scenarioCount", actualScenarioCount);
                            }
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isContentEdited
                          ? "This feature has been manually edited - scenario count auto-updated"
                          : "Edit the content directly to customize scenarios and steps"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingFeature(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending || isRegenerating}
                  >
                    {isRegenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        Regenerating...
                      </span>
                    ) : editMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        Updating...
                      </span>
                    ) : (
                      "Update Feature"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isGenerating} onOpenChange={(open) => !open && setIsGenerating(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generating Feature</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Please wait while we generate your feature content...
              </p>
            </DialogHeader>
            <div className="py-6">
              <FeatureGenerationLoader currentStep={generationStep} />
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Learn BDD with Cucumber</DialogTitle>
            </DialogHeader>
            <CucumberGuide />
          </DialogContent>
        </Dialog>
        

      </motion.div>
    </div>
  );
}

function updateFeatureContent(content: string, newTitle: string): string {
  const featureTag = `@${newTitle
    .split(/\s+/)
    .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}`;

  let updatedContent = content
    .replace(/@[\w]+\n/, `${featureTag}\n`)
    .replace(/Feature:.*\n/, `Feature: ${newTitle}\n`);

  return updatedContent;
}

function adjustScenarioCount(content: string, targetCount: number): string {
  const lines = content.split('\n');
  const scenarioIndices: number[] = [];
  
  // Find all scenario lines
  lines.forEach((line, index) => {
    if (line.trim().match(/^(Scenario:|Scenario Outline:)/)) {
      scenarioIndices.push(index);
    }
  });
  
  const currentCount = scenarioIndices.length;
  
  if (currentCount === targetCount) {
    return content; // No change needed
  }
  
  if (currentCount > targetCount) {
    // Remove excess scenarios - keep first targetCount scenarios
    const keepScenarios = scenarioIndices.slice(0, targetCount);
    const lastKeepIndex = keepScenarios[keepScenarios.length - 1];
    
    // Find the end of the last scenario to keep
    let endIndex = lines.length;
    if (targetCount < scenarioIndices.length) {
      endIndex = scenarioIndices[targetCount];
    }
    
    // Keep lines up to the end of the last scenario we want to keep
    const keptLines: string[] = [];
    let inScenarioToKeep = false;
    
    for (let i = 0; i <= lastKeepIndex; i++) {
      keptLines.push(lines[i]);
    }
    
    // Add any remaining lines that belong to the last kept scenario
    for (let i = lastKeepIndex + 1; i < endIndex; i++) {
      const line = lines[i];
      if (line.trim().match(/^(Scenario:|Scenario Outline:)/)) {
        break; // Stop at next scenario
      }
      keptLines.push(line);
    }
    
    return keptLines.join('\n');
  } else {
    // Need to add more scenarios - duplicate the last scenario
    if (scenarioIndices.length === 0) {
      return content; // No scenarios to duplicate
    }
    
    const lastScenarioIndex = scenarioIndices[scenarioIndices.length - 1];
    const scenarioLines: string[] = [];
    
    // Extract the last scenario
    for (let i = lastScenarioIndex; i < lines.length; i++) {
      const line = lines[i];
      scenarioLines.push(line);
      
      // Stop at next scenario or end of file
      if (i > lastScenarioIndex && line.trim().match(/^(Scenario:|Scenario Outline:)/)) {
        scenarioLines.pop(); // Remove the next scenario line
        break;
      }
    }
    
    // Create new scenarios by duplicating and modifying the last one
    const additionalScenarios: string[] = [];
    const scenariosToAdd = targetCount - currentCount;
    
    // Common scenario variations to make them more meaningful
    const scenarioVariations = [
      'with error handling',
      'under high load',
      'with timeout conditions',
      'in production environment',
      'with authentication',
      'with data validation',
      'during peak hours',
      'with retry logic',
      'in secure mode',
      'with monitoring enabled'
    ];
    
    for (let i = 0; i < scenariosToAdd; i++) {
      const variation = scenarioVariations[i % scenarioVariations.length];
      const duplicatedScenario = scenarioLines.map((line, lineIndex) => {
        if (lineIndex === 0 && line.trim().match(/^(Scenario:|Scenario Outline:)/)) {
          // Modify scenario name to make it unique and meaningful
          const scenarioType = line.trim().startsWith('Scenario Outline:') ? 'Scenario Outline:' : 'Scenario:';
          const originalName = line.replace(/^\s*(Scenario:|Scenario Outline:)\s*/, '');
          return `  ${scenarioType} ${originalName} ${variation}`;
        }
        return line;
      });
      
      additionalScenarios.push(...duplicatedScenario);
      if (i < scenariosToAdd - 1) {
        additionalScenarios.push(''); // Add blank line between scenarios
      }
    }
    
    return content + '\n\n' + additionalScenarios.join('\n');
  }
}

// Global analysis singleton to prevent multiple simultaneous analyses across all components
class AnalysisManager {
  private static instance: AnalysisManager;
  private isRunning = false;
  private currentFeatureId: number | null = null;

  static getInstance() {
    if (!AnalysisManager.instance) {
      AnalysisManager.instance = new AnalysisManager();
    }
    return AnalysisManager.instance;
  }

  canStart(featureId: number): boolean {
    return !this.isRunning;
  }

  start(featureId: number): boolean {
    if (this.isRunning) return false;
    this.isRunning = true;
    this.currentFeatureId = featureId;
    return true;
  }

  finish() {
    this.isRunning = false;
    this.currentFeatureId = null;
  }

  isAnalyzing(): boolean {
    return this.isRunning;
  }
}

const analysisManager = AnalysisManager.getInstance();

function ComplexityAnalysis({ featureId, autoAnalyze = false, feature, permissions }: { featureId: number, autoAnalyze?: boolean, feature?: Feature, permissions?: any }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [teamContext, setTeamContext] = useState<TeamContext>(() => {
    try {
      const stored = localStorage.getItem('cucumber-team-config');
      if (stored) {
        const config = JSON.parse(stored);
        // Check if this is old config with non-zero defaults and reset it
        const hasOldDefaults = config.velocity === 6 || config.juniorDevs === 1 || config.seniorDevs === 4;
        if (hasOldDefaults) {
          localStorage.removeItem('cucumber-team-config');
          return {};
        }
        return config;
      }
      return {};
    } catch {
      return {};
    }
  });
  
  // Use passed feature or fetch features if not provided
  const { data: features } = useQuery<Feature[]>({
    queryKey: ['/api/features'],
    enabled: !feature
  });
  
  const currentFeature = feature || features?.find((f) => f.id === featureId);
  const storedAnalysis = currentFeature?.analysisJson ? JSON.parse(currentFeature.analysisJson) : null;
  
  const { data: complexity, isLoading, refetch } = useQuery({
    queryKey: ['/api/features/complexity', featureId, refreshKey],
    queryFn: async () => {
      const res = await apiRequest(
        'POST',
        `/api/features/${featureId}/complexity`
      );
      if (!res.ok) {
        throw new Error('Failed to analyze complexity');
      }
      const data = await res.json();
      console.log('Complexity data received:', data);
      if (data.scenarios && data.scenarios[0]) {
        console.log('First scenario factors:', data.scenarios[0].factors);
      }
      setHasAnalyzed(true);
      return data;
    },
    staleTime: 0,
    enabled: false,
    retry: false
  });
  
  // Use stored analysis if available, otherwise use fresh analysis
  const analysisData = complexity || storedAnalysis;

  const handleTeamConfigSave = (config: TeamContext) => {
    setTeamContext(config);
    localStorage.setItem('cucumber-team-config', JSON.stringify(config));
  };



  if (!hasAnalyzed && !storedAnalysis) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click below to analyze the complexity of this feature's scenarios
            </p>
            <Button 
              onClick={() => {
                if (analysisManager.canStart(featureId) && !isLoading) {
                  if (analysisManager.start(featureId)) {
                    setHasAnalyzed(true);
                    refetch().finally(() => analysisManager.finish());
                  }
                }
              }}
              className="flex items-center gap-2"
              disabled={isLoading || analysisManager.isAnalyzing()}
            >
              <Activity className="h-4 w-4" />
              Analyze Complexity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <>
        <ComplexityAnalysisLoader isOpen={true} />
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Complexity analysis in progress...</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!analysisData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Development Planning Insights
        </h4>
        <div className="flex items-center gap-2">
          {permissions?.hasPermission('canConfigureTeam') && (
            <TeamConfig teamContext={teamContext} onSave={handleTeamConfigSave} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (analysisManager.canStart(featureId) && !isLoading) {
                if (analysisManager.start(featureId)) {
                  setRefreshKey(key => key + 1);
                  setTimeout(() => {
                    refetch().finally(() => analysisManager.finish());
                  }, 100);
                }
              }
            }}
            disabled={isLoading || analysisManager.isAnalyzing()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Analysis
              </div>
            )}
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <TeamContextSummary teamContext={teamContext} />
      </div>
      
      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
        <p className="text-xs text-blue-800 dark:text-blue-400 flex items-start gap-2">
          <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>These insights translate complexity scores into actionable development recommendations for sprint planning and team assignment.</span>
        </p>
      </div>

      <ComplexityInsights 
        overallComplexity={analysisData.overallComplexity}
        scenarios={analysisData.scenarios}
        teamContext={teamContext}
      />
      
      {/* Detailed Scenario Breakdown - Collapsible */}
      <div className="space-y-4">
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            View Detailed Scenario Analysis
          </summary>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysisData.scenarios.map((scenario: {
              name: string;
              complexity: number;
              factors: {
                stepCount: number;
                dataDependencies: number;
                conditionalLogic: number;
                technicalDifficulty: number;
              };
              explanation: string;
            }) => (
              <ScenarioComplexity
                key={scenario.name}
                name={scenario.name}
                complexity={scenario.complexity}
                factors={scenario.factors}
                explanation={scenario.explanation}
              />
            ))}
          </div>
        </details>
      </div>

      {analysisData.recommendations && analysisData.recommendations.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">AI Recommendations</h5>
          <ul className="space-y-2">
            {analysisData.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowRight className="h-4 w-4 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}