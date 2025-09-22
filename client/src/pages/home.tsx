import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MosaicCanvas } from "@/components/mosaic-canvas";
import { CubeEditorModal } from "@/components/cube-editor-modal";
import { ColorPalette } from "@/components/color-palette";
import { ToolPanel } from "@/components/tool-panel";
import { LayersPanel } from "@/components/layers-panel";
import { AlgorithmSelector } from "@/components/algorithm-selector";
import { RomanMosaicPanel } from "@/components/roman-mosaic-panel";
import { useMosaic } from "@/hooks/use-mosaic";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  FolderOpen, 
  Save, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Maximize,
  Upload,
  Wand2,
  RotateCcw,
  PanelLeft,
  Settings,
  Undo2,
  Redo2,
  X,
  Crop,
  Palette
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageCropModal } from "@/components/image-crop-modal";
import { COMPLETE_PALETTE, PALETTE_NAMES } from "@/lib/rubiks-colors";
import { Logo } from "@/components/logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
  // Setup modal state
  const [showSetup, setShowSetup] = useState(true);
  const [setupCubeType, setSetupCubeType] = useState("3x3");
  const [setupWidth, setSetupWidth] = useState(10);
  const [setupHeight, setSetupHeight] = useState(10);

  useEffect(() => {
    // Only show setup if this is a new project (could be improved with localStorage)
    if (mosaicData && mosaicData.width && mosaicData.height) {
      setShowSetup(false);
    }
  }, []);
  // Setup dialog handler
  const handleSetupConfirm = () => {
    setShowSetup(false);
    setWidth(setupWidth);
    setHeight(setupHeight);
    updateDimensions(setupWidth, setupHeight);
    if (setupCubeType !== cubeType) {
      setCubeOutlineType("stickerless"); // or keep current
      // If you have a setCubeType, use it here. Otherwise, createNewProject may need to accept cubeType.
    }
    // Optionally, reset project/canvas here
  };
  {/* Setup Dialog */}
  <Dialog open={showSetup}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Start a New Mosaic</DialogTitle>
        <DialogDescription>
          Choose your cube type and grid size to begin.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div>
          <label className="block text-sm font-medium mb-1">Cube Type</label>
          <div className="flex gap-2">
            {["2x2", "3x3", "4x4"].map(type => (
              <Button
                key={type}
                variant={setupCubeType === type ? "default" : "outline"}
                onClick={() => setSetupCubeType(type)}
                className="flex-1"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Width (cubes)</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={setupWidth}
              onChange={e => setSetupWidth(Math.max(1, Math.min(50, Number(e.target.value))))}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Height (cubes)</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={setupHeight}
              onChange={e => setSetupHeight(Math.max(1, Math.min(50, Number(e.target.value))))}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSetupConfirm} className="w-full">Start</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

export default function Home() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const {
    mosaicData,
    projectName,
    colorPalette,
    selectedTool,
    selectedColor,
    cubeType,
    zoom,
    showGrid,
    outlineColor,
    selectedCube,
    showLeftPanel,
    cubeOutlineType,
    backgroundColor,

    canUndo,
    canRedo,
    createNewProject,
    exportProject,
    importProject,
    updateDimensions,
    onCubeUpdate,
    onCubeSelect,
    generateFromImage,
    generateFromImageData,
    undo,
    redo,
    clearCanvas,
    fillBackground,
    hasContent,
    setSelectedTool,
    setSelectedColor,
    setZoom,
    setShowLeftPanel,
    setCubeOutlineType,
    setBackgroundColor,

    setProjectName,
    setColorPalette,
    toggleGrid,
    toggleOutlineColor
  } = useMosaic();

  const [width, setWidth] = useState(mosaicData.width);
  const [height, setHeight] = useState(mosaicData.height);
  const [showAlgorithmSelector, setShowAlgorithmSelector] = useState(false);
  const [useRomanMosaicPanel, setUseRomanMosaicPanel] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [useGrayscale, setUseGrayscale] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [grayscaleColor1, setGrayscaleColor1] = useState("#FFFFFF"); // White
  const [grayscaleColor2, setGrayscaleColor2] = useState("#000000"); // Black
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [showBackgroundFillDialog, setShowBackgroundFillDialog] = useState(false);

  const handleNewProject = () => {
    createNewProject();
    setWidth(10);
    setHeight(10);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importProject(file);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create image element for algorithm selector
      const img = new Image();
      img.onload = async () => {
        let processedImage = img;
        
        // Apply preprocessing if requested
        if (useGrayscale) {
          try {
            const { preprocessImage } = await import("@/lib/image-processing");
            processedImage = await preprocessImage(img, { 
              grayscale: useGrayscale,
              grayscaleColors: [grayscaleColor1, grayscaleColor2]
            });
          } catch (error) {
            console.error("Failed to preprocess image:", error);
          }
        }
        
  // Always crop
  setCropImage(processedImage);
  setShowCropModal(true);
      };
      img.src = URL.createObjectURL(file);
    }
  };
  
  const handleCropComplete = async (croppedImage: HTMLImageElement, cropWidth?: number, cropHeight?: number, cropCubeType?: string) => {
    setShowCropModal(false);
    setCropImage(null);
    
    // Update dimensions and cube type if provided
    if (cropWidth) setWidth(cropWidth);
    if (cropHeight) setHeight(cropHeight);
    
    // Set processed image for algorithm selector
    setSourceImage(croppedImage);
    setShowAlgorithmSelector(true);
  };


  const handleBackgroundFill = () => {
    if (hasContent()) {
      setShowBackgroundFillDialog(true);
    } else {
      fillBackground(selectedColor);
    }
  };

  const confirmBackgroundFill = () => {
    fillBackground(selectedColor);
    setShowBackgroundFillDialog(false);
  };

  const handleBasicImageGeneration = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && useGrayscale) {
      // For basic generation with preprocessing, we need to preprocess the file
      const img = new Image();
      img.onload = async () => {
        try {
          const { preprocessImage } = await import("@/lib/image-processing");
          const processedImage = await preprocessImage(img, { 
            grayscale: useGrayscale,
            grayscaleColors: [grayscaleColor1, grayscaleColor2]
          });
          
          // Convert processed image back to file-like blob for the API
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = processedImage.width;
            canvas.height = processedImage.height;
            ctx.drawImage(processedImage, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, { type: 'image/png' });
                generateFromImage(processedFile, width, height, cubeType);
              }
            }, 'image/png');
          }
        } catch (error) {
          console.error("Failed to preprocess image:", error);
          generateFromImage(file, width, height, cubeType);
        }
      };
      img.src = URL.createObjectURL(file);
    } else if (file) {
      generateFromImage(file, width, height, cubeType);
    }
  };

  const handleExport = () => {
    exportProject();
  };

  const handleApplyDimensions = () => {
    updateDimensions(width, height);
    toast({
      title: "Dimensions Updated",
      description: `Canvas resized to ${width}×${height}`,
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Setup Dialog overlays everything on first visit */}
      <Dialog open={showSetup} modal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a New Mosaic</DialogTitle>
            <DialogDescription>
              Choose your cube type and grid size to begin.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Cube Type</label>
              <div className="flex gap-2">
                {["2x2", "3x3", "4x4"].map(type => (
                  <Button
                    key={type}
                    variant={setupCubeType === type ? "default" : "outline"}
                    onClick={() => setSetupCubeType(type)}
                    className="flex-1"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Width (cubes)</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={setupWidth}
                  onChange={e => setSetupWidth(Math.max(1, Math.min(50, Number(e.target.value))))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Height (cubes)</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={setupHeight}
                  onChange={e => setSetupHeight(Math.max(1, Math.min(50, Number(e.target.value))))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSetupConfirm} className="w-full">Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Logo size="md" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">RMmaker</h1>
          </div>
          
          <div className="flex items-center space-x-2 ml-8">
            <Button variant="ghost" size="sm" onClick={handleNewProject} title="New Project (Ctrl+N)">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FolderOpen className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} className="text-primary hover:bg-blue-50" title="Export Project (Ctrl+S)">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Panel Toggles */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={showLeftPanel ? "bg-gray-200 dark:bg-gray-600" : ""}
            title="Toggle Tools Panel"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setShowRightPanel(false);
              setUseRomanMosaicPanel(true);
              if (!sourceImage && imageInputRef.current) {
                imageInputRef.current.click();
              }
            }}
            className={useRomanMosaicPanel ? "bg-gray-200 dark:bg-gray-600" : ""}
            title="Toggle Roman Mosaic UI"
          >
            <Wand2 className="w-4 h-4" />
          </Button>

          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))} title="Zoom Out (Ctrl+-)">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(400, zoom + 25))} title="Zoom In (Ctrl++)">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {/* View Options */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleGrid}
            className={showGrid ? "bg-gray-200 dark:bg-gray-600" : ""}
            title="Toggle Grid (G)"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleOutlineColor}
            className="flex items-center space-x-1"
            title={`Outline: ${outlineColor === "#000000" ? "Black" : "White"}`}
          >
            <div 
              className="w-4 h-4 border-2 rounded"
              style={{ 
                backgroundColor: outlineColor,
                borderColor: outlineColor === "#FFFFFF" ? "#000000" : "#FFFFFF"
              }}
            />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? "bg-gray-200 dark:bg-gray-600" : ""}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Single Sidebar */}
        <AnimatePresence>
          {showLeftPanel && (
            <motion.div 
              className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.25, 0.25, 1] 
              }}
            >
          {/* Close Button Only */}
          <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeftPanel(false)}
              className="p-1 h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tools Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <ToolPanel 
              selectedTool={selectedTool}
              onToolSelect={setSelectedTool}
            />
          </div>
          
          {/* Colors */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          </div>
          
          {/* Canvas Dimensions */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Width</label>
                <Input
                  type="number"
                  value={width.toString()}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Height</label>
                <Input
                  type="number"
                  value={height.toString()}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
            </div>
            
            <Button onClick={handleApplyDimensions} className="w-full mb-3">
              Apply Dimensions
            </Button>
          </div>
          
          {/* History */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="flex-1"
              >
                <Undo2 className="w-4 h-4 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="flex-1"
              >
                <Redo2 className="w-4 h-4 mr-1" />
                Redo
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={clearCanvas}
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              <Button 
                onClick={handleBackgroundFill}
                variant="outline" 
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 flex-1"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Fill
              </Button>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Project Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cubes:</span>
                <span className="font-medium">{width * height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Colors Used:</span>
                <span className="font-medium">
                  {mosaicData?.cubes ? 
                    new Set(mosaicData.cubes.flatMap(cube => 
                      cube.face.stickers.flat()
                    )).size : 0
                  }
                </span>
                      return (
                        <>
                          <Dialog open={showSetup} modal>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Start a New Mosaic</DialogTitle>
                                <DialogDescription>
                                  Choose your cube type and grid size to begin.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex flex-col gap-4 py-2">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Cube Type</label>
                                  <div className="flex gap-2">
                                    {["2x2", "3x3", "4x4"].map(type => (
                                      <Button
                                        key={type}
                                        variant={setupCubeType === type ? "default" : "outline"}
                                        onClick={() => setSetupCubeType(type)}
                                        className="flex-1"
                                      >
                                        {type}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Width (cubes)</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={50}
                                      value={setupWidth}
                                      onChange={e => setSetupWidth(Math.max(1, Math.min(50, Number(e.target.value))))}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Height (cubes)</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={50}
                                      value={setupHeight}
                                      onChange={e => setSetupHeight(Math.max(1, Math.min(50, Number(e.target.value))))}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleSetupConfirm} className="w-full">Start</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 flex flex-col">
                            {/* ...rest of the app... */}
                          </div>
                        </>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRightPanel(false)}
                  className="p-1 h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Step 1: Upload Area */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
                    Upload Image
                  </h3>
                  <div className="text-center p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-colors cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Upload className="w-10 h-10 mx-auto text-blue-500 dark:text-blue-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, GIF supported</p>
                  </div>
                </div>

                {/* Step 2: Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
                    Options (Optional)
                  </nh3>
                    
                    {/* 2 Colors Option */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="grayscale-right" className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <Palette className="w-4 h-4 mr-2 text-gray-500" />
                          2 Colors Mode
                        </label>
                        <input
                          type="checkbox"
                          id="grayscale-right"
                          checked={useGrayscale}
                          onChange={(e) => setUseGrayscale(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </div>
                      
                      {useGrayscale && (
                        <div className="ml-6 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Light Color</label>
                              <Select value={grayscaleColor1} onValueChange={setGrayscaleColor1}>
                                <SelectTrigger className="h-8 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-4 h-4 rounded border" 
                                      style={{ backgroundColor: grayscaleColor1 }}
                                    />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {COMPLETE_PALETTE.map((color) => (
                                    <SelectItem key={color} value={color}>
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-4 h-4 rounded border" 
                                          style={{ backgroundColor: color }}
                                        />
                                        <span>{PALETTE_NAMES[color]}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Dark Color</label>
                              <Select value={grayscaleColor2} onValueChange={setGrayscaleColor2}>
                                <SelectTrigger className="h-8 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-4 h-4 rounded border" 
                                      style={{ backgroundColor: grayscaleColor2 }}
                                    />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {COMPLETE_PALETTE.map((color) => (
                                    <SelectItem key={color} value={color}>
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-4 h-4 rounded border" 
                                          style={{ backgroundColor: color }}
                                        />
                                        <span>{PALETTE_NAMES[color]}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Images will be converted to use only these two colors
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: Generation Method */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2 text-xs">3</span>
                    Choose Method
                  </h3>
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-base font-medium shadow-lg"
                  >
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate from Image
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Uses advanced algorithms for best quality.
                  </p>
                </div>

                {/* Clear Button */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700" 
                    onClick={clearCanvas}
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear Canvas
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Use <strong>Advanced Algorithms</strong> for best quality</li>
                    <li>Try different algorithms for various artistic effects</li>
                    <li><strong>Basic</strong> mode for quick, simple generation</li>
                    <li>Square images work best for mosaic generation</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
          {useRomanMosaicPanel && (
            <motion.div 
              className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.25, 0.25, 1] 
              }}
            >
              <RomanMosaicPanel
                sourceImage={sourceImage}
                palette={["#FFFFFF", "#B90000", "#0045AD", "#FF5900", "#009B48", "#FFD500"]}
                mosaicWidth={width}
                mosaicHeight={height}
                cubeType={cubeType}
                onGenerate={(processedImageData, options) => {
                  generateFromImageData(processedImageData, width, height, cubeType, options);
                  setUseRomanMosaicPanel(false);
                  setSourceImage(null);
                }}
                onRequestImageUpload={() => imageInputRef.current?.click()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Tab */}
        {showSettings && (
          <div className="fixed top-20 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="p-1 h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Cube Type</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
                  {["3x3", "2x2", "4x4"].map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Cube Type",
                          description: "Create a new project to change cube type",
                        });
                      }}
                      className={`flex-1 ${cubeType === type ? "bg-white dark:bg-gray-600 text-primary shadow-sm" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Cube Outline Type</h3>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose the outline style for your cubes in auto generation
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Background Style</h3>
                
                {/* Solid Colors */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Solid Colors</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("#FFFFFF")}
                      className={`${backgroundColor === "#FFFFFF" ? "bg-primary text-white" : ""}`}
                    >
                      White
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor(selectedColor)}
                      className={`${backgroundColor === selectedColor ? "bg-primary text-white" : ""}`}
                    >
                      Main Color
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("#000000")}
                      className={`${backgroundColor === "#000000" ? "bg-primary text-white" : ""}`}
                    >
                      Black
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("#f8f8f8")}
                      className={`${backgroundColor === "#f8f8f8" ? "bg-primary text-white" : ""}`}
                    >
                      Default
                    </Button>
                  </div>
                </div>

                {/* Advanced Backgrounds */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Advanced Patterns</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("linear-gradient(135deg, #667eea 0%, #764ba2 100%)")}
                      className={`${backgroundColor.includes("667eea") ? "bg-primary text-white" : ""} text-xs`}
                    >
                      Purple Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("linear-gradient(45deg, #f093fb 0%, #f5576c 100%)")}
                      className={`${backgroundColor.includes("f093fb") ? "bg-primary text-white" : ""} text-xs`}
                    >
                      Pink Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("linear-gradient(90deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)")}
                      className={`${backgroundColor.includes("74b9ff") ? "bg-primary text-white" : ""} text-xs`}
                    >
                      Ocean Blue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("radial-gradient(circle, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)")}
                      className={`${backgroundColor.includes("radial") ? "bg-primary text-white" : ""} text-xs`}
                    >
                      Soft Radial
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundColor("repeating-linear-gradient(45deg, #f8f8f8, #f8f8f8 10px, #e8e8e8 10px, #e8e8e8 20px)")}
                      className={`${backgroundColor.includes("repeating") ? "bg-primary text-white" : ""} text-xs`}
                    >
                      Diagonal Stripes
                    </Button>
                  </div>
                </div>

                {/* Custom Color Input */}
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Background</p>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={backgroundColor.startsWith("#") ? backgroundColor : "#f8f8f8"}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="CSS background value"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Use solid colors, gradients, or any CSS background property
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".rm"
        onChange={handleImport}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Algorithm Selector Modal */}
      {showAlgorithmSelector && sourceImage && (
        <AlgorithmSelector
          sourceImage={sourceImage}
          palette={["#FFFFFF", "#B90000", "#0045AD", "#FF5900", "#009B48", "#FFD500"]}
          mosaicWidth={width}
          mosaicHeight={height}
          cubeType={cubeType}
          twoColorGrayscale={useGrayscale ? [grayscaleColor1, grayscaleColor2] : undefined}
          onAlgorithmSelect={(processedImageData, options) => {
            generateFromImageData(processedImageData, width, height, cubeType, options);
            setShowAlgorithmSelector(false);
            setSourceImage(null);
          }}
          onClose={() => {
            setShowAlgorithmSelector(false);
            setSourceImage(null);
          }}
        />
      )}

      {/* Image Crop Modal */}
      {showCropModal && cropImage && (
        <ImageCropModal
          image={cropImage}
          onCrop={handleCropComplete}
          onClose={() => {
            setShowCropModal(false);
            setCropImage(null);
          }}
        />
      )}

      {/* Background Fill Confirmation Dialog */}
      <AlertDialog open={showBackgroundFillDialog} onOpenChange={setShowBackgroundFillDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fill Background with Color?</AlertDialogTitle>
            <AlertDialogDescription>
              This will fill all squares with the selected color ({selectedColor}) and replace any existing content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBackgroundFill}>Fill Background</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cube Editor Modal */}
      {selectedCube && (
        <CubeEditorModal
          cube={selectedCube}
          cubeType={cubeType}
          onSave={onCubeUpdate}
          onClose={() => onCubeSelect(null)}
        />
      )}
    </div>
  );
}
