import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  processImageWithAlgorithm, 
  generateAlgorithmPreviews, 
  MosaicMethod, 
  type MosaicOptions,
  type AlgorithmPreview 
} from "@/lib/advanced-algorithms";

interface AlgorithmSelectorProps {
  sourceImage: HTMLImageElement | null;
  palette: string[];
  mosaicWidth: number;
  mosaicHeight: number;
  cubeType?: string;
  twoColorGrayscale?: [string, string]; // [lightColor, darkColor]
  onAlgorithmSelect: (processedImageData: ImageData, options: MosaicOptions) => void;
  onClose: () => void;
}

export function AlgorithmSelector({ sourceImage, palette, mosaicWidth, mosaicHeight, cubeType = "3x3", twoColorGrayscale, onAlgorithmSelect, onClose }: AlgorithmSelectorProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmPreview | null>(null);
  const [parameter, setParameter] = useState<number>(1.0);
  const [excludeColors, setExcludeColors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState(false);
  const [useBlackStickers, setUseBlackStickers] = useState(false);
  const [cubeOutlineType, setCubeOutlineType] = useState<'stickerless' | 'white' | 'black'>('black');

  const algorithmOptions = generateAlgorithmPreviews();

  // Generate preview canvas for an algorithm
  const generatePreview = async (algorithm: AlgorithmPreview, customParam?: number) => {
    if (!sourceImage) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Create a larger preview (400px max) to avoid blurriness, maintain aspect ratio
    const maxPreviewSize = 400;
    const aspectRatio = sourceImage.width / sourceImage.height;
    let previewWidth, previewHeight;
    
    if (aspectRatio > 1) {
      previewWidth = maxPreviewSize;
      previewHeight = maxPreviewSize / aspectRatio;
    } else {
      previewHeight = maxPreviewSize;
      previewWidth = maxPreviewSize * aspectRatio;
    }

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Disable image smoothing for crisp pixel art effect
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceImage, 0, 0, previewWidth, previewHeight);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const options: MosaicOptions = {
      method: algorithm.method,
      parameter: customParam ?? algorithm.parameter,
      excludeColors,
      twoColorGrayscale: undefined
    };

    const processed = processImageWithAlgorithm(imageData, options, palette);
    ctx.putImageData(processed, 0, 0);
    
    return canvas.toDataURL();
  };

  // Generate all initial previews
  useEffect(() => {
    if (!sourceImage) return;

    const generateAllPreviews = async () => {
      setProcessing(true);
      const previewData: { [key: string]: string } = {};

      for (const algorithm of algorithmOptions) {
        const preview = await generatePreview(algorithm);
        if (preview) {
          previewData[algorithm.name] = preview;
        }
      }

      setPreviews(previewData);
      setProcessing(false);
    };

    generateAllPreviews();
  }, [sourceImage, palette, excludeColors]);

  // Update preview when parameter changes
  useEffect(() => {
    if (!selectedAlgorithm || !sourceImage) return;

    const updatePreview = async () => {
      const preview = await generatePreview(selectedAlgorithm, parameter);
      if (preview) {
        setPreviews(prev => ({ ...prev, [selectedAlgorithm.name]: preview }));
      }
    };

    updatePreview();
  }, [parameter, selectedAlgorithm]);

  const handleApplyAlgorithm = async () => {
    if (!sourceImage || !selectedAlgorithm) return;

    setProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep higher resolution for sticker-level detail
    // Each cube needs multiple pixels for individual stickers
    const cubeSize = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
    canvas.width = mosaicWidth * cubeSize;
    canvas.height = mosaicHeight * cubeSize;
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const options: MosaicOptions = {
      method: selectedAlgorithm.method,
      parameter,
      excludeColors,
      useBlackStickers,
      cubeOutlineType,
      twoColorGrayscale: undefined
    };

    const processed = processImageWithAlgorithm(imageData, options, palette);
    
    onAlgorithmSelect(processed, options);
    onClose();
  };

  const getParameterLabel = (method: MosaicMethod) => {
    switch (method) {
      case MosaicMethod.GRADIENT:
        return "Contrast Adjustment";
      case MosaicMethod.ORDERED_DITHER:
        return "Grain Intensity";
      case MosaicMethod.ERROR_DIFFUSION:
        return "Smoothness Level";
      case MosaicMethod.ATKINSON:
        return "Pattern Strength";
      default:
        return "Intensity";
    }
  };

  const getParameterRange = (method: MosaicMethod): [number, number, number] => {
    switch (method) {
      case MosaicMethod.GRADIENT:
        return [0.3, 1.0, 0.05]; // min, max, step
      case MosaicMethod.ORDERED_DITHER:
        return [-5, 8, 0.5];
      case MosaicMethod.ERROR_DIFFUSION:
        return [0.5, 6, 0.25];
      case MosaicMethod.ATKINSON:
        return [0.5, 6, 0.25];
      default:
        return [0, 5, 0.1];
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mr-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Choose Processing Algorithm</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Select the best algorithm for your image type</p>
            </div>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>

          {/* Algorithm Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {algorithmOptions.map((algorithm) => (
              <Card 
                key={algorithm.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAlgorithm?.name === algorithm.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedAlgorithm(algorithm);
                  setParameter(algorithm.parameter);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{algorithm.displayName}</CardTitle>
                    {selectedAlgorithm?.name === algorithm.name && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">{algorithm.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {previews[algorithm.name] ? (
                    <img 
                      src={previews[algorithm.name]} 
                      alt={`${algorithm.displayName} preview`}
                      className="w-full h-32 object-contain rounded border bg-gray-50"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                      {processing ? (
                        <div className="text-sm text-gray-500">Processing...</div>
                      ) : (
                        <div className="text-sm text-gray-400">Loading preview...</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedAlgorithm && selectedAlgorithm.method !== MosaicMethod.CLOSEST_COLOR && (
            <>
              <Separator className="my-6" />
              
              {/* Parameter Controls */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Fine-tune Parameters</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getParameterLabel(selectedAlgorithm.method)}: {parameter.toFixed(2)}
                  </label>
                  <Slider
                    value={[parameter]}
                    onValueChange={(value) => setParameter(value[0])}
                    min={getParameterRange(selectedAlgorithm.method)[0]}
                    max={getParameterRange(selectedAlgorithm.method)[1]}
                    step={getParameterRange(selectedAlgorithm.method)[2]}
                    className="w-full"
                  />
                </div>

                {/* Black Stickers Option */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="blackStickers"
                    checked={useBlackStickers}
                    onCheckedChange={(checked) => setUseBlackStickers(checked === true)}
                  />
                  <label htmlFor="blackStickers" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Black stickers? (swaps one color for black)
                  </label>
                </div>

                {/* Cube Outline Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cube Type</label>
                  <Select value={cubeOutlineType} onValueChange={(value: 'stickerless' | 'white' | 'black') => setCubeOutlineType(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stickerless">Stickerless cubes</SelectItem>
                      <SelectItem value="white">White outlines</SelectItem>
                      <SelectItem value="black">Black outlines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyAlgorithm}
              disabled={!selectedAlgorithm || processing}
            >
              {processing ? "Processing..." : "Apply Algorithm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}