// Vercel Serverless Function for lyrics scraping
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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if this is a mock URL (fallback case)
    if (url.includes('mock-') || url.includes('genius.com/mock-')) {
      // Generate contextual mock lyrics based on the URL
      const songName = url.split('mock-')[1]?.split('-lyrics')[0]?.replace(/-/g, ' ') || 'unknown song';
      const mockLyrics = generateMockLyrics(songName);
      
      return res.status(200).json({
        lyrics: mockLyrics,
        success: true,
        cached: false,
        mock: true
      });
    }

    // For real Genius URLs, attempt to scrape
    // Note: This is a simplified scraper - in production you'd want more robust parsing
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lyrics page: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple regex to extract lyrics from Genius pages
    // This is a basic implementation - production would use a proper HTML parser
    const lyricsMatch = html.match(/<div[^>]*data-lyrics-container[^>]*>(.*?)<\/div>/s);
    
    if (lyricsMatch) {
      // Clean up the HTML and extract text
      let lyrics = lyricsMatch[1]
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (lyrics.length > 50) { // Ensure we got meaningful content
        return res.status(200).json({
          lyrics: lyrics,
          success: true,
          cached: false,
          mock: false
        });
      }
    }

    // If scraping failed, return mock lyrics
    const songName = url.split('/').pop()?.replace('-lyrics', '')?.replace(/-/g, ' ') || 'unknown song';
    const mockLyrics = generateMockLyrics(songName);
    
    return res.status(200).json({
      lyrics: mockLyrics,
      success: true,
      cached: false,
      mock: true,
      note: 'Scraping failed, using mock lyrics'
    });

  } catch (error) {
    console.error('Error in lyrics-scrape:', error);
    
    // Always return mock lyrics on error to ensure the app continues working
    const { url } = req.body || {};
    const songName = url?.split('/').pop()?.replace('-lyrics', '')?.replace(/-/g, ' ') || 'unknown song';
    const mockLyrics = generateMockLyrics(songName);
    
    return res.status(200).json({
      lyrics: mockLyrics,
      success: true,
      cached: false,
      mock: true,
      error: 'Fallback to mock lyrics due to scraping error'
    });
  }
}

// Generate contextual mock lyrics based on song name
function generateMockLyrics(songName) {
  const lowerSongName = songName.toLowerCase();
  
  // Enhanced mock lyrics based on song characteristics
  const mockTemplates = {
    love: [
      'love you forever heart beating fast together always happiness joy beautiful amazing wonderful perfect moments dancing under stars every breath you take makes me feel alive',
      'your love lifts me higher than mountains touching the sky together we shine bright like diamonds in the night holding hands through every storm',
      'every moment with you feels like magic love flowing through my veins happiness beyond measure when I see your smile the world becomes beautiful'
    ],
    sad: [
      'tears falling down broken heart alone in darkness lost without you pain sorrow grief empty void crying lonely abandoned memories of what we used to be',
      'memories haunt me in the silence of the night broken dreams scattered like leaves in the wind walking through shadows of yesterday',
      'walking through shadows of what we used to be empty rooms echo with forgotten laughter the pain of missing you never goes away'
    ],
    happy: [
      'dancing in the sunshine feeling so alive energy flowing through my veins joy happiness celebration party time amazing wonderful life is beautiful every day',
      'every day is a gift wrapped in golden sunlight smiling faces everywhere spreading joy and laughter music in the air celebration time',
      'celebration time dancing through the streets music in the air happiness everywhere friends and family gathering together sharing love and joy'
    ],
    rock: [
      'rage fire burning fight battle power strong aggressive intense energy explosive force destroy break smash thunder rolling through the night electric guitars screaming loud',
      'thunder rolling through the night electric guitars screaming loud power chords shaking the ground rebellion in our hearts fighting for what we believe',
      'rebellion in our hearts fighting for what we believe standing strong against the storm never backing down from the fight for freedom'
    ],
    calm: [
      'peaceful calm quiet gentle soft serene tranquil meditation breathe relax zen harmony balance stillness gentle waves washing over sandy shores',
      'gentle waves washing over sandy shores peaceful moments in the morning light soft whispers of the wind through the trees finding peace',
      'finding peace in simple moments breathing deeply feeling centered and whole nature surrounds us with its gentle embrace silence speaks volumes'
    ],
    party: [
      'party all night dancing till the morning light music pumping energy high celebration time with friends having fun living life to the fullest',
      'turn up the music let the beat drop dancing like nobody is watching party lights flashing colors everywhere good vibes only tonight',
      'good vibes only tonight dancing with my friends music loud and clear celebration mode activated living our best life right now'
    ]
  };

  // Determine category based on song name
  let category = 'happy'; // default
  if (lowerSongName.includes('love') || lowerSongName.includes('heart')) category = 'love';
  else if (lowerSongName.includes('sad') || lowerSongName.includes('cry') || lowerSongName.includes('tear')) category = 'sad';
  else if (lowerSongName.includes('rock') || lowerSongName.includes('metal') || lowerSongName.includes('punk')) category = 'rock';
  else if (lowerSongName.includes('calm') || lowerSongName.includes('peace') || lowerSongName.includes('quiet')) category = 'calm';
  else if (lowerSongName.includes('party') || lowerSongName.includes('dance') || lowerSongName.includes('club')) category = 'party';
  else if (lowerSongName.includes('happy') || lowerSongName.includes('joy') || lowerSongName.includes('smile')) category = 'happy';

  const templates = mockTemplates[category];
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return randomTemplate;
}

