import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Environment variables
const SPOTIFY_CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const NOCODE_API_KEY = process.env.NOCODE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Dynamic frontend URL detection for different environments
  // Get frontend URL from environment
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vibelines-git-nocodeapi-workaround-bjh-developers-projects.vercel.app';

// In-memory session store (use Redis in production)
const userSessions = new Map();

export default async function handler(req, res) {
  // Add error logging
  console.log('Function invoked:', req.method, req.url, req.query);
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { action } = req.query;
    console.log('Action:', action);

    // Validate required environment variables
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Missing Spotify credentials');
      return res.status(500).json({ error: 'Missing Spotify configuration' });
    }

    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'callback':
        return await handleCallback(req, res);
      case 'user':
        return await handleGetUser(req, res);
      case 'tracks':
        return await handleGetTracks(req, res);
      default:
        console.log('Unknown action:', action);
        return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Spotify OAuth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Initiate Spotify OAuth
async function handleLogin(req, res) {
  try {
    console.log('=== LOGIN DEBUG INFO ===');
    console.log('Host header:', req.headers.host);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('=== END LOGIN DEBUG INFO ===');
    
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    const scope = 'user-library-read user-read-private user-read-email';
    
    // Determine the correct redirect URI based on environment
    const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirectUri = `${protocol}://${req.headers.host}/api/spotify-oauth?action=callback`;
    
    console.log('=== OAUTH CONFIG ===');
    console.log('Client ID:', SPOTIFY_CLIENT_ID);
    console.log('Redirect URI:', redirectUri);
    console.log('State:', state);
    console.log('Scope:', scope);
    console.log('=== END OAUTH CONFIG ===');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    // Store state and code verifier (in production, use Redis with expiration)
    userSessions.set(state, {
      codeVerifier,
      timestamp: Date.now()
    });
    
    const authUrl = `https://accounts.spotify.com/authorize?${params}`;
    console.log('Final auth URL:', authUrl);
    
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Error in handleLogin:', error);
    return res.status(500).json({ error: 'Login initialization failed', message: error.message });
  }
}

// Handle Spotify OAuth callback
async function handleCallback(req, res) {
  console.log('=== CALLBACK DEBUG INFO ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query params:', req.query);
  console.log('Query keys:', Object.keys(req.query));
  console.log('Raw query string:', req.url?.split('?')[1]);
  console.log('=== END CALLBACK DEBUG INFO ===');
  
  const { code, state, error } = req.query;
  
  if (error) {
    console.log('Spotify returned error:', error);
    return res.redirect(`${FRONTEND_URL}?error=${error}`);
  }
  
  if (!code || !state) {
    console.log('Missing parameters - code:', !!code, 'state:', !!state);
    console.log('Full query object:', JSON.stringify(req.query, null, 2));
    console.log('Expected parameters: code, state');
    console.log('Received parameters:', Object.keys(req.query));
    
    // Let's see if there are any parameters at all
    if (Object.keys(req.query).length === 0) {
      console.log('⚠️  NO QUERY PARAMETERS RECEIVED AT ALL');
      console.log('This suggests Spotify is not sending the OAuth response to this URL');
    }
    
    return res.redirect(`${FRONTEND_URL}?error=missing_parameters&debug=code:${!!code},state:${!!state},keys:${Object.keys(req.query).join(',')}`);
  }

  // Retrieve stored session data
  const sessionData = userSessions.get(state);
  if (!sessionData) {
    return res.redirect(`${FRONTEND_URL}?error=invalid_state`);
  }

  // Clean up temporary session data
  userSessions.delete(state);
  
  try {
    // Determine the correct redirect URI based on environment
    const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirectUri = `${protocol}://${req.headers.host}/api/spotify-oauth?action=callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: sessionData.codeVerifier
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user profile to create session
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      return res.redirect(`${FRONTEND_URL}?error=user_fetch_failed`);
    }
    
    const user = await userResponse.json();
    
    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const newSessionData = {
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      user: user,
      createdAt: Date.now()
    };
    
    userSessions.set(sessionId, newSessionData);
    
    // Create JWT for frontend
    const sessionToken = jwt.sign(
      { sessionId, userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirect to frontend with session token
    return res.redirect(`${FRONTEND_URL}/callback?session_token=${sessionToken}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
}

// Get user profile
async function handleGetUser(req, res) {
  const session = await verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json(session.user);
}

// Get user's liked tracks using NocodeAPI
async function handleGetTracks(req, res) {
  const session = await verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { limit = 50, offset = 0 } = req.query;
  
  try {
    // Check if token needs refresh
    if (Date.now() > session.expiresAt) {
      const refreshed = await refreshUserToken(session);
      if (!refreshed) {
        return res.status(401).json({ error: 'Session expired' });
      }
    }

    // Use NocodeAPI for liked songs
    const nocodeResponse = await fetch(`https://v1.nocodeapi.com/vibelines/spotify/${NOCODE_API_KEY}/me/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: session.accessToken,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    });
    
    if (!nocodeResponse.ok) {
      const errorText = await nocodeResponse.text();
      console.error('NocodeAPI request failed:', errorText);
      return res.status(500).json({ error: 'Failed to fetch liked songs' });
    }
    
    const data = await nocodeResponse.json();
    return res.json(data);
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    return res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
}

// Verify session middleware
async function verifySession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = userSessions.get(decoded.sessionId);
    
    if (!session) {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

// Refresh user token
async function refreshUserToken(session) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken
      })
    });

    if (!response.ok) {
      return false;
    }

    const tokens = await response.json();
    
    // Update session
    session.accessToken = tokens.access_token;
    session.expiresAt = Date.now() + (tokens.expires_in * 1000);
    if (tokens.refresh_token) {
      session.refreshToken = tokens.refresh_token;
    }

    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

// Helper functions
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const values = crypto.getRandomValues(new Uint8Array(length));
      return Array.from(values, x => possible[x % possible.length]).join('');
    } else {
      // Fallback for Node.js
      const values = Array.from({length}, () => Math.floor(Math.random() * possible.length));
      return Array.from(values, x => possible[x % possible.length]).join('');
    }
  } catch (error) {
    console.error('Error generating random string:', error);
    // Fallback
    return Array.from({length}, () => possible[Math.floor(Math.random() * possible.length)]).join('');
  }
}

async function generateCodeChallenge(codeVerifier) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Buffer.from(digest).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    } else {
      // Fallback for Node.js environment
      const hash = crypto.createHash('sha256');
      hash.update(codeVerifier);
      return hash.digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }
  } catch (error) {
    console.error('Error generating code challenge:', error);
    throw error;
  }
}
