/**
 * MoodTimeline component - displays the user's musical emotional journey
 * Features swipeable cards, audio playback, and screenshot functionality
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";

// Components
import Stack from "./components/Stack";
import ChapterCard from "./components/ChapterCard";
import Aurora from "./components/AuroraBG";
import BubbleMenu from "./components/BubbleMenu";

// Hooks and utilities
import { useScreenSize, calculateCardDimensions } from "./hooks/useScreenSize";
import { useScreenshot } from "./hooks/useScreenshot";
import { audioManager } from "./utils/deezerApi";

// Types and Interfaces
interface TimelineData {
  Chapters: { [key: string]: string };
  Phases: { [key: string]: string };
  Contents: { [key: string]: string };
  Soundtracks: { [key: string]: string };
}

interface CardData {
  id: number;
  chapter: string;
  phase: string;
  content: string;
  soundtrack: string;
}

interface BubbleMenuItem {
  label: string;
  href: string;
  ariaLabel: string;
  rotation: number;
  hoverStyles: {
    bgColor: string;
    textColor: string;
  };
}

// Constants
const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"] as string[],
  blend: 0.5,
  amplitude: 0.25,
  speed: 1,
};

const BUBBLE_MENU_CONFIG = {
  menuAriaLabel: "Toggle navigation",
  menuBg: "#ffffff",
  menuContentColor: "#111111",
  useFixedPosition: true,
  animationEase: "back.out(1.5)",
  animationDuration: 0.5,
  staggerDelay: 0.12,
} as const;

const NAVIGATION_ITEMS: BubbleMenuItem[] = [
  {
    label: "home",
    href: "/",
    ariaLabel: "Home",
    rotation: -8,
    hoverStyles: { bgColor: "#3b82f6", textColor: "#ffffff" },
  },
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

const UI_CONFIG = {
  screenshot: {
    buttonText: {
      capturing: "📸 Capturing...",
      default: "📸 Share Vibeline",
    },
    containerElementId: "vibeline-container",
  },
  swipeInstructions: {
    soundEmoji: "🎧",
    instructionText: "Turn on sound!",
  },
  buyMeACoffee: {
    url: "https://www.buymeacoffee.com/bjh21",
    imageUrl: "https://cdn.buymeacoffee.com/buttons/v2/default-green.png",
  },
};

/**
 * Hook for managing timeline data and card processing
 */
const useTimelineData = (timeline: any) => {
  const cardsData: CardData[] = useMemo(() => {
    if (!timeline || typeof timeline !== "object") {
      return [];
    }

    const timelineData = timeline as TimelineData;
    const { Chapters, Phases, Contents, Soundtracks } = timelineData;

    if (!Chapters || !Phases || !Contents || !Soundtracks) {
      return [];
    }

    const cards = Object.keys(Chapters)
      .map((key): CardData => {
        const cardId = parseInt(key);
        return {
          id: cardId,
          chapter: Chapters[key],
          phase: Phases[key],
          content: Contents[key],
          soundtrack: Soundtracks[key],
        };
      })
      .sort((a, b) => a.id - b.id); // Sort chronologically by ID

    return cards;
  }, [timeline]);

  return { cardsData };
};

/**
 * Hook for managing audio playback and mobile interaction
 */
