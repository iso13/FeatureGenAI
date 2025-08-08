/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useSuggestions(story: string) {
  const [debouncedStory, setDebouncedStory] = useState(story);
  const [isLoadingWithDelay, setIsLoadingWithDelay] = useState(false);

  // Debounce the story input with a longer delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStory(story);
    }, 2000); // Increase debounce to 2 seconds

    return () => clearTimeout(timer);
  }, [story]);

  // Handle loading state with minimum display time
  useEffect(() => {
    if (story.length >= 20) { // Only show loading for substantial content
      setIsLoadingWithDelay(true);
      const timer = setTimeout(() => {
        setIsLoadingWithDelay(false);
      }, 1500); // Minimum loading display time
      return () => clearTimeout(timer);
    }
  }, [story]);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/features/suggest-titles', debouncedStory],
    queryFn: async () => {
      if (!debouncedStory || debouncedStory.length < 20) return { titles: [] };

      const res = await apiRequest('POST', '/api/features/suggest-titles', { story: debouncedStory });
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      return res.json();
    },
    enabled: debouncedStory.length >= 20,
  });

  return {
    suggestions: data?.titles || [],
    isLoading: isLoadingWithDelay || isLoading,
  };
}