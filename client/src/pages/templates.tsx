/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wand2, Copy, FileText, Database, ShoppingCart, Shield, Heart, TrendingUp, Users, MessageSquare, Calendar, Search, Settings, Globe, GraduationCap, Truck, Camera, Gamepad2, Stethoscope, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Domain } from "@shared/schema";

interface Template {
  id: string;
  title: string;
  story: string;
  domain: Domain;
  scenarioCount: number;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  complexity: "Basic" | "Intermediate" | "Advanced";
}

const templates: Template[] = [
  {
    id: "user-auth",
    title: "User Authentication System",
    story: "As a user\nI want to securely log into the system\nSo that I can access my personal account",
    domain: "security",
    scenarioCount: 5,
    description: "Comprehensive authentication flow with login, logout, registration, and password reset",
    icon: <Shield className="h-6 w-6" />,
    tags: ["Authentication", "Security", "User Management"],
    complexity: "Intermediate"
  },
  {
    id: "ecommerce-checkout",
    title: "E-commerce Checkout Process",
    story: "As a customer\nI want to complete my purchase securely\nSo that I can receive my ordered items",
    domain: "ecommerce",
    scenarioCount: 6,
    description: "End-to-end checkout flow with cart management, payment processing, and order confirmation",
    icon: <ShoppingCart className="h-6 w-6" />,
    tags: ["E-commerce", "Payment", "Shopping Cart"],
    complexity: "Advanced"
  },
  {
    id: "api-crud",
    title: "REST API CRUD Operations",
    story: "As a developer\nI want to perform CRUD operations via API\nSo that I can manage data efficiently",
    domain: "infrastructure",
    scenarioCount: 4,
    description: "Standard Create, Read, Update, Delete operations with proper HTTP methods and responses",
    icon: <Database className="h-6 w-6" />,
    tags: ["API", "CRUD", "Backend"],
    complexity: "Basic"
  },
  {
    id: "healthcare-records",
    title: "Patient Medical Records",
    story: "As a healthcare provider\nI want to manage patient medical records\nSo that I can provide quality care",
    domain: "healthcare",
    scenarioCount: 5,
    description: "Medical record management with privacy compliance and audit trails",
    icon: <Heart className="h-6 w-6" />,
    tags: ["Healthcare", "Records", "Privacy"],
    complexity: "Advanced"
  },
  {
    id: "financial-reporting",
    title: "Financial Dashboard Reporting",
    story: "As a financial analyst\nI want to generate comprehensive reports\nSo that I can track business performance",
    domain: "finance",
    scenarioCount: 4,
    description: "Financial reporting with charts, filters, and export capabilities",
    icon: <TrendingUp className="h-6 w-6" />,
    tags: ["Finance", "Reporting", "Analytics"],
    complexity: "Intermediate"
  },
  {
    id: "document-management",
    title: "Document Management System",
    story: "As a user\nI want to upload and organize documents\nSo that I can manage my files efficiently",
    domain: "generic",
    scenarioCount: 5,
    description: "File upload, organization, sharing, and version control system",
    icon: <FileText className="h-6 w-6" />,
    tags: ["Documents", "File Management", "Collaboration"],
    complexity: "Intermediate"
  },
  {
    id: "social-media-feed",
    title: "Social Media Feed",
    story: "As a user\nI want to view and interact with posts in my feed\nSo that I can stay connected with my network",
    domain: "generic",
    scenarioCount: 6,
    description: "Social media feed with posts, likes, comments, and sharing functionality",
    icon: <MessageSquare className="h-6 w-6" />,
    tags: ["Social Media", "Feed", "Interaction"],
    complexity: "Intermediate"
  },
  {
    id: "team-collaboration",
    title: "Team Collaboration Platform",
    story: "As a team member\nI want to collaborate on projects with my colleagues\nSo that we can work together effectively",
    domain: "generic",
    scenarioCount: 7,
    description: "Team workspace with project management, file sharing, and communication tools",
    icon: <Users className="h-6 w-6" />,
    tags: ["Collaboration", "Team", "Project Management"],
    complexity: "Advanced"
  },
  {
    id: "event-scheduling",
    title: "Event Scheduling System",
    story: "As an organizer\nI want to schedule and manage events\nSo that participants can easily join and stay informed",
    domain: "generic",
    scenarioCount: 5,
    description: "Event creation, scheduling, invitations, and calendar integration",
    icon: <Calendar className="h-6 w-6" />,
    tags: ["Events", "Scheduling", "Calendar"],
    complexity: "Intermediate"
  },
  {
    id: "search-functionality",
    title: "Advanced Search & Filter System",
    story: "As a user\nI want to search and filter content efficiently\nSo that I can find exactly what I'm looking for",
    domain: "generic",
    scenarioCount: 4,
    description: "Comprehensive search with filters, sorting, and advanced query options",
    icon: <Search className="h-6 w-6" />,
    tags: ["Search", "Filtering", "Navigation"],
    complexity: "Basic"
  },
  {
    id: "admin-panel",
    title: "Admin Dashboard & Settings",
    story: "As an administrator\nI want to manage system settings and user permissions\nSo that I can maintain control over the platform",
    domain: "generic",
    scenarioCount: 6,
    description: "Admin interface with user management, system settings, and monitoring tools",
    icon: <Settings className="h-6 w-6" />,
    tags: ["Admin", "Settings", "User Management"],
    complexity: "Advanced"
  },
  {
    id: "multi-language",
    title: "Multi-language Support",
    story: "As an international user\nI want to use the application in my preferred language\nSo that I can understand and navigate effectively",
    domain: "generic",
    scenarioCount: 4,
    description: "Internationalization with language switching and localized content",
    icon: <Globe className="h-6 w-6" />,
    tags: ["Internationalization", "Language", "Localization"],
    complexity: "Intermediate"
  },
  {
    id: "education-platform",
    title: "Online Learning Platform",
    story: "As a student\nI want to access educational content and track my progress\nSo that I can learn effectively at my own pace",
    domain: "generic",
    scenarioCount: 6,
    description: "Educational platform with courses, assessments, and progress tracking",
    icon: <GraduationCap className="h-6 w-6" />,
    tags: ["Education", "Learning", "Progress Tracking"],
    complexity: "Advanced"
  },
  {
    id: "logistics-tracking",
    title: "Package Delivery Tracking",
    story: "As a customer\nI want to track my package delivery status\nSo that I know when to expect my order",
    domain: "ecommerce",
    scenarioCount: 5,
    description: "Real-time package tracking with delivery updates and notifications",
    icon: <Truck className="h-6 w-6" />,
    tags: ["Logistics", "Tracking", "Delivery"],
    complexity: "Intermediate"
  },
  {
    id: "photo-gallery",
    title: "Photo Gallery Management",
    story: "As a photographer\nI want to organize and showcase my photos\nSo that clients can view and purchase my work",
    domain: "generic",
    scenarioCount: 5,
    description: "Photo gallery with upload, organization, and client interaction features",
    icon: <Camera className="h-6 w-6" />,
    tags: ["Photography", "Gallery", "Portfolio"],
    complexity: "Intermediate"
  },
  {
    id: "gaming-leaderboard",
    title: "Gaming Leaderboard System",
    story: "As a gamer\nI want to see my ranking and compete with others\nSo that I can track my performance and achievements",
    domain: "generic",
    scenarioCount: 4,
    description: "Gaming platform with scores, rankings, and achievement tracking",
    icon: <Gamepad2 className="h-6 w-6" />,
    tags: ["Gaming", "Leaderboard", "Competition"],
    complexity: "Basic"
  },
  {
    id: "telemedicine",
    title: "Telemedicine Consultation",
    story: "As a patient\nI want to consult with my doctor remotely\nSo that I can receive medical care from home",
    domain: "healthcare",
    scenarioCount: 6,
    description: "Virtual medical consultations with video calls and health record access",
    icon: <Stethoscope className="h-6 w-6" />,
    tags: ["Telemedicine", "Healthcare", "Virtual Consultation"],
    complexity: "Advanced"
  },
  {
    id: "property-management",
    title: "Real Estate Property Management",
    story: "As a property manager\nI want to manage rental properties and tenant relationships\nSo that I can efficiently handle all property operations",
    domain: "generic",
    scenarioCount: 7,
    description: "Property management with tenant screening, lease management, and maintenance tracking",
    icon: <Building className="h-6 w-6" />,
    tags: ["Real Estate", "Property", "Management"],
    complexity: "Advanced"
  },
  {
    id: "ai-chatbot",
    title: "AI-Powered Customer Support",
    story: "As a customer\nI want to get instant help through an AI chatbot\nSo that I can resolve my issues quickly without waiting",
    domain: "ai",
    scenarioCount: 5,
    description: "Intelligent chatbot with natural language processing and escalation to human agents",
    icon: <MessageSquare className="h-6 w-6" />,
    tags: ["AI", "Chatbot", "Customer Support"],
    complexity: "Advanced"
  },
  {
    id: "crypto-portfolio",
    title: "Cryptocurrency Portfolio Tracker",
    story: "As a crypto investor\nI want to track my cryptocurrency investments\nSo that I can monitor my portfolio performance",
    domain: "crypto",
    scenarioCount: 5,
    description: "Crypto portfolio tracking with real-time prices and performance analytics",
    icon: <TrendingUp className="h-6 w-6" />,
    tags: ["Cryptocurrency", "Portfolio", "Investment"],
    complexity: "Intermediate"
  },
  {
    id: "insurance-claims",
    title: "Insurance Claims Processing",
    story: "As a policyholder\nI want to file and track my insurance claims\nSo that I can get reimbursed for covered incidents",
    domain: "insurance",
    scenarioCount: 6,
    description: "Insurance claims management with document upload and status tracking",
    icon: <Shield className="h-6 w-6" />,
    tags: ["Insurance", "Claims", "Processing"],
    complexity: "Advanced"
  }
];

