import "./App.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import TextPressure from "./components/TextPressure";
import { initiateSpotifyAuth, isAuthenticated } from "./utils/spotifyAuth";
import BubbleMenu from "./components/BubbleMenu";
("use client");
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

export default function App() {
  const { triggerHaptic } = useHaptic();
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);

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
          // Save permission to localStorage
          localStorage.setItem("gyroscopePermissionGranted", "true");
          setPermissionGranted(true);
          setShowPermissionButton(false);
        } else {
          // Save denied permission as well
          localStorage.setItem("gyroscopePermissionGranted", "false");
        }
      } catch (error) {
        console.log("Permission denied");
        localStorage.setItem("gyroscopePermissionGranted", "false");
      }
    }
  };

  // Function to reset gyroscope permission (for debugging or user reset)
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

  // Add reset function to window for debugging (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).resetGyroscopePermission = resetGyroscopePermission;
      console.log(
        "Debug: Use window.resetGyroscopePermission() to reset permission"
      );
    }
  }, []);

  // Check if we need to show permission button (iOS 13+)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const needsPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";

    console.log("Gyroscope permission check:", { isIOS, needsPermission });

    if (isIOS && needsPermission) {
      // On iOS, always show the permission button initially since permission
      // needs to be requested fresh each session, even if previously granted
      console.log("iOS detected, showing permission button for fresh session");
      setPermissionGranted(false);
      setShowPermissionButton(true);
    } else {
      // Not iOS or doesn't need permission
      console.log(
        "Gyroscope permission not needed or not iOS, enabling automatically"
      );
      setPermissionGranted(true);
      setShowPermissionButton(false);
    }
  }, []);

  // Spotify state
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);

  // Handle Spotify login/regenerate timeline
  const handleSpotifyLogin = async () => {
    triggerHaptic();
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
                Tap to enable gyroscope control - tilt your phone to interact
                with the text!
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
            <div
              className="mt-6 md:mt-8 transition-transform duration-50 active:scale-95 cursor-pointer hover:scale-105"
              onClick={() => {
                triggerHaptic();
              }}
            >
              <Drawer>
                <DrawerTrigger>
                  <Announcement className="bg-sky-100 text-sky-700" themed>
                    <AnnouncementTag>🙏</AnnouncementTag>
                    <AnnouncementTitle>
                      I'm tiny, please be patient if I take time/error!
                      <ArrowUpRightIcon
                        className="shrink-0 opacity-70"
                        size={16}
                      />
                    </AnnouncementTitle>
                  </Announcement>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>🤔 Why am I tiny?</DrawerTitle>
                    <DrawerDescription>
                      I'm running on a very small budget, thus I'm powered by a
                      small computer that can only handle limited requests at a
                      time. If I take a bit longer or run into an error, please
                      bear with me as I work to serve you the best I can! Your
                      patience means a lot. 🙏
                      <br />
                      <br />
                      If you are feeling generous, consider supporting me
                      through "buy me a coffee" so I can keep improving!
                      <br />
                      <br />
                      <a
                        href="https://www.buymeacoffee.com/bjh21"
                        target="_blank"
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
                    <DrawerClose>
                      <Button variant="outline">Understood 👍</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full text-center pb-25 md:pb-10 mt-auto">
            <p className="text-gray-400 text-sm md:text-base leading-relaxed px-4">
              Made with ❤️ by{" "}
              <a
                href="https://www.linkedin.com/in/bek-joon-hao/"
                target="_blank"
                className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
              >
                Joon Hao
              </a>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> • </span>
              Credits:{" "}
              <a
                href="https://developer.spotify.com/documentation/web-api"
                target="_blank"
                className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
              >
                Spotify API
              </a>
              ,{" "}
              <a
                href="https://developers.deezer.com/api"
                target="_blank"
                className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
              >
                Deezer API
              </a>
              ,{" "}
              <a
                href="https://huggingface.co/amaai-lab/music2emo"
                target="_blank"
                className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
              >
                Music2Emo
              </a>
              ,{" "}
              <a
                href="https://deepmind.google/models/gemini/flash-lite/"
                target="_blank"
                className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
              >
                Gemini 2.5 Flash Lite
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
