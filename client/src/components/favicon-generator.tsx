import { useEffect } from 'react';
import { OFFICIAL_RUBIKS_COLORS } from "@/lib/rubiks-colors";

export function generateFavicon() {
  // Create a canvas for the favicon
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Set canvas size for favicon (32x32 is standard)
  canvas.width = 32;
  canvas.height = 32;

  // Logo pattern (6x6 grid scaled to fit 32x32)
  const logoPattern = [
    [1, 1, 0, 2, 2, 0],  // R pattern top
    [1, 0, 1, 2, 0, 2],  // R pattern middle  
    [1, 1, 0, 2, 2, 0],  // R pattern bottom
    [0, 0, 0, 0, 0, 0],  // spacing
    [3, 3, 3, 4, 0, 4],  // M pattern top
    [3, 0, 3, 4, 4, 4],  // M pattern bottom
  ];

  const colors = [
    OFFICIAL_RUBIKS_COLORS.white.hex,    // 0 - background/white
    OFFICIAL_RUBIKS_COLORS.red.hex,      // 1 - red for R
    OFFICIAL_RUBIKS_COLORS.blue.hex,     // 2 - blue for R accent
    OFFICIAL_RUBIKS_COLORS.orange.hex,   // 3 - orange for M
    OFFICIAL_RUBIKS_COLORS.green.hex,    // 4 - green for M accent
  ];

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 32, 32);

  // Calculate cell size (32px / 6 = ~5.33px per cell)
  const cellSize = Math.floor(32 / 6);
  const offsetX = (32 - (cellSize * 6)) / 2;
  const offsetY = (32 - (cellSize * 6)) / 2;

  // Draw the mosaic pattern
  logoPattern.forEach((row, rowIndex) => {
    row.forEach((colorIndex, colIndex) => {
      ctx.fillStyle = colors[colorIndex];
      const x = offsetX + (colIndex * cellSize);
      const y = offsetY + (rowIndex * cellSize);
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Add subtle border for definition
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellSize, cellSize);
    });
  });

  return canvas.toDataURL('image/png');
}

// Component to generate and download favicon
export function FaviconGenerator() {
  useEffect(() => {
    const dataUrl = generateFavicon();
    if (dataUrl) {
      // Create download link for the favicon
      const link = document.createElement('a');
      link.download = 'favicon.png';
      link.href = dataUrl;
      
      // Also update the existing favicon if it exists
      let existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!existingFavicon) {
        existingFavicon = document.createElement('link');
        existingFavicon.rel = 'icon';
        existingFavicon.type = 'image/png';
        document.head.appendChild(existingFavicon);
      }
      existingFavicon.href = dataUrl;
    }
  }, []);

  return null; // This component doesn't render anything visible
}