/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  MoreHorizontal,
  FolderOpen,
  Target,
  FileText,
  Edit,
  Trash2,
  Archive,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Users,
  Calendar,
  Search,
  SortAsc,
  Filter,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertEpicSchema, type Project, type Epic, type Feature } from "@shared/schema";
import { z } from "zod";

type InsertProject = z.infer<typeof insertProjectSchema>;
type InsertEpic = z.infer<typeof insertEpicSchema>;

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialogs and UI
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [newEpicDialog, setNewEpicDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  
  // Sorting and filtering state
  const [sortOption, setSortOption] = useState<"title" | "date" | "domain" | "complexity">("date");
  const [filterOption, setFilterOption] = useState<"all" | "unassigned">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data queries
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: epics = [] } = useQuery({
    queryKey: ["/api/epics"],
    enabled: !!user,
  });

  const { data: features = [] } = useQuery({
    queryKey: ["/api/features"],
    enabled: !!user,
  });

  // Forms
  const projectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  const epicForm = useForm<InsertEpic>({
    resolver: zodResolver(insertEpicSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      projectId: 0,
    },
  });

  const editProjectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editEpicForm = useForm<InsertEpic>({
    resolver: zodResolver(insertEpicSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await apiRequest("POST", "/api/projects", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
        duration: 3000,
      });
      setNewProjectDialog(false);
      projectForm.reset();
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

  const createEpicMutation = useMutation({
    mutationFn: async (data: InsertEpic) => {
      const res = await apiRequest("POST", "/api/epics", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create epic");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/epics"] });
      toast({
        title: "Success",
        description: "Epic created successfully",
        duration: 3000,
      });
      setNewEpicDialog(false);
      epicForm.reset();
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

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ featureId, epicId }: { featureId: number; epicId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/features/${featureId}`, { epicId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update feature");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
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

  const updateEpicMutation = useMutation({
    mutationFn: async ({ epicId, projectId }: { epicId: number; projectId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/epics/${epicId}`, { projectId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update epic");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/epics"] });
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

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: Partial<InsertProject> }) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingProject(null);
      toast({
        title: "Project Updated",
        description: "Project has been updated successfully.",
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

  const editEpicMutation = useMutation({
    mutationFn: async ({ epicId, data }: { epicId: number; data: Partial<InsertEpic> }) => {
      const res = await apiRequest("PATCH", `/api/epics/${epicId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update epic");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/epics"] });
      setEditingEpic(null);
      toast({
        title: "Epic Updated",
        description: "Epic has been updated successfully.",
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

  // Helper functions
  const toggleProjectExpansion = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectEpics = (projectId: number) => {
    return (epics as Epic[]).filter(epic => epic.projectId === projectId);
  };

  const getEpicFeatures = (epicId: number) => {
    return (features as Feature[]).filter(feature => feature.epicId === epicId);
  };

  const getUnassignedFeatures = () => {
    return (features as Feature[]).filter(feature => !feature.epicId);
  };

  const getUnassignedEpics = () => {
    return (epics as Epic[]).filter(epic => !epic.projectId);
  };

  // Sorting and filtering functions
  const getFilteredAndSortedFeatures = () => {
    let filteredFeatures = features as Feature[];

    // Apply search filter
    if (searchQuery) {
      filteredFeatures = filteredFeatures.filter(feature =>
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (feature.domain && feature.domain.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply filter option
    if (filterOption === "unassigned") {
      filteredFeatures = filteredFeatures.filter(feature => !feature.epicId);
    }

    // Apply sorting
    const sortedFeatures = [...filteredFeatures].sort((a, b) => {
      switch (sortOption) {
        case "title":
          return a.title.localeCompare(b.title);
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "domain":
          const domainA = a.domain || "";
          const domainB = b.domain || "";
          return domainA.localeCompare(domainB);
        case "complexity":
          const complexityA = a.analysisJson ? (() => {
            try {
              return JSON.parse(a.analysisJson).overallComplexity || 0;
            } catch {
              return 0;
            }
          })() : 0;
          const complexityB = b.analysisJson ? (() => {
            try {
              return JSON.parse(b.analysisJson).overallComplexity || 0;
            } catch {
              return 0;
            }
          })() : 0;
          return complexityB - complexityA;
        default:
          return 0;
      }
    });

    return sortedFeatures;
  };

  const calculateProjectComplexity = (projectId: number) => {
    const projectEpics = getProjectEpics(projectId);
    let totalComplexity = 0;
    let featureCount = 0;

    projectEpics.forEach(epic => {
      const epicFeatures = getEpicFeatures(epic.id);
      epicFeatures.forEach(feature => {
        if (feature.analysisJson) {
          try {
            const analysis = JSON.parse(feature.analysisJson);
            totalComplexity += analysis.overallComplexity || 0;
            featureCount++;
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
    });

    return featureCount > 0 ? Math.round(totalComplexity / featureCount) : 0;
  };

  const calculateEpicComplexity = (epicId: number) => {
    const epicFeatures = getEpicFeatures(epicId);
    let totalComplexity = 0;
    let featureCount = 0;

    epicFeatures.forEach(feature => {
      if (feature.analysisJson) {
        try {
          const analysis = JSON.parse(feature.analysisJson);
          totalComplexity += analysis.overallComplexity || 0;
          featureCount++;
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    return featureCount > 0 ? Math.round(totalComplexity / featureCount) : 0;
  };

  // Submit handlers
  const onSubmitProject = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  const onSubmitEpic = (data: InsertEpic) => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project for this epic",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    createEpicMutation.mutate({ ...data, projectId: selectedProjectId });
  };

  const onSubmitEditProject = (data: InsertProject) => {
    if (!editingProject) return;
    updateProjectMutation.mutate({ projectId: editingProject.id, data });
  };

  const onSubmitEditEpic = (data: InsertEpic) => {
    if (!editingEpic) return;
    editEpicMutation.mutate({ epicId: editingEpic.id, data });
  };

  // Reset forms when editing items change
  useEffect(() => {
    if (editingProject) {
      editProjectForm.reset({
        name: editingProject.name,
        description: editingProject.description || undefined,
      });
    }
  }, [editingProject, editProjectForm]);

  useEffect(() => {
    if (editingEpic) {
      editEpicForm.reset({
        name: editingEpic.name,
        description: editingEpic.description || undefined,
        status: editingEpic.status as "active" | "on-hold" | "completed" | "cancelled",
      });
    }
  }, [editingEpic, editEpicForm]);

  // Drag and drop handler
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (type === 'feature') {
      // Moving features between epics
      const featureId = parseInt(draggableId);
      let newEpicId: number | null = null;

      if (destination.droppableId.startsWith('epic-')) {
        newEpicId = parseInt(destination.droppableId.replace('epic-', ''));
      } else if (destination.droppableId === 'unassigned-features') {
        newEpicId = null;
      }

      updateFeatureMutation.mutate({ featureId, epicId: newEpicId });
    } else if (type === 'epic') {
      // Moving epics between projects
      const epicId = parseInt(draggableId);
      let newProjectId: number | null = null;

      if (destination.droppableId.startsWith('project-')) {
        newProjectId = parseInt(destination.droppableId.replace('project-', ''));
      } else if (destination.droppableId === 'unassigned-epics') {
        newProjectId = null;
      }

      updateEpicMutation.mutate({ epicId, projectId: newProjectId });
    }
  };

  if (!user) {
    return <div>Please log in to view projects.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
          <p className="text-muted-foreground">
            Organize your features into epics and projects with drag-and-drop
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              <FileText className="w-3 h-3 mr-1" />
              {(features as Feature[]).length} Total Features
            </Badge>
            <Badge variant="outline">
              <Target className="w-3 h-3 mr-1" />
              {(epics as Epic[]).length} Epics
            </Badge>
            <Badge variant="outline">
              <FolderOpen className="w-3 h-3 mr-1" />
              {(projects as Project[]).length} Projects
            </Badge>
            {getFilteredAndSortedFeatures().filter(f => !f.epicId).length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {getFilteredAndSortedFeatures().filter(f => !f.epicId).length} Unassigned
              </Badge>
            )}
          </div>
        </div>
        <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your epics and features.
              </DialogDescription>
            </DialogHeader>
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-4">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter project description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewProjectDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {/* Projects with their epics and features */}
          {(projects as Project[]).map((project) => (
            <Card key={project.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Collapsible 
                    open={expandedProjects.has(project.id)} 
                    onOpenChange={() => toggleProjectExpansion(project.id)}
                    className="flex-1"
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md transition-colors">
                      {expandedProjects.has(project.id) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                    </CollapsibleTrigger>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                      className="ml-auto"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <CollapsibleContent className="mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            <Target className="w-3 h-3 mr-1" />
                            {getProjectEpics(project.id).length} Epics
                          </Badge>
                          <Badge variant="secondary">
                            <FileText className="w-3 h-3 mr-1" />
                            {getProjectEpics(project.id).reduce((total, epic) => total + getEpicFeatures(epic.id).length, 0)} Features
                          </Badge>
                          <Badge variant="outline">
                            Complexity: {calculateProjectComplexity(project.id)}/10
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setNewEpicDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Epic
                        </Button>
                      </div>

                      <Droppable droppableId={`project-${project.id}`} type="epic">
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-4 min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                              snapshot.isDraggingOver ? 'border-primary bg-primary/10' : 'border-muted'
                            }`}
                          >
                            {getProjectEpics(project.id).map((epic, index) => (
                              <Draggable key={epic.id} draggableId={epic.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                  >
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-2">
                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                          <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </div>
                                        <Target className="w-4 h-4 text-green-600" />
                                        <div className="flex-1">
                                          <CardTitle className="text-lg">{epic.name}</CardTitle>
                                          <CardDescription>{epic.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary">
                                            {getEpicFeatures(epic.id).length} Features
                                          </Badge>
                                          <Badge variant="outline">
                                            Complexity: {calculateEpicComplexity(epic.id)}/10
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingEpic(epic);
                                            }}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <Droppable droppableId={`epic-${epic.id}`} type="feature">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`space-y-2 min-h-[60px] p-3 rounded-md border border-dashed transition-colors ${
                                              snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-muted'
                                            }`}
                                          >
                                            {getEpicFeatures(epic.id).map((feature, featureIndex) => (
                                              <Draggable 
                                                key={feature.id} 
                                                draggableId={feature.id.toString()} 
                                                index={featureIndex}
                                              >
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`p-3 bg-card border rounded-md cursor-grab transition-shadow ${
                                                      snapshot.isDragging ? 'shadow-md' : ''
                                                    }`}
                                                  >
                                                    <div className="space-y-2">
                                                      <div className="flex items-center justify-between">
                                                        <TooltipProvider>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <span className="font-medium truncate">{feature.title}</span>
                                                              </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-sm">
                                                              <div className="space-y-2">
                                                                <p className="font-semibold">{feature.title}</p>
                                                                <p className="text-sm">{feature.story}</p>
                                                                {feature.domain && (
                                                                  <p className="text-xs text-muted-foreground">Domain: {feature.domain}</p>
                                                                )}
                                                              </div>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                        <span className="text-xs text-muted-foreground">
                                                          {new Date(feature.createdAt).toLocaleDateString()}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        {feature.domain && (
                                                          <Badge variant="outline" className="text-xs">
                                                            {feature.domain}
                                                          </Badge>
                                                        )}
                                                        <Badge variant={feature.analysisJson ? "secondary" : "outline"} className="text-xs">
                                                          {(() => {
                                                            if (!feature.analysisJson) return "Not Analyzed";
                                                            try {
                                                              const analysis = JSON.parse(feature.analysisJson);
                                                              return `${analysis.overallComplexity || 0}/10`;
                                                            } catch {
                                                              return "Analysis Error";
                                                            }
                                                          })()}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {getEpicFeatures(epic.id).length === 0 && (
                                              <div className="text-center text-muted-foreground py-4">
                                                Drop features here or create them on the Home page
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </Droppable>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {getProjectEpics(project.id).length === 0 && (
                              <div className="text-center text-muted-foreground py-8">
                                No epics yet. Create your first epic above or drag epics here from unassigned.
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardHeader>
            </Card>
          ))}

          {/* Unassigned Epics */}
          {getUnassignedEpics().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-orange-600" />
                  Unassigned Epics
                </CardTitle>
                <CardDescription>
                  Epics that haven't been assigned to a project yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="unassigned-epics" type="epic">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-4 min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                    >
                      {getUnassignedEpics().map((epic, index) => (
                        <Draggable key={epic.id} draggableId={epic.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                    <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                  </div>
                                  <Target className="w-4 h-4 text-orange-600" />
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{epic.name}</CardTitle>
                                    <CardDescription>{epic.description}</CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {getEpicFeatures(epic.id).length} Features
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEpic(epic);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Features */}
          {getFilteredAndSortedFeatures().filter(f => !f.epicId).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      Unassigned Features
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredAndSortedFeatures().filter(f => !f.epicId).length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Features that haven't been assigned to an epic yet
                    </CardDescription>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={filterOption} onValueChange={(value: "all" | "unassigned") => setFilterOption(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Features</SelectItem>
                        <SelectItem value="unassigned">Unassigned Only</SelectItem>
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
                        <DropdownMenuItem onClick={() => setSortOption("complexity")}>
                          Sort by Complexity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="unassigned-features" type="feature">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                    >
                      {getFilteredAndSortedFeatures().filter(f => !f.epicId).map((feature, index) => (
                        <Draggable 
                          key={feature.id} 
                          draggableId={feature.id.toString()} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-card border rounded-md cursor-grab transition-shadow ${
                                snapshot.isDragging ? 'shadow-md' : ''
                              }`}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-yellow-600" />
                                        <span className="font-medium text-sm truncate">{feature.title}</span>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm">
                                    <div className="space-y-2">
                                      <p className="font-semibold">{feature.title}</p>
                                      <p className="text-sm">{feature.story}</p>
                                      {feature.domain && (
                                        <p className="text-xs text-muted-foreground">Domain: {feature.domain}</p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {feature.story}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {feature.domain && (
                                    <Badge variant="outline" className="text-xs">
                                      {feature.domain}
                                    </Badge>
                                  )}
                                  <Badge variant={feature.analysisJson ? "secondary" : "outline"} className="text-xs">
                                    {(() => {
                                      if (!feature.analysisJson) return "Not Analyzed";
                                      try {
                                        const analysis = JSON.parse(feature.analysisJson);
                                        return `${analysis.overallComplexity || 0}/10`;
                                      } catch {
                                        return "Analysis Error";
                                      }
                                    })()}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(feature.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          )}
        </div>
      </DragDropContext>

      {/* Create Epic Dialog */}
      <Dialog open={newEpicDialog} onOpenChange={setNewEpicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Epic</DialogTitle>
            <DialogDescription>
              Create a new epic for {selectedProjectId && (projects as Project[]).find(p => p.id === selectedProjectId)?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...epicForm}>
            <form onSubmit={epicForm.handleSubmit(onSubmitEpic)} className="space-y-4">
              <FormField
                control={epicForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Epic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter epic name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={epicForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter epic description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewEpicDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEpicMutation.isPending}>
                  {createEpicMutation.isPending ? "Creating..." : "Create Epic"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project name and description.
            </DialogDescription>
          </DialogHeader>
          <Form {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(onSubmitEditProject)} className="space-y-4">
              <FormField
                control={editProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter project description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Epic Dialog */}
      <Dialog open={!!editingEpic} onOpenChange={() => setEditingEpic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Epic</DialogTitle>
            <DialogDescription>
              Update the epic name and description.
            </DialogDescription>
          </DialogHeader>
          <Form {...editEpicForm}>
            <form onSubmit={editEpicForm.handleSubmit(onSubmitEditEpic)} className="space-y-4">
              <FormField
                control={editEpicForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Epic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter epic name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editEpicForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter epic description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingEpic(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editEpicMutation.isPending}>
                  {editEpicMutation.isPending ? "Updating..." : "Update Epic"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}