const complexityColors = {
  Basic: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

export default function Templates() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const useTemplate = (template: Template) => {
    // Store template data in localStorage to pre-fill the home form
    localStorage.setItem('templateData', JSON.stringify({
      title: template.title,
      story: template.story,
      domain: template.domain,
      scenarioCount: template.scenarioCount
    }));
    
    toast({
      title: "Template Applied",
      description: "Template data loaded to the form. Redirecting to home page...",
    });
    
    navigate("/");
  };

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));
  const filteredTemplates = selectedFilter === "all" 
    ? templates 
    : templates.filter(t => t.tags.includes(selectedFilter));

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 py-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Feature Templates</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start with pre-built templates for common testing scenarios. Each template includes 
            comprehensive user stories and scenario structures you can customize for your needs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Templates</CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                All Templates
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedFilter === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={complexityColors[template.complexity]}
                        >
                          {template.complexity}
                        </Badge>
                        <Badge variant="outline">
                          {template.scenarioCount} scenarios
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">User Story:</h4>
                    <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {template.story}
                    </pre>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() => useTemplate(template)}
                      className="flex-1"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(template.story);
                        toast({
                          title: "Copied!",
                          description: "User story copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No templates found for the selected filter.</p>
            <Button
              variant="outline"
              onClick={() => setSelectedFilter("all")}
              className="mt-4"
            >
              Show All Templates
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}