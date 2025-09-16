import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';
import { useHaptic } from "use-haptic";

interface UseScreenshotProps {
  targetElementId: string;
}

export const useScreenshot = ({ targetElementId }: UseScreenshotProps) => {
  const { triggerHaptic } = useHaptic();
  triggerHaptic();
  const [isCapturing, setIsCapturing] = useState(false);

  const takeScreenshot = useCallback(async () => {
    try {
      setIsCapturing(true);

      // // Find the Aurora background element and temporarily make it non-fixed
      // const auroraElements = document.querySelectorAll('[class*="aurora"], [style*="position: fixed"]');
      // const originalStyles: { element: HTMLElement; originalStyle: string }[] = [];
      
      // // Temporarily change fixed positioned elements to absolute
      // auroraElements.forEach((el) => {
      //   const element = el as HTMLElement;
      //   if (element.style.position === 'fixed') {
      //     originalStyles.push({
      //       element,
      //       originalStyle: element.style.cssText
      //     });
      //     element.style.position = 'absolute';
      //     element.style.top = '0';
      //     element.style.left = '0';
      //     element.style.right = '0';
      //     element.style.bottom = '0';
      //   }
      // });

      // Capture the entire document body to include background
      const targetElement = document.getElementById(targetElementId);
      
      if (!targetElement) {
        throw new Error(`Element with id "${targetElementId}" not found`);
      }

      // Create Instagram Story canvas (9:16 aspect ratio)
      const storyWidth = 1080;
      const storyHeight = 1920;

      // Capture the entire viewport including aurora background
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        // width: window.innerWidth,
        // height: window.innerHeight,
        // x: 0,
        // y: 0,
      });

      // // Restore original styles
      // originalStyles.forEach(({ element, originalStyle }) => {
      //   element.style.cssText = originalStyle;
      // });

      // Create final Instagram story canvas
      const storyCanvas = document.createElement('canvas');
      storyCanvas.width = storyWidth;
      storyCanvas.height = storyHeight;
      const ctx = storyCanvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Calculate scaling to fill entire canvas while maintaining aspect ratio
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

      // Draw the captured content to fill entire canvas
      ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

      // Add semi-transparent overlay for URL visibility (higher up to avoid Instagram UI)
      const overlayHeight = 120;
      const urlYPosition = storyHeight - 140; // Move URL higher up
      const gradient = ctx.createLinearGradient(0, storyHeight - overlayHeight, 0, storyHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, storyHeight - overlayHeight, storyWidth, overlayHeight);

      // Add website URL higher up to avoid Instagram UI
      const urlText = 'Discover your\'s @ vibelines.vercel.app';
      ctx.font = 'bold 32px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      
      // Measure text to create background
      const textMetrics = ctx.measureText(urlText);
      const textWidth = textMetrics.width;
      const textHeight = 32; // Font size
      const padding = 16;
      
      // Draw rounded background for URL
      const bgX = (storyWidth - textWidth) / 2 - padding;
      const bgY = urlYPosition - textHeight - padding / 2;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = textHeight + padding;
      const borderRadius = 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius);
      ctx.fill();
      
      // Add white text with shadow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(urlText, storyWidth / 2, urlYPosition);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

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
            // If share fails, fallback to download
            downloadImage(blob);
          }
        } else {
          // Desktop - download image
          downloadImage(blob);
        }
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('Screenshot failed. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [targetElementId]);

  const downloadImage = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibeline-story.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isCapturing,
    takeScreenshot
  };
};
