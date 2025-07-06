import type { SimpleTrack } from "../api/types";
import { analyzeTracksAdvanced, type TrackWithAdvancedMood } from './advancedNLP';
import { geniusService } from './geniusService';
import { cacheService } from './cacheService';


export interface MoodPoint {
  week: string;
  valence: number;
  energy: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  trackCount: number;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  currentTrack: string;
  stage: 'fetching_lyrics' | 'analyzing_sentiment' | 'aggregating_data' | 'complete';
}

export interface MoodResponse {
  timeline: MoodPoint[];
  tracks: TrackWithAdvancedMood[];
  processingStats: {
    totalTracks: number;
    cachedLyrics: number;
    cachedSentiment: number;
    newAnalysis: number;
    processingTime: number;
  };
  cacheStats: {
    hitRate: number;
    totalSize: number;
    entryCount: number;
  };
}

class SentimentService {
  async analyzeTracks(
    tracks: SimpleTrack[], 
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<MoodResponse> {
    const startTime = Date.now();
    let cachedLyrics = 0;
    let cachedSentiment = 0;
    let newAnalysis = 0;

    const enrichedTracks: TrackWithAdvancedMood[] = [];

    // Process tracks with progress updates
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      onProgress?.({
        current: i + 1,
        total: tracks.length,
        currentTrack: `${track.name} - ${track.artists}`,
        stage: 'fetching_lyrics'
      });

      // Check if sentiment is already cached
      let sentiment = cacheService.getCachedSentiment(track.id);
      
      if (sentiment) {
        cachedSentiment++;
        enrichedTracks.push({ ...track, sentiment });
        continue;
      }

      onProgress?.({
        current: i + 1,
        total: tracks.length,
        currentTrack: `${track.name} - ${track.artists}`,
        stage: 'analyzing_sentiment'
      });

      // Get lyrics (from cache or fetch new)
      const lyricsResult = await geniusService.getLyrics(track.id, track.name, track.artists);
      
      if (lyricsResult.cached) {
        cachedLyrics++;
      }

      // Analyze sentiment using advanced NLP
      const [analyzedTrack] = await analyzeTracksAdvanced([{
        ...track,
        // Use the actual lyrics for analysis
        name: lyricsResult.lyrics.substring(0, 100) // Use lyrics snippet for better analysis
      }]);

      sentiment = analyzedTrack.sentiment;
      newAnalysis++;

      // Cache the sentiment result
      await cacheService.cacheSentiment(track.id, sentiment);

      enrichedTracks.push({ ...track, sentiment });

      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    onProgress?.({
      current: tracks.length,
      total: tracks.length,
      currentTrack: '',
      stage: 'aggregating_data'
    });

    // Calculate timeline data with enhanced aggregation
    const timeline = this.calculateTimeline(enrichedTracks);

    onProgress?.({
      current: tracks.length,
      total: tracks.length,
      currentTrack: '',
      stage: 'complete'
    });

    const processingTime = Date.now() - startTime;
    const cacheStats = cacheService.getCacheStats();

    return {
      timeline,
      tracks: enrichedTracks,
      processingStats: {
        totalTracks: tracks.length,
        cachedLyrics,
        cachedSentiment,
        newAnalysis,
        processingTime
      },
      cacheStats: {
        hitRate: cacheStats.hitRate,
        totalSize: cacheStats.totalSize,
        entryCount: cacheStats.lyricsCount + cacheStats.sentimentCount
      }
    };
  }

  private calculateTimeline(tracks: TrackWithAdvancedMood[]): MoodPoint[] {
    if (tracks.length === 0) return [];

    // Group tracks by week
    const weeklyData: Record<string, {
      valence: number[];
      energy: number[];
      emotions: {
        joy: number[];
        sadness: number[];
        anger: number[];
        fear: number[];
        surprise: number[];
        disgust: number[];
      };
    }> = {};

    tracks.forEach(track => {
      const date = new Date(track.added_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          valence: [],
          energy: [],
          emotions: {
            joy: [],
            sadness: [],
            anger: [],
            fear: [],
            surprise: [],
            disgust: []
          }
        };
      }

      weeklyData[weekKey].valence.push(track.sentiment.valence);
      weeklyData[weekKey].energy.push(track.sentiment.energy);
      
      Object.keys(weeklyData[weekKey].emotions).forEach(emotion => {
        weeklyData[weekKey].emotions[emotion as keyof typeof weeklyData[string]['emotions']].push(
          track.sentiment.emotions[emotion as keyof typeof track.sentiment.emotions]
        );
      });
    });

    // Calculate averages and create timeline points
    const timeline: MoodPoint[] = Object.entries(weeklyData).map(([week, data]) => {
      const avgValence = data.valence.reduce((a, b) => a + b, 0) / data.valence.length;
      const avgEnergy = data.energy.reduce((a, b) => a + b, 0) / data.energy.length;
      
      const avgEmotions = {
        joy: data.emotions.joy.reduce((a, b) => a + b, 0) / data.emotions.joy.length,
        sadness: data.emotions.sadness.reduce((a, b) => a + b, 0) / data.emotions.sadness.length,
        anger: data.emotions.anger.reduce((a, b) => a + b, 0) / data.emotions.anger.length,
        fear: data.emotions.fear.reduce((a, b) => a + b, 0) / data.emotions.fear.length,
        surprise: data.emotions.surprise.reduce((a, b) => a + b, 0) / data.emotions.surprise.length,
        disgust: data.emotions.disgust.reduce((a, b) => a + b, 0) / data.emotions.disgust.length
      };

      return {
        week,
        valence: Math.round(avgValence * 1000) / 1000,
        energy: Math.round(avgEnergy * 1000) / 1000,
        emotions: {
          joy: Math.round(avgEmotions.joy * 1000) / 1000,
          sadness: Math.round(avgEmotions.sadness * 1000) / 1000,
          anger: Math.round(avgEmotions.anger * 1000) / 1000,
          fear: Math.round(avgEmotions.fear * 1000) / 1000,
          surprise: Math.round(avgEmotions.surprise * 1000) / 1000,
          disgust: Math.round(avgEmotions.disgust * 1000) / 1000
        },
        trackCount: data.valence.length
      };
    });

    // Sort by week
    return timeline.sort((a, b) => a.week.localeCompare(b.week));
  }

  // Utility methods
  async clearCache(): Promise<void> {
    cacheService.clearCache();
  }

  async getCacheStats() {
    return cacheService.getCacheStats();
  }

  async exportCache(): Promise<string> {
    return cacheService.exportCache();
  }

  async importCache(data: string): Promise<boolean> {
    return cacheService.importCache(data);
  }

  async getStorageInfo() {
    return cacheService.getStorageInfo();
  }

  async checkGeniusHealth(): Promise<boolean> {
    return geniusService.checkHealth();
  }
}

export const sentimentService = new SentimentService();