const useAudioManager = () => {
  const [showMobileAudioPrompt, setShowMobileAudioPrompt] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  useEffect(() => {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Show audio prompt for mobile users
      setShowMobileAudioPrompt(true);
      
      // Function to handle user interaction and enable audio
      const enableAudioOnInteraction = async () => {
        console.log('🎵 Mobile user interaction detected - enabling audio');
        setUserHasInteracted(true);
        setShowMobileAudioPrompt(false);
        
        try {
          // Create a silent audio to unlock the audio context
          const audio = new Audio();
          audio.volume = 0;
          audio.muted = true;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            audio.pause();
            audio.remove();
            console.log('🎵 Audio context unlocked for mobile');
          }
        } catch (error) {
          console.warn('🎵 Could not unlock audio context:', error);
        }
        
        // Remove event listeners after first interaction
        document.removeEventListener('touchstart', enableAudioOnInteraction);
        document.removeEventListener('touchend', enableAudioOnInteraction);
        document.removeEventListener('click', enableAudioOnInteraction);
      };
      
      // Add event listeners for user interaction
      document.addEventListener('touchstart', enableAudioOnInteraction, { once: true, passive: true });
      document.addEventListener('touchend', enableAudioOnInteraction, { once: true, passive: true });
      document.addEventListener('click', enableAudioOnInteraction, { once: true, passive: true });
      
      return () => {
        document.removeEventListener('touchstart', enableAudioOnInteraction);
        document.removeEventListener('touchend', enableAudioOnInteraction);
        document.removeEventListener('click', enableAudioOnInteraction);
      };
    }

    // Stop audio when leaving the page
    const handleBeforeUnload = () => {
      console.log("🎵 Page unloading - stopping audio");
      audioManager.stop();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("🎵 Page hidden - stopping audio");
        audioManager.stop();
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("🎵 Stopping audio on component unmount");
      audioManager.stop();

      // Remove event listeners
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { showMobileAudioPrompt, userHasInteracted };
};

/**
 * Hook for managing card state and interactions
 */
const useCardManager = (cardsData: CardData[]) => {
  const [frontCardId, setFrontCardId] = useState<number | null>(null);

  // Set the initial front card ID
  useEffect(() => {
    if (cardsData.length > 0 && frontCardId === null) {
      const initialFrontId = cardsData[0].id; // First card (chronologically #1)
      console.log("🃏 Setting initial front card to:", initialFrontId);
      setFrontCardId(initialFrontId);
    }
  }, [cardsData, frontCardId]);

  // Callback to update which card is in front
  const handleCardOrderChange = useCallback(
    (newCards: any[]) => {
      if (newCards.length > 0) {
        // The top card is now the last one in the array (since we reversed it)
        const newFrontId = newCards[newCards.length - 1].id;
        if (newFrontId !== frontCardId) {
          console.log(
            "🃏 Front card changed from",
            frontCardId,
            "to:",
            newFrontId
          );
          // Immediately stop any playing audio to prevent overlaps during fast swiping
          audioManager.stopImmediate();
          setFrontCardId(newFrontId);
        }
      }
    },
    [frontCardId]
  );

  return {
    frontCardId,
    handleCardOrderChange,
  };
};

/**
 * Header component with title and instructions
 */
interface HeaderProps {
  frontCardId: number | null;
  totalCards: number;
  isCapturing: boolean;
  onTakeScreenshot: () => void;
  showMobileAudioPrompt: boolean;
}

const Header: React.FC<HeaderProps> = ({
  frontCardId,
  totalCards,
  isCapturing,
  onTakeScreenshot,
  showMobileAudioPrompt,
}) => {
  const handleEnableAudio = async () => {
    try {
      // Create a silent audio to enable the audio context
      const audio = new Audio();
      audio.volume = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        audio.pause();
        audio.remove();
        console.log('🎵 Audio context enabled via manual button');
      }
    } catch (error) {
      console.log('🎵 Manual audio enable failed:', error);
    }
  };

  return (
    <div className="text-center mb-6 md:mb-8">
      <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
        Your Vibeline
      </h1>
      <p className="text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed">
        Swipe through your musical chapters ({frontCardId} / {totalCards}).
        <br />
        {UI_CONFIG.swipeInstructions.soundEmoji}{" "}
        {UI_CONFIG.swipeInstructions.instructionText}
      </p>

      {/* Mobile Audio Enable Prompt */}
      {showMobileAudioPrompt && (
        <div className="mt-4 mx-4 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl shadow-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-lg">🎵</span>
            <span className="font-semibold text-sm">Enable Audio for Full Experience</span>
          </div>
          <p className="text-xs mb-3 opacity-80">
            Tap anywhere or press the button below to enable audio playback
          </p>
          <button
            onClick={handleEnableAudio}
            className="px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md"
          >
            🔊 Enable Audio
          </button>
        </div>
      )}

      {/* Share Screenshot Button */}
      <button
        data-html2canvas-ignore
        onClick={onTakeScreenshot}
        disabled={isCapturing}
        className={`mt-4 px-6 py-2 md:px-8 md:py-3 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${
          isCapturing
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#7CFF67] to-[#5227FF] text-white hover:scale-105 shadow-lg"
        }`}
      >
        {isCapturing
          ? UI_CONFIG.screenshot.buttonText.capturing
          : UI_CONFIG.screenshot.buttonText.default}
      </button>
    </div>
  );
};

