// Spotify OAuth and API utilities

// Backend API Configuration
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

// Store auth data in session storage
const storeAuthData = (key: string, value: string): void => {
  sessionStorage.setItem(`spotify_${key}`, value);
};

// Get auth data from session storage
const getAuthData = (key: string): string | null => {
  return sessionStorage.getItem(`spotify_${key}`);
};

// Remove auth data from session storage
const removeAuthData = (key: string): void => {
  sessionStorage.removeItem(`spotify_${key}`);
};

// Start the OAuth flow - now redirects to backend
export const initiateSpotifyAuth = async (): Promise<void> => {
  console.log('🔐 Initiating backend-based Spotify OAuth...');
  
  // Redirect to backend OAuth endpoint
  const backendAuthUrl = `${API_BASE_URL}/spotify-oauth?action=login`;
  window.location.href = backendAuthUrl;
};

// Handle the callback from backend OAuth
export const handleSpotifyCallback = async (sessionToken: string): Promise<boolean> => {
  try {
    console.log('🔐 Processing session token from backend...');
    
    // Store the session token
    storeAuthData('session_token', sessionToken);
    
    // Set expiry (24 hours from now)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    storeAuthData('expires_at', expiresAt.toString());
    
    return true;
  } catch (error) {
    console.error('Error processing session token:', error);
    return false;
  }
};

// Interface for Spotify API responses
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null; // Legacy Spotify preview (deprecated - we use Deezer for mood analysis)
  added_at?: string; // Date when the song was added to liked songs
}

export interface SpotifyLikedTracksResponse {
  items: Array<{
    added_at: string;
    track: SpotifyTrack;
  }>;
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const sessionToken = getAuthData('session_token');
  const expiresAt = getAuthData('expires_at');
  
  if (!sessionToken || !expiresAt) {
    return false;
  }

  return Date.now() < parseInt(expiresAt);
};

// Get session token
export const getSessionToken = (): string | null => {
  if (!isAuthenticated()) {
    return null;
  }
  return getAuthData('session_token');
};

// Make authenticated API request to backend
const makeSpotifyRequest = async (endpoint: string): Promise<any> => {
  const sessionToken = getSessionToken();
  
  if (!sessionToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/spotify-oauth?action=${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
  });

  if (response.status === 401) {
    // Session expired, redirect to login
    removeAuthData('session_token');
    removeAuthData('expires_at');
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

// Get user profile
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  return makeSpotifyRequest('user');
};

// Get user's liked songs using backend/NocodeAPI
export const getLikedSongs = async (limit: number = 50, offset: number = 0): Promise<SpotifyLikedTracksResponse> => {
  const sessionToken = getSessionToken();
  
  if (!sessionToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/spotify-oauth?action=tracks&limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
  });

  if (response.status === 401) {
    // Session expired, redirect to login
    removeAuthData('session_token');
    removeAuthData('expires_at');
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};


// Get all liked songs (paginated) - keeping for backward compatibility
export const getAllLikedSongs = async (): Promise<SpotifyTrack[]> => {
  const allTracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 50;
  
  try {
    console.log('📚 Fetching ALL liked songs from Spotify...');
    
    while (true) {
      console.log(`🔄 Fetching songs ${offset + 1}-${offset + limit}...`);
      const response = await getLikedSongs(limit, offset);
      
      // Map items to tracks while preserving the added_at information
      const tracks = response.items.map(item => ({
        ...item.track,
        added_at: item.added_at // Include the date when the song was added
      }));
      
      allTracks.push(...tracks);
      
      console.log(`✅ Fetched ${tracks.length} songs (total: ${allTracks.length})`);
      
      if (response.items.length < limit || !response.next) {
        break;
      }
      
      offset += limit;
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Finished fetching all ${allTracks.length} liked songs`);
    return allTracks;
  } catch (error) {
    console.error('Error fetching all liked songs:', error);
    throw error;
  }
};

// Search for a track and get album cover - Note: This may need backend implementation for search endpoint
export const searchTrackAlbumCover = async (trackName: string, artistName: string): Promise<string | null> => {
  try {
    // For now, return null as search functionality would need additional backend endpoint
    // This can be implemented later if needed
    console.log('Track search not implemented in backend yet:', trackName, artistName);
    return null;
  } catch (error) {
    console.error('Error searching for track:', error);
    return null;
  }
};


