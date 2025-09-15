import "./App.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import TextPressure from "./components/TextPressure";
import { initiateSpotifyAuth, isAuthenticated } from "./utils/spotifyAuth";
import BubbleMenu from "./components/BubbleMenu";

export default function App() {
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);

  const requestGyroscopePermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permission === "granted") {
          console.log(
            "Gyroscope permission granted - updating TextPressure component"
          );
          setPermissionGranted(true);
          setShowPermissionButton(false);
        }
      } catch (error) {
        console.log("Permission denied");
      }
    }
  };

  // Check if we need to show permission button (iOS 13+)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const needsPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";

    if (isIOS && needsPermission) {
      setShowPermissionButton(true);
    } else {
      setPermissionGranted(true);
    }
  }, []);

  // Spotify state
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);

  // Handle Spotify login/regenerate timeline
  const handleSpotifyLogin = async () => {
    try {
      setIsLoadingSpotify(true);
      if (isSpotifyAuthenticated) {
        // Already authenticated, go directly to loading page to regenerate timeline
        navigate("/loading");
      } else {
        // Not authenticated, initiate Spotify auth
        await initiateSpotifyAuth();
      }
    } catch (error) {
      console.error("Error initiating Spotify auth:", error);
      setIsLoadingSpotify(false);
    }
  };

  // Check for Spotify callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      // If we're on the callback, redirect to loading page
      navigate("/loading");
    } else {
      // Check if already authenticated
      if (isAuthenticated()) {
        setIsSpotifyAuthenticated(true);
      }
    }
    // Reset loading state when component mounts
    setIsLoadingSpotify(false);
  }, [navigate]);

  const items = [
    // {
    //   label: "home",
    //   href: "/",
    //   ariaLabel: "Home",
    //   rotation: -8,
    //   hoverStyles: { bgColor: "#3b82f6", textColor: "#ffffff" },
    // },
    {
      label: "about",
      href: "/about",
      ariaLabel: "About",
      rotation: 8,
      hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
    },
    {
      label: "faq",
      href: "/faq",
      ariaLabel: "FAQ",
      rotation: 8,
      hoverStyles: { bgColor: "#f59e0b", textColor: "#ffffff" },
    },
    {
      label: "privacy policy",
      href: "/privacy-policy",
      ariaLabel: "Privacy Policy",
      rotation: 8,
      hoverStyles: { bgColor: "#900bf5ff", textColor: "#ffffff" },
    },
    {
      label: "contact me",
      href: "/contact",
      ariaLabel: "Contact Me",
      rotation: 8,
      hoverStyles: { bgColor: "#6744f2ff", textColor: "#ffffff" },
    },
  ];

  return (
    <div className="min-h-screen w-full bg-black relative">
      <BubbleMenu
        items={items}
        menuAriaLabel="Toggle navigation"
        menuBg="#ffffff"
        menuContentColor="#111111"
        useFixedPosition={true}
        animationEase="back.out(1.5)"
        animationDuration={0.5}
        staggerDelay={0.12}
      />
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.25}
          speed={1}
        />
      </div>

      {/* Content Container - positioned below BubbleMenu */}
      <div className="relative z-10 w-full min-h-screen pt-24 md:pt-28 px-4">
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
        {/* Permission button section */}
        {showPermissionButton && (
          <div className="w-full max-w-4xl text-center mb-8 md:mb-12">
            <button
              onClick={requestGyroscopePermission}
              className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-lg text-base md:text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Enable Gyroscope
            </button>
            <p className="text-white mt-4 md:mt-6 text-sm md:text-base px-4">
              Tap to enable gyroscope control - tilt your phone to interact with
              the text!
            </p>
          </div>
        )}

        {/* TextPressure section */}
        <div className="w-full max-w-4xl text-center flex-1 flex flex-col items-center justify-center py-8 md:py-12">
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
            minFontSize={28}
            gyroscopeEnabled={permissionGranted}
          />

          <div className="mt-6 md:mt-8">
            <p className="text-gray-400 text-base md:text-lg leading-relaxed px-4">
              Your soundtrack, your emotions, your timeline.
            </p>
          </div>

          {/* Spotify Login Button */}
          <div className="mt-12 md:mt-16">
            <button
              onClick={handleSpotifyLogin}
              disabled={isLoadingSpotify}
              className={`flex items-center gap-3 md:gap-4 px-6 py-3 md:px-10 md:py-5 text-base md:text-lg font-semibold rounded-full transition-all duration-200 transform shadow-lg ${
                isLoadingSpotify
                  ? "bg-gray-600 text-white cursor-not-allowed"
                  : "bg-[#1DB954] hover:bg-[#1ed760] text-white hover:scale-105"
              }`}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                alt="Spotify Logo"
                className="w-6 h-6 md:w-7 md:h-7"
              />
              {isSpotifyAuthenticated
                ? "Generate New Timeline"
                : "Connect with Spotify"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center pb-10 md:pb-12 mt-auto">
          <p className="text-gray-400 text-sm md:text-base leading-relaxed px-4">
            Made with ❤️ by{" "}
            <a
              href="https://www.linkedin.com/in/bek-joon-hao/"
              target="_blank"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Joon Hao
            </a>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> • </span>
            Credits: Spotify API, Deezer API,{" "}
            <a
              href="https://huggingface.co/amaai-lab/music2emo"
              target="_blank"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Music2Emo
            </a>
            , Gemini 2.5 Flash Lite
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