/**
 * Support footer component
 */
const SupportFooter: React.FC = () => (
  <div data-html2canvas-ignore className="mb-10">
    <a href={UI_CONFIG.buyMeACoffee.url} target="_blank">
      <img
        src={UI_CONFIG.buyMeACoffee.imageUrl}
        alt="Buy Me A Coffee"
        className="h-10 w-auto"
      />
    </a>
  </div>
);

/**
 * MoodTimeline Component
 *
 * Interactive timeline display component that renders swipeable cards representing
 * musical chapters with mood analysis. Features audio playback, screenshot capture,
 * and responsive design optimized for mobile and desktop.
 *
 * Key Features:
 * - Swipeable card interface using Stack component
 * - Automatic audio management with cleanup
 * - Screenshot capture functionality
 * - Responsive card dimensions
 * - Navigation menu integration
 *
 * @returns {JSX.Element} The complete MoodTimeline interface
 */
export default function MoodTimeline(): React.ReactElement {
  const location = useLocation();
  const { timeline } = location.state || { timeline: {} };
  const screenSize = useScreenSize();

  // Custom hooks
  const { cardsData } = useTimelineData(timeline);
  const { frontCardId, handleCardOrderChange } = useCardManager(cardsData);
  const { showMobileAudioPrompt } = useAudioManager();

  // Screenshot hook
  const { isCapturing, takeScreenshot } = useScreenshot({
    targetElementId: UI_CONFIG.screenshot.containerElementId,
  });

  // Enable scrolling on mount
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    return () => {
      // Cleanup if needed
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Calculate optimal card dimensions based on screen size
  const cardDimensions = useMemo(() => {
    return calculateCardDimensions(screenSize.width, screenSize.height);
  }, [screenSize]);

  return (
    <div
      // id="vibeline-container"
      className="w-full bg-black relative overflow-y-auto overflow-x-hidden"
      style={{ minHeight: "100vh" }}
    >
      <BubbleMenu
        items={NAVIGATION_ITEMS}
        menuAriaLabel={BUBBLE_MENU_CONFIG.menuAriaLabel}
        menuBg={BUBBLE_MENU_CONFIG.menuBg}
        menuContentColor={BUBBLE_MENU_CONFIG.menuContentColor}
        useFixedPosition={BUBBLE_MENU_CONFIG.useFixedPosition}
        animationEase={BUBBLE_MENU_CONFIG.animationEase}
        animationDuration={BUBBLE_MENU_CONFIG.animationDuration}
        staggerDelay={BUBBLE_MENU_CONFIG.staggerDelay}
      />
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={AURORA_CONFIG.colorStops}
          blend={AURORA_CONFIG.blend}
          amplitude={AURORA_CONFIG.amplitude}
          speed={AURORA_CONFIG.speed}
        />
      </div>

      {/* Content Container - positioned below BubbleMenu */}
      <div
        id="vibeline-container"
        className="relative z-10 w-full min-h-screen pt-15 md:pt-20 px-4"
      >
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-6xl flex flex-col items-center py-4 md:py-8">
            <Header
              frontCardId={frontCardId}
              totalCards={cardsData.length}
              isCapturing={isCapturing}
              onTakeScreenshot={takeScreenshot}
              showMobileAudioPrompt={showMobileAudioPrompt}
            />

            <div className="w-full flex items-center justify-center mb-12 md:mb-16">
              <Stack
                randomRotation={false}
                sensitivity={180}
                sendToBackOnClick={false}
                cardDimensions={cardDimensions}
                cardsData={cardsData}
                onCardOrderChange={handleCardOrderChange}
                renderCard={(card) => (
                  <ChapterCard
                    title={card.chapter}
                    phase={card.phase}
                    content={card.content}
                    soundtrack={card.soundtrack}
                    width={cardDimensions.width}
                    height={cardDimensions.height}
                    isInFront={frontCardId === card.id}
                    cardId={card.id}
                  />
                )}
              />
            </div>

            <SupportFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
