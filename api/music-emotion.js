export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract endpoint and parameters from the request
    const { endpoint = 'health', song_title, artist_name } = req.query;
    
    console.log('🎯 Music emotion proxy called:', {
      endpoint,
      song_title,
      artist_name,
      method: req.method
    });
    
    // Your VM's FastAPI URL
    const VM_API_URL = 'http://104.198.230.255';
    
    let targetUrl;
    let requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VibeLines-Proxy/1.0'
      }
    };

    // Add API key for protected endpoints
    if (endpoint !== 'health' && endpoint !== 'device-info') {
      // You should set this in Vercel environment variables
      const apiKey = process.env.M2E_API_KEY;
      if (apiKey) {
        requestOptions.headers['api-key'] = apiKey;
      }
    }
    
    // Handle different endpoints
    switch (endpoint) {
      case 'health':
        targetUrl = `${VM_API_URL}/`;
        requestOptions.method = 'GET';
        break;
        
      case 'device-info':
        targetUrl = `${VM_API_URL}/device-info`;
        requestOptions.method = 'GET';
        break;
        
      case 'analyse-predict':
        if (!song_title || !artist_name) {
          res.status(400).json({ 
            error: 'song_title and artist_name are required for analyse-predict endpoint' 
          });
          return;
        }
        
        // Replace forward slashes with a safe placeholder before encoding
        // This prevents routing issues in FastAPI
        const safeSongTitle = song_title.replace(/\//g, '___SLASH___');
        const safeArtistName = artist_name.replace(/\//g, '___SLASH___');
        
        // Your backend expects the exact format: /analyse&predict/{title}/{artist}
        const encodedTitle = encodeURIComponent(safeSongTitle);
        const encodedArtist = encodeURIComponent(safeArtistName);
        targetUrl = `${VM_API_URL}/analyse&predict/${encodedTitle}/${encodedArtist}`;
        requestOptions.method = 'POST';
        
        console.log('🎵 Original song_title:', song_title);
        console.log('🎤 Original artist_name:', artist_name);
        console.log('🔒 Safe song_title:', safeSongTitle);
        console.log('� Safe artist_name:', safeArtistName);
        console.log('🔗 Final URL:', targetUrl);
        break;
        
      default:
        res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
        return;
    }
    
    console.log(`🚀 Proxying ${requestOptions.method} request to: ${targetUrl}`);
    console.log('📋 Request headers:', requestOptions.headers);
    
    // Make the request to your FastAPI backend
    const response = await fetch(targetUrl, requestOptions);

    console.log('📨 Backend response status:', response.status);
    console.log('📨 Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend API error: ${response.status} - ${errorText}`);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Successfully received response from backend');
    res.status(200).json(data);

  } catch (error) {
    console.error('Music emotion proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with music emotion API',
      message: error.message,
      details: 'Could not communicate with emotion analysis backend'
    });
  }
}
