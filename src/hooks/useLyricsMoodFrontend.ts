import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { useLiked } from "./useLiked";
import { analyzeTracks, type MoodResponse } from "../utils/sentimentAnalysis";

export function useLyricsMoodFrontend() {
  const { data: liked } = useLiked();

  return useQuery<MoodResponse>({
    queryKey: ["lyricsMoodFrontend", liked?.length ?? 0],
    enabled: !!liked?.length,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    queryFn: async ({ signal }: QueryFunctionContext) => {
      if (!liked) throw new Error("No liked tracks available");
      
      // Check if the request was cancelled
      if (signal?.aborted) {
        throw new Error("Request cancelled");
      }
      
      return analyzeTracks(liked);
    },
  });
}

