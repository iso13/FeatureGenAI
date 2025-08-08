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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { type Analytics } from "@shared/schema";

export default function Analytics() {
  const { data: analyticsData = [], isLoading, error } = useQuery<Analytics[], Error>({
    queryKey: ['/api/analytics'],
    retry: 3,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const analytics = analyticsData.filter(event =>
    new Date(event.createdAt) >= new Date('2025-04-23')
  );

  const totalPages = Math.max(1, Math.ceil(analytics.length / itemsPerPage));
  const paginatedAnalytics = analytics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error loading analytics data
      </div>
    );
  }

  const featureGenEvents = analytics.filter(event => event.eventType === "feature_generation");
  const totalFeatures = featureGenEvents.length;
  const successfulFeatures = featureGenEvents.filter(event => event.successful).length;
  const successRate = totalFeatures > 0 ? Math.round((successfulFeatures / totalFeatures) * 100) : 0;

  const validScenarioCounts = featureGenEvents
    .map(event => event.scenarioCount)
    .filter((count): count is number => typeof count === 'number');

  const avgScenarios = validScenarioCounts.length > 0
    ? Math.round((validScenarioCounts.reduce((sum, count) => sum + count, 0) / validScenarioCounts.length) * 10) / 10
    : 0;

  // Render component
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col gap-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track feature generation metrics and usage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Total Features</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{totalFeatures}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Success Rate</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{successRate}%</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Avg. Scenarios</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{avgScenarios}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Events</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{analytics.length}</p></CardContent>
          </Card>
        </div>

        {Array.isArray(featureGenEvents[0]?.recommendations) && featureGenEvents[0]?.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-4 text-sm text-muted-foreground">
                {(featureGenEvents[0].recommendations as string[]).map((rec, idx) => (
                  <li key={idx}>💡 {rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...paginatedAnalytics]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((event, index) => (
                  <div
                    key={event.id || index}
                    className={`p-4 rounded-lg border ${
                      event.successful
                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                        : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">
                          <span className="text-primary">
                            {event.title?.match(/^Generated Feature \d+$/) ? '' : event.title}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className={event.successful ? "text-green-500" : "text-red-500"}>
                            {event.successful ? "Success" : "Failed"}
                          </span>
                          {event.scenarioCount !== undefined && (
                            <span>• {event.scenarioCount} scenarios</span>
                          )}
                        </p>
                      </div>
                      <time dateTime={String(event.createdAt)} className="text-sm text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString(undefined, {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </time>
                    </div>
                    {event.errorMessage && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {event.errorMessage}
                      </p>
                    )}
                  </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}