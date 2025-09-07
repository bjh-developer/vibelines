import { useState, useEffect } from 'react';

interface ScreenDimensions {
  width: number;
  height: number;
}

export function useScreenSize(): ScreenDimensions {
  const [screenSize, setScreenSize] = useState<ScreenDimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

// Function to calculate optimal card dimensions
export function calculateCardDimensions(screenWidth: number, screenHeight: number) {
  // Use 80% of screen width and height, with some reasonable limits
  const maxWidth = Math.min(screenWidth * 0.8, 500);
  const maxHeight = Math.min(screenHeight * 0.7, 600);
  
  // Maintain a reasonable aspect ratio (roughly 3:4)
  const aspectRatio = 3 / 4;
  
  let cardWidth = maxWidth;
  let cardHeight = maxWidth / aspectRatio;
  
  // If height exceeds max, adjust by height instead
  if (cardHeight > maxHeight) {
    cardHeight = maxHeight;
    cardWidth = maxHeight * aspectRatio;
  }
  
  // Ensure minimum dimensions for readability
  cardWidth = Math.max(cardWidth, 280);
  cardHeight = Math.max(cardHeight, 350);
  
  return {
    width: Math.round(cardWidth),
    height: Math.round(cardHeight)
  };
}
