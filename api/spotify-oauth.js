const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Polyfill fetch for Node.js environment if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Environment variables
const SPOTIFY_CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const NOCODE_API_KEY = process.env.NOCODE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || (
  process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
);

// In-memory session store (use Redis in production)
const userSessions = new Map();

export default async function handler(req, res) {
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

  try {
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
        return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Spotify OAuth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Initiate Spotify OAuth
async function handleLogin(req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const scope = 'user-library-read user-read-private user-read-email';
  
  // Determine the correct redirect URI based on environment
  const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  const redirectUri = `${protocol}://${req.headers.host}/api/spotify-oauth?action=callback`;
  
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
  
  return res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}

// Handle Spotify OAuth callback
async function handleCallback(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`${FRONTEND_URL}?error=${error}`);
  }
  
  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}?error=missing_parameters`);
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
  const values = crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(length)) : 
    Array.from({length}, () => Math.floor(Math.random() * possible.length));
  return Array.from(values, x => possible[x % possible.length]).join('');
}

async function generateCodeChallenge(codeVerifier) {
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
}
