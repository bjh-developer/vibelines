import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { q, limit = '1' } = req.query;
    
    if (!q) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(q as string)}&limit=${limit}`;
    
    console.log('Proxying to Deezer:', deezerUrl);
    
    const response = await fetch(deezerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VibeLines/1.0)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Deezer proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Deezer API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
