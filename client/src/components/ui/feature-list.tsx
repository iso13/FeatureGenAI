/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Feature } from "@shared/schema";
import { ScenarioComplexity } from "./scenario-complexity";

export function FeatureList() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  // Filter out deleted or invalid features
  const visibleFeatures = features.filter(
    (f) => !f.deleted && f.generatedContent
  );

  console.log("Visible features:", visibleFeatures);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generated Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {visibleFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedFeature(feature)}
                >
                  <h3 className="text-lg font-semibold truncate">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {feature.story}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleFeatures.length === 0 && (
              <div className="text-center text-muted-foreground col-span-full">
                No features generated yet. Try generating one above!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedFeature !== null}
        onOpenChange={() => setSelectedFeature(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeature?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Story</h4>
              <p className="text-sm text-muted-foreground">
                {selectedFeature?.story}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Generated Content</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                {selectedFeature?.generatedContent}
              </pre>
            </div>

            {selectedFeature?.generatedContent &&
              selectedFeature?.analysisJson && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium">
                    Scenario Complexity Analysis
                  </h4>
                  {(() => {
                    const analysis = JSON.parse(
                      selectedFeature.analysisJson
                    );
                    const scenarioChunks =
                      selectedFeature.generatedContent
                        .split("Scenario:")
                        .slice(1);

                    return scenarioChunks.map((chunk, idx) => {
                      const nameLine = chunk.trim().split("\n")[0];
                      const matchingScenario = analysis.scenarios.find(
                        (s: any) =>
                          s.name.trim().toLowerCase() ===
                          nameLine.trim().toLowerCase()
                      );

                      if (!matchingScenario) return null;

                      return (
                        <ScenarioComplexity
                          key={idx}
                          name={matchingScenario.name}
                          complexity={matchingScenario.complexity}
                          factors={matchingScenario.factors}
                          explanation={matchingScenario.explanation}
                        />
                      );
                    });
                  })()}
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}