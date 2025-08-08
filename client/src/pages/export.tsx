/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Download, FileText, Package, CheckCircle, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Feature } from "@shared/schema";
import JSZip from "jszip";

const domainLabels: Record<string, string> = {
  ai: "AI",
  biotech: "Biotech", 
  crypto: "Crypto",
  ecommerce: "E-Commerce",
  finance: "Finance",
  generic: "Generic",
  healthcare: "Healthcare",
  infrastructure: "Infrastructure",
  insurance: "Insurance",
  performance: "Performance",
  rag: "RAG",
  salesforce: "Salesforce",
  security: "Security"
};

export default function Export() {
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<"individual" | "bundle">("individual");
  const [fileFormat, setFileFormat] = useState<"feature" | "docx">("feature");

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  const activeFeatures = features.filter(f => !f.deleted && f.generatedContent);
  
  const filteredFeatures = useMemo(() => {
    if (domainFilter === "all") return activeFeatures;
    return activeFeatures.filter(f => f.domain === domainFilter);
  }, [activeFeatures, domainFilter]);

  const availableDomains = Array.from(new Set(activeFeatures.map(f => f.domain).filter((domain): domain is string => Boolean(domain))));

  const toggleFeature = (featureId: number) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  const toggleAll = () => {
    if (selectedFeatures.size === filteredFeatures.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(filteredFeatures.map(f => f.id)));
    }
  };

  const exportSelected = async () => {
    if (selectedFeatures.size === 0) {
      toast({
        title: "No Features Selected",
        description: "Please select at least one feature to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedFeatureData = activeFeatures.filter(f => selectedFeatures.has(f.id));

    try {
      if (exportFormat === "individual") {
        // Export each feature as individual file
        for (const feature of selectedFeatureData) {
          await downloadFeature(feature);
        }
        toast({
          title: "Export Complete",
          description: `${selectedFeatureData.length} features exported successfully.`,
        });
      } else {
        // Export as bundle (ZIP)
        await downloadBundle(selectedFeatureData);
        toast({
          title: "Bundle Export Complete",
          description: `${selectedFeatureData.length} features exported as bundle.`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export features. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadFeature = async (feature: Feature) => {
    try {
      const response = await fetch(`/api/features/export/${feature.id}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${feature.title.toLowerCase().replace(/\s+/g, '_')}.${fileFormat === 'feature' ? 'feature' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const downloadBundle = async (features: Feature[]) => {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Add features to zip
    for (const feature of features) {
      const filename = `${feature.title.toLowerCase().replace(/\s+/g, '_')}.feature`;
      zip.file(filename, feature.generatedContent || '');
    }

    // Add metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      featuresCount: features.length,
      features: features.map(f => ({
        id: f.id,
        title: f.title,
        domain: f.domain,
        scenarioCount: f.scenarioCount,
        createdAt: f.createdAt
      }))
    };
    zip.file('export_metadata.json', JSON.stringify(metadata, null, 2));

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature_bundle_${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col gap-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 py-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Export Features</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Export your generated Cucumber features as individual files or bundled packages. 
            Choose from multiple formats and filtering options.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Configuration */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Export Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: "individual" | "bundle") => setExportFormat(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Files</SelectItem>
                    <SelectItem value="bundle">ZIP Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">File Format</Label>
                <Select value={fileFormat} onValueChange={(value: "feature" | "docx") => setFileFormat(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">.feature (Gherkin)</SelectItem>
                    <SelectItem value="docx">.docx (Word Document)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Filter by Domain</Label>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {availableDomains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domainLabels[domain as keyof typeof domainLabels] || domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">
                    {selectedFeatures.size} of {filteredFeatures.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {selectedFeatures.size === filteredFeatures.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <Button
                  onClick={exportSelected}
                  disabled={selectedFeatures.size === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected ({selectedFeatures.size})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Features to Export
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? 's' : ''} available
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFeatures.has(feature.id)}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{feature.title}</h3>
                        {feature.domain && (
                          <Badge variant="secondary" className="text-xs">
                            {domainLabels[feature.domain] || feature.domain}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {feature.scenarioCount} scenarios
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feature.story}
                      </p>
                      {feature.createdAt && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(feature.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredFeatures.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {domainFilter === "all" 
                        ? "No features available for export." 
                        : "No features found for the selected domain."
                      }
                    </p>
                    {domainFilter !== "all" && (
                      <Button
                        variant="outline"
                        onClick={() => setDomainFilter("all")}
                        className="mt-4"
                      >
                        Show All Domains
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}