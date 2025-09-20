// Utility for calling the music emotion analysis API through Vercel proxy

interface MoodPrediction {
  predicted_moods: string[] | null;
}

interface DeviceInfo {
  cuda_available: boolean;
  mps_available: boolean;
  device_count: number;
  cuda_device_name?: string;
  cuda_memory_allocated?: number;
  cuda_memory_reserved?: number;
  model_device: string;
}

interface HealthResponse {
  message: string;
  status: string;
}

interface EmotionApiError {
  error: string;
  message?: string;
  details?: string;
}

/**
 * Analyze moods from a song using title and artist name
 * @param songTitle - The song title to analyze
 * @param artistName - The artist name
 * @returns Promise with mood analysis results
 */
export const analyzeSongMoods = async (songTitle: string, artistName: string): Promise<MoodPrediction> => {
  try {
    console.log(`🎭 Analyzing moods for: "${songTitle}" by ${artistName}`);
    
    // const response = await fetch(`/api/music-emotion?endpoint=analyse-predict&song_title=${encodeURIComponent(songTitle)}&artist_name=${encodeURIComponent(artistName)}`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   }
    // });

    // Replace forward slashes with a safe placeholder before encoding
    // This prevents routing issues in FastAPI
    const safeSongTitle = songTitle.replace(/\//g, '___SLASH___');
    const safeArtistName = artistName.replace(/\//g, '___SLASH___');

    // Your backend expects the exact format: /analyse&predict/{title}/{artist}
    const encodedTitle = encodeURIComponent(safeSongTitle);
    const encodedArtist = encodeURIComponent(safeArtistName);
    const API_URL = 'https://ktnf72fqnabpy2-8000.proxy.runpod.net';
    const apiKey = process.env.M2E_API_KEY;
    let targetUrl;
    targetUrl = `${API_URL}/analyse&predict/${encodedTitle}/${encodedArtist}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey || ''
      }
    });

    if (!response.ok) {
      const errorData: EmotionApiError = await response.json();
      throw new Error(errorData.message || errorData.error || `API request failed: ${response.status}`);
    }

    const data: MoodPrediction = await response.json();
    
    if (data.predicted_moods && data.predicted_moods.length > 0) {
      console.log('✅ Mood analysis completed:', {
        moods: data.predicted_moods,
        song: `"${songTitle}" by ${artistName}`
      });
    } else {
      console.log(`❌ No moods found for "${songTitle}" by ${artistName}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error analyzing song moods:', error);
    throw error;
  }
};

/**
 * Check the health status of the emotion analysis API
 * @returns Promise<HealthResponse> indicating if the API is working
 */
export const checkApiHealth = async (): Promise<HealthResponse> => {
  try {
    console.log('🏥 Checking API health...');
    
    const response = await fetch('/api/music-emotion?endpoint=health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data: HealthResponse = await response.json();
    console.log('✅ API health check successful:', data);
    return data;
    
  } catch (error) {
    console.error('❌ API health check failed:', error);
    throw error;
  }
};

/**
 * Get device information from the backend
 * @returns Promise<DeviceInfo> with backend device details
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  try {
    console.log('💻 Getting device information...');
    
    const response = await fetch('/api/music-emotion?endpoint=device-info', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Device info request failed: ${response.status}`);
    }

    const data: DeviceInfo = await response.json();
    console.log('✅ Device info retrieved:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Failed to get device info:', error);
    throw error;
  }
};

/**
 * Test the emotion analysis API connectivity with a known song
 * @returns Promise<boolean> indicating if the API is working
 */
export const testEmotionApi = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing emotion analysis API...');
    
    // First check health
    await checkApiHealth();
    
    // Test with a known song (Ed Sheeran - Shape of You)
    const result = await analyzeSongMoods("Shape of You", "Ed Sheeran");
    
    if (result.predicted_moods && result.predicted_moods.length > 0) {
      console.log('✅ Emotion API test successful:', result);
      return true;
    } else {
      console.log('⚠️ API responded but no moods found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Emotion API test failed:', error);
    return false;
  }
};

/**
 * Batch analyze multiple songs for moods
 * @param songs - Array of {title, artist} objects to analyze
 * @param delayMs - Delay between requests to avoid rate limiting
 * @returns Promise with array of results
 */
export const analyzeMultipleSongs = async (
  songs: Array<{title: string, artist: string}>, 
  delayMs: number = 1000
): Promise<Array<{song: string, moods: string[] | null}>> => {
  const results: Array<{song: string, moods: string[] | null}> = [];
  
  for (let i = 0; i < songs.length; i++) {
    try {
      const {title, artist} = songs[i];
      const songIdentifier = `"${title}" by ${artist}`;
      
      console.log(`🎭 Analyzing song ${i + 1}/${songs.length}: ${songIdentifier}`);
      
      const result = await analyzeSongMoods(title, artist);
      results.push({
        song: songIdentifier,
        moods: result.predicted_moods
      });
      
      // Add delay between requests
      if (i < songs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      const {title, artist} = songs[i];
      const songIdentifier = `"${title}" by ${artist}`;
      console.error(`❌ Failed to analyze song ${i + 1}:`, error);
      results.push({
        song: songIdentifier,
        moods: null
      });
    }
  }
  
  return results;
};

export type { MoodPrediction, DeviceInfo, HealthResponse, EmotionApiError };
