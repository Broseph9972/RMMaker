
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  processImageWithAlgorithm, 
  generateAlgorithmPreviews, 
  MosaicMethod, 
  type MosaicOptions,
  type AlgorithmPreview 
} from "@/lib/advanced-algorithms";

interface RomanMosaicPanelProps {
  sourceImage: HTMLImageElement | null;
  palette: string[];
  mosaicWidth: number;
  mosaicHeight: number;
  cubeType?: string;
  onGenerate: (processedImageData: ImageData, options: MosaicOptions) => void;
}

export function RomanMosaicPanel({ sourceImage, palette, mosaicWidth, mosaicHeight, cubeType = "3x3", onGenerate, onRequestImageUpload }: RomanMosaicPanelProps & { onRequestImageUpload?: () => void }) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmPreview | null>(null);
  const [parameter, setParameter] = useState<number>(1.0);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const algorithmOptions = generateAlgorithmPreviews();

  const generatePreview = async (algorithm: AlgorithmPreview, customParam?: number) => {
    if (!sourceImage) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

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

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceImage, 0, 0, previewWidth, previewHeight);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const options: MosaicOptions = {
      method: algorithm.method,
      parameter: customParam ?? algorithm.parameter,
    };

    const processed = processImageWithAlgorithm(imageData, options, palette);
    ctx.putImageData(processed, 0, 0);
    
    return canvas.toDataURL();
  };

  const handleAlgorithmChange = async (algorithmName: string) => {
    const algorithm = algorithmOptions.find(a => a.name === algorithmName);
    if (algorithm) {
      setSelectedAlgorithm(algorithm);
      setParameter(algorithm.parameter);
      setProcessing(true);
      const previewUrl = await generatePreview(algorithm);
      if (previewUrl) {
        setPreview(previewUrl);
      }
      setProcessing(false);
    }
  };

  const handleParameterChange = async (value: number) => {
    setParameter(value);
    if (selectedAlgorithm) {
      setProcessing(true);
      const previewUrl = await generatePreview(selectedAlgorithm, value);
      if (previewUrl) {
        setPreview(previewUrl);
      }
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!sourceImage || !selectedAlgorithm) return;

    setProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cubeSize = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
    canvas.width = mosaicWidth * cubeSize;
    canvas.height = mosaicHeight * cubeSize;
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const options: MosaicOptions = {
      method: selectedAlgorithm.method,
      parameter,
    };

    const processed = processImageWithAlgorithm(imageData, options, palette);
    
    onGenerate(processed, options);
    setProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Roman Mosaic Generator</h2>
      {!sourceImage && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="mb-2 text-gray-500">Upload an image to begin.</p>
          <Button onClick={onRequestImageUpload}>Upload Image</Button>
        </div>
      )}
      <Select onValueChange={handleAlgorithmChange} disabled={!sourceImage}>
        <SelectTrigger>
          <SelectValue placeholder="Select an algorithm" />
        </SelectTrigger>
        <SelectContent>
          {algorithmOptions.map(alg => (
            <SelectItem key={alg.name} value={alg.name}>{alg.displayName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAlgorithm && (
        <>
          <p className="text-sm text-gray-500">{selectedAlgorithm.description}</p>
          {selectedAlgorithm.method !== MosaicMethod.CLOSEST_COLOR && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Parameter: {parameter.toFixed(2)}</label>
              <Slider
                value={[parameter]}
                onValueChange={(value) => handleParameterChange(value[0])}
                min={0}
                max={5}
                step={0.1}
                disabled={!sourceImage}
              />
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="border rounded-md p-2">
          <img src={preview} alt="Preview" className="w-full h-auto" style={{ imageRendering: 'pixelated' }} />
        </div>
      )}

      <Button onClick={handleApply} disabled={!selectedAlgorithm || processing || !sourceImage}>
        {processing ? "Processing..." : "Apply"}
      </Button>
    </div>
  );
}
