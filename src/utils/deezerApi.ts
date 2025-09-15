// Deezer API utilities for fetching 30-second preview URLs
// Deezer API: https://api.deezer.com/search?q=track:"Song Title" artist:"Artist Name"

export interface DeezerSearchResult {
  data: Array<{
    id: number;
    title: string;
    title_short: string;
    link: string;
    duration: number;
    rank: number;
    explicit_lyrics: boolean;
    preview: string; // 30-second MP3 preview URL
    artist: {
      id: number;
      name: string;
      link: string;
      picture: string;
      picture_small: string;
      picture_medium: string;
      picture_big: string;
      picture_xl: string;
    };
    album: {
      id: number;
      title: string;
      cover: string;
      cover_small: string;
      cover_medium: string;
      cover_big: string;
      cover_xl: string;
    };
  }>;
  total: number;
  next?: string;
}

// Cache for Deezer search results
const deezerCache = new Map<string, string>();

// Rate limiting: 50 requests per 5 seconds
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 50;
  private readonly timeWindow = 5000; // 5 seconds in milliseconds

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      console.log(`🚦 Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Clean up requests again after waiting
      const newNow = Date.now();
      this.requests = this.requests.filter(time => newNow - time < this.timeWindow);
    }
    
    // Record this request
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

// Clean and format search query for Deezer API
const formatDeezerQuery = (songTitle: string, artistName: string): string => {
  // Escape quotes and format for Deezer search
  const cleanTitle = songTitle.replace(/"/g, '').trim();
  const cleanArtist = artistName.replace(/"/g, '').trim();
  
  // Deezer search format: track:"Song Title" artist:"Artist Name"
  return `track:"${cleanTitle}" artist:"${cleanArtist}"`;
};

// Get Deezer preview URL for a track
export const getDeezerPreviewUrl = async (songTitle: string, artistName: string): Promise<string | null> => {
  try {
    const cacheKey = `${artistName}-${songTitle}`;
    
    // Check cache first
    if (deezerCache.has(cacheKey)) {
      const cached = deezerCache.get(cacheKey)!;
      return cached === '' ? null : cached; // Empty string means no preview found
    }

    // Wait for rate limit if needed
    await rateLimiter.waitIfNeeded();

    const searchQuery = formatDeezerQuery(songTitle, artistName);
    // Use Vite proxy to avoid CORS issues
    const deezerUrl = `/api/deezer/search?q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    console.log(`🎵 Searching Deezer for: ${songTitle} by ${artistName}`);
    console.log(`🔗 Deezer URL: ${deezerUrl}`);

    const response = await fetch(deezerUrl);
    
    if (!response.ok) {
      throw new Error(`Deezer API request failed: ${response.status}`);
    }

    const data: DeezerSearchResult = await response.json();
    
    if (data.data.length > 0 && data.data[0]?.preview) {
      const previewUrl = data.data[0].preview;
      
      // Cache the result
      deezerCache.set(cacheKey, previewUrl);
      
      console.log(`✅ Found Deezer preview for "${songTitle}" by ${artistName}`);
      return previewUrl;
    } else {
      console.log(`❌ No Deezer preview found for "${songTitle}" by ${artistName}`);
      deezerCache.set(cacheKey, ''); // Cache empty result to avoid repeated requests
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching Deezer preview for "${songTitle}" by ${artistName}:`, error);
    return null;
  }
};

// Batch fetch Deezer preview URLs for multiple tracks
export const batchGetDeezerPreviewUrls = async (
  tracks: Array<{ id: string; name: string; artists: Array<{ name: string }> }>,
  onProgress?: (completed: number, total: number, currentSong?: string) => void
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  
  console.log(`🎼 Starting batch Deezer preview URL fetch for ${tracks.length} tracks`);
  
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const artistName = track.artists[0]?.name || 'Unknown Artist';
    const currentSong = `${track.name} by ${artistName}`;
    
    try {
      if (onProgress) {
        onProgress(i, tracks.length, currentSong);
      }
      
      const previewUrl = await getDeezerPreviewUrl(track.name, artistName);
      
      if (previewUrl) {
        results.set(track.id, previewUrl);
        console.log(`✅ ${i + 1}/${tracks.length}: Found preview for ${currentSong}`);
      } else {
        console.log(`⏭️ ${i + 1}/${tracks.length}: No preview for ${currentSong}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to get Deezer preview for track ${track.id}:`, error);
      // Continue with other tracks
    }
  }
  
  if (onProgress) {
    onProgress(tracks.length, tracks.length);
  }
  
  console.log(`🎉 Deezer preview URL fetch completed. Found ${results.size} preview URLs out of ${tracks.length} tracks.`);
  return results;
};

// Test function to verify Deezer API connectivity
export const testDeezerApi = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Deezer API...');
    
    const testQuery = formatDeezerQuery("Shape of You", "Ed Sheeran");
    const testUrl = `https://api.deezer.com/search?q=${encodeURIComponent(testQuery)}&limit=1`;
    
    console.log('🔗 Test query:', testQuery);
    console.log('🔗 Test URL:', testUrl);
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.error('❌ Deezer API test failed:', response.status);
      return false;
    }
    
    const data: DeezerSearchResult = await response.json();
    console.log('✅ Deezer API test successful:', {
      found: data.data.length,
      hasPreview: data.data[0]?.preview ? 'Yes' : 'No',
      preview: data.data[0]?.preview
    });
    return true;
  } catch (error) {
    console.error('❌ Deezer API test error:', error);
    return false;
  }
};

