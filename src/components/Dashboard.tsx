import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getAllLikedSongs, 
  logout,
  isAuthenticated 
} from '../utils/spotifyAuth';
import type { SpotifyUser, SpotifyTrack } from '../utils/spotifyAuth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data and liked songs
  const loadSpotifyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await getCurrentUser();
      setSpotifyUser(user);
      
      const songs = await getAllLikedSongs();
      setLikedSongs(songs);
      
      console.log('📊 Liked songs loaded:', {
        total: songs.length,
        withSpotifyPreviewUrl: songs.filter(song => song.preview_url).length
      });
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setError('Failed to load your Spotify data. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check authentication and load data on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    
    loadSpotifyData();
  }, [navigate]);

  // Format duration from milliseconds to mm:ss
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB954] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your music...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Vibelines
            </button>
            <h1 className="text-2xl font-bold">Your Music Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {spotifyUser && (
              <div className="flex items-center gap-3">
                {spotifyUser.images?.[0] && (
                  <img 
                    src={spotifyUser.images[0].url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-300">{spotifyUser.display_name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#1DB954]">{likedSongs.length}</div>
              <div className="text-sm text-gray-400">Liked Songs</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#1DB954]">
                {new Set(likedSongs.map(song => song.artists[0]?.name)).size}
              </div>
              <div className="text-sm text-gray-400">Artists</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#1DB954]">
                {Math.floor(likedSongs.reduce((total, song) => total + song.duration_ms, 0) / 60000)}
              </div>
              <div className="text-sm text-gray-400">Minutes</div>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Your Liked Songs</h2>
            <p className="text-gray-400 text-sm mt-1">All your saved tracks from Spotify</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {likedSongs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-4">🎵</div>
                <p>No liked songs found. Start liking some songs on Spotify!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {likedSongs.map((song) => (
                  <div 
                    key={song.id} 
                    className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4"
                  >
                    {/* Album Art */}
                    <div className="flex-shrink-0">
                      {song.album.images[2] ? (
                        <img 
                          src={song.album.images[2].url} 
                          alt={song.album.name}
                          className="w-12 h-12 rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                          🎵
                        </div>
                      )}
                    </div>
                    
                    {/* Song Info */}
                    <div className="flex-grow min-w-0">
                      <div className="font-medium text-white truncate">{song.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {song.artists.map(artist => artist.name).join(', ')} • {song.album.name}
                      </div>
                    </div>
                    
                    {/* Duration */}
                    <div className="flex-shrink-0 text-sm text-gray-400">
                      {formatDuration(song.duration_ms)}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {/* Spotify Preview */}
                      {song.preview_url && (
                        <a
                          href={song.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1DB954] hover:text-[#1ed760] transition-colors p-2"
                          title="Play Spotify Preview"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="m7 4 10 6L7 16V4z"/>
                          </svg>
                        </a>
                      )}
                      
                      {/* Play on Spotify Link */}
                      <a
                        href={song.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1DB954] hover:text-[#1ed760] transition-colors p-2"
                        title="Open in Spotify"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
