# Vibelines Component Documentation

## Overview

This document provides comprehensive documentation for all React components used in the Vibelines application, including their props, usage examples, and implementation details.

---

## Table of Contents

1. [Core Application Components](#core-application-components)
2. [UI Components](#ui-components)
3. [Custom Hooks](#custom-hooks)
4. [Utility Components](#utility-components)
5. [Page Components](#page-components)
6. [Usage Examples](#usage-examples)

---

## Core Application Components

### App.tsx - Main Application Component

The main entry point component that handles Spotify authentication and displays the home interface.

#### Props
```typescript
// No props - root component
```

#### Key Features
- Gyroscope permission handling for device motion effects
- Spotify authentication state management
- Aurora background with interactive text pressure effects
- Bubble navigation menu
- Responsive design with mobile-first approach

#### Implementation Details
```typescript
export default function App() {
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState<boolean>(false);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  
  // Gyroscope permission management
  const requestGyroscopePermission = async () => {
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      setPermissionGranted(permission === 'granted');
    }
  };
  
  // Authentication state management
  useEffect(() => {
    const checkAuth = () => {
      setIsSpotifyAuthenticated(isAuthenticated());
      setIsLoadingSpotify(false);
    };
    checkAuth();
  }, []);
  
  return (
    <div className="min-h-screen w-full bg-black relative">
      <Aurora {...AURORA_CONFIG} />
      <div className="relative z-10">
        <TextPressure 
          text="Vibelines"
          gyroscopeEnabled={permissionGranted}
        />
        <BubbleMenu items={BUBBLE_MENU_ITEMS} />
      </div>
    </div>
  );
}
```

---

### MoodTimeline.tsx - Interactive Timeline Component

Displays the generated mood timeline as swipeable cards with audio playback functionality.

#### Props
```typescript
// No props - page component that reads from navigation state
```

#### Key Features
- Swipeable card interface using Stack component
- Audio playback for song previews
- Screenshot capture functionality
- Responsive card dimensions
- Navigation menu integration

#### Implementation Details
```typescript
export default function MoodTimeline(): React.ReactElement {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [frontCardId, setFrontCardId] = useState<number>(1);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Card management
  const handleCardOrderChange = useCallback((newFrontCardId: number) => {
    setFrontCardId(newFrontCardId);
  }, []);
  
  // Audio handling
  const handleAudioPlay = useCallback((audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const newAudio = new Audio(audioUrl);
    newAudio.volume = 0.7;
    setCurrentAudio(newAudio);
    newAudio.play().catch(console.error);
  }, [currentAudio]);
  
  // Screenshot functionality
  const { takeScreenshot } = useScreenshot('vibeline-container');
  
  return (
    <div id="vibeline-container" className="min-h-screen bg-black">
      <Aurora {...AURORA_CONFIG} />
      <div className="relative z-10">
        <Header 
          frontCardId={frontCardId}
          totalCards={totalCards}
          isCapturing={isCapturing}
          onTakeScreenshot={takeScreenshot}
        />
        <Stack
          cards={chapterCards}
          onCardOrderChange={handleCardOrderChange}
          frontCardId={frontCardId}
        />
        <BubbleMenu items={BUBBLE_MENU_ITEMS} />
      </div>
    </div>
  );
}
```

---

### Loading.tsx - Data Processing Component

Orchestrates the entire Spotify data analysis flow from authentication to timeline generation.

#### Props
```typescript
// No props - page component
```

#### Key Features
- Multi-step data processing pipeline
- Progress tracking and error handling
- API rate limiting and retry logic
- Spotify OAuth callback processing
- Database operations for caching results

#### Implementation Details
```typescript
export default function Loading() {
  const [currentStep, setCurrentStep] = useState<string>('Initializing...');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const processUserData = async () => {
    try {
      setCurrentStep('Fetching user profile...');
      setProgress(10);
      const user = await getCurrentUser();
      
      setCurrentStep('Loading liked songs...');
      setProgress(20);
      const songs = await fetchAllLikedSongs();
      
      setCurrentStep('Analyzing song emotions...');
      const moodAnalyses: AnalyzeSongResponse[] = [];
      
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        setProgress(20 + (i / songs.length) * 60);
        
        const analysis = await analyzeSong({
          song_name: song.name,
          artist_name: song.artists[0].name,
        });
        
        moodAnalyses.push(analysis);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      }
      
      setCurrentStep('Generating timeline...');
      setProgress(85);
      const timeline = await generateTimeline(moodAnalyses);
      
      setCurrentStep('Saving results...');
      setProgress(95);
      await saveTimelineData(timeline);
      
      setProgress(100);
      navigate('/moodtimeline', { state: { timeline } });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">{currentStep}</div>
        <div className="w-64 bg-gray-800 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </div>
    </div>
  );
}
```

---

## UI Components

### AuroraBG.tsx - Animated Background

Creates a dynamic aurora-like background effect using OGL (WebGL library).

#### Props
```typescript
interface AuroraProps {
  colorStops: string[];      // Array of hex color codes for gradient
  blend: number;             // Blend factor (0-1)
  amplitude: number;         // Wave amplitude (0-1)
  speed: number;             // Animation speed multiplier
}
```

#### Usage
```typescript
<Aurora
  colorStops={['#7CFF67', '#B19EEF', '#5227FF']}
  blend={0.5}
  amplitude={0.25}
  speed={1}
/>
```

#### Implementation Details
```typescript
export default function Aurora({ colorStops, blend, amplitude, speed }: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new Renderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    
    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorStops: { value: parseColorStops(colorStops) },
        uBlend: { value: blend },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });
    
    const mesh = new Mesh(gl, { geometry, program });
    
    const animate = (time: number) => {
      program.uniforms.uTime.value = time * 0.001 * speed;
      renderer.render({ scene: mesh });
      requestAnimationFrame(animate);
    };
    
    animate(0);
    
    return () => renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }, [colorStops, blend, amplitude, speed]);
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
```

---

### BubbleMenu.tsx - Navigation Menu

Floating bubble navigation menu with hover effects and routing.

#### Props
```typescript
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

interface BubbleMenuProps {
  items: BubbleMenuItem[];
}
```

#### Usage
```typescript
const menuItems = [
  {
    label: "about",
    href: "/about",
    ariaLabel: "About",
    rotation: 8,
    hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
  },
  // ... more items
];

<BubbleMenu items={menuItems} />
```

#### Implementation Details
```typescript
export default function BubbleMenu({ items }: BubbleMenuProps) {
  const { hapticFeedback } = useHaptic();
  const navigate = useNavigate();
  
  const handleItemClick = useCallback((href: string) => {
    hapticFeedback.light();
    navigate(href);
  }, [hapticFeedback, navigate]);
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.href)}
            aria-label={item.ariaLabel}
            className="group relative"
            style={{ transform: `rotate(${item.rotation}deg)` }}
          >
            <div 
              className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-sm font-medium transition-all duration-300 hover:scale-110"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.hoverStyles.bgColor;
                e.currentTarget.style.color = item.hoverStyles.textColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = '';
              }}
            >
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### ChapterCard.tsx - Timeline Card

Individual card component displaying a musical chapter with mood analysis.

#### Props
```typescript
interface ChapterCardProps {
  chapter: string;           // Chapter title
  phase: string;            // Time period
  content: string;          // Narrative content
  soundtrack: string;       // Representative song
  cardId: number;          // Card identifier
  totalCards: number;      // Total number of cards
  onAudioPlay?: (url: string) => void;  // Audio playback callback
}
```

#### Usage
```typescript
<ChapterCard
  chapter="The Echoes of Love and Longing"
  phase="(March - April 2018)"
  content="You begin in a space of tender reflection, where love's sweetness intertwines with a gentle ache."
  soundtrack="When I Was Your Man by Bruno Mars"
  cardId={1}
  totalCards={5}
  onAudioPlay={handleAudioPlay}
/>
```

#### Implementation Details
```typescript
export default function ChapterCard({ 
  chapter, 
  phase, 
  content, 
  soundtrack, 
  cardId, 
  totalCards, 
  onAudioPlay 
}: ChapterCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  
  const loadPreview = useCallback(async () => {
    if (previewUrl || isLoadingPreview) return;
    
    setIsLoadingPreview(true);
    try {
      const [artist, song] = soundtrack.split(' by ').reverse();
      const url = await findPreviewUrl(song, artist);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [soundtrack, previewUrl, isLoadingPreview]);
  
  const handlePlayClick = useCallback(() => {
    if (previewUrl && onAudioPlay) {
      onAudioPlay(previewUrl);
    }
  }, [previewUrl, onAudioPlay]);
  
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-white text-xl font-bold mb-2">{chapter}</h2>
        <p className="text-gray-300 text-sm">{phase}</p>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-200 text-base leading-relaxed">{content}</p>
      </div>
      
      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-300 text-sm mb-1">🎵 Soundtrack</p>
            <p className="text-white text-sm font-medium">{soundtrack}</p>
          </div>
          
          <button
            onClick={handlePlayClick}
            onMouseEnter={loadPreview}
            disabled={!previewUrl && !isLoadingPreview}
            className="ml-4 w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 flex items-center justify-center transition-colors"
          >
            {isLoadingPreview ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1" />
            )}
          </button>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <span className="text-gray-400 text-xs">
          {cardId} / {totalCards}
        </span>
      </div>
    </div>
  );
}
```

---

### Stack.tsx - Swipeable Card Stack

Manages a stack of swipeable cards with gesture recognition and animations.

#### Props
```typescript
interface StackProps {
  cards: React.ReactNode[];                    // Array of card components
  onCardOrderChange?: (newFrontCardId: number) => void;  // Callback for order changes
  frontCardId?: number;                        // Currently displayed card ID
  direction?: 'horizontal' | 'vertical';       // Swipe direction
  snapThreshold?: number;                      // Swipe threshold (0-1)
}
```

#### Usage
```typescript
<Stack
  cards={[
    <ChapterCard key={1} {...chapter1Props} />,
    <ChapterCard key={2} {...chapter2Props} />,
    <ChapterCard key={3} {...chapter3Props} />,
  ]}
  onCardOrderChange={handleCardOrderChange}
  frontCardId={currentCardId}
  direction="horizontal"
  snapThreshold={0.3}
/>
```

#### Implementation Details
```typescript
export default function Stack({ 
  cards, 
  onCardOrderChange, 
  frontCardId = 1,
  direction = 'horizontal',
  snapThreshold = 0.3 
}: StackProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentFrontId, setCurrentFrontId] = useState<number>(frontCardId);
  
  const handleDragStart = useCallback((event: PointerEvent) => {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);
  
  const handleDragMove = useCallback((event: PointerEvent) => {
    if (!isDragging) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragOffset({
      x: event.clientX - centerX,
      y: event.clientY - centerY,
    });
  }, [isDragging]);
  
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = direction === 'horizontal' 
      ? window.innerWidth * snapThreshold
      : window.innerHeight * snapThreshold;
    
    const offset = direction === 'horizontal' ? dragOffset.x : dragOffset.y;
    
    if (Math.abs(offset) > threshold) {
      const newFrontId = offset > 0 
        ? Math.max(1, currentFrontId - 1)
        : Math.min(cards.length, currentFrontId + 1);
      
      setCurrentFrontId(newFrontId);
      onCardOrderChange?.(newFrontId);
    }
    
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, dragOffset, direction, snapThreshold, currentFrontId, cards.length, onCardOrderChange]);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {cards.map((card, index) => {
        const cardId = index + 1;
        const isActive = cardId === currentFrontId;
        const offset = cardId - currentFrontId;
        
        const transform = isActive && isDragging
          ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.1}deg)`
          : `translate3d(${offset * 20}px, ${offset * 10}px, ${-Math.abs(offset) * 10}px)`;
        
        return (
          <div
            key={cardId}
            className={`absolute inset-0 transition-transform duration-300 ${
              isActive ? 'z-10' : `z-${10 - Math.abs(offset)}`
            }`}
            style={{
              transform,
              opacity: Math.max(0.1, 1 - Math.abs(offset) * 0.3),
            }}
            onPointerDown={isActive ? handleDragStart : undefined}
            onPointerMove={isActive ? handleDragMove : undefined}
            onPointerUp={isActive ? handleDragEnd : undefined}
          >
            {card}
          </div>
        );
      })}
    </div>
  );
}
```

---

### TextPressure.tsx - Dynamic Text Effects

Creates pressure-sensitive text effects that respond to device motion (gyroscope).

#### Props
```typescript
interface TextPressureProps {
  text: string;                    // Text to display
  flex?: boolean;                  // Enable flex layout
  alpha?: boolean;                 // Enable alpha transparency effects
  stroke?: boolean;                // Enable stroke effects
  width?: boolean;                 // Enable width effects
  weight?: boolean;                // Enable weight effects
  italic?: boolean;                // Enable italic effects
  textColor?: string;              // Text color (hex)
  strokeColor?: string;            // Stroke color (hex)
  minFontSize?: number;            // Minimum font size
  gyroscopeEnabled?: boolean;      // Enable gyroscope effects
}
```

#### Usage
```typescript
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
```

#### Implementation Details
```typescript
export default function TextPressure({
  text,
  flex = false,
  alpha = true,
  stroke = true,
  width = true,
  weight = true,
  italic = true,
  textColor = '#ffffff',
  strokeColor = '#ff0000',
  minFontSize = 16,
  gyroscopeEnabled = false
}: TextPressureProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [pressure, setPressure] = useState<number>(0.5);
  const [deviceMotion, setDeviceMotion] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    if (!gyroscopeEnabled) return;
    
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (acceleration) {
        setDeviceMotion({
          x: acceleration.x || 0,
          y: acceleration.y || 0,
          z: acceleration.z || 0,
        });
        
        // Calculate pressure based on motion intensity
        const intensity = Math.sqrt(
          Math.pow(acceleration.x || 0, 2) + 
          Math.pow(acceleration.y || 0, 2) + 
          Math.pow(acceleration.z || 0, 2)
        );
        
        setPressure(Math.min(1, Math.max(0, intensity / 20)));
      }
    };
    
    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [gyroscopeEnabled]);
  
  const styles = useMemo(() => {
    const baseSize = minFontSize + (pressure * 40);
    
    return {
      fontSize: `${baseSize}px`,
      fontWeight: weight ? Math.round(400 + (pressure * 500)) : 400,
      fontStyle: italic && pressure > 0.3 ? 'italic' : 'normal',
      color: textColor,
      opacity: alpha ? 0.5 + (pressure * 0.5) : 1,
      textShadow: stroke ? `2px 2px 4px ${strokeColor}` : 'none',
      transform: `scale(${1 + pressure * 0.2}) rotate(${deviceMotion.x * 2}deg)`,
      transition: 'all 0.1s ease-out',
    };
  }, [pressure, deviceMotion, textColor, strokeColor, weight, italic, alpha, stroke, width, minFontSize]);
  
  return (
    <div 
      ref={textRef}
      className={`text-center font-bold ${flex ? 'flex items-center justify-center' : ''}`}
      style={styles}
    >
      {text}
    </div>
  );
}
```

---

## Custom Hooks

### useScreenshot.ts - Screenshot Capture

Provides functionality to capture screenshots of specific DOM elements for social sharing.

#### Interface
```typescript
interface ScreenshotHook {
  takeScreenshot: () => Promise<void>;
  isCapturing: boolean;
  error: string | null;
}

function useScreenshot(elementId: string): ScreenshotHook;
```

#### Usage
```typescript
const { takeScreenshot, isCapturing, error } = useScreenshot('vibeline-container');

const handleShare = async () => {
  try {
    await takeScreenshot();
  } catch (err) {
    console.error('Screenshot failed:', err);
  }
};
```

#### Implementation
```typescript
export function useScreenshot(elementId: string): ScreenshotHook {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const takeScreenshot = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }
      
      // Use html2canvas to capture the element
      const canvas = await html2canvas(element, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        ignoreElements: (element) => {
          return element.hasAttribute('data-html2canvas-ignore');
        },
      });
      
      // Create Instagram Story dimensions (9:16 aspect ratio)
      const storyWidth = 1080;
      const storyHeight = 1920;
      const storyCanvas = document.createElement('canvas');
      storyCanvas.width = storyWidth;
      storyCanvas.height = storyHeight;
      
      const ctx = storyCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      // Fill with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, storyWidth, storyHeight);
      
      // Calculate scaling and positioning
      const sourceAspect = canvas.width / canvas.height;
      const targetAspect = storyWidth / storyHeight;
      
      let drawWidth = storyWidth;
      let drawHeight = storyHeight;
      let drawX = 0;
      let drawY = 0;
      
      if (sourceAspect > targetAspect) {
        // Source is wider, scale to height and center horizontally
        drawWidth = storyHeight * sourceAspect;
        drawX = (storyWidth - drawWidth) / 2;
      } else {
        // Source is taller, scale to width and center vertically
        drawHeight = storyWidth / sourceAspect;
        drawY = (storyHeight - drawHeight) / 2;
      }
      
      // Draw the captured content
      ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
      
      // Add branding overlay
      const urlText = "Discover your's @ vibelines.vercel.app";
      ctx.font = 'bold 32px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(urlText, storyWidth / 2, storyHeight - 140);
      
      // Convert to blob and trigger download/share
      storyCanvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to create image blob');
        
        const file = new File([blob], 'my-vibeline.png', { type: 'image/png' });
        
        // Try Web Share API first (mobile)
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Vibeline',
              text: 'Check out my 🎵Vibeline✨!\n\nDiscover your\'s 👇\nhttps://vibelines.vercel.app'
            });
          } catch (shareError) {
            // Fallback to download
            downloadFile(file);
          }
        } else {
          // Desktop - trigger download
          downloadFile(file);
        }
      }, 'image/png');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Screenshot capture failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCapturing(false);
    }
  }, [elementId]);
  
  return { takeScreenshot, isCapturing, error };
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

### useScreenSize.ts - Screen Dimension Tracking

Tracks screen dimensions and updates on resize for responsive design calculations.

#### Interface
```typescript
interface ScreenSize {
  width: number;
  height: number;
}

function useScreenSize(): ScreenSize;
```

#### Usage
```typescript
const screenSize = useScreenSize();

const cardDimensions = useMemo(() => {
  return calculateCardDimensions(screenSize.width, screenSize.height);
}, [screenSize]);
```

#### Implementation
```typescript
export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', () => {
      // Delay to account for mobile browser UI changes
      setTimeout(updateScreenSize, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);
  
  return screenSize;
}
```

---

## Usage Examples

### Complete Timeline Implementation

```typescript
// pages/Timeline.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Aurora, BubbleMenu, Stack, ChapterCard } from '../components';
import { useScreenshot, useScreenSize } from '../hooks';

interface TimelineData {
  Chapters: Record<string, string>;
  Phases: Record<string, string>;
  Contents: Record<string, string>;
  Soundtracks: Record<string, string>;
}

export default function Timeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const { takeScreenshot, isCapturing } = useScreenshot('timeline-container');
  
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [frontCardId, setFrontCardId] = useState<number>(1);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Load timeline data from navigation state or storage
  useEffect(() => {
    const data = location.state?.timeline || localStorage.getItem('vibelines_timeline');
    if (data) {
      setTimelineData(typeof data === 'string' ? JSON.parse(data) : data);
    } else {
      navigate('/'); // Redirect if no data
    }
  }, [location.state, navigate]);
  
  // Audio handling
  const handleAudioPlay = useCallback((audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const newAudio = new Audio(audioUrl);
    newAudio.volume = 0.7;
    setCurrentAudio(newAudio);
    newAudio.play().catch(console.error);
  }, [currentAudio]);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);
  
  // Card management
  const handleCardOrderChange = useCallback((newFrontCardId: number) => {
    setFrontCardId(newFrontCardId);
  }, []);
  
  // Generate card components
  const chapterCards = useMemo(() => {
    if (!timelineData) return [];
    
    return Object.keys(timelineData.Chapters).map((key) => (
      <ChapterCard
        key={key}
        chapter={timelineData.Chapters[key]}
        phase={timelineData.Phases[key]}
        content={timelineData.Contents[key]}
        soundtrack={timelineData.Soundtracks[key]}
        cardId={parseInt(key)}
        totalCards={Object.keys(timelineData.Chapters).length}
        onAudioPlay={handleAudioPlay}
      />
    ));
  }, [timelineData, handleAudioPlay]);
  
  if (!timelineData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading timeline...</div>
      </div>
    );
  }
  
  return (
    <div id="timeline-container" className="min-h-screen bg-black">
      <Aurora
        colorStops={['#7CFF67', '#B19EEF', '#5227FF']}
        blend={0.5}
        amplitude={0.25}
        speed={1}
      />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-white text-3xl font-bold mb-4">Your Vibeline</h1>
          <p className="text-gray-400 text-lg">
            Swipe through your musical chapters ({frontCardId} / {chapterCards.length})
          </p>
          
          <button
            onClick={takeScreenshot}
            disabled={isCapturing}
            className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-white rounded-full transition-colors"
          >
            {isCapturing ? '📸 Capturing...' : '📸 Share Vibeline'}
          </button>
        </div>
        
        {/* Cards */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md h-[600px]">
            <Stack
              cards={chapterCards}
              onCardOrderChange={handleCardOrderChange}
              frontCardId={frontCardId}
              direction="horizontal"
              snapThreshold={0.3}
            />
          </div>
        </div>
        
        {/* Navigation */}
        <BubbleMenu
          items={[
            {
              label: "home",
              href: "/",
              ariaLabel: "Home",
              rotation: -5,
              hoverStyles: { bgColor: "#1DB954", textColor: "#ffffff" },
            },
            {
              label: "about",
              href: "/about",
              ariaLabel: "About",
              rotation: 8,
              hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
            },
          ]}
        />
      </div>
    </div>
  );
}
```

### Custom Component with Hooks

```typescript
// components/MusicPlayer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useScreenSize } from '../hooks';

interface Track {
  id: string;
  title: string;
  artist: string;
  previewUrl?: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  autoPlay?: boolean;
  onTrackChange?: (track: Track) => void;
}

export default function MusicPlayer({ 
  tracks, 
  autoPlay = false, 
  onTrackChange 
}: MusicPlayerProps) {
  const screenSize = useScreenSize();
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  const currentTrack = tracks[currentTrackIndex];
  
  // Initialize audio
  useEffect(() => {
    if (!currentTrack?.previewUrl) return;
    
    const newAudio = new Audio(currentTrack.previewUrl);
    newAudio.crossOrigin = 'anonymous';
    
    const handleLoadedMetadata = () => setDuration(newAudio.duration);
    const handleTimeUpdate = () => setCurrentTime(newAudio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };
    
    newAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    newAudio.addEventListener('timeupdate', handleTimeUpdate);
    newAudio.addEventListener('ended', handleEnded);
    
    setAudio(newAudio);
    
    if (autoPlay) {
      newAudio.play().then(() => setIsPlaying(true));
    }
    
    return () => {
      newAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      newAudio.removeEventListener('timeupdate', handleTimeUpdate);
      newAudio.removeEventListener('ended', handleEnded);
      newAudio.pause();
      newAudio.currentTime = 0;
    };
  }, [currentTrack, autoPlay]);
  
  // Notify parent of track changes
  useEffect(() => {
    if (currentTrack && onTrackChange) {
      onTrackChange(currentTrack);
    }
  }, [currentTrack, onTrackChange]);
  
  const togglePlayPause = useCallback(() => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  }, [audio, isPlaying]);
  
  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  }, [tracks.length]);
  
  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);
  
  const seekTo = useCallback((position: number) => {
    if (!audio) return;
    audio.currentTime = (position / 100) * duration;
  }, [audio, duration]);
  
  // Responsive sizing
  const playerSize = screenSize.width < 768 ? 'mobile' : 'desktop';
  
  return (
    <div className={`music-player ${playerSize === 'mobile' ? 'mobile' : 'desktop'}`}>
      {/* Track Info */}
      <div className="track-info text-center mb-4">
        <h3 className="text-white text-lg font-semibold">{currentTrack?.title}</h3>
        <p className="text-gray-400">{currentTrack?.artist}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-bar mb-4">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="controls flex items-center justify-center gap-4">
        <button
          onClick={prevTrack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          ⏮️
        </button>
        
        <button
          onClick={togglePlayPause}
          disabled={!currentTrack?.previewUrl}
          className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 flex items-center justify-center transition-colors"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button
          onClick={nextTrack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

This comprehensive component documentation provides detailed information about all the major components in the Vibelines application, including their props, usage patterns, and implementation details.