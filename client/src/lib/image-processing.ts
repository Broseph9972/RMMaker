// Image processing utilities for grayscale conversion and preprocessing

export function convertImageToGrayscale(image: HTMLImageElement): HTMLImageElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale using luminance formula
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1]; 
    const b = data[i + 2];
    
    // Use standard luminance weights for grayscale conversion
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (i + 3) remains unchanged
  }

  // Put the grayscale data back
  ctx.putImageData(imageData, 0, 0);

  // Create a new image element with the grayscale data
  const grayscaleImage = new Image();
  grayscaleImage.src = canvas.toDataURL();
  
  return new Promise<HTMLImageElement>((resolve) => {
    grayscaleImage.onload = () => resolve(grayscaleImage);
  }) as any; // Return synchronously for now, will be handled async in caller
}

export function convertImageToGrayscaleAsync(image: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale using luminance formula
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1]; 
      const b = data[i + 2];
      
      // Use standard luminance weights for grayscale conversion
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha channel (i + 3) remains unchanged
    }

    // Put the grayscale data back
    ctx.putImageData(imageData, 0, 0);

    // Create a new image element with the grayscale data
    const grayscaleImage = new Image();
    grayscaleImage.onload = () => resolve(grayscaleImage);
    grayscaleImage.onerror = () => reject(new Error('Failed to load grayscale image'));
    grayscaleImage.src = canvas.toDataURL();
  });
}

export function cropToSquare(image: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Calculate square dimensions (use the smaller dimension)
    const size = Math.min(image.width, image.height);
    canvas.width = size;
    canvas.height = size;

    // Calculate crop position to center the image
    const cropX = (image.width - size) / 2;
    const cropY = (image.height - size) / 2;

    // Draw the cropped image
    ctx.drawImage(
      image,
      cropX, cropY, size, size,  // Source crop area
      0, 0, size, size           // Destination area
    );

    // Create a new image element with the square data
    const squareImage = new Image();
    squareImage.onload = () => resolve(squareImage);
    squareImage.onerror = () => reject(new Error('Failed to load square image'));
    squareImage.src = canvas.toDataURL();
  });
}

// Convert hex color to RGB values
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export function convertImageToTwoColor(image: HTMLImageElement, lightColor: string, darkColor: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Get RGB values for the two colors
    const [lightR, lightG, lightB] = hexToRgb(lightColor);
    const [darkR, darkG, darkB] = hexToRgb(darkColor);

    // Convert to two-color using luminance-based threshold
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1]; 
      const b = data[i + 2];
      
      // Calculate luminance (brightness)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Use threshold of 128 (middle gray) to decide between light and dark
      if (luminance > 128) {
        // Use light color
        data[i] = lightR;
        data[i + 1] = lightG;
        data[i + 2] = lightB;
      } else {
        // Use dark color
        data[i] = darkR;
        data[i + 1] = darkG;
        data[i + 2] = darkB;
      }
      // Alpha channel (i + 3) remains unchanged
    }

    // Put the processed data back
    ctx.putImageData(imageData, 0, 0);

    // Create a new image element with the two-color data
    const twoColorImage = new Image();
    twoColorImage.onload = () => resolve(twoColorImage);
    twoColorImage.onerror = () => reject(new Error('Failed to load two-color image'));
    twoColorImage.src = canvas.toDataURL();
  });
}

export function preprocessImage(image: HTMLImageElement, options: { grayscale?: boolean, grayscaleColors?: [string, string] }): Promise<HTMLImageElement> {
  return new Promise(async (resolve, reject) => {
    try {
      let processedImage = image;
      
      // Apply grayscale or two-color conversion if requested
      if (options.grayscale) {
        if (options.grayscaleColors) {
          // Use custom two-color conversion
          processedImage = await convertImageToTwoColor(processedImage, options.grayscaleColors[0], options.grayscaleColors[1]);
        } else {
          // Use standard grayscale
          processedImage = await convertImageToGrayscaleAsync(processedImage);
        }
      }
      
      resolve(processedImage);
    } catch (error) {
      reject(error);
    }
  });
}