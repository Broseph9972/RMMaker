// Advanced mosaic generation algorithms inspired by Roman-/mosaic
// Includes gradient method, error diffusion, ordered dithering, and enhanced color matching

export enum MosaicMethod {
  GRADIENT = 'gradient',
  CLOSEST_COLOR = 'closest_color',
  ORDERED_DITHER = 'ordered_dither',
  ERROR_DIFFUSION = 'error_diffusion',
  ATKINSON = 'atkinson'
}

export interface MosaicOptions {
  method: MosaicMethod;
  parameter: number; // Method-specific parameter (intensity, ratio, etc.)
  excludeColors?: string[]; // Colors to exclude from processing
  useBlackStickers?: boolean; // Whether to include black stickers
  cubeOutlineType?: 'stickerless' | 'white' | 'black'; // Cube outline preference
  twoColorGrayscale?: [string, string]; // [lightColor, darkColor] for two-color mode
}

// Color distance calculation using euclidean distance
function colorDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}

// Find the closest color in the palette
function approximateColor(color: number[], palette: number[][]): number[] {
  let bestMatch = palette[0];
  let bestDistance = Number.MAX_SAFE_INTEGER;
  
  for (const paletteColor of palette) {
    const distance = colorDistance(color, paletteColor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = paletteColor;
    }
  }
  
  return bestMatch;
}

// Convert hex color to RGB array
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Convert RGB array to hex color
function rgbToHex(rgb: number[]): string {
  return "#" + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

// Get official Rubik's cube palette as RGB arrays (WCA standard colors)
function getDefaultPalette(): number[][] {
  return [
    [255, 255, 255], // White
    [183, 18, 52],   // Red (official WCA)
    [0, 70, 173],    // Blue (official WCA)
    [255, 88, 0],    // Orange (official WCA)
    [0, 155, 72],    // Green (official WCA)
    [255, 213, 0],   // Yellow (official WCA)
  ];
}

// Gradient method - works best for portraits by treating image as grayscale
export function gradientMethod(imageData: ImageData, palette: string[], ranges: number[]): ImageData {
  const rgbPalette = palette.map(hexToRgb);
  const data = new Uint8ClampedArray(imageData.data);
  
  // Sort palette by brightness for gradient mapping
  const sortedPalette = rgbPalette.slice().sort((a, b) => {
    return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]);
  });
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale tone
    const tone = (r + g + b) / 3;
    
    // Find matching color based on ranges
    let matchedColor = sortedPalette[sortedPalette.length - 1];
    for (let j = 0; j < ranges.length; j++) {
      if (tone < ranges[j]) {
        matchedColor = sortedPalette[j];
        break;
      }
    }
    
    data[i] = matchedColor[0];
    data[i + 1] = matchedColor[1];
    data[i + 2] = matchedColor[2];
    data[i + 3] = 255;
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

// Closest color method - replaces each pixel with nearest palette color
export function closestColorMethod(imageData: ImageData, palette: string[]): ImageData {
  const rgbPalette = palette.map(hexToRgb);
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const color = [data[i], data[i + 1], data[i + 2]];
    const matched = approximateColor(color, rgbPalette);
    
    data[i] = matched[0];
    data[i + 1] = matched[1];
    data[i + 2] = matched[2];
    data[i + 3] = 255;
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

// Ordered dithering - creates structured dither patterns
export function orderedDither(imageData: ImageData, palette: string[], ratio: number = 1.0): ImageData {
  const rgbPalette = palette.map(hexToRgb);
  const data = new Uint8ClampedArray(imageData.data);
  const w = imageData.width;
  const h = imageData.height;
  
  // Bayer matrix for ordered dithering
  const matrix = [
    [1, 9, 3, 11],
    [13, 5, 15, 7],
    [4, 12, 2, 10],
    [16, 8, 14, 6]
  ];
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (4 * x) + (4 * y * w);
      
      // Apply dither matrix
      const threshold = matrix[x % 4][y % 4] * ratio;
      
      data[i] += threshold;
      data[i + 1] += threshold;
      data[i + 2] += threshold;
      
      // Clamp values
      data[i] = Math.min(255, Math.max(0, data[i]));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
      
      const color = [data[i], data[i + 1], data[i + 2]];
      const matched = approximateColor(color, rgbPalette);
      
      data[i] = matched[0];
      data[i + 1] = matched[1];
      data[i + 2] = matched[2];
      data[i + 3] = 255;
    }
  }
  
  return new ImageData(data, w, h);
}

