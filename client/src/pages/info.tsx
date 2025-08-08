/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  FileText, 
  BarChart3, 
  Package, 
  Lightbulb, 
  Target, 
  Users, 
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Wand2,
  Database
} from "lucide-react";

export default function Info() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 py-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">FeatureGen AI Guide</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Master the art of Cucumber feature generation with AI-powered insights, 
            intelligent templates, and comprehensive testing tools.
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">1</div>
                <h3 className="font-semibold mb-2">Create Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your user story and select domain to generate comprehensive Cucumber features
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">2</div>
                <h3 className="font-semibold mb-2">Analyze Complexity</h3>
                <p className="text-sm text-muted-foreground">
                  Review AI-generated complexity scores and implementation recommendations
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">3</div>
                <h3 className="font-semibold mb-2">Export & Implement</h3>
                <p className="text-sm text-muted-foreground">
                  Export features as .doc files or ZIP bundles for your testing framework
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI-Powered Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Feature Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Transform user stories into comprehensive Cucumber features using GPT-4 intelligence.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Generates realistic scenarios with proper Gherkin syntax
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Domain-specific context for accurate requirements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Background steps and scenario outlines included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Proper feature tags and organization
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Template System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Template Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                22+ pre-built templates covering diverse industries and use cases.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Authentication</Badge>
                <Badge variant="outline" className="text-xs">E-commerce</Badge>
                <Badge variant="outline" className="text-xs">Healthcare</Badge>
                <Badge variant="outline" className="text-xs">Finance</Badge>
                <Badge variant="outline" className="text-xs">AI Systems</Badge>
                <Badge variant="outline" className="text-xs">Real Estate</Badge>
                <Badge variant="outline" className="text-xs">Education</Badge>
                <Badge variant="outline" className="text-xs">Gaming</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Each template includes detailed user stories, complexity levels, and implementation guidance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Complexity Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Understanding Complexity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Each generated feature receives intelligent complexity scoring to help with sprint planning and resource allocation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Data Dependencies</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>1-3:</strong> Self-contained scenarios with minimal external data</p>
                  <p><strong>4-6:</strong> Moderate database interactions and API calls</p>
                  <p><strong>7-10:</strong> Complex data orchestration and multiple sources</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold">Conditional Logic</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>1-3:</strong> Linear flow with minimal branching</p>
                  <p><strong>4-6:</strong> Multiple paths and error handling</p>
                  <p><strong>7-10:</strong> Complex business rules and decision trees</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Technical Difficulty</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>1-3:</strong> Standard implementation with common tools</p>
                  <p><strong>4-6:</strong> Specialized knowledge or integrations required</p>
                  <p><strong>7-10:</strong> Advanced technical expertise and custom solutions</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Using Complexity Scores
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Sprint Planning:</strong> Estimate story points based on complexity metrics</li>
                <li>• <strong>Resource Allocation:</strong> Assign scenarios to team members by skill level</li>
                <li>• <strong>Risk Assessment:</strong> Identify high-complexity scenarios for early attention</li>
                <li>• <strong>Test Strategy:</strong> Plan additional testing for complex scenarios</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Export & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Multiple export formats for seamless integration with your testing workflow.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Individual .doc files for each feature
                </li>
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  ZIP bundles with metadata for bulk export
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  Clean Gherkin formatting ready for test frameworks
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Filtered exports by domain or complexity
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Track your feature generation patterns and team productivity metrics.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Feature creation trends over time
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Domain distribution and popularity
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Complexity distribution across projects
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Team productivity insights
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Available Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Available Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Choose the right domain for context-aware feature generation:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Badge variant="secondary">AI & Machine Learning</Badge>
              <Badge variant="secondary">Biotechnology</Badge>
              <Badge variant="secondary">Cryptocurrency</Badge>
              <Badge variant="secondary">E-commerce</Badge>
              <Badge variant="secondary">Finance</Badge>
              <Badge variant="secondary">Generic/Universal</Badge>
              <Badge variant="secondary">Healthcare</Badge>
              <Badge variant="secondary">Infrastructure</Badge>
              <Badge variant="secondary">Insurance</Badge>
              <Badge variant="secondary">Performance Testing</Badge>
              <Badge variant="secondary">RAG Systems</Badge>
              <Badge variant="secondary">Salesforce</Badge>
              <Badge variant="secondary">Security</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Writing Effective User Stories</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use the "As a [role], I want [goal], So that [benefit]" format</li>
                  <li>• Be specific about the user's context and motivations</li>
                  <li>• Include acceptance criteria when possible</li>
                  <li>• Consider edge cases and error scenarios</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Optimizing Feature Generation</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Select the most relevant domain for better context</li>
                  <li>• Start with 4-6 scenarios for comprehensive coverage</li>
                  <li>• Review and edit generated content for your specific needs</li>
                  <li>• Use templates as starting points for common patterns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            FeatureGen AI leverages OpenAI GPT-4 to transform your requirements into production-ready Cucumber features.
            <br />
            Built with React, TypeScript, and modern testing practices in mind.
          </p>
        </div>
      </motion.div>
    </div>
  );
}