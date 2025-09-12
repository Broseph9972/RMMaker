import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RotateCcw, Square, Crop } from "lucide-react";

interface ImageCropModalProps {
  image: HTMLImageElement | null;
  onCrop: (image: HTMLImageElement, width: number, height: number, cubeType: string) => void;
  onClose: () => void;
}

export function ImageCropModal({ image, onCrop, onClose }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mosaicWidth, setMosaicWidth] = useState(12);
  const [mosaicHeight, setMosaicHeight] = useState(11);
  const [cubeType, setCubeType] = useState("3x3");

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size to fit in modal
    const maxSize = 500;
    const imageAspect = image.width / image.height;
    let canvasWidth, canvasHeight;
    
    if (imageAspect > 1) {
      canvasWidth = Math.min(maxSize, image.width);
      canvasHeight = canvasWidth / imageAspect;
    } else {
      canvasHeight = Math.min(maxSize, image.height);
      canvasWidth = canvasHeight * imageAspect;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    setCanvasSize({ width: canvasWidth, height: canvasHeight });
    setScale(canvasWidth / image.width);
    
    drawCanvas();
  }, [image]);

  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const mosaicAspect = mosaicWidth / mosaicHeight;
    const canvasAspect = canvasSize.width / canvasSize.height;

    let newWidth, newHeight;

    if (mosaicAspect > canvasAspect) {
      // Limited by canvas width
      newWidth = canvasSize.width * 0.9;
      newHeight = newWidth / mosaicAspect;
    } else {
      // Limited by canvas height
      newHeight = canvasSize.height * 0.9;
      newWidth = newHeight * mosaicAspect;
    }

    const newX = (canvasSize.width - newWidth) / 2;
    const newY = (canvasSize.height - newHeight) / 2;

    setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [mosaicWidth, mosaicHeight, canvasSize]);

  useEffect(() => {
    drawCanvas();
  }, [cropArea, image, canvasSize]);

  const drawCanvas = () => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      image,
      cropArea.x / scale, cropArea.y / scale, cropArea.width / scale, cropArea.height / scale,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );
    
    // Draw crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#fff';
    const corners = [
      { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 },
      { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 }
    ];
    
    corners.forEach(corner => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on resize handles
    const handleSize = 12;
    const handles = [
      { name: 'nw', x: cropArea.x, y: cropArea.y },
      { name: 'ne', x: cropArea.x + cropArea.width, y: cropArea.y },
      { name: 'sw', x: cropArea.x, y: cropArea.y + cropArea.height },
      { name: 'se', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height }
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
        setIsResizing(true);
        setResizeHandle(handle.name);
        setDragStart({ x, y });
        return;
      }
    }
    
    // Check if clicking inside crop area for dragging
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing && resizeHandle) {
      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;
      const aspect = mosaicWidth / mosaicHeight;
      
      switch (resizeHandle) {
        case 'nw':
          newWidth = cropArea.x + cropArea.width - x;
          newHeight = newWidth / aspect;
          newX = x;
          newY = (cropArea.y + cropArea.height) - newHeight;
          break;
        case 'ne':
          newWidth = x - cropArea.x;
          newHeight = newWidth / aspect;
          newY = (cropArea.y + cropArea.height) - newHeight;
          break;
        case 'sw':
          newWidth = cropArea.x + cropArea.width - x;
          newHeight = newWidth / aspect;
          newX = x;
          break;
        case 'se':
          newWidth = x - cropArea.x;
          newHeight = newWidth / aspect;
          break;
      }
      
      // Ensure minimum size and stay within bounds
      if (newWidth < 50 || newHeight < 50) return;
      if (newX < 0 || newY < 0 || newX + newWidth > canvas.width || newY + newHeight > canvas.height) return;
      
      setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
    } else if (isDragging) {
      // Calculate new position, keeping within bounds
      const newX = Math.max(0, Math.min(x - dragStart.x, canvas.width - cropArea.width));
      const newY = Math.max(0, Math.min(y - dragStart.y, canvas.height - cropArea.height));
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const makeSquare = () => {
    const size = Math.min(cropArea.width, cropArea.height);
    const newX = cropArea.x + (cropArea.width - size) / 2;
    const newY = cropArea.y + (cropArea.height - size) / 2;
    setCropArea({ x: newX, y: newY, width: size, height: size });
  };

  const resetCrop = () => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const mosaicAspect = mosaicWidth / mosaicHeight;
    const canvasAspect = canvasSize.width / canvasSize.height;

    let newWidth, newHeight;

    if (mosaicAspect > canvasAspect) {
      newWidth = canvasSize.width * 0.9;
      newHeight = newWidth / mosaicAspect;
    } else {
      newHeight = canvasSize.height * 0.9;
      newWidth = newHeight * mosaicAspect;
    }

    const newX = (canvasSize.width - newWidth) / 2;
    const newY = (canvasSize.height - newHeight) / 2;

    setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleCrop = () => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate actual crop dimensions on original image
    const actualX = cropArea.x / scale;
    const actualY = cropArea.y / scale;
    const actualWidth = cropArea.width / scale;
    const actualHeight = cropArea.height / scale;
    
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    
    // Draw cropped portion
    ctx.drawImage(
      image,
      actualX, actualY, actualWidth, actualHeight,
      0, 0, actualWidth, actualHeight
    );
    
    // Create new image from cropped canvas
    const croppedImage = new Image();
    croppedImage.onload = () => onCrop(croppedImage, mosaicWidth, mosaicHeight, cubeType);
    croppedImage.src = canvas.toDataURL();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crop Image</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Drag to reposition the crop area</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 dark:border-gray-600"
              style={{ cursor: isResizing ? 'nwse-resize' : (isDragging ? 'move' : 'crosshair') }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Size Controls */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Mosaic Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Width (cubes)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={mosaicWidth}
                  onChange={(e) => setMosaicWidth(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Height (cubes)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={mosaicHeight}
                  onChange={(e) => setMosaicHeight(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Cube Type</label>
                <Select value={cubeType} onValueChange={setCubeType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x2">2×2</SelectItem>
                    <SelectItem value="3x3">3×3</SelectItem>
                    <SelectItem value="4x4">4×4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Drag the corners to resize the crop area or drag inside to move it
            </div>
          </div>

          {/* Crop Controls */}
          <div className="flex justify-center space-x-3 mb-6">
            <Button variant="outline" onClick={makeSquare}>
              <Square className="w-4 h-4 mr-2" />
              Make Square
            </Button>
            <Button variant="outline" onClick={resetCrop}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Crop
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCrop} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Crop className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}