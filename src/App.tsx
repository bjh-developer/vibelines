/**
 * Main App component for Vibelines
 * Handles gyroscope permissions, Spotify authentication, and displays the main interface
 */

import "./App.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import TextPressure from "./components/TextPressure";
import { initiateSpotifyAuth, isAuthenticated } from "./utils/spotifyAuth";
import BubbleMenu from "./components/BubbleMenu";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/shadcn-io/announcement";
import { ArrowUpRightIcon } from "lucide-react";
import { useHaptic } from "use-haptic";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

// Constants for better maintainability
const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"],
  blend: 0.5,
  amplitude: 0.25,
  speed: 1,
};

const BUBBLE_MENU_ITEMS = [
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
    hoverStyles: { bgColor: "#0f0bf5ff", textColor: "#ffffff" },
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

const EXTERNAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/bek-joon-hao/",
  spotifyApi: "https://developer.spotify.com/documentation/web-api",
  deezerApi: "https://developers.deezer.com/api",
  music2emo: "https://huggingface.co/amaai-lab/music2emo",
  gemini: "https://deepmind.google/models/gemini/flash-lite/",
  buyMeCoffee: "https://www.buymeacoffee.com/bjh21",
} as const;

/**
 * Hook for managing gyroscope permissions
 */
const useGyroscopePermission = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const { triggerHaptic } = useHaptic();

  const requestGyroscopePermission = async () => {
    triggerHaptic();
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
          localStorage.setItem("gyroscopePermissionGranted", "true");
          setPermissionGranted(true);
          setShowPermissionButton(false);
        } else {
          localStorage.setItem("gyroscopePermissionGranted", "false");
        }
      } catch (error) {
        console.log("Permission denied");
        localStorage.setItem("gyroscopePermissionGranted", "false");
      }
    }
  };

  const resetGyroscopePermission = () => {
    localStorage.removeItem("gyroscopePermissionGranted");
    setPermissionGranted(false);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const needsPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";
    if (isIOS && needsPermission) {
      setShowPermissionButton(true);
    }
  };

  // Check if we need to show permission button (iOS 13+)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const needsPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";

    console.log("Gyroscope permission check:", { isIOS, needsPermission });

    if (isIOS && needsPermission) {
      console.log("iOS detected, showing permission button for fresh session");
      setPermissionGranted(false);
      setShowPermissionButton(true);
    } else {
      console.log(
        "Gyroscope permission not needed or not iOS, enabling automatically"
      );
      setPermissionGranted(true);
      setShowPermissionButton(false);
    }
  }, []);

  // Add reset function to window for debugging (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).resetGyroscopePermission = resetGyroscopePermission;
      console.log(
        "Debug: Use window.resetGyroscopePermission() to reset permission"
      );
    }
  }, []);

  return {
    permissionGranted,
    showPermissionButton,
    requestGyroscopePermission,
  };
};

/**
 * Hook for managing Spotify authentication
 */
const useSpotifyAuth = () => {
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptic();

  const handleSpotifyLogin = async () => {
    triggerHaptic();
    try {
      setIsLoadingSpotify(true);
      if (isSpotifyAuthenticated) {
        navigate("/loading");
      } else {
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
      navigate("/loading");
    } else {
      if (isAuthenticated()) {
        setIsSpotifyAuthenticated(true);
      }
    }
    setIsLoadingSpotify(false);
  }, [navigate]);

  return {
    isSpotifyAuthenticated,
    isLoadingSpotify,
    handleSpotifyLogin,
  };
};

/**
 * Component for gyroscope permission request
 */
interface GyroscopePermissionProps {
  onRequestPermission: () => void;
}

const GyroscopePermission = ({
  onRequestPermission,
}: GyroscopePermissionProps) => (
  <div className="w-full max-w-4xl text-center mb-8 md:mb-12">
    <button
      onClick={onRequestPermission}
      className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-lg text-base md:text-lg font-semibold hover:bg-gray-200 transition-colors"
      aria-label="Enable gyroscope control for text interaction"
    >
      Enable Gyroscope
    </button>
    <p className="text-white mt-4 md:mt-6 text-sm md:text-base px-4">
      Tap to enable gyroscope control - tilt your phone to interact with the
      text!
    </p>
  </div>
);

/**
 * Component for Spotify login button
 */
