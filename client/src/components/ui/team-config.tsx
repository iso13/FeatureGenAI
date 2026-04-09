/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import { 
  Settings, 
  Users, 
  TrendingUp, 
  Clock, 
  Save,
  RotateCcw,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TeamContext {
  velocity?: number; // stories per sprint
  sprintLength?: number; // days
  seniorDevs?: number;
  midDevs?: number;
  juniorDevs?: number;
  qaTesters?: number;
  domainExpertise?: "low" | "medium" | "high";
  techStackFamiliarity?: "low" | "medium" | "high";
}

interface TeamConfigProps {
  teamContext?: TeamContext;
  onSave: (context: TeamContext) => void;
}

export function TeamConfig({ teamContext, onSave }: TeamConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<TeamContext>(teamContext || {});

  const handleSave = () => {
    onSave(config);
    setIsOpen(false);
  };

  const handleReset = () => {
    setConfig({});
    // Also clear from localStorage to ensure fresh start
    localStorage.removeItem('cucumber-team-config');
  };

  const isConfigured = teamContext && Object.keys(teamContext).length > 0;
  const totalDevs = (config.seniorDevs || 0) + (config.midDevs || 0) + (config.juniorDevs || 0);

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Team Config
            {isConfigured && (
              <Badge variant="secondary" className="ml-1">
                Configured
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your team details for more accurate complexity estimates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Team Velocity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <Label className="font-medium">Team Performance</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="velocity" className="text-sm">Velocity</Label>
                  <Input
                    id="velocity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={config.velocity || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, velocity: (value >= 0) ? value : undefined });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">points/sprint</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sprintLength" className="text-sm">Sprint Length</Label>
                  </div>
                  <Input
                    id="sprintLength"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={config.sprintLength || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, sprintLength: (value >= 1) ? value : undefined });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            </div>

            {/* Team Composition */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <Label className="font-medium">Team Composition</Label>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="juniorDevs" className="text-sm">Junior</Label>
                  <Input
                    id="juniorDevs"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={config.juniorDevs || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, juniorDevs: (value >= 0) ? value : undefined });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="midDevs" className="text-sm">Mid-level</Label>
                  <Input
                    id="midDevs"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={config.midDevs || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, midDevs: (value >= 0) ? value : undefined });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seniorDevs" className="text-sm">Senior</Label>
                  <Input
                    id="seniorDevs"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={config.seniorDevs || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, seniorDevs: (value >= 0) ? value : undefined });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qaTesters" className="text-sm">QA</Label>
                  <Input
                    id="qaTesters"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={config.qaTesters || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setConfig({ ...config, qaTesters: (value >= 0) ? value : undefined });
                    }}
                  />
                </div>
              </div>
              
              {totalDevs > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: {totalDevs} developers{config.qaTesters ? `, ${config.qaTesters} QA` : ""}
                </p>
              )}
            </div>

            {/* Experience Levels */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <Label className="font-medium">Experience & Familiarity</Label>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Domain Expertise</Label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <Button
                        key={level}
                        variant={config.domainExpertise === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setConfig({ ...config, domainExpertise: level })}
                        className="flex-1 capitalize text-xs"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Tech Stack Familiarity</Label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <Button
                        key={level}
                        variant={config.techStackFamiliarity === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setConfig({ ...config, techStackFamiliarity: level })}
                        className="flex-1 capitalize text-xs"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              
              <Button
                onClick={handleSave}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-3 w-3" />
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export function TeamContextSummary({ teamContext }: { teamContext?: TeamContext }) {
  if (!teamContext || Object.keys(teamContext).length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No team configuration set - using generic estimates
      </div>
    );
  }

  const totalDevs = (teamContext.seniorDevs || 0) + (teamContext.midDevs || 0) + (teamContext.juniorDevs || 0);
  const totalQA = teamContext.qaTesters || 0;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {teamContext.velocity && (
        <Badge variant="outline">
          {teamContext.velocity} pts/sprint
        </Badge>
      )}
      {totalDevs > 0 && (
        <Badge variant="outline">
          {totalDevs} devs ({teamContext.juniorDevs || 0}J/{teamContext.midDevs || 0}M/{teamContext.seniorDevs || 0}S)
        </Badge>
      )}
      {totalQA > 0 && (
        <Badge variant="outline">
          {totalQA} QA
        </Badge>
      )}
      {teamContext.domainExpertise && (
        <Badge variant="outline">
          Domain: {teamContext.domainExpertise}
        </Badge>
      )}
      {teamContext.techStackFamiliarity && (
        <Badge variant="outline">
          Tech: {teamContext.techStackFamiliarity}
        </Badge>
      )}
    </div>
  );
}