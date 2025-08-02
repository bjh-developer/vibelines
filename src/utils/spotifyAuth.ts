// Spotify OAuth and API utilities

// Spotify App Configuration
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE_URL = 'https://api.spotify.com/v1';

// Scopes needed for accessing liked songs
const SCOPES = [
  'user-library-read',
  'user-read-private',
  'user-read-email'
].join(' ');

// Generate random string for state parameter
const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

// Generate code verifier for PKCE
const generateCodeVerifier = (): string => {
  return generateRandomString(128);
};

// Generate code challenge for PKCE
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

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

// Start the OAuth flow
export const initiateSpotifyAuth = async (): Promise<void> => {
  // Check if CLIENT_ID is configured
  if (CLIENT_ID === 'your_spotify_client_id') {
    console.error('Spotify Client ID not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file');
    alert('Spotify Client ID not configured. Please check your .env file.');
    return;
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  // Store code verifier and state for later use
  storeAuthData('code_verifier', codeVerifier);
  storeAuthData('state', state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: state,
    scope: SCOPES,
  });

  console.log('Redirecting to Spotify auth with redirect URI:', REDIRECT_URI);
  
  // Redirect to Spotify authorization
  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
};

// Handle the callback from Spotify
export const handleSpotifyCallback = async (code: string, state: string): Promise<boolean> => {
  const storedState = getAuthData('state');
  const codeVerifier = getAuthData('code_verifier');

  if (state !== storedState) {
    console.error('State mismatch');
    return false;
  }

  if (!codeVerifier) {
    console.error('Code verifier not found');
    return false;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const data = await response.json();
    
    // Store tokens
    storeAuthData('access_token', data.access_token);
    storeAuthData('refresh_token', data.refresh_token);
    storeAuthData('expires_at', (Date.now() + data.expires_in * 1000).toString());

    // Clean up temporary storage
    removeAuthData('code_verifier');
    removeAuthData('state');

    return true;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const accessToken = getAuthData('access_token');
  const expiresAt = getAuthData('expires_at');
  
  if (!accessToken || !expiresAt) {
    return false;
  }

  return Date.now() < parseInt(expiresAt);
};

// Get access token
export const getAccessToken = (): string | null => {
  if (!isAuthenticated()) {
    return null;
  }
  return getAuthData('access_token');
};

// Refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getAuthData('refresh_token');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update stored tokens
    storeAuthData('access_token', data.access_token);
    storeAuthData('expires_at', (Date.now() + data.expires_in * 1000).toString());
    
    // Update refresh token if provided
    if (data.refresh_token) {
      storeAuthData('refresh_token', data.refresh_token);
    }

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Make authenticated API request
const makeSpotifyRequest = async (endpoint: string): Promise<any> => {
  let accessToken = getAccessToken();
  
  if (!accessToken) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Authentication required');
    }
    accessToken = getAccessToken();
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = getAccessToken();
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!retryResponse.ok) {
        throw new Error(`API request failed: ${retryResponse.status}`);
      }
      
      return retryResponse.json();
    } else {
      throw new Error('Authentication required');
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

// Get user profile
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  return makeSpotifyRequest('/me');
};

// Get user's liked songs
export const getLikedSongs = async (limit: number = 50, offset: number = 0): Promise<SpotifyLikedTracksResponse> => {
  return makeSpotifyRequest(`/me/tracks?limit=${limit}&offset=${offset}`);
};

// Get all liked songs (paginated)
export const getAllLikedSongs = async (): Promise<SpotifyTrack[]> => {
  const allTracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 50;
  
  try {
    while (true) {
      const response = await getLikedSongs(limit, offset);
      const tracks = response.items.map(item => item.track);
      allTracks.push(...tracks);
      
      if (response.items.length < limit || !response.next) {
        break;
      }
      
      offset += limit;
    }
    
    return allTracks;
  } catch (error) {
    console.error('Error fetching all liked songs:', error);
    throw error;
  }
};

// Logout user
export const logout = (): void => {
  removeAuthData('access_token');
  removeAuthData('refresh_token');
  removeAuthData('expires_at');
  removeAuthData('code_verifier');
  removeAuthData('state');
};
