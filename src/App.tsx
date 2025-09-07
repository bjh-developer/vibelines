import './App.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Aurora from './components/AuroraBG';
import TextPressure from './components/TextPressure';
import { 
  initiateSpotifyAuth, 
  isAuthenticated
} from './utils/spotifyAuth';

export default function App() {
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  
  // Spotify state
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);

  // Handle Spotify login
  const handleSpotifyLogin = async () => {
    try {
      setIsLoadingSpotify(true);
      await initiateSpotifyAuth();
    } catch (error) {
      console.error('Error initiating Spotify auth:', error);
      setIsLoadingSpotify(false);
    }
  };

  // Check for Spotify callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // If we're on the callback, redirect to loading page
      navigate('/loading');
    } else {
      // Check if already authenticated
      if (isAuthenticated()) {
        setIsSpotifyAuthenticated(true);
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.5}
          speed={1}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen">
      {/* Permission button section */}
      {showPermissionButton && (
        <div className="w-full max-w-4xl text-center mb-6 md:mb-8 px-4">
          <button
            onClick={requestGyroscopePermission}
            className="px-4 py-2 md:px-6 md:py-3 bg-white text-black rounded-lg text-sm md:text-base font-semibold hover:bg-gray-200 transition-colors"
          >
            Enable Gyroscope
          </button>
          <p className="text-white mt-3 md:mt-4 text-xs md:text-sm px-2">
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

        <div>
          <p className="text-gray-400 mt-6">Your soundtrack, your emotions, your timeline.</p>
        </div>
        
        {/* Spotify Login Button */}
        <div className="mt-12">
            <button
              onClick={handleSpotifyLogin}
              disabled={isSpotifyAuthenticated || isLoadingSpotify}
              className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:px-8 md:py-4 text-sm md:text-base font-semibold rounded-full transition-all duration-200 transform shadow-lg ${
                isSpotifyAuthenticated 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : isLoadingSpotify
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : 'bg-[#1DB954] hover:bg-[#1ed760] text-white hover:scale-105'
              }`}
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" 
                alt="Spotify Logo" 
                className="w-6 h-6"
              />
              Connect with Spotify
            </button>
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
    </div>
  )
}