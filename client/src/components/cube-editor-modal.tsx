import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type MosaicCube, type CubeType } from "@shared/schema";

interface CubeEditorModalProps {
  cube: MosaicCube;
  cubeType: CubeType;
  onSave: (cube: MosaicCube) => void;
  onClose: () => void;
}

export function CubeEditorModal({ cube, cubeType, onSave, onClose }: CubeEditorModalProps) {
  const [editedStickers, setEditedStickers] = useState(cube.face.stickers);
  const [selectedColor, setSelectedColor] = useState("#ffffff");

  useEffect(() => {
    setEditedStickers(cube.face.stickers);
  }, [cube]);

  const getCubeSize = (type: CubeType): number => {
    switch (type) {
      case "2x2": return 2;
      case "4x4": return 4;
      default: return 3;
    }
  };

  const handleStickerClick = (row: number, col: number) => {
    const newStickers = [...editedStickers];
    newStickers[row][col] = selectedColor;
    setEditedStickers(newStickers);
  };

  const handleSave = () => {
    onSave({
      ...cube,
      face: { stickers: editedStickers }
    });
    onClose();
  };

  const handleReset = () => {
    const cubeSize = getCubeSize(cubeType);
    const resetStickers = Array(cubeSize).fill(null).map(() => 
      Array(cubeSize).fill("#ffffff")
    );
    setEditedStickers(resetStickers);
  };

  const cubeSize = getCubeSize(cubeType);
  const stickerSize = cubeSize === 2 ? 40 : cubeSize === 4 ? 25 : 30;

  const colors = [
    "#FFFFFF", // White
    "#B71234", // Red  
    "#0046AD", // Blue
    "#FF5800", // Orange
    "#009B48", // Green
    "#FFD500", // Yellow
    "#000000"  // Black
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit Cube Face - Position ({cube.position.row + 1}, {cube.position.col + 1})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          {/* Color Selector */}
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-md border-2 transition-colors ${
                  selectedColor === color 
                    ? "border-primary ring-2 ring-primary" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          {/* Cube Grid Editor */}
          <div 
            className="grid gap-1 mx-auto border-2 border-gray-300 p-2 rounded-lg bg-gray-50"
            style={{ 
              gridTemplateColumns: `repeat(${cubeSize}, 1fr)`,
              width: cubeSize * stickerSize + (cubeSize - 1) * 4 + 16
            }}
          >
            {editedStickers.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className="border border-gray-300 rounded-sm hover:border-primary transition-colors"
                  style={{ 
                    backgroundColor: color,
                    width: stickerSize,
                    height: stickerSize
                  }}
                  onClick={() => handleStickerClick(rowIndex, colIndex)}
                />
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleReset}>
              Reset Face
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
