import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useLiked } from "./useLiked";
import { sentimentService, type MoodResponse, type ProcessingProgress } from "../services/sentimentService";

export function useAdvancedMood() {
  const { data: liked } = useLiked();
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProgress = useCallback((progressData: ProcessingProgress) => {
    setProgress(progressData);
  }, []);

  const queryResult = useQuery<MoodResponse>({
    queryKey: ["advancedMood", liked?.length ?? 0],
    enabled: !!liked?.length,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    queryFn: async ({ signal }: QueryFunctionContext) => {
      if (!liked) throw new Error("No liked tracks available");
      
      if (signal?.aborted) {
        throw new Error("Request cancelled");
      }

      setIsProcessing(true);
      setProgress({
        current: 0,
        total: liked.length,
        currentTrack: '',
        stage: 'fetching_lyrics'
      });

      try {
        const result = await sentimentService.analyzeTracks(liked, handleProgress);
        return result;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
  });

  return {
    ...queryResult,
    progress,
    isProcessing: isProcessing || queryResult.isLoading,
    clearCache: sentimentService.clearCache.bind(sentimentService),
    getCacheStats: sentimentService.getCacheStats.bind(sentimentService),
    exportCache: sentimentService.exportCache.bind(sentimentService),
    importCache: sentimentService.importCache.bind(sentimentService),
    getStorageInfo: sentimentService.getStorageInfo.bind(sentimentService),
    checkGeniusHealth: sentimentService.checkGeniusHealth.bind(sentimentService)
  };
}

