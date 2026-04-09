/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronRight } from 'lucide-react';
import { LifecycleTracker, type LifecycleStage } from '@/components/ui/lifecycle-tracker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { type Feature } from '@shared/schema';

interface FeatureLifecyclePanelProps {
  feature: Feature;
  onUpdate: () => void;
}

export function FeatureLifecyclePanel({ feature, onUpdate }: FeatureLifecyclePanelProps) {
  const { toast } = useToast();
  const [selectedStage, setSelectedStage] = useState<LifecycleStage>(
    (feature.lifecycleStage as LifecycleStage) || 'draft'
  );

  // Parse the stage history JSON string
  const stageHistory = feature.stageHistory ? 
    JSON.parse(feature.stageHistory as string) as Record<LifecycleStage, string> : 
    {};

  // Update lifecycle stage mutation
  const { mutate: updateLifecycle, isPending } = useMutation({
    mutationFn: async (newStage: LifecycleStage) => {
      // Create a new stageHistory object with the current timestamp for the new stage
      const updatedHistory = {
        ...stageHistory,
        [newStage]: new Date().toISOString()
      };

      const response = await apiRequest(
        'PATCH',
        `/api/features/${feature.id}`,
        {
          lifecycleStage: newStage,
          stageHistory: JSON.stringify(updatedHistory)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update lifecycle stage');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Stage updated',
        description: `Feature moved to ${selectedStage} stage`,
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Get the next stage based on the current stage
  const getNextStage = (currentStage: LifecycleStage): LifecycleStage | null => {
    const stages: LifecycleStage[] = ['draft', 'review', 'approved', 'implemented', 'tested', 'deployed'];
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex < stages.length - 1) {
      return stages[currentIndex + 1];
    }
    
    return null;
  };

  const nextStage = getNextStage(feature.lifecycleStage as LifecycleStage || 'draft');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Feature Lifecycle</CardTitle>
        <CardDescription>
          Track this feature's progress through the development cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LifecycleTracker
          currentStage={feature.lifecycleStage as LifecycleStage || 'draft'}
          createdAt={feature.createdAt}
          lastUpdated={new Date().toISOString()}
          stageHistory={stageHistory}
        />
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 pt-0">
        <div className="flex items-center justify-between border rounded-md p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Current Stage</span>
            <span className="text-sm text-muted-foreground capitalize">
              {feature.lifecycleStage || 'Draft'}
            </span>
          </div>

          <Select
            value={selectedStage}
            onValueChange={(value) => setSelectedStage(value as LifecycleStage)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="tested">Tested</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => updateLifecycle(selectedStage)}
            disabled={isPending || selectedStage === feature.lifecycleStage}
            className="w-full"
          >
            {isPending ? 'Updating...' : 'Update Stage'}
          </Button>

          {nextStage && (
            <Button
              onClick={() => {
                setSelectedStage(nextStage);
                updateLifecycle(nextStage);
              }}
              disabled={isPending}
              className="w-full"
            >
              <span className="flex items-center">
                <span className="mr-1">Next Stage</span>
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}