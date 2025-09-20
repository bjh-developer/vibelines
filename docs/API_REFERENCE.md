# Vibelines API Reference

## Overview

This document provides comprehensive API documentation for the Vibelines application, covering both frontend and backend API endpoints, data models, and integration patterns.

---

## Table of Contents

1. [Spotify Web API Integration](#spotify-web-api-integration)
2. [Music2Emotion API](#music2emotion-api)
3. [Deezer API Integration](#deezer-api-integration)
4. [Supabase Database API](#supabase-database-api)
5. [OpenRouter/Gemini LLM API](#openroutergemini-llm-api)
6. [Vercel Proxy API](#vercel-proxy-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Authentication](#authentication)

---

## Spotify Web API Integration

### Base Configuration
```typescript
const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.VITE_SPOTIFY_CLIENT_ID,
  REDIRECT_URI: process.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback',
  SCOPES: [
    'user-library-read',
    'user-read-private', 
    'user-read-email'
  ],
  BASE_URL: 'https://api.spotify.com/v1'
};
```

### Authentication Endpoints

#### Initiate OAuth Flow
```typescript
function initiateSpotifyAuth(): void {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    scope: SPOTIFY_CONFIG.SCOPES.join(' '),
    redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
    state: generateRandomString(16)
  });
  
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}
```

#### Exchange Code for Token
```typescript
interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  scope: string;
  expires_in: number;
  refresh_token: string;
}

async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET, // Server-side only
    }),
  });
  
  return response.json();
}
```

### Data Endpoints

#### Get User Profile
```typescript
interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  country: string;
  product: 'free' | 'premium';
}

async function getCurrentUser(): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_CONFIG.BASE_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  
  return response.json();
}
```

#### Get Liked Songs
```typescript
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
  };
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  popularity: number;
}

interface LikedSongsResponse {
  items: Array<{
    added_at: string;
    track: SpotifyTrack;
  }>;
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

async function fetchLikedSongs(
  limit: number = 50,
  offset: number = 0
): Promise<LikedSongsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    market: 'US',
  });
  
  const response = await fetch(
    `${SPOTIFY_CONFIG.BASE_URL}/me/tracks?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch liked songs: ${response.status}`);
  }
  
  return response.json();
}
```

---

## Music2Emotion API

### Base Configuration
```typescript
const M2E_CONFIG = {
  BASE_URL: 'http://104.198.230.255', // AWS EC2 instance
  API_KEY: process.env.M2E_API_KEY,
  TIMEOUT: 30000, // 30 seconds
};
```

### Endpoints

#### Health Check
```typescript
// GET /
interface HealthResponse {
  message: string;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}

async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${M2E_CONFIG.BASE_URL}/`);
  return response.json();
}
```

#### Analyze Song Emotion
```typescript
// POST /analyze-song
interface AnalyzeSongRequest {
  song_name: string;
  artist_name: string;
}

interface AnalyzeSongResponse {
  song_name: string;
  artist_name: string;
  emotions: string[];
  confidence_scores: number[];
  preview_url?: string;
  processing_time: number;
}

async function analyzeSong(request: AnalyzeSongRequest): Promise<AnalyzeSongResponse> {
  const response = await fetch(`${M2E_CONFIG.BASE_URL}/analyze-song`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': M2E_CONFIG.API_KEY,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Music2Emotion API error: ${error.detail || response.status}`);
  }
  
  return response.json();
}
```

---

## Supabase Database API

### Schema
```sql
-- mood_analysis table
CREATE TABLE mood_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  predicted_moods TEXT[] NOT NULL,
  confidence_scores DECIMAL[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_timelines table  
CREATE TABLE user_timelines (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  timeline_data JSONB NOT NULL,
  song_count INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Operations
```typescript
// Insert mood analysis
async function insertMoodAnalysis(data: {
  user_id: string;
  song_name: string;
  artist_name: string;
  predicted_moods: string[];
  confidence_scores: number[];
}) {
  const { data: result, error } = await supabase
    .from('mood_analysis')
    .insert(data)
    .select()
    .single();
    
  if (error) throw new Error(`Database error: ${error.message}`);
  return result;
}
```

---

## OpenRouter/Gemini LLM API

### Timeline Generation
```typescript
interface TimelineData {
  Chapters: Record<string, string>;
  Phases: Record<string, string>;
  Contents: Record<string, string>;
  Soundtracks: Record<string, string>;
}

async function generateTimeline(moodsData: Array<{
  track_name: string;
  artist_name: string;
  date_added: string;
  predicted_moods: string[];
}>): Promise<TimelineData> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [{
        role: 'user',
        content: createTimelinePrompt(moodsData),
      }],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## Error Handling

### Error Types
```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Usage
try {
  const result = await analyzeSong({ song_name: 'Test', artist_name: 'Artist' });
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error on ${error.endpoint}: ${error.message}`);
  }
}
```

### Retry Logic
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Rate Limiting

### Implementation
```typescript
class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - Math.min(...this.requests));
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }
    
    this.requests.push(now);
  }
}

// Usage
const spotifyLimiter = new RateLimiter(1, 1000); // 1 req/sec
```

---

## Authentication

### Token Management
```typescript
class TokenManager {
  private static readonly STORAGE_KEY = 'spotify_tokens';
  
  static saveTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
  }
  
  static async getValidAccessToken(): Promise<string> {
    const tokens = this.getTokens();
    if (!tokens) throw new Error('No tokens available');
    
    if (Date.now() < tokens.expires_at) {
      return tokens.access_token;
    }
    
    return this.refreshTokens(tokens.refresh_token);
  }
}
```

---

This API reference covers all the essential endpoints and patterns used in the Vibelines application.