import './App.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// import SplitText from "./components/SplitText";
import TextPressure from './components/TextPressure';

import { 
  initiateSpotifyAuth, 
  isAuthenticated, 
  getCurrentUser, 
  logout,
  handleSpotifyCallback
} from './utils/spotifyAuth';
import type { SpotifyUser } from './utils/spotifyAuth';


function App() {
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Spotify state
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);

  const requestGyroscopePermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          console.log('Gyroscope permission granted - updating TextPressure component');
          setPermissionGranted(true);
          setShowPermissionButton(false);
        }
      } catch (error) {
        console.log('Permission denied');
      }
    }
  };

  // Handle Spotify login
  const handleSpotifyLogin = async () => {
    try {
      await initiateSpotifyAuth();
    } catch (error) {
      console.error('Error initiating Spotify auth:', error);
    }
  };

  // Handle navigation to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Handle Spotify logout
  const handleSpotifyLogout = () => {
    logout();
    setIsSpotifyAuthenticated(false);
    setSpotifyUser(null);
  };

  // Load user data only (songs will be loaded in dashboard)
  const loadSpotifyUserData = async () => {
    try {
      const user = await getCurrentUser();
      setSpotifyUser(user);
    } catch (error) {
      console.error('Error loading Spotify user data:', error);
    }
  };

  // Check for Spotify callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Handle callback
      handleSpotifyCallback(code, state).then((success) => {
        if (success) {
          setIsSpotifyAuthenticated(true);
          // Clean up URL and navigate to dashboard
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/dashboard');
        }
      });
    } else {
      // Check if already authenticated
      if (isAuthenticated()) {
        setIsSpotifyAuthenticated(true);
        loadSpotifyUserData();
      }
    }
  }, [navigate]);

  // Check if we need to show permission button (iOS 13+) and detect mobile
  useEffect(() => {
    const mobileCheck = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const needsPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function';
    
    setIsMobile(mobileCheck);
    
    if (isIOS && needsPermission) {
      setShowPermissionButton(true);
    } else {
      setPermissionGranted(true);
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
      {/* Permission button section */}
      {showPermissionButton && (
        <div className="w-full max-w-4xl text-center mb-8">
          <button
            onClick={requestGyroscopePermission}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Enable Gyroscope
          </button>
          <p className="text-white mt-4 text-sm">
            Tap to enable gyroscope control - tilt your phone to interact with the text!
          </p>
        </div>
      )}
      
      {/* TextPressure section */}
      <div className="w-full max-w-4xl text-center flex-grow flex flex-col items-center justify-center">
        <TextPressure
          text="Vibelines"
          flex={true}
          alpha={false}
          stroke={false}
          width={true}
          weight={true}
          italic={true}
          textColor="#ffffff"
          strokeColor="#ff0000"
          minFontSize={24}
          gyroscopeEnabled={permissionGranted}
        />
        
        {/* Spotify Login Button */}
        <div className="mt-12">
          {!isSpotifyAuthenticated ? (
            <button
              onClick={handleSpotifyLogin}
              className="flex items-center gap-3 px-8 py-4 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect with Spotify
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* User info */}
              <div className="flex items-center gap-3 text-white">
                {spotifyUser?.images?.[0] && (
                  <img 
                    src={spotifyUser.images[0].url} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <span>Welcome back, {spotifyUser?.display_name}!</span>
              </div>
              
              {/* Dashboard button */}
              <button
                onClick={goToDashboard}
                className="flex items-center gap-3 px-8 py-4 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                View Dashboard
              </button>
              
              {/* Logout button */}
              <button
                onClick={handleSpotifyLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom instruction text - only on mobile */}
      {isMobile && permissionGranted && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-gray-400 text-sm px-4">
            🎯 Tilt your phone to control the text animation
          </p>
        </div>
      )}
    </div>
  )
}

export default App
