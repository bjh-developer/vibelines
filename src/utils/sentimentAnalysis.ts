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

// Simple sentiment analysis based on keywords
const POSITIVE_WORDS = [
  'love', 'happy', 'joy', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome',
  'beautiful', 'perfect', 'brilliant', 'excellent', 'good', 'best', 'smile',
  'laugh', 'fun', 'exciting', 'celebrate', 'victory', 'win', 'success', 'hope',
  'dream', 'peace', 'freedom', 'light', 'bright', 'shine', 'dance', 'party'
];

const NEGATIVE_WORDS = [
  'sad', 'hate', 'angry', 'terrible', 'awful', 'bad', 'worst', 'horrible',
  'pain', 'hurt', 'cry', 'tears', 'broken', 'lost', 'alone', 'dark', 'death',
  'fear', 'scared', 'worry', 'stress', 'problem', 'trouble', 'fight', 'war',
  'sick', 'tired', 'weak', 'fail', 'mistake', 'wrong', 'sorry', 'regret'
];

const HIGH_ENERGY_WORDS = [
  'run', 'jump', 'fast', 'quick', 'rush', 'speed', 'power', 'strong', 'loud',
  'scream', 'shout', 'fight', 'battle', 'fire', 'explosion', 'thunder', 'storm',
  'wild', 'crazy', 'intense', 'extreme', 'maximum', 'boost', 'pump', 'energy',
  'electric', 'shock', 'bang', 'crash', 'smash', 'break', 'destroy', 'rage'
];

const LOW_ENERGY_WORDS = [
  'slow', 'calm', 'quiet', 'soft', 'gentle', 'peaceful', 'rest', 'sleep',
  'relax', 'chill', 'cool', 'smooth', 'easy', 'simple', 'still', 'silent',
  'whisper', 'breathe', 'meditate', 'zen', 'serene', 'tranquil', 'mellow',
  'lazy', 'tired', 'weak', 'fade', 'drift', 'float', 'dream', 'comfort'
];

function cleanLyrics(lyrics: string): string {
  // Remove section headers like [Verse 1], [Chorus], etc.
  return lyrics
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function calculateSentiment(text: string): { valence: number; energy: number } {
  const words = text.split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let highEnergyCount = 0;
  let lowEnergyCount = 0;

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (POSITIVE_WORDS.includes(cleanWord)) positiveCount++;
    if (NEGATIVE_WORDS.includes(cleanWord)) negativeCount++;
    if (HIGH_ENERGY_WORDS.includes(cleanWord)) highEnergyCount++;
    if (LOW_ENERGY_WORDS.includes(cleanWord)) lowEnergyCount++;
  });

  const totalWords = words.length;
  const valence = totalWords > 0 
    ? Math.max(-1, Math.min(1, (positiveCount - negativeCount) / totalWords * 10))
    : 0;
  
  const energy = totalWords > 0
    ? Math.max(0, Math.min(1, (highEnergyCount - lowEnergyCount) / totalWords * 10 + 0.5))
    : 0.5;

  return {
    valence: Math.round(valence * 1000) / 1000,
    energy: Math.round(energy * 1000) / 1000
  };
}

// Mock lyrics data for demonstration (in a real app, you'd fetch from Genius API)
const MOCK_LYRICS: Record<string, string> = {
  // This would be populated with actual lyrics in a real implementation
};

function getMockLyrics(trackName: string, artist: string): string {
  const key = `${trackName.toLowerCase()}_${artist.toLowerCase()}`;
  
  // Return mock lyrics or generate based on track name sentiment
  if (MOCK_LYRICS[key]) {
    return MOCK_LYRICS[key];
  }
  
  // Generate mock sentiment based on track name
  const trackWords = (trackName + ' ' + artist).toLowerCase();
  const hasPositive = POSITIVE_WORDS.some(word => trackWords.includes(word));
  const hasNegative = NEGATIVE_WORDS.some(word => trackWords.includes(word));
  const hasHighEnergy = HIGH_ENERGY_WORDS.some(word => trackWords.includes(word));
  
  if (hasPositive && hasHighEnergy) {
    return "love dance party amazing wonderful energy power strong happy joy celebration";
  } else if (hasNegative) {
    return "sad broken heart pain tears alone dark lost hurt cry";
  } else if (hasHighEnergy) {
    return "fast run jump wild crazy intense maximum power energy electric";
  } else {
    return "calm peaceful quiet gentle soft relax chill smooth easy simple";
  }
}

export async function analyzeTracks(tracks: SimpleTrack[]): Promise<MoodResponse> {
  const enrichedTracks: TrackWithMood[] = [];
  
  for (const track of tracks) {
    // In a real implementation, you would:
    // 1. Check cache first
    // 2. Fetch lyrics from Genius API
    // 3. Use proper sentiment analysis libraries
    
    const mockLyrics = getMockLyrics(track.name, track.artists);
    const cleanedLyrics = cleanLyrics(mockLyrics);
    const sentiment = calculateSentiment(cleanedLyrics);
    
    enrichedTracks.push({
      ...track,
      valence: sentiment.valence,
      energy: sentiment.energy
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate timeline data
  const timeline: MoodPoint[] = [];
  if (enrichedTracks.length > 0) {
    // Group by week
    const weeklyData: Record<string, { valence: number[]; energy: number[] }> = {};
    
    enrichedTracks.forEach(track => {
      const date = new Date(track.added_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { valence: [], energy: [] };
      }
      
      weeklyData[weekKey].valence.push(track.valence);
      weeklyData[weekKey].energy.push(track.energy);
    });
    
    // Calculate averages
    Object.entries(weeklyData).forEach(([week, data]) => {
      const avgValence = data.valence.reduce((a, b) => a + b, 0) / data.valence.length;
      const avgEnergy = data.energy.reduce((a, b) => a + b, 0) / data.energy.length;
      
      timeline.push({
        week,
        valence: Math.round(avgValence * 1000) / 1000,
        energy: Math.round(avgEnergy * 1000) / 1000
      });
    });
    
    // Sort by week
    timeline.sort((a, b) => a.week.localeCompare(b.week));
  }
  
  return {
    timeline,
    tracks: enrichedTracks
  };
}