// Error diffusion dithering - spreads quantization error to neighboring pixels
export function errorDiffusionDither(imageData: ImageData, palette: string[], strength: number = 3): ImageData {
  const rgbPalette = palette.map(hexToRgb);
  const data = new Uint8ClampedArray(imageData.data);
  const out = new Uint8ClampedArray(imageData.data);
  const w = imageData.width;
  const h = imageData.height;
  
  const ratio = 1 / (1.5 + (strength / 5 * 13.5)) / 4;
  
  const getIndex = (x: number, y: number) => (4 * x) + (4 * y * w);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = getIndex(x, y);
      
      const color = [data[i], data[i + 1], data[i + 2]];
      const matched = approximateColor(color, rgbPalette);
      
      // Calculate quantization error
      const error = [
        data[i] - matched[0],
        data[i + 1] - matched[1],
        data[i + 2] - matched[2]
      ];
      
      // Distribute error to neighboring pixels (Floyd-Steinberg pattern)
      if (x + 1 < w) {
        const rightIdx = getIndex(x + 1, y);
        data[rightIdx] += 7 * ratio * error[0];
        data[rightIdx + 1] += 7 * ratio * error[1];
        data[rightIdx + 2] += 7 * ratio * error[2];
      }
      
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          const bottomLeftIdx = getIndex(x - 1, y + 1);
          data[bottomLeftIdx] += 3 * ratio * error[0];
          data[bottomLeftIdx + 1] += 3 * ratio * error[1];
          data[bottomLeftIdx + 2] += 3 * ratio * error[2];
        }
        
        const bottomIdx = getIndex(x, y + 1);
        data[bottomIdx] += 5 * ratio * error[0];
        data[bottomIdx + 1] += 5 * ratio * error[1];
        data[bottomIdx + 2] += 5 * ratio * error[2];
        
        if (x + 1 < w) {
          const bottomRightIdx = getIndex(x + 1, y + 1);
          data[bottomRightIdx] += 1 * ratio * error[0];
          data[bottomRightIdx + 1] += 1 * ratio * error[1];
          data[bottomRightIdx + 2] += 1 * ratio * error[2];
        }
      }
      
      // Set the approximated color in output
      out[i] = matched[0];
      out[i + 1] = matched[1];
      out[i + 2] = matched[2];
      out[i + 3] = 255;
    }
  }
  
  return new ImageData(out, w, h);
}

// Atkinson dithering - creates distinctive cross-hatch patterns
export function atkinsonDither(imageData: ImageData, palette: string[], strength: number = 3): ImageData {
  const rgbPalette = palette.map(hexToRgb);
  const data = new Uint8ClampedArray(imageData.data);
  const out = new Uint8ClampedArray(imageData.data);
  const w = imageData.width;
  const h = imageData.height;
  
  const ratio = 1 / (1.5 + (strength / 5 * 7.5)) / 8 * 3;
  
  const getIndex = (x: number, y: number) => (4 * x) + (4 * y * w);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = getIndex(x, y);
      
      const color = [data[i], data[i + 1], data[i + 2]];
      const matched = approximateColor(color, rgbPalette);
      
      const error = [
        data[i] - matched[0],
        data[i + 1] - matched[1],
        data[i + 2] - matched[2]
      ];
      
      // Atkinson dithering pattern
      const positions = [
        [1, 0], [-1, 1], [0, 1], [1, 1], [2, 0], [0, 2]
      ];
      
      positions.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const idx = getIndex(nx, ny);
          data[idx] += ratio * error[0];
          data[idx + 1] += ratio * error[1];
          data[idx + 2] += ratio * error[2];
        }
      });
      
      out[i] = matched[0];
      out[i + 1] = matched[1];
      out[i + 2] = matched[2];
      out[i + 3] = 255;
    }
  }
  
  return new ImageData(out, w, h);
}

