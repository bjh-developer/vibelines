import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSpotifyCallback } from '../utils/spotifyAuth';

const SpotifyCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        const success = await handleSpotifyCallback(code, state);
        if (success) {
          setStatus('success');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setStatus('error');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to Spotify...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <p className="text-white text-lg">Successfully connected to Spotify!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting you back...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <p className="text-white text-lg">Failed to connect to Spotify</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SpotifyCallback;
