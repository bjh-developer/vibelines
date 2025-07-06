import type { SimpleTrack } from "../api/types";

export interface AdvancedSentimentResult {
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
  language: string;
  confidence: number;
  wordCount: number;
  keyPhrases: string[];
}

export interface TrackWithAdvancedMood extends SimpleTrack {
  sentiment: AdvancedSentimentResult;
}

// Enhanced word lists with weights
const EMOTION_LEXICON = {
  joy: {
    words: ['love', 'happy', 'joy', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome', 'beautiful', 'perfect', 'brilliant', 'excellent', 'good', 'best', 'smile', 'laugh', 'fun', 'exciting', 'celebrate', 'victory', 'win', 'success', 'hope', 'dream', 'peace', 'freedom', 'light', 'bright', 'shine', 'dance', 'party', 'bliss', 'ecstasy', 'euphoria', 'delight', 'cheerful', 'elated', 'gleeful', 'jubilant', 'radiant'],
    weight: 1.0
  },
  sadness: {
    words: ['sad', 'cry', 'tears', 'broken', 'lost', 'alone', 'dark', 'death', 'hurt', 'pain', 'sorrow', 'grief', 'melancholy', 'despair', 'hopeless', 'empty', 'void', 'lonely', 'abandoned', 'devastated', 'heartbroken', 'miserable', 'depressed', 'gloomy', 'mourn', 'weep', 'anguish', 'suffering', 'tragic', 'unfortunate'],
    weight: 1.0
  },
  anger: {
    words: ['angry', 'hate', 'rage', 'fury', 'mad', 'pissed', 'furious', 'livid', 'outraged', 'enraged', 'irate', 'hostile', 'aggressive', 'violent', 'fight', 'battle', 'war', 'destroy', 'kill', 'attack', 'revenge', 'vengeance', 'bitter', 'resentful', 'indignant', 'wrathful', 'incensed', 'infuriated', 'seething', 'boiling'],
    weight: 1.0
  },
  fear: {
    words: ['fear', 'scared', 'afraid', 'terrified', 'panic', 'anxiety', 'worry', 'nervous', 'frightened', 'horror', 'terror', 'dread', 'phobia', 'paranoid', 'anxious', 'stressed', 'overwhelmed', 'threatened', 'vulnerable', 'insecure', 'apprehensive', 'alarmed', 'startled', 'petrified', 'horrified', 'spooked', 'uneasy', 'troubled', 'disturbed', 'concerned'],
    weight: 1.0
  },
  surprise: {
    words: ['surprise', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'confused', 'puzzled', 'perplexed', 'baffled', 'mystified', 'flabbergasted', 'astounded', 'dumbfounded', 'speechless', 'awestruck', 'thunderstruck', 'startled', 'taken aback', 'caught off guard', 'unexpected', 'sudden', 'abrupt', 'unforeseen', 'remarkable', 'extraordinary', 'incredible', 'unbelievable', 'mind-blowing', 'jaw-dropping'],
    weight: 1.0
  },
  disgust: {
    words: ['disgusting', 'gross', 'sick', 'nasty', 'revolting', 'repulsive', 'vile', 'foul', 'awful', 'terrible', 'horrible', 'hideous', 'loathsome', 'abhorrent', 'detestable', 'repugnant', 'offensive', 'appalling', 'sickening', 'nauseating', 'putrid', 'rotten', 'filthy', 'dirty', 'contaminated', 'toxic', 'poisonous', 'corrupt', 'tainted', 'despicable'],
    weight: 1.0
  }
};

const ENERGY_LEXICON = {
  high: {
    words: ['run', 'jump', 'fast', 'quick', 'rush', 'speed', 'power', 'strong', 'loud', 'scream', 'shout', 'fight', 'battle', 'fire', 'explosion', 'thunder', 'storm', 'wild', 'crazy', 'intense', 'extreme', 'maximum', 'boost', 'pump', 'energy', 'electric', 'shock', 'bang', 'crash', 'smash', 'break', 'destroy', 'rage', 'explosive', 'dynamic', 'vigorous', 'forceful', 'aggressive', 'fierce', 'turbulent'],
    weight: 1.0
  },
  low: {
    words: ['slow', 'calm', 'quiet', 'soft', 'gentle', 'peaceful', 'rest', 'sleep', 'relax', 'chill', 'cool', 'smooth', 'easy', 'simple', 'still', 'silent', 'whisper', 'breathe', 'meditate', 'zen', 'serene', 'tranquil', 'mellow', 'lazy', 'tired', 'weak', 'fade', 'drift', 'float', 'dream', 'comfort', 'soothing', 'placid', 'subdued', 'passive', 'lethargic', 'sluggish', 'drowsy', 'sleepy', 'inactive'],
    weight: 1.0
  }
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
  es: /\b(el|la|los|las|y|o|pero|en|con|de|por|para)\b/gi,
  fr: /\b(le|la|les|et|ou|mais|dans|avec|de|par|pour)\b/gi,
  de: /\b(der|die|das|und|oder|aber|in|mit|von|für)\b/gi,
  it: /\b(il|la|gli|le|e|o|ma|in|con|di|per)\b/gi,
  pt: /\b(o|a|os|as|e|ou|mas|em|com|de|por|para)\b/gi
};

function detectLanguage(text: string): string {
  const cleanText = text.toLowerCase();
  let maxMatches = 0;
  let detectedLang = 'en';

  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = (cleanText.match(pattern) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

function cleanLyrics(lyrics: string): string {
  return lyrics
    .replace(/\[.*?\]/g, ' ') // Remove section headers
    .replace(/\(.*?x\d+\)/g, ' ') // Remove repetition indicators
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
}

function extractKeyPhrases(text: string): string[] {
  const words = text.split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-3 word phrases that might be meaningful
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 3 && words[i + 1].length > 3) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
    if (i < words.length - 2 && words[i].length > 3 && words[i + 1].length > 2 && words[i + 2].length > 3) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  // Return most frequent phrases
  const phraseCount: Record<string, number> = {};
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
  });
  
  return Object.entries(phraseCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

function calculateAdvancedSentiment(text: string): AdvancedSentimentResult {
  const cleanText = cleanLyrics(text);
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  const wordCount = words.length;
  
  if (wordCount === 0) {
    return {
      valence: 0,
      energy: 0.5,
      emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 },
      language: 'en',
      confidence: 0,
      wordCount: 0,
      keyPhrases: []
    };
  }

  const language = detectLanguage(text);
  
  // Calculate emotion scores
  const emotions = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0
  };

  let totalEmotionWords = 0;
  let highEnergyCount = 0;
  let lowEnergyCount = 0;

  words.forEach(word => {
    // Check emotions
    for (const [emotion, data] of Object.entries(EMOTION_LEXICON)) {
      if (data.words.includes(word)) {
        emotions[emotion as keyof typeof emotions] += data.weight;
        totalEmotionWords++;
      }
    }

    // Check energy
    if (ENERGY_LEXICON.high.words.includes(word)) {
      highEnergyCount += ENERGY_LEXICON.high.weight;
    }
    if (ENERGY_LEXICON.low.words.includes(word)) {
      lowEnergyCount += ENERGY_LEXICON.low.weight;
    }
  });

  // Normalize emotion scores
  Object.keys(emotions).forEach(emotion => {
    emotions[emotion as keyof typeof emotions] = Math.min(1, emotions[emotion as keyof typeof emotions] / wordCount * 10);
  });

  // Calculate valence (positive/negative sentiment)
  const valence = Math.max(-1, Math.min(1, 
    (emotions.joy - emotions.sadness - emotions.anger - emotions.fear - emotions.disgust) * 2
  ));

  // Calculate energy level
  const energy = Math.max(0, Math.min(1, 
    0.5 + (highEnergyCount - lowEnergyCount) / wordCount * 5
  ));

  // Calculate confidence based on emotion word density
  const confidence = Math.min(1, totalEmotionWords / wordCount * 5);

  // Extract key phrases
  const keyPhrases = extractKeyPhrases(cleanText);

  return {
    valence: Math.round(valence * 1000) / 1000,
    energy: Math.round(energy * 1000) / 1000,
    emotions: {
      joy: Math.round(emotions.joy * 1000) / 1000,
      sadness: Math.round(emotions.sadness * 1000) / 1000,
      anger: Math.round(emotions.anger * 1000) / 1000,
      fear: Math.round(emotions.fear * 1000) / 1000,
      surprise: Math.round(emotions.surprise * 1000) / 1000,
      disgust: Math.round(emotions.disgust * 1000) / 1000
    },
    language,
    confidence: Math.round(confidence * 1000) / 1000,
    wordCount,
    keyPhrases
  };
}

