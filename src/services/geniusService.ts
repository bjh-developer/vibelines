import { cacheService } from './cacheService';

export interface GeniusSearchResult {
  id: number;
  title: string;
  artist: string;
  url: string;
  lyrics_url: string;
  release_date?: string;
  album?: string;
  mock?: boolean;
}

export interface LyricsResult {
  lyrics: string;
  url: string;
  source: 'cache' | 'genius' | 'mock';
  cached: boolean;
}

class GeniusService {
  private readonly API_BASE = '/api'; // Use Vercel Serverless Functions
  
  async searchSong(songName: string, artistName: string): Promise<GeniusSearchResult | null> {
    try {
      const response = await fetch(`${this.API_BASE}/genius-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song: songName,
          artist: artistName
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Genius search failed:', error);
      return null;
    }
  }

  async getLyrics(trackId: string, trackName: string, artistName: string): Promise<LyricsResult> {
    // Check cache first
    const cached = cacheService.getCachedLyrics(trackId);
    if (cached) {
      return {
        lyrics: cached.lyrics,
        url: cached.geniusUrl || '',
        source: cached.source,
        cached: true
      };
    }

    try {
      // Search for the song
      const searchResult = await this.searchSong(trackName, artistName);
      
      if (!searchResult) {
        // Fallback to mock lyrics
        const mockLyrics = this.generateMockLyrics(trackName, artistName);
        await cacheService.cacheLyrics(trackId, trackName, artistName, mockLyrics, undefined, 'mock');
        
        return {
          lyrics: mockLyrics,
          url: '',
          source: 'mock',
          cached: false
        };
      }

      // Try to get lyrics from the URL
      const lyricsResult = await this.scrapeLyrics(searchResult.url);
      
      if (lyricsResult.lyrics) {
        // Cache the lyrics
        const source = searchResult.mock ? 'mock' : 'genius';
        await cacheService.cacheLyrics(
          trackId, 
          trackName, 
          artistName, 
          lyricsResult.lyrics, 
          searchResult.url, 
          source
        );
        
        return {
          lyrics: lyricsResult.lyrics,
          url: searchResult.url,
          source: source,
          cached: false
        };
      } else {
        // Fallback to mock if scraping fails
        const mockLyrics = this.generateMockLyrics(trackName, artistName);
        await cacheService.cacheLyrics(trackId, trackName, artistName, mockLyrics, searchResult.url, 'mock');
        
        return {
          lyrics: mockLyrics,
          url: searchResult.url,
          source: 'mock',
          cached: false
        };
      }
    } catch (error) {
      console.warn('Failed to get lyrics:', error);
      
      // Fallback to mock lyrics
      const mockLyrics = this.generateMockLyrics(trackName, artistName);
      await cacheService.cacheLyrics(trackId, trackName, artistName, mockLyrics, undefined, 'mock');
      
      return {
        lyrics: mockLyrics,
        url: '',
        source: 'mock',
        cached: false
      };
    }
  }

  private async scrapeLyrics(geniusUrl: string): Promise<{ lyrics: string; url: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/lyrics-scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: geniusUrl })
      });

      if (!response.ok) {
        throw new Error(`Lyrics scraping failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        lyrics: data.lyrics || '',
        url: geniusUrl
      };
    } catch (error) {
      console.warn('Lyrics scraping failed:', error);
      return { lyrics: '', url: geniusUrl };
    }
  }

  private generateMockLyrics(trackName: string, artistName: string): string {
    const trackWords = (trackName + ' ' + artistName).toLowerCase();
    
    // Enhanced mock lyrics based on track characteristics
    const mockTemplates = {
      love: [
        'love you forever heart beating fast together always happiness joy beautiful amazing wonderful perfect moments dancing under stars',
        'your love lifts me higher than mountains touching the sky together we shine bright like diamonds in the night',
        'every moment with you feels like magic love flowing through my veins happiness beyond measure'
      ],
      sad: [
        'tears falling down broken heart alone in darkness lost without you pain sorrow grief empty void crying lonely abandoned',
        'memories haunt me in the silence of the night broken dreams scattered like leaves in the wind',
        'walking through shadows of what we used to be empty rooms echo with forgotten laughter'
      ],
      happy: [
        'dancing in the sunshine feeling so alive energy flowing through my veins joy happiness celebration party time amazing wonderful life is beautiful',
        'every day is a gift wrapped in golden sunlight smiling faces everywhere spreading joy and laughter',
        'celebration time dancing through the streets music in the air happiness everywhere'
      ],
      rock: [
        'rage fire burning fight battle power strong aggressive intense energy explosive force destroy break smash',
        'thunder rolling through the night electric guitars screaming loud power chords shaking the ground',
        'rebellion in our hearts fighting for what we believe standing strong against the storm'
      ],
      calm: [
        'peaceful calm quiet gentle soft serene tranquil meditation breathe relax zen harmony balance stillness',
        'gentle waves washing over sandy shores peaceful moments in the morning light soft whispers of the wind',
        'finding peace in simple moments breathing deeply feeling centered and whole'
      ]
    };

    // Determine category based on track/artist name
    let category = 'happy'; // default
    if (trackWords.includes('love') || trackWords.includes('heart')) category = 'love';
    else if (trackWords.includes('sad') || trackWords.includes('cry') || trackWords.includes('tear')) category = 'sad';
    else if (trackWords.includes('rock') || trackWords.includes('metal') || trackWords.includes('punk')) category = 'rock';
    else if (trackWords.includes('calm') || trackWords.includes('peace') || trackWords.includes('quiet')) category = 'calm';
    else if (trackWords.includes('happy') || trackWords.includes('dance') || trackWords.includes('party')) category = 'happy';

    const templates = mockTemplates[category as keyof typeof mockTemplates];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return randomTemplate;
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Test with a simple search to verify the API is working
      const result = await this.searchSong('test', 'test');
      return result !== null;
    } catch (error) {
      return false;
    }
  }
}

export const geniusService = new GeniusService();

