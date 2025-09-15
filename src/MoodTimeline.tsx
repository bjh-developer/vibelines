import Stack from "./components/Stack";
import ChapterCard from "./components/ChapterCard";
import { useLocation } from "react-router-dom";
import { useScreenSize, calculateCardDimensions } from "./hooks/useScreenSize";
import { useMemo, useState, useCallback, useEffect } from "react";
import Aurora from "./components/AuroraBG";
import { useScreenshot } from "./hooks/useScreenshot";
import BubbleMenu from "./components/BubbleMenu";
import { audioManager } from "./utils/deezerApi";

interface TimelineData {
  Chapters: { [key: string]: string };
  Phases: { [key: string]: string };
  Contents: { [key: string]: string };
  Soundtracks: { [key: string]: string };
}

export default function MoodTimeline() {
  const items = [
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

  const location = useLocation();
  const { timeline } = location.state || { timeline: {} };
  const screenSize = useScreenSize();
  const [frontCardId, setFrontCardId] = useState<number | null>(null);

  // Screenshot hook
  const { isCapturing, takeScreenshot } = useScreenshot({
    targetElementId: "vibeline-container",
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

  // Stop audio when leaving the page
  useEffect(() => {
    // Also stop audio immediately when navigating
    const handleBeforeUnload = () => {
      console.log('🎵 Page unloading - stopping audio');
      audioManager.stop();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🎵 Page hidden - stopping audio');
        audioManager.stop();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🎵 Stopping audio on component unmount');
      audioManager.stop();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calculate optimal card dimensions based on screen size
  const cardDimensions = useMemo(() => {
    return calculateCardDimensions(screenSize.width, screenSize.height);
  }, [screenSize]);

  // Process timeline data into cards - adapt to Stack's expected format
  const cardsData = useMemo(() => {
    if (!timeline || typeof timeline !== "object") {
      return [];
    }

    const timelineData = timeline as TimelineData;
    const { Chapters, Phases, Contents, Soundtracks } = timelineData;

    if (!Chapters || !Phases || !Contents || !Soundtracks) {
      return [];
    }

    const cards = Object.keys(Chapters)
      .map((key) => {
        const cardId = parseInt(key);
        return {
          id: cardId,
          // Store the card data instead of rendered component
          chapter: Chapters[key],
          phase: Phases[key],
          content: Contents[key],
          soundtrack: Soundtracks[key],
        };
      })
      .sort((a, b) => a.id - b.id); // Sort chronologically by ID

    return cards;
  }, [timeline]);

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
          console.log("🃏 Front card changed from", frontCardId, "to:", newFrontId);
          // Immediately stop any playing audio to prevent overlaps during fast swiping
          audioManager.stopImmediate();
          setFrontCardId(newFrontId);
        }
      }
    },
    [frontCardId]
  );

  return (
    <div
      id="vibeline-container"
      className="w-full bg-black relative overflow-y-auto overflow-x-hidden"
      style={{ minHeight: "100vh" }}
    >
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
      <div
        className="fixed inset-0 z-0"
      >
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
          <div className="w-full max-w-6xl flex flex-col items-center py-4 md:py-8">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
                Your Vibeline
              </h1>
              <p className="text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed">
                Swipe through your musical chapters ({frontCardId} / {cardsData.length}).
              </p>

              {/* Share Screenshot Button */}
              <button
                onClick={takeScreenshot}
                disabled={isCapturing}
                className={`mt-4 px-6 py-2 md:px-8 md:py-3 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${
                  isCapturing
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#7CFF67] to-[#5227FF] text-white hover:scale-105 shadow-lg"
                }`}
              >
                {isCapturing ? "📸 Capturing..." : "📸 Share Story"}
              </button>
            </div>

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

            <div>
              <a href="https://www.buymeacoffee.com/bjh21" target="_blank">
                <img src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png" alt="Buy Me A Coffee" className="height: 60px !important;width: 217px !important;" />
              </a>
            </div>

            <div className="text-center max-w-2xl mt-8 md:mt-12 pb-8">
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                Swipe the cards to explore different chapters of your
                musical journey.
                <br />
                Turn on sound!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
