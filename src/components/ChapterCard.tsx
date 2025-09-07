import { useState, useEffect } from 'react';
import { searchTrackAlbumCover } from '../utils/spotifyAuth';
import { getDeezerPreviewUrl, audioManager } from '../utils/deezerApi';

interface ChapterCardProps {
  title: string;
  phase: string;
  content: string;
  soundtrack: string;
  albumCover?: string;
  width: number;
  height: number;
  isInFront?: boolean;
}

export default function ChapterCard({ 
  title, 
  phase, 
  content, 
  soundtrack, 
  albumCover,
  width, 
  height,
  isInFront = false
}: ChapterCardProps) {
  const [backgroundImage, setBackgroundImage] = useState<string>(
    albumCover || ''
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle audio playback when card is in front
  useEffect(() => {
    if (isInFront && previewUrl) {
      console.log('🎵 Card is in front, starting audio playback');
      audioManager.playTrack(previewUrl, 0.25); // Softer volume as requested
    }
  }, [isInFront, previewUrl]);

  useEffect(() => {
    console.log('🎨 ChapterCard useEffect - soundtrack:', soundtrack, 'albumCover:', albumCover);
    
    // If no album cover provided, search for it
    if (!albumCover && soundtrack) {
      // Extract artist and track from soundtrack string
      // Format: "Song Name" by Artist Name
      const match = soundtrack.match(/"([^"]+)"\s+by\s+(.+)/);
      if (match) {
        const [, trackTitle, artist] = match;
        console.log('🔍 Searching for:', trackTitle, 'by', artist);
        
        // Search for Spotify album cover
        searchTrackAlbumCover(trackTitle, artist).then(imageUrl => {
          if (imageUrl) {
            console.log('✅ Found album cover:', imageUrl);
            console.log('🔄 Setting backgroundImage state...');
            setBackgroundImage(imageUrl);
          } else {
            console.log('❌ No album cover found, using placeholder');
          }
        }).catch(error => {
          console.error('❌ Error fetching album cover:', error);
        });

        // Search for Deezer preview URL
        getDeezerPreviewUrl(trackTitle, artist).then(deezerUrl => {
          if (deezerUrl) {
            console.log('🎵 Found Deezer preview:', deezerUrl);
            setPreviewUrl(deezerUrl);
          } else {
            console.log('❌ No Deezer preview found');
          }
        }).catch(error => {
          console.error('❌ Error fetching Deezer preview:', error);
        });
      }
    }
  }, [soundtrack, albumCover]);

  console.log('🎨 Current backgroundImage state:', backgroundImage);

  return (
    <div 
      className="relative rounded-2xl overflow-hidden border-4 border-white shadow-xl"
      style={{ width, height }}
    >
      {/* Background Image with Blur and Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Album cover image */}
        {backgroundImage ? (
          <>
            {/* Main blurred background */}
            <img
              src={backgroundImage}
              alt="Album cover background"
              className="w-full h-full object-cover"
              style={{ 
                filter: 'blur(8px) brightness(0.6)',
                transform: 'scale(1.1)' // Slightly scale up to hide blur edges
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
              onError={(e) => {
                console.error('❌ Image failed to load:', backgroundImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </>
        ) : (
          /* Fallback gradient background when no image */
          <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-700 to-green-800" />
        )}
        
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2 text-shadow-lg">{title}</h2>
          <p className="text-lg text-gray-200 mb-4 font-medium">{phase}</p>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex items-center">
          <p className="text-base leading-relaxed text-gray-100 text-shadow">
            {content}
          </p>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-30">
          <p className="text-sm text-gray-200 italic">
            🎵 {soundtrack}
          </p>
        </div>
      </div>
    </div>
  );
}
