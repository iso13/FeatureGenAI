/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Progress } from "./progress";
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Calendar,
  TrendingUp,
  Shield,
  Lightbulb
} from "lucide-react";

const SHOW_TEAM_CONFIG = import.meta.env.VITE_FEATURE_TEAM_CONFIG === "true";
const SHOW_PLANNING = import.meta.env.VITE_FEATURE_PLANNING_INSIGHTS === "true";

interface ComplexityInsightsProps {
  overallComplexity: number;
  scenarios: Array<{
    name: string;
    complexity: number;
    factors: {
      stepCount: number;
      dataDependencies: number;
      conditionalLogic: number;
      technicalDifficulty: number;
    };
  }>;
}

function getComplexityLabel(score: number): { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (score <= 3) return { label: "Simple", color: "text-green-600", variant: "default" };
  if (score <= 6) return { label: "Moderate", color: "text-yellow-600", variant: "secondary" };
  if (score <= 8) return { label: "Complex", color: "text-orange-600", variant: "outline" };
  return { label: "High Risk", color: "text-red-600", variant: "destructive" };
}

function getStoryPointEstimate(complexity: number, teamContext?: TeamContextProps): string {
  let basePoints = complexity <= 2 ? 1.5 : 
                   complexity <= 4 ? 4 : 
                   complexity <= 6 ? 6.5 : 
                   complexity <= 8 ? 10.5 : 16;

  if (teamContext?.domainExpertise === "high") basePoints *= 0.8;
  else if (teamContext?.domainExpertise === "low") basePoints *= 1.3;
  
  if (teamContext?.techStackFamiliarity === "high") basePoints *= 0.9;
  else if (teamContext?.techStackFamiliarity === "low") basePoints *= 1.2;
  
  const rounded = Math.round(basePoints);
  const range = `${Math.max(1, rounded - 1)}-${rounded + 2}`;
  
  const disclaimer = !teamContext ? " (generic)" : 
                    !teamContext.velocity ? " (no velocity data)" : "";
  
  return `${range} points${disclaimer}`;
}

function getTimeEstimate(complexity: number, teamContext?: TeamContextProps): string {
  let baseDays = complexity <= 3 ? 0.5 : 
                 complexity <= 5 ? 1.5 : 
                 complexity <= 7 ? 4 : 
                 complexity <= 8 ? 8 : 12;

  if (teamContext?.domainExpertise === "high") baseDays *= 0.7;
  else if (teamContext?.domainExpertise === "low") baseDays *= 1.4;
  
  if (teamContext?.techStackFamiliarity === "high") baseDays *= 0.8;
  else if (teamContext?.techStackFamiliarity === "low") baseDays *= 1.3;
  
  const timeString = baseDays < 1 ? `${Math.round(baseDays * 8)} hours` :
                     baseDays < 5 ? `${Math.round(baseDays)} days` :
                     `${Math.round(baseDays / 5)} weeks`;
  
  const disclaimer = !teamContext ? " (generic)" : "";
  return `${timeString}${disclaimer}`;
}

function getDeveloperLevel(complexity: number, teamContext?: TeamContextProps): string {
  const baseLevel = complexity <= 3 ? "Junior/Mid-level" : 
                   complexity <= 6 ? "Mid/Senior-level" : 
                   complexity <= 8 ? "Senior-level" : "Senior + Architecture Review";
  
  if (!teamContext) return `${baseLevel} (team composition unknown)`;
  
  const { seniorDevs = 0, midDevs = 0, juniorDevs = 0 } = teamContext;
  const totalDevs = seniorDevs + midDevs + juniorDevs;
  
  if (totalDevs === 0) return `${baseLevel} (team size unknown)`;
  
  const availability = complexity <= 3 ? `${juniorDevs + midDevs}/${totalDevs} devs suitable` :
                      complexity <= 6 ? `${midDevs + seniorDevs}/${totalDevs} devs suitable` :
                      complexity <= 8 ? `${seniorDevs}/${totalDevs} devs suitable` :
                      `${seniorDevs}/${totalDevs} senior devs + architect needed`;
  
  return `${baseLevel} (${availability})`;
}

