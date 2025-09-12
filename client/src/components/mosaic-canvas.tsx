import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type MosaicData, type MosaicCube, type CubeType } from "@shared/schema";
import { getCubeSize } from "@/lib/mosaic-utils";

interface MosaicCanvasProps {
  mosaicData: MosaicData | null;
  selectedTool: string;
  selectedColor: string;
  zoom: number;
  showGrid: boolean;
  outlineColor: string;
  backgroundColor: string;
  onCubeSelect: (cube: MosaicCube | null) => void;
  onCubeUpdate: (cube: MosaicCube) => void;
}

export function MosaicCanvas({
  mosaicData,
  selectedTool,
  selectedColor,
  zoom,
  showGrid,
  outlineColor,
  backgroundColor,
  onCubeSelect,
  onCubeUpdate
}: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [animatedCubes, setAnimatedCubes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!mosaicData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const cubeSize = 48 * (zoom / 100);
    canvas.width = mosaicData.width * cubeSize;
    canvas.height = mosaicData.height * cubeSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mosaic
    drawMosaic(ctx, mosaicData, cubeSize, showGrid, outlineColor);
  }, [mosaicData, zoom, showGrid, outlineColor, backgroundColor]);

  const drawMosaic = (ctx: CanvasRenderingContext2D, data: MosaicData, cubeSize: number, showGrid: boolean, outlineColor: string) => {
    const stickerSize = cubeSize / getCubeSize(data.cubeType);
    const gap = 1;

    // Only draw solid color backgrounds on canvas, CSS backgrounds handled by background div
    if (backgroundColor.startsWith("#")) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      // For gradients/patterns, make canvas transparent and let background div handle it
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Draw cubes
    for (let row = 0; row < data.height; row++) {
      for (let col = 0; col < data.width; col++) {
        const x = col * cubeSize;
        const y = row * cubeSize;

        // Find cube at this position
        const cube = data.cubes.find(c => 
          c.position.row === row && c.position.col === col
        );

        if (cube) {
          drawCube(ctx, cube, x, y, stickerSize, gap, outlineColor);
        } else {
          // Draw empty cube
          drawEmptyCube(ctx, x, y, cubeSize, stickerSize, gap, outlineColor);
        }

        // Draw grid
        if (showGrid) {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cubeSize, cubeSize);
        }
      }
    }
  };

  const drawCube = (
    ctx: CanvasRenderingContext2D, 
    cube: MosaicCube, 
    x: number, 
    y: number, 
    stickerSize: number, 
    gap: number,
    outlineColor: string
  ) => {
    const stickers = cube.face.stickers;
    
    for (let sRow = 0; sRow < stickers.length; sRow++) {
      for (let sCol = 0; sCol < stickers[sRow].length; sCol++) {
        const stickerX = x + sCol * stickerSize + gap;
        const stickerY = y + sRow * stickerSize + gap;
        
        ctx.fillStyle = stickers[sRow][sCol] || "#ffffff";
        ctx.fillRect(stickerX, stickerY, stickerSize - gap, stickerSize - gap);
        
        // Draw sticker outline
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(stickerX, stickerY, stickerSize - gap, stickerSize - gap);
      }
    }
  };

  const drawEmptyCube = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cubeSize: number,
    stickerSize: number,
    gap: number,
    outlineColor: string
  ) => {
    const gridSize = cubeSize / stickerSize;
    
    for (let sRow = 0; sRow < gridSize; sRow++) {
      for (let sCol = 0; sCol < gridSize; sCol++) {
        const stickerX = x + sCol * stickerSize + gap;
        const stickerY = y + sRow * stickerSize + gap;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(stickerX, stickerY, stickerSize - gap, stickerSize - gap);
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(stickerX, stickerY, stickerSize - gap, stickerSize - gap);
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mosaicData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cubeSize = 48 * (zoom / 100);
    const col = Math.floor(x / cubeSize);
    const row = Math.floor(y / cubeSize);

    if (row >= 0 && row < mosaicData.height && col >= 0 && col < mosaicData.width) {
      // Calculate position within the cube for individual sticker interaction
      const cubeX = x - (col * cubeSize);
      const cubeY = y - (row * cubeSize);
      
      const stickerSize = cubeSize / getCubeSize(mosaicData.cubeType);
      const stickerCol = Math.floor(cubeX / stickerSize);
      const stickerRow = Math.floor(cubeY / stickerSize);
      
      // Check if Ctrl key is pressed for fill functionality
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      handleCubeInteraction(row, col, stickerRow, stickerCol, isCtrlPressed);
    }
  };

  const handleCubeInteraction = (row: number, col: number, stickerRow?: number, stickerCol?: number, isCtrlPressed: boolean = false) => {
    if (!mosaicData) return;

    // Find existing cube or create new one
    let cube = mosaicData.cubes.find(c => 
      c.position.row === row && c.position.col === col
    );

    if (!cube) {
      const gridSize = getCubeSize(mosaicData.cubeType);
      cube = {
        face: {
          stickers: Array(gridSize).fill(null).map(() => Array(gridSize).fill("#ffffff"))
        },
        position: { row, col }
      };
    }

    const updatedCube = { ...cube };
    const newStickers = updatedCube.face.stickers.map(row => [...row]);

    switch (selectedTool) {
      case "brush":
        if (isCtrlPressed) {
          // Ctrl+click fills entire cube face with selected color
          updatedCube.face.stickers = newStickers.map(row => 
            row.map(() => selectedColor)
          );
          onCubeUpdate(updatedCube);
        } else {
          // Paint individual sticker
          if (stickerRow !== undefined && stickerCol !== undefined &&
              stickerRow >= 0 && stickerRow < getCubeSize(mosaicData.cubeType) && 
              stickerCol >= 0 && stickerCol < getCubeSize(mosaicData.cubeType)) {
            newStickers[stickerRow][stickerCol] = selectedColor;
            updatedCube.face.stickers = newStickers;
            onCubeUpdate(updatedCube);
          }
        }
        break;
      
      case "eraser":
        // Erase individual sticker to white
        if (stickerRow !== undefined && stickerCol !== undefined &&
            stickerRow >= 0 && stickerRow < getCubeSize(mosaicData.cubeType) && 
            stickerCol >= 0 && stickerCol < getCubeSize(mosaicData.cubeType)) {
          newStickers[stickerRow][stickerCol] = "#FFFFFF";
          updatedCube.face.stickers = newStickers;
          onCubeUpdate(updatedCube);
        }
        break;
        
      default:
        onCubeSelect(cube);
        break;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    handleCanvasClick(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || selectedTool !== "brush" || event.ctrlKey || event.metaKey) return;
    handleCanvasClick(event);
  };

  const handleMouseUp = () => {
    setIsPainting(false);
  };

  if (!mosaicData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No project loaded</p>
          <p className="text-sm text-gray-400">Create a new project to start designing your mosaic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-8">
      <motion.div 
        className="bg-white rounded-lg shadow-lg inline-block"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.25, 0.25, 0.25, 1],
          delay: 0.2 
        }}
      >
        <div className="p-8">
          <div className="relative">
            {/* Background Layer for Advanced CSS Backgrounds */}
            <div 
              className="absolute inset-0 border border-gray-300 rounded-sm"
              style={{ 
                background: backgroundColor,
                zIndex: 1
              }}
            />
            {/* Canvas Layer */}
            <motion.canvas
              ref={canvasRef}
              className="border border-gray-300 cursor-crosshair relative z-10"
              style={{ backgroundColor: 'transparent' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                delay: 0.4 
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