interface SpotifyButtonProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const SpotifyButton = ({
  isAuthenticated,
  isLoading,
  onClick,
}: SpotifyButtonProps) => (
  <div className="mt-12 md:mt-16">
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center gap-3 md:gap-4 px-6 py-3 md:px-10 md:py-5 text-base md:text-lg font-semibold rounded-full transition-all duration-200 transform shadow-lg ${
        isLoading
          ? "bg-gray-600 text-white cursor-not-allowed"
          : "bg-[#1DB954] hover:bg-[#1ed760] text-white hover:scale-105"
      }`}
      aria-label={
        isAuthenticated
          ? "Generate new music timeline"
          : "Connect with Spotify to create timeline"
      }
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
        alt="Spotify Logo"
        className="w-6 h-6 md:w-7 md:h-7"
      />
      {isAuthenticated ? "Generate New Timeline" : "Connect with Spotify"}
    </button>
  </div>
);

/**
 * Component for the info announcement drawer
 */
const InfoDrawer = () => {
  const { triggerHaptic } = useHaptic();

  return (
    <div
      className="mt-6 md:mt-8 transition-transform duration-50 active:scale-95 cursor-pointer hover:scale-105"
      onClick={triggerHaptic}
    >
      <Drawer>
        <DrawerTrigger asChild>
          <div>
            <Announcement className="bg-sky-100 text-sky-700" themed>
              <AnnouncementTag>🙏</AnnouncementTag>
              <AnnouncementTitle>
                I'm tiny, please be patient if I take time/error!
                <ArrowUpRightIcon className="shrink-0 opacity-70" size={16} />
              </AnnouncementTitle>
            </Announcement>
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>🤔 Why am I tiny?</DrawerTitle>
            <DrawerDescription>
              I'm running on a very small budget, thus I'm powered by a small
              computer that can only handle limited requests at a time. If I
              take a bit longer or run into an error, please bear with me as I
              work to serve you the best I can! Your patience means a lot. 🙏
              <br />
              <br />
              If you are feeling generous, consider supporting me through "buy
              me a coffee" so I can keep improving!
              <br />
              <br />
              <a
                href={EXTERNAL_LINKS.buyMeCoffee}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png"
                  alt="Buy Me A Coffee"
                  className="h-10 w-auto"
                />
              </a>
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Understood 👍</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

/**
 * Component for the info announcement
 */
const InfoAnnouncement = () => {
  const { triggerHaptic } = useHaptic();

  return (
    <div
      className="mt-6 md:mt-8 transition-transform duration-50 active:scale-95 cursor-pointer hover:scale-105"
      onClick={triggerHaptic}
    >
      <Announcement className="bg-rose-100 text-rose-700" themed>
        <AnnouncementTag>⚠️</AnnouncementTag>
        <AnnouncementTitle>
          Due to Spotify's API restrictions, only approved users can use this.
          Please contact me for access.
          <ArrowUpRightIcon className="shrink-0 opacity-70" size={16} />
        </AnnouncementTitle>
      </Announcement>
    </div>
  );
};

/**
 * Component for footer credits
 */
const Footer = () => (
  <div className="w-full text-center pb-25 md:pb-10 mt-auto">
    <p className="text-gray-400 text-sm md:text-base leading-relaxed px-4">
      Made with ❤️ by{" "}
      <a
        href={EXTERNAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
      >
        Joon Hao
      </a>
      <br className="hidden sm:block" />
      <span className="sm:hidden"> • </span>
      Credits:{" "}
      <a
        href={EXTERNAL_LINKS.spotifyApi}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
      >
        Spotify API
      </a>
      ,{" "}
      <a
        href={EXTERNAL_LINKS.deezerApi}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
      >
        Deezer API
      </a>
      ,{" "}
      <a
        href={EXTERNAL_LINKS.music2emo}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
      >
        Music2Emo
      </a>
      ,{" "}
      <a
        href={EXTERNAL_LINKS.gemini}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
      >
        Gemini 2.5 Flash Lite
      </a>
    </p>
  </div>
);

export default function App() {
  const gyroscope = useGyroscopePermission();
  const spotify = useSpotifyAuth();

  return (
    <div className="min-h-screen w-full bg-black relative">
      <BubbleMenu
        items={BUBBLE_MENU_ITEMS}
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
        <Aurora {...AURORA_CONFIG} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full min-h-screen pt-24 md:pt-28 px-4">
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          {/* Gyroscope Permission Section */}
          {gyroscope.showPermissionButton && (
            <GyroscopePermission
              onRequestPermission={gyroscope.requestGyroscopePermission}
            />
          )}

          {/* Main Content Section */}
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
              gyroscopeEnabled={gyroscope.permissionGranted}
            />

            <div className="mt-6 md:mt-8">
              <p className="text-gray-400 text-base md:text-lg leading-relaxed px-4">
                Your soundtrack, your emotions, your timeline.
              </p>
            </div>

            {/* Spotify Login Button */}
            <SpotifyButton
              isAuthenticated={spotify.isSpotifyAuthenticated}
              isLoading={spotify.isLoadingSpotify}
              onClick={spotify.handleSpotifyLogin}
            />

            {/* Info Drawer */}
            <InfoDrawer />

            {/* Info Announcement */}
            <InfoAnnouncement />
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
