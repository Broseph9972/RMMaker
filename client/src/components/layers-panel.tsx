import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { type Layer } from "@shared/schema";
import { Plus, Eye, EyeOff, Copy, Trash2, Undo, Redo, Lock } from "lucide-react";

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerUpdate: (layers: Layer[]) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function LayersPanel({ 
  layers, 
  activeLayerId, 
  onLayerUpdate, 
  onUndo, 
  onRedo 
}: LayersPanelProps) {
  const activeLayer = layers.find(l => l.id === activeLayerId);

  const handleOpacityChange = (value: number[]) => {
    if (!activeLayer) return;
    
    const updatedLayers = layers.map(layer => 
      layer.id === activeLayerId 
        ? { ...layer, opacity: value[0] }
        : layer
    );
    onLayerUpdate(updatedLayers);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Layers Panel */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Layers</h3>
          <Button variant="ghost" size="sm" title="Add Layer">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {layers.map((layer) => (
            <div 
              key={layer.id}
              className={`rounded-md p-3 border ${
                layer.id === activeLayerId 
                  ? "bg-blue-50 border-primary" 
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="p-1">
                    {layer.visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <span className="text-sm font-medium">{layer.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="p-1" title="Duplicate">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {layer.id === activeLayerId && (
                <div className="mt-2">
                  <Slider
                    value={[layer.opacity]}
                    onValueChange={handleOpacityChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Opacity</span>
                    <span>{layer.opacity}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Background Layer */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Background</span>
              </div>
              <Lock className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* History Panel */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">History</h3>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onUndo} title="Undo">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRedo} title="Redo">
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="py-2 px-3 bg-blue-50 text-primary rounded-md font-medium">
            Current State
          </div>
          <div className="py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
            Paint Brush
          </div>
          <div className="py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
            Canvas Created
          </div>
        </div>
      </div>
    </div>
  );
}
