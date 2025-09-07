import Stack from './components/Stack';
import ChapterCard from './components/ChapterCard';
import { useLocation } from 'react-router-dom';
import { useScreenSize, calculateCardDimensions } from './hooks/useScreenSize';
import { useMemo, useState, useCallback, useEffect } from 'react';
import Aurora from './components/AuroraBG';
import { useScreenshot } from './hooks/useScreenshot';

interface TimelineData {
  Chapters: { [key: string]: string };
  Phases: { [key: string]: string };
  Contents: { [key: string]: string };
  Soundtracks: { [key: string]: string };
}

export default function MoodTimeline() {
  const location = useLocation();
  const { timeline } = location.state || { timeline: {} };
  const screenSize = useScreenSize();
  const [frontCardId, setFrontCardId] = useState<number | null>(null);

  // Screenshot hook
  const { isCapturing, takeScreenshot } = useScreenshot({
    targetElementId: 'vibeline-container'
  });

  // Enable scrolling on mount
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      // Cleanup if needed
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Calculate optimal card dimensions based on screen size
  const cardDimensions = useMemo(() => {
    return calculateCardDimensions(screenSize.width, screenSize.height);
  }, [screenSize]);

  // Process timeline data into cards - adapt to Stack's expected format
  const cardsData = useMemo(() => {
    if (!timeline || typeof timeline !== 'object') {
      return [];
    }

    const timelineData = timeline as TimelineData;
    const { Chapters, Phases, Contents, Soundtracks } = timelineData;

    if (!Chapters || !Phases || !Contents || !Soundtracks) {
      return [];
    }

    const cards = Object.keys(Chapters).map((key) => {
      const cardId = parseInt(key);
      return {
        id: cardId,
        // Store the card data instead of rendered component
        chapter: Chapters[key],
        phase: Phases[key],
        content: Contents[key],
        soundtrack: Soundtracks[key]
      };
    }).sort((a, b) => a.id - b.id); // Sort chronologically by ID

    return cards;
  }, [timeline]);

  // Set the initial front card ID
  useEffect(() => {
    if (cardsData.length > 0 && frontCardId === null) {
      const initialFrontId = cardsData[0].id; // First card (chronologically #1)
      console.log('🃏 Setting initial front card to:', initialFrontId);
      setFrontCardId(initialFrontId);
    }
  }, [cardsData, frontCardId]);

  // Callback to update which card is in front
  const handleCardOrderChange = useCallback((newCards: any[]) => {
    if (newCards.length > 0) {
      // The top card is now the last one in the array (since we reversed it)
      const newFrontId = newCards[newCards.length - 1].id;
      if (newFrontId !== frontCardId) {
        console.log('🃏 Front card changed to:', newFrontId);
        setFrontCardId(newFrontId);
      }
    }
  }, [frontCardId]);

  return (
    <div id="vibeline-container" className="w-full flex flex-col items-center justify-start p-4 bg-black relative overflow-y-auto overflow-x-hidden" style={{ minHeight: '100vh' }}>
        <div className="absolute inset-0 z-0" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Aurora
            colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
            blend={0.5}
            amplitude={0.5}
            speed={1}
            />
        </div>
        <div className='z-10 p-4 md:p-8 w-full max-w-6xl flex flex-col items-center'>
            <div className="text-center mb-6 md:mb-8">
                <h1 className="text-white text-2xl md:text-4xl font-bold mb-2 md:mb-4">Your Vibeline</h1>
                <p className="text-gray-400 text-base md:text-lg">Swipe through your musical chapters</p>
                
                {/* Share Screenshot Button */}
                <button
                  onClick={takeScreenshot}
                  disabled={isCapturing}
                  className={`mt-4 px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    isCapturing
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#7CFF67] to-[#5227FF] text-white hover:scale-105 shadow-lg'
                  }`}
                >
                  {isCapturing ? '📸 Capturing...' : '📸 Share Story'}
                </button>
            </div>
        
        <div className="w-full flex items-center justify-center mb-6">
            <Stack
            randomRotation={true}
            sensitivity={150}
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
                />
            )}
            />
        </div>
        
        <div className="text-center max-w-2xl mt-4 pb-8">
            <p className="text-gray-500 text-sm">
            Drag or swipe the cards to explore different chapters of your musical journey. Turn on sound!
            </p>
        </div>
        </div>
    </div>
  );
}