// Two-color grayscale algorithm - maps grayscale image to just two colors
export function twoColorGrayscale(imageData: ImageData, color1: string, color2: string, threshold: number = 0.5): ImageData {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const data = imageData.data;
  const out = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    
    // Choose color based on threshold
    const targetColor = gray > threshold ? rgb2 : rgb1;
    
    out[i] = targetColor[0];
    out[i + 1] = targetColor[1];
    out[i + 2] = targetColor[2];
    out[i + 3] = 255;
  }
  
  return new ImageData(out, imageData.width, imageData.height);
}

// Generate default gradient ranges for portrait processing
export function generateGradientRanges(palette: string[], scaleOffset: [number, number] = [0.65, 0.4]): number[] {
  const numColors = palette.length;
  if (numColors < 2) return [];
  
  const [scale, offset] = scaleOffset;
  const ranges = [];
  
  for (let i = 1; i < numColors; i++) {
    const uniform = (255 * i) / numColors;
    const adjusted = (uniform * scale) + (offset * 255 / numColors * i);
    ranges.push(Math.min(255, Math.max(0, adjusted)));
  }
  
  return ranges;
}

// Main processing function that applies the selected algorithm
export function processImageWithAlgorithm(
  imageData: ImageData, 
  options: MosaicOptions, 
  palette: string[]
): ImageData {
  // Handle black stickers option
  let activePalette = palette;
  if (options.useBlackStickers) {
    // Add black to palette if not already present
    if (!activePalette.includes('#000000')) {
      activePalette = [...activePalette, '#000000'];
    }
  }
  
  // Filter palette if colors should be excluded
  if (options.excludeColors && options.excludeColors.length > 0) {
    activePalette = activePalette.filter(color => !options.excludeColors!.includes(color));
  }
  
  switch (options.method) {
    case MosaicMethod.GRADIENT:
      const ranges = generateGradientRanges(activePalette, [options.parameter, 0.4]);
      return gradientMethod(imageData, activePalette, ranges);
      
    case MosaicMethod.CLOSEST_COLOR:
      return closestColorMethod(imageData, activePalette);
      
    case MosaicMethod.ORDERED_DITHER:
      return orderedDither(imageData, activePalette, options.parameter);
      
    case MosaicMethod.ERROR_DIFFUSION:
      return errorDiffusionDither(imageData, activePalette, options.parameter);
      
    case MosaicMethod.ATKINSON:
      return atkinsonDither(imageData, activePalette, options.parameter);
      
    default:
      return closestColorMethod(imageData, activePalette);
  }
}

// Generate multiple preview options for algorithm selection
export interface AlgorithmPreview {
  name: string;
  displayName: string;
  method: MosaicMethod;
  parameter: number;
  description: string;
}

export function generateAlgorithmPreviews(): AlgorithmPreview[] {
  return [
    {
      name: 'portrait_gradient',
      displayName: 'Portrait Gradient',
      method: MosaicMethod.GRADIENT,
      parameter: 0.65,
      description: 'Best for faces and portraits with smooth gradients'
    },
    {
      name: 'error_diffusion',
      displayName: 'Error Diffusion',
      method: MosaicMethod.ERROR_DIFFUSION,
      parameter: 2.5,
      description: 'High detail with natural color mixing'
    },
    {
      name: 'ordered_dither',
      displayName: 'Structured Dither',
      method: MosaicMethod.ORDERED_DITHER,
      parameter: 1.0,
      description: 'Clean patterns with controlled grain'
    },
    {
      name: 'atkinson_dither',
      displayName: 'Atkinson Dither',
      method: MosaicMethod.ATKINSON,
      parameter: 3.0,
      description: 'Artistic cross-hatch patterns'
    },
    {
      name: 'closest_color',
      displayName: 'Direct Color Match',
      method: MosaicMethod.CLOSEST_COLOR,
      parameter: 0,
      description: 'Simple color replacement without dithering'
    }
  ];
}