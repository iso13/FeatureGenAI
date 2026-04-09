/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, FileText, BarChart3, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ComplexityAnalysisLoaderProps {
  isOpen: boolean;
}

const analysisSteps = [
  {
    title: "Analyzing Input",
    description: "Processing your feature requirements",
    icon: FileText
  },
  {
    title: "Evaluating Complexity",
    description: "Evaluating scenario difficulty and dependencies",
    icon: BarChart3
  },
  {
    title: "Generating Recommendations",
    description: "Creating implementation recommendations",
    icon: Lightbulb
  }
];

export function ComplexityAnalysisLoader({ isOpen }: ComplexityAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500); // Change step every 2.5 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-lg" aria-describedby="complexity-analysis-description">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Analyzing Complexity</DialogTitle>
          <p className="text-sm text-muted-foreground" id="complexity-analysis-description">
            Please wait while we analyze your feature content...
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={index}
                className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? "bg-primary/10 border border-primary/20" 
                    : isCompleted
                    ? "bg-green-50 border border-green-200"
                    : "bg-muted/50"
                }`}
              >
                <div className={`flex-shrink-0 ${
                  isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : isCurrent ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${
                    isCurrent ? "text-primary" : isCompleted ? "text-green-700" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isCurrent ? "text-primary/80" : isCompleted ? "text-green-600" : "text-muted-foreground"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}