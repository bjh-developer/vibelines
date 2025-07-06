// Vercel Serverless Function for Genius API search
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { song, artist } = req.body;

    if (!song || !artist) {
      return res.status(400).json({ error: 'Song and artist are required' });
    }

    // Get Genius API token from environment variables
    const geniusToken = process.env.GENIUS_API_TOKEN;
    
    if (!geniusToken) {
      console.error('GENIUS_API_TOKEN not found in environment variables');
      // Return mock data instead of failing
      return res.status(200).json({
        id: Math.floor(Math.random() * 1000000),
        title: song,
        artist: artist,
        url: `https://genius.com/mock-${song.toLowerCase().replace(/\s+/g, '-')}-lyrics`,
        lyrics_url: `https://genius.com/mock-${song.toLowerCase().replace(/\s+/g, '-')}-lyrics`,
        release_date: new Date().toISOString().split('T')[0],
        album: 'Unknown Album',
        mock: true
      });
    }

    // Search Genius API
    const searchQuery = `${song} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${geniusToken}`,
        'User-Agent': 'Vibelines/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Genius API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || !data.response.hits || data.response.hits.length === 0) {
      // Return mock data if no results found
      return res.status(200).json({
        id: Math.floor(Math.random() * 1000000),
        title: song,
        artist: artist,
        url: `https://genius.com/mock-${song.toLowerCase().replace(/\s+/g, '-')}-lyrics`,
        lyrics_url: `https://genius.com/mock-${song.toLowerCase().replace(/\s+/g, '-')}-lyrics`,
        release_date: new Date().toISOString().split('T')[0],
        album: 'Unknown Album',
        mock: true
      });
    }

    // Get the first result
    const hit = data.response.hits[0].result;
    
    return res.status(200).json({
      id: hit.id,
      title: hit.title,
      artist: hit.primary_artist.name,
      url: hit.url,
      lyrics_url: hit.url,
      release_date: hit.release_date_for_display || null,
      album: hit.album ? hit.album.name : null,
      mock: false
    });

  } catch (error) {
    console.error('Error in genius-search:', error);
    
    // Return mock data on error to ensure the app continues working
    const { song, artist } = req.body || {};
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000000),
      title: song || 'Unknown Song',
      artist: artist || 'Unknown Artist',
      url: `https://genius.com/mock-${(song || 'unknown').toLowerCase().replace(/\s+/g, '-')}-lyrics`,
      lyrics_url: `https://genius.com/mock-${(song || 'unknown').toLowerCase().replace(/\s+/g, '-')}-lyrics`,
      release_date: new Date().toISOString().split('T')[0],
      album: 'Unknown Album',
      mock: true,
      error: 'Fallback to mock data due to API error'
    });
  }
}

