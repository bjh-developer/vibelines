export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the target endpoint from query params
    const { endpoint = '/' } = req.query;
    
    // Your VM's FastAPI URL
    const VM_API_URL = 'http://104.198.230.255';
    const targetUrl = `${VM_API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    // Prepare headers for the backend request
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'VibeLines-Proxy/1.0'
    };
    
    // Forward API key if provided (for protected endpoints)
    if (req.headers['api-key']) {
      headers['api-key'] = req.headers['api-key'];
    }
    
    // Add environment API key for server-side requests
    if (endpoint !== '/' && endpoint !== 'device-info') {
      const apiKey = process.env.M2E_API_KEY;
      if (apiKey && !headers['api-key']) {
        headers['api-key'] = apiKey;
      }
    }
    
    // Forward the request to your VM HTTP API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      throw new Error(`Backend API responded with status: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    
    // Handle JSON responses
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // Handle text responses
      const text = await response.text();
      res.status(response.status).send(text);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message,
      details: 'Failed to communicate with Music2Emotion API backend'
    });
  }
}
