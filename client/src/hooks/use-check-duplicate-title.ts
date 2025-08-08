/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCheckDuplicateTitle(title: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/features", title],
    queryFn: async () => {
      if (!title) return { exists: false };
      const features = await (await apiRequest("GET", "/api/features")).json();
      return { 
        exists: features.some((f: any) => 
          f.title.toLowerCase() === title.toLowerCase()
        )
      };
    },
    enabled: !!title,
  });

  return {
    isDuplicate: data?.exists || false,
    isChecking: isLoading,
  };
}
