import { DEFAULT_PALETTE, PALETTE_NAMES } from "@/lib/rubiks-colors";

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Official Rubik's Colors</h3>
      
      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {DEFAULT_PALETTE.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-md border-2 hover:border-gray-400 transition-colors ${
              selectedColor === color 
                ? "border-primary ring-2 ring-primary" 
                : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onColorSelect(color)}
            title={PALETTE_NAMES[color] || color}
          />
        ))}
      </div>
      
      {/* Current Color Display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-md border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-xs font-medium text-gray-600">Selected Color</p>
            <p className="text-sm font-mono">{selectedColor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
