import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { useLiked } from "./useLiked";
import type { SimpleTrack } from "../api/types";

export interface MoodPoint {
  week: string;
  valence: number;
  energy: number;
}

export interface TrackWithMood extends SimpleTrack {
  valence: number;
  energy: number;
}

export interface MoodResponse {
  timeline: MoodPoint[];
  tracks: TrackWithMood[];
}

export function useLyricsMood() {
  const { data: liked } = useLiked();
  const API_URL = "/api/analyse";

  return useQuery<MoodResponse>({
    queryKey: ["lyricsMood", liked?.length ?? 0],
    enabled: !!liked?.length,
    staleTime: 60 * 60 * 1000,
    queryFn: ({ signal }: QueryFunctionContext) =>
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: liked }),
        signal,
      }).then((r) => {
        if (!r.ok) throw new Error("Mood analysis failed");
        return r.json();
      }),
  });
}
