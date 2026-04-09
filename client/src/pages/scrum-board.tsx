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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRightCircle, 
  CheckCircle2, 
  ClipboardList, 
  ListTodo, 
  Activity,
  LayoutDashboard,
  Clock,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Feature } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const columns = [
  { 
    id: "backlog", 
    title: "Backlog", 
    icon: <ClipboardList className="h-5 w-5" />,
    color: "bg-slate-100 dark:bg-slate-900",
    description: "Features waiting to be prioritized"
  },
  { 
    id: "todo", 
    title: "To Do", 
    icon: <ListTodo className="h-5 w-5" />,
    color: "bg-blue-50 dark:bg-blue-950",
    description: "Ready to be worked on" 
  },
  { 
    id: "inProgress", 
    title: "In Progress", 
    icon: <Activity className="h-5 w-5" />,
    color: "bg-amber-50 dark:bg-amber-950",
    description: "Currently being implemented"
  },
  { 
    id: "done", 
    title: "Done", 
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "bg-green-50 dark:bg-green-950",
    description: "Completed features"
  }
];

export default function ScrumBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<{ [key: string]: Feature[] }>({
    backlog: [],
    todo: [],
    inProgress: [],
    done: []
  });
  const [isDragging, setIsDragging] = useState(false);

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/features");
      if (!res.ok) throw new Error("Failed to fetch features");
      const data = await res.json();
      return data.filter((f: Feature) => !f.deleted);
    }
  });
  
  // Mutation for updating feature status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ featureId, status }: { featureId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/features/${featureId}/status`, { status });
      if (!res.ok) throw new Error("Failed to update feature status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    console.log("All features:", features);
    if (features.length > 0) {
      const newItems = {
        backlog: features.filter(f => !f.status || f.status === 'backlog'),
        todo: features.filter(f => f.status === 'todo'),
        inProgress: features.filter(f => f.status === 'inProgress'),
        done: features.filter(f => f.status === 'done')
      };
      setItems(newItems);
      console.log("Features loaded:", features.length);
      console.log("Features by status:", {
        backlog: newItems.backlog.length,
        todo: newItems.todo.length,
        inProgress: newItems.inProgress.length,
        done: newItems.done.length
      });
    }
  }, [features]);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    
    if (sourceColumn === destColumn) {
      // Just reordering within the same column
      const column = [...items[sourceColumn]];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setItems({
        ...items,
        [sourceColumn]: column
      });
    } else {
      // Moving to a different column (status change)
      const sourceItems = [...items[sourceColumn]];
      const destItems = [...items[destColumn]];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      // Optimistically update the UI
      setItems({
        ...items,
        [sourceColumn]: sourceItems,
        [destColumn]: destItems
      });

      // Update feature status on the server
      const featureId = parseInt(draggableId);
      updateStatusMutation.mutate({ 
        featureId, 
        status: destColumn 
      });
      
      // Show toast notification
      toast({
        title: "Status Updated",
        description: `Feature moved to ${columns.find(col => col.id === destColumn)?.title}`,
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading features...</div>;
  }

  // Helper to get domain badge color
  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      generic: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      salesforce: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      healthcare: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      finance: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      "ar-vr": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      ai: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      crypto: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      ecommerce: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      gaming: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
      automotive: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      biotech: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
    };
    return colors[domain] || colors.generic;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scrum Board</h1>
          <p className="text-muted-foreground mt-1">Drag and drop features to update their status</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/features'] })}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Refresh Board
        </Button>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <div key={column.id} className={`rounded-lg border ${isDragging ? 'ring-1 ring-primary/20' : ''}`}>
              <div className={`p-4 rounded-t-lg flex items-center gap-2 border-b ${column.color}`}>
                <div className="flex-shrink-0">{column.icon}</div>
                <div>
                  <h2 className="font-semibold flex items-center">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {items[column.id]?.length || 0}
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">{column.description}</p>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`p-3 space-y-2 min-h-[400px] ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                  >
                    {items[column.id]?.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center h-[150px] border border-dashed rounded-lg text-muted-foreground p-4">
                        <p className="text-sm text-center">No features in this column</p>
                      </div>
                    )}

                    {items[column.id]?.map((feature, index) => (
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
                            className={`transition-all ${snapshot.isDragging ? 'rotate-1 scale-105 shadow-lg z-10' : ''}`}
                          >
                            <Card className={`p-3 ${snapshot.isDragging ? 'border-primary' : ''}`}>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge className={getDomainColor(feature.domain as string)}>
                                    {feature.domain}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {feature.scenarioCount} {feature.scenarioCount === 1 ? 'scenario' : 'scenarios'}
                                  </Badge>
                                </div>
                                
                                <h3 className="font-medium line-clamp-2">{feature.title}</h3>
                                
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {feature.story}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 mt-2 border-t">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>{new Date(feature.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{formatDistanceToNow(new Date(feature.createdAt), { addSuffix: true })}</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
