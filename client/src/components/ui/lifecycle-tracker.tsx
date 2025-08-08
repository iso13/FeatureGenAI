/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the stages in the feature lifecycle
export type LifecycleStage = 'draft' | 'review' | 'approved' | 'implemented' | 'tested' | 'deployed';

// Map stage to user-friendly label
const stageLabels: Record<LifecycleStage, string> = {
  draft: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  implemented: 'Implemented',
  tested: 'Tested',
  deployed: 'Deployed'
};

// Define colors for different statuses
const statusColors = {
  active: {
    bg: 'bg-primary',
    text: 'text-primary',
    border: 'border-primary'
  },
  completed: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500'
  },
  pending: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted'
  },
  error: {
    bg: 'bg-destructive',
    text: 'text-destructive',
    border: 'border-destructive'
  }
};

interface LifecycleTrackerProps {
  currentStage: LifecycleStage;
  createdAt: Date | string;
  lastUpdated: Date | string;
  stageHistory?: Partial<Record<LifecycleStage, Date | string>>;
  error?: string;
  compact?: boolean;
  className?: string;
}

export function LifecycleTracker({
  currentStage,
  createdAt,
  lastUpdated,
  stageHistory = {},
  error,
  compact = false,
  className,
}: LifecycleTrackerProps) {
  // Convert string dates to Date objects
  const convertedCreatedAt = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const convertedLastUpdated = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  
  // Define all stages in order
  const allStages: LifecycleStage[] = ['draft', 'review', 'approved', 'implemented', 'tested', 'deployed'];
  
  // Determine the index of the current stage
  const currentStageIndex = allStages.indexOf(currentStage);
  
  // Animation for progress line
  const progressWidth = `${(currentStageIndex / (allStages.length - 1)) * 100}%`;
  
  // Function to determine status of a stage
  const getStageStatus = (stage: LifecycleStage) => {
    const stageIndex = allStages.indexOf(stage);
    
    if (error && stage === currentStage) return 'error';
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'active';
    return 'pending';
  };
  
  // Function to get icon for a stage based on its status
  const getStageIcon = (stage: LifecycleStage) => {
    const status = getStageStatus(stage);
    
    if (status === 'error') return <AlertCircle className="h-4 w-4" />;
    if (status === 'completed') return <Check className="h-4 w-4" />;
    if (status === 'active') return <Clock className="h-4 w-4 animate-pulse" />;
    return <RotateCcw className="h-4 w-4 opacity-50" />;
  };
  
  // Animation controls for badges
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Trigger animation when the component mounts
    setAnimate(true);
  }, []);

  return (
    <div className={cn(
      "w-full", 
      compact ? "py-2" : "py-4",
      className
    )}>
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute top-2 left-0 h-1 w-full bg-muted rounded-full" />
        <motion.div 
          className="absolute top-2 left-0 h-1 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: progressWidth }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Stage indicators */}
        <div className="relative flex justify-between">
          {allStages.map((stage, index) => {
            const status = getStageStatus(stage);
            const colors = statusColors[status];
            const date = stageHistory[stage];
            const formattedDate = date ? new Date(date).toLocaleDateString() : '';
            
            return (
              <div 
                key={stage} 
                className={cn(
                  "flex flex-col items-center",
                  compact ? "space-y-1" : "space-y-2"
                )}
              >
                <motion.div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2",
                    colors.border,
                    status === 'active' || status === 'completed' ? colors.bg : 'bg-background',
                    "w-5 h-5"
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: animate ? 1 : 0.8, 
                    opacity: animate ? 1 : 0,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300
                  }}
                >
                  <span className={cn(
                    "text-white text-xs",
                    status === 'pending' && colors.text
                  )}>
                    {getStageIcon(stage)}
                  </span>
                </motion.div>
                
                {!compact && (
                  <>
                    <motion.span 
                      className={cn(
                        "text-xs font-medium",
                        status === 'active' ? colors.text : 'text-muted-foreground',
                        status === 'completed' && 'text-foreground'
                      )}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ 
                        y: animate ? 0 : 10, 
                        opacity: animate ? 1 : 0 
                      }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.15 + 0.1,
                        type: "spring"
                      }}
                    >
                      {stageLabels[stage]}
                    </motion.span>
                    
                    {date && (
                      <motion.span 
                        className="text-[10px] text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: animate ? 1 : 0 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.15 + 0.2 
                        }}
                      >
                        {formattedDate}
                      </motion.span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Error message if present */}
      {error && (
        <motion.div 
          className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        </motion.div>
      )}
      
      {/* Lifecycle metadata */}
      {!compact && (
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-4">
          <span>Created: {convertedCreatedAt.toLocaleDateString()}</span>
          <span>Last updated: {convertedLastUpdated.toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}