// Mock lyrics database with more sophisticated examples
const ADVANCED_MOCK_LYRICS: Record<string, string> = {
  // Happy/energetic songs
  'happy_upbeat': 'dancing in the sunshine feeling so alive energy flowing through my veins joy happiness celebration party time amazing wonderful life is beautiful',
  'love_song': 'love you forever heart beating fast together always happiness joy beautiful amazing wonderful perfect moments dancing under stars',
  
  // Sad/melancholic songs
  'sad_ballad': 'tears falling down broken heart alone in darkness lost without you pain sorrow grief empty void crying lonely abandoned',
  'heartbreak': 'goodbye forever lost love broken dreams shattered heart pain tears crying alone dark empty sad memories haunting',
  
  // Angry/intense songs
  'rock_anthem': 'rage fire burning fight battle power strong aggressive intense energy explosive force destroy break smash',
  'protest_song': 'angry mad fight injustice rage fury battle revolution power struggle intense aggressive force',
  
  // Calm/peaceful songs
  'meditation': 'peaceful calm quiet gentle soft serene tranquil meditation breathe relax zen harmony balance stillness',
  'lullaby': 'sleep peaceful dreams gentle soft quiet calm rest comfort soothing tender love protection safety'
};

function getMockLyricsAdvanced(trackName: string, artist: string): string {
  const trackWords = (trackName + ' ' + artist).toLowerCase();
  
  // Check for specific patterns in track/artist names
  if (trackWords.includes('love') || trackWords.includes('heart')) {
    return ADVANCED_MOCK_LYRICS.love_song;
  } else if (trackWords.includes('sad') || trackWords.includes('cry') || trackWords.includes('tear')) {
    return ADVANCED_MOCK_LYRICS.sad_ballad;
  } else if (trackWords.includes('rock') || trackWords.includes('metal') || trackWords.includes('punk')) {
    return ADVANCED_MOCK_LYRICS.rock_anthem;
  } else if (trackWords.includes('calm') || trackWords.includes('peace') || trackWords.includes('quiet')) {
    return ADVANCED_MOCK_LYRICS.meditation;
  } else if (trackWords.includes('happy') || trackWords.includes('dance') || trackWords.includes('party')) {
    return ADVANCED_MOCK_LYRICS.happy_upbeat;
  } else if (trackWords.includes('break') || trackWords.includes('goodbye') || trackWords.includes('end')) {
    return ADVANCED_MOCK_LYRICS.heartbreak;
  } else if (trackWords.includes('sleep') || trackWords.includes('dream') || trackWords.includes('night')) {
    return ADVANCED_MOCK_LYRICS.lullaby;
  } else if (trackWords.includes('fight') || trackWords.includes('war') || trackWords.includes('battle')) {
    return ADVANCED_MOCK_LYRICS.protest_song;
  }
  
  // Default to a balanced emotional song
  return 'life is a journey with ups and downs sometimes happy sometimes sad but always moving forward with hope and dreams';
}

export async function analyzeTracksAdvanced(tracks: SimpleTrack[]): Promise<TrackWithAdvancedMood[]> {
  const enrichedTracks: TrackWithAdvancedMood[] = [];
  
  for (const track of tracks) {
    // Get mock lyrics (in production, this would fetch from Genius API)
    const mockLyrics = getMockLyricsAdvanced(track.name, track.artists);
    
    // Perform advanced sentiment analysis
    const sentiment = calculateAdvancedSentiment(mockLyrics);
    
    enrichedTracks.push({
      ...track,
      sentiment
    });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return enrichedTracks;
}