// Audio manager for smooth music transitions
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private fadeTimeout: NodeJS.Timeout | null = null;
  private currentPreviewUrl: string | null = null;
  private allAudioInstances: Set<HTMLAudioElement> = new Set();
  private currentCardId: string | number | null = null;
  private pendingPlayPromise: Promise<void> | null = null;

  async playTrack(previewUrl: string, cardId: string | number, volume: number = 0.3): Promise<void> {
    // Cancel any pending play operations
    if (this.pendingPlayPromise) {
      console.log('🎵 Cancelling pending play operation');
    }

    // Set this as the pending operation
    const playOperation = this._playTrackInternal(previewUrl, cardId, volume);
    this.pendingPlayPromise = playOperation;

    try {
      await playOperation;
    } finally {
      // Clear pending operation if it's still the current one
      if (this.pendingPlayPromise === playOperation) {
        this.pendingPlayPromise = null;
      }
    }
  }

  private async _playTrackInternal(previewUrl: string, cardId: string | number, volume: number): Promise<void> {
    // Don't restart the same track for the same card
    if (this.currentPreviewUrl === previewUrl && 
        this.currentCardId === cardId && 
        this.currentAudio && 
        !this.currentAudio.paused) {
      console.log('🎵 Same track already playing for same card, skipping');
      return;
    }

    // Always stop all audio first - this ensures only one track plays at a time
    await this.stopAllAudioImmediate();

    try {
      console.log(`🎵 Starting to play preview for card ${cardId}:`, previewUrl);
      const audio = new Audio(previewUrl);
      audio.volume = 0;
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      
      // Track this audio instance
      this.allAudioInstances.add(audio);
      
      // Add event listeners for cleanup
      audio.addEventListener('ended', () => {
        this.cleanupAudio(audio);
      });
      
      audio.addEventListener('error', () => {
        this.cleanupAudio(audio);
      });
      
      // Start playing
      await audio.play();
      
      // Double-check we're still the active operation
      if (this.currentCardId !== null && this.currentCardId !== cardId) {
        console.log('🎵 Card changed during audio load, stopping this audio');
        this.cleanupAudio(audio);
        return;
      }
      
      // Set as current
      this.currentAudio = audio;
      this.currentPreviewUrl = previewUrl;
      this.currentCardId = cardId;
      this.fadeIn(audio, volume);
      
      console.log(`🎵 Now playing preview for card ${cardId} with fade in`);
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  }

  // Immediately stop all audio without fade for quick card changes
  private async stopAllAudioImmediate(): Promise<void> {
    console.log('🛑 Stopping all audio immediately');
    
    // Clear fade timeout
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
    
    // Stop current audio immediately
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.volume = 0;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch (error) {
        console.warn('Warning: Could not stop current audio:', error);
      }
    }
    
    // Force stop all tracked audio instances immediately
    this.allAudioInstances.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
        audio.src = '';
        audio.load();
      } catch (error) {
        console.warn('Warning: Could not stop audio instance:', error);
      }
    });
    
    // Clear all references
    this.allAudioInstances.clear();
    this.currentAudio = null;
    this.currentPreviewUrl = null;
    this.currentCardId = null;

    // Stop all page audio elements as additional safety
    this.stopAllPageAudio();

    // Small delay to ensure all operations complete
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Get current card ID for debugging
  getCurrentCardId(): string | number | null {
    return this.currentCardId;
  }

  // Force stop with immediate effect (no fade)
  stopImmediate(): void {
    console.log('🛑 Force stopping all audio immediately');
    this.stopAllAudioImmediate();
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number): void {
    // Clear any existing fade timeout
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }
    
    const fadeStep = targetVolume / 30; // 30 steps for smoother fade
    const fadeInterval = 50; // 50ms per step = 1.5 second total
    
    let currentVolume = 0;
    const fade = () => {
      if (currentVolume < targetVolume && audio === this.currentAudio && !audio.paused) {
        currentVolume += fadeStep;
        audio.volume = Math.min(currentVolume, targetVolume);
        this.fadeTimeout = setTimeout(fade, fadeInterval);
      } else {
        // Clear timeout when fade is complete
        this.fadeTimeout = null;
      }
    };
    fade();
  }

  private fadeOut(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve) => {
      const initialVolume = audio.volume;
      const fadeStep = initialVolume / 20; // 20 steps
      const fadeInterval = 25; // 25ms per step = 0.5 second total
      
      const fade = () => {
        if (audio.volume > 0.01) { // Stop fading when volume is very low
          audio.volume = Math.max(audio.volume - fadeStep, 0);
          setTimeout(fade, fadeInterval);
        } else {
          // Ensure complete stop
          audio.volume = 0;
          audio.pause();
          audio.currentTime = 0; // Reset to beginning
          audio.src = ''; // Clear source to free memory
          this.cleanupAudio(audio);
          resolve();
        }
      };
      fade();
    });
  }

  private cleanupAudio(audio: HTMLAudioElement): void {
    // Remove from tracking set
    this.allAudioInstances.delete(audio);
    
    // If this was the current audio, clear the reference
    if (this.currentAudio === audio) {
      this.currentAudio = null;
      this.currentPreviewUrl = null;
      this.currentCardId = null;
    }
    
    // Ensure audio is completely stopped
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load(); // Reset the audio element
    } catch (error) {
      console.warn('Warning: Could not fully cleanup audio:', error);
    }
  }

  stop(): void {
    console.log('🛑 Stopping all audio playback');
    
    // Stop current audio with fade
    if (this.currentAudio) {
      this.fadeOut(this.currentAudio);
    }
    
    // Force stop all tracked audio instances
    this.allAudioInstances.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
        audio.src = '';
        audio.load();
      } catch (error) {
        console.warn('Warning: Could not stop audio instance:', error);
      }
    });
    
    // Clear all references
    this.allAudioInstances.clear();
    this.currentAudio = null;
    this.currentPreviewUrl = null;
    this.currentCardId = null;
    this.pendingPlayPromise = null;
    
    // Clear any pending fade timeout
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    // Additional safety: stop ALL audio elements on the page
    this.stopAllPageAudio();
  }

  private stopAllPageAudio(): void {
    try {
      // Find all audio elements on the page and stop them
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0;
          audio.src = '';
          audio.load();
        } catch (error) {
          console.warn('Warning: Could not stop page audio element:', error);
        }
      });
      console.log(`🛑 Stopped ${allAudioElements.length} audio elements found on page`);
    } catch (error) {
      console.warn('Warning: Could not stop all page audio:', error);
    }
  }

  getCurrentPreviewUrl(): string | null {
    return this.currentPreviewUrl;
  }

  // Debug method to check for lingering audio
  debugAudioState(): void {
    console.log('🔍 Audio Manager Debug State:');
    console.log('Current audio:', this.currentAudio);
    console.log('Current preview URL:', this.currentPreviewUrl);
    console.log('Current card ID:', this.currentCardId);
    console.log('Tracked audio instances:', this.allAudioInstances.size);
    console.log('Fade timeout active:', !!this.fadeTimeout);
    console.log('Pending play promise active:', !!this.pendingPlayPromise);
    
    // Check all audio elements on page
    const allPageAudio = document.querySelectorAll('audio');
    console.log('Total audio elements on page:', allPageAudio.length);
    
    allPageAudio.forEach((audio, index) => {
      console.log(`Audio element ${index}:`, {
        paused: audio.paused,
        volume: audio.volume,
        currentTime: audio.currentTime,
        src: audio.src,
        duration: audio.duration
      });
    });
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Global cleanup when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    audioManager.stop();
  });
  
  // Also stop audio when navigating away (for SPAs)
  window.addEventListener('pagehide', () => {
    audioManager.stop();
  });
}