function getTestingStrategy(complexity: number): string {
  if (complexity <= 3) return "Standard unit tests";
  if (complexity <= 5) return "Unit + integration tests";
  if (complexity <= 7) return "Comprehensive test suite + manual testing";
  return "Full test pyramid + performance testing";
}

function getRiskLevel(complexity: number): { level: string; icon: any; color: string } {
  if (complexity <= 3) return { level: "Low Risk", icon: CheckCircle, color: "text-green-600" };
  if (complexity <= 6) return { level: "Medium Risk", icon: Target, color: "text-yellow-600" };
  if (complexity <= 8) return { level: "High Risk", icon: AlertTriangle, color: "text-orange-600" };
  return { level: "Critical Risk", icon: Shield, color: "text-red-600" };
}

interface TeamContextProps {
  velocity?: number; // stories per sprint
  sprintLength?: number; // days
  seniorDevs?: number;
  midDevs?: number;
  juniorDevs?: number;
  domainExpertise?: "low" | "medium" | "high";
  techStackFamiliarity?: "low" | "medium" | "high";
}

export function ComplexityInsights({ 
  overallComplexity, 
  scenarios, 
  teamContext 
}: ComplexityInsightsProps & { teamContext?: TeamContextProps }) {
  const complexityInfo = getComplexityLabel(overallComplexity);
  const riskInfo = getRiskLevel(overallComplexity);
  const RiskIcon = riskInfo.icon;

  const avgFactors = scenarios.reduce(
    (acc, scenario) => ({
      stepCount: acc.stepCount + scenario.factors.stepCount,
      dataDependencies: acc.dataDependencies + scenario.factors.dataDependencies,
      conditionalLogic: acc.conditionalLogic + scenario.factors.conditionalLogic,
      technicalDifficulty: acc.technicalDifficulty + scenario.factors.technicalDifficulty,
    }),
    { stepCount: 0, dataDependencies: 0, conditionalLogic: 0, technicalDifficulty: 0 }
  );

  if (scenarios.length > 0) {
    avgFactors.stepCount = Math.round(avgFactors.stepCount / scenarios.length);
    avgFactors.dataDependencies = Math.round(avgFactors.dataDependencies / scenarios.length);
    avgFactors.conditionalLogic = Math.round(avgFactors.conditionalLogic / scenarios.length);
    avgFactors.technicalDifficulty = Math.round(avgFactors.technicalDifficulty / scenarios.length);
  }

  return (
    <div className="space-y-6">
      {/* Estimation Accuracy Notice (hidden when team config feature is disabled) */}
      {SHOW_TEAM_CONFIG && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">Estimation Accuracy Notice</h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {!teamContext || Object.keys(teamContext).length === 0 ? (
                  <>These are <strong>baseline estimates</strong> using industry averages. Configure your team settings above for personalized estimates.</>
                ) : (
                  <>Estimates are <strong>personalized</strong> based on your team configuration. Accuracy depends on requirements clarity and scope stability.</>
                )}
              </p>
              {(!teamContext || Object.keys(teamContext).length === 0) && (
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4">
                  <li>• Team velocity and historical performance data</li>
                  <li>• Individual developer experience and domain knowledge</li>
                  <li>• Technology stack familiarity and tooling maturity</li>
                  <li>• Requirements clarity and scope stability</li>
                </ul>
              )}
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Use these as starting points for estimation discussions, not final commitments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Assessment (Development Impact Assessment) */}
      {SHOW_PLANNING && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Development Impact Assessment
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={complexityInfo.variant} className={complexityInfo.color}>
                  {complexityInfo.label}
                </Badge>
                <span className="text-2xl font-bold">{overallComplexity}/10</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Story Points */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Story Points</span>
                </div>
                <p className="text-lg font-semibold">{getStoryPointEstimate(overallComplexity, teamContext)}</p>
                <p className="text-xs text-muted-foreground">Agile estimation</p>
              </div>

              {/* Time Estimate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Time Estimate</span>
                </div>
                <p className="text-lg font-semibold">{getTimeEstimate(overallComplexity, teamContext)}</p>
                <p className="text-xs text-muted-foreground">Development time</p>
              </div>

              {/* Developer Level */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Developer Level</span>
                </div>
                <p className="text-lg font-semibold">{getDeveloperLevel(overallComplexity, teamContext)}</p>
                <p className="text-xs text-muted-foreground">Skill requirement</p>
              </div>

              {/* Risk Assessment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RiskIcon className={`h-4 w-4 ${riskInfo.color}`} />
                  <span className="text-sm font-medium">Risk Level</span>
                </div>
                <p className={`text-lg font-semibold ${riskInfo.color}`}>{riskInfo.level}</p>
                <p className="text-xs text-muted-foreground">Implementation risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actionable Recommendations (Sprint Planning Recommendations) */}
      {SHOW_PLANNING && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sprint Planning Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sprint Planning
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Allocate {getTimeEstimate(overallComplexity, teamContext)} for implementation</li>
                    <li>• Reserve additional 20-30% buffer for testing</li>
                    <li>• {overallComplexity > 7 ? "Consider breaking into smaller stories" : "Can fit in single sprint"}</li>
                    <li>• Schedule {overallComplexity > 6 ? "mid-sprint" : "end-of-sprint"} demo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Assignment
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Assign to {getDeveloperLevel(overallComplexity, teamContext)}</li>
                    <li>• {overallComplexity > 6 ? "Consider pair programming" : "Individual development OK"}</li>
                    <li>• {overallComplexity > 8 ? "Requires architecture review first" : "Standard code review process"}</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Quality Assurance
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {getTestingStrategy(overallComplexity)}</li>
                    <li>• {overallComplexity > 6 ? "QA review before merge" : "Standard testing process"}</li>
                    <li>• {overallComplexity > 7 ? "Performance testing required" : "Standard performance checks"}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Mitigation
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {overallComplexity > 7 ? "Start early in sprint" : "Can start mid-sprint"}</li>
                    <li>• {overallComplexity > 6 ? "Daily check-ins recommended" : "Standard standup updates"}</li>
                    <li>• {overallComplexity > 8 ? "Create fallback plan" : "Standard delivery approach"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complexity Factors Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Complexity Factor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step Count</span>
                <span>{avgFactors.stepCount}/10</span>
              </div>
              <Progress value={avgFactors.stepCount * 10} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {avgFactors.stepCount <= 3 ? "Few test steps - quick to implement" : 
                 avgFactors.stepCount <= 6 ? "Moderate step count - standard complexity" :
                 "Many test steps - requires careful planning"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Data Dependencies</span>
                <span>{avgFactors.dataDependencies}/10</span>
              </div>
              <Progress value={avgFactors.dataDependencies * 10} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {avgFactors.dataDependencies <= 3 ? "Self-contained - minimal external dependencies" : 
                 avgFactors.dataDependencies <= 6 ? "Some database/API interactions required" :
                 "Complex data orchestration - coordinate with data team"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Business Logic</span>
                <span>{avgFactors.conditionalLogic}/10</span>
              </div>
              <Progress value={avgFactors.conditionalLogic * 10} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {avgFactors.conditionalLogic <= 3 ? "Straightforward logic - clear requirements" : 
                 avgFactors.conditionalLogic <= 6 ? "Some conditional flows - document edge cases" :
                 "Complex business rules - involve business analyst"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Technical Difficulty</span>
                <span>{avgFactors.technicalDifficulty}/10</span>
              </div>
              <Progress value={avgFactors.technicalDifficulty * 10} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {avgFactors.technicalDifficulty <= 3 ? "Standard implementation patterns" : 
                 avgFactors.technicalDifficulty <= 6 ? "Some technical challenges - research required" :
                 "High technical complexity - spike/POC recommended"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}