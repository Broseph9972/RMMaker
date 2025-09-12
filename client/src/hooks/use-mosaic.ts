import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { type MosaicData, type MosaicCube, type CubeType } from "@shared/schema";
import { createEmptyMosaic, resizeMosaic, fillCubeWithColor, clearCube, createEmptyCube, getCubeSize } from "@/lib/mosaic-utils";
import { readRMFile } from "@/lib/file-handlers";
import { type MosaicOptions } from "@/lib/advanced-algorithms";
import { useHistory } from "@/hooks/use-history";
import { useKeyboardShortcuts, createShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function useMosaic() {
  const { toast } = useToast();
  
  // Initial mosaic data
  const [initialMosaic] = useState(() => createEmptyMosaic(10, 10, "3x3"));
  
  // History management with undo/redo
  const {
    state: mosaicData,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory
  } = useHistory(initialMosaic);
  
  const [projectName, setProjectName] = useState("Untitled Mosaic");
  const [colorPalette, setColorPalette] = useState("standard");
  
  // UI State
  const [selectedTool, setSelectedTool] = useState("brush");
  const [selectedColor, setSelectedColor] = useState("#B90000"); // Official UE Red
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [selectedCube, setSelectedCube] = useState<MosaicCube | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [cubeOutlineType, setCubeOutlineType] = useState<'stickerless' | 'white' | 'black'>('black');
  const [backgroundColor, setBackgroundColor] = useState("#f8f8f8");


  // Derived state
  const cubeType = mosaicData?.cubeType || "3x3";

  // Helper function to update mosaic with history
  const updateMosaic = useCallback((newData: MosaicData) => {
    pushState(newData);
  }, [pushState]);

  // Actions
  const createNewProject = useCallback(() => {
    const newMosaic = createEmptyMosaic(10, 10, "3x3");
    clearHistory(newMosaic);
    setProjectName("Untitled Mosaic");
    setColorPalette("standard");
    toast({
      title: "New Project",
      description: "Created new mosaic project",
    });
  }, [toast, clearHistory]);

  const exportProject = useCallback(() => {
    const projectData = {
      name: projectName,
      width: mosaicData.width,
      height: mosaicData.height,
      cubeType: mosaicData.cubeType,
      mosaicData,
      colorPalette,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const rmContent = JSON.stringify(projectData, null, 2);
    const blob = new Blob([rmContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.rm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Project exported successfully",
    });
  }, [mosaicData, projectName, colorPalette, toast]);

  const importProject = useCallback(async (file: File) => {
    try {
      const project = await readRMFile(file);
      clearHistory(project.mosaicData as MosaicData);
      setProjectName(project.name);
      setColorPalette(project.colorPalette);
      
      toast({
        title: "Imported",
        description: "Project imported successfully",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import project file",
        variant: "destructive",
      });
    }
  }, [toast, clearHistory]);

  const updateDimensions = useCallback((width: number, height: number) => {
    const resizedData = resizeMosaic(mosaicData, width, height);
    updateMosaic(resizedData);
  }, [mosaicData, updateMosaic]);

  const onCubeUpdate = useCallback((updatedCube: MosaicCube) => {
    const existingCubeIndex = mosaicData.cubes.findIndex(c => 
      c.position.row === updatedCube.position.row && c.position.col === updatedCube.position.col
    );

    let newCubes;
    if (existingCubeIndex >= 0) {
      newCubes = [...mosaicData.cubes];
      newCubes[existingCubeIndex] = updatedCube;
    } else {
      newCubes = [...mosaicData.cubes, updatedCube];
    }

    // Create new mosaic state and push to history for individual brush stroke undo
    const newMosaicData = {
      ...mosaicData,
      cubes: newCubes
    };
    
    pushState(newMosaicData);
  }, [mosaicData, pushState]);

  const onCubeSelect = useCallback((cube: MosaicCube | null) => {
    setSelectedCube(cube);
  }, []);

  const generateFromImageData = useCallback((imageData: ImageData, width: number, height: number, cubeType: CubeType, options?: MosaicOptions) => {
    const newCubes: MosaicCube[] = [];
    const data = imageData.data;
    const cubeSize = getCubeSize(cubeType);
    
    // Calculate how many pixels from the source image correspond to each cube
    const pixelsPerCubeX = Math.floor(imageData.width / width);
    const pixelsPerCubeY = Math.floor(imageData.height / height);
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const emptyCube = createEmptyCube(row, col, cubeType);
        
        // Create sticker-level detail by sampling from the source image
        for (let stickerRow = 0; stickerRow < cubeSize; stickerRow++) {
          for (let stickerCol = 0; stickerCol < cubeSize; stickerCol++) {
            // Calculate which pixel in the source image corresponds to this sticker
            const sourceX = Math.floor(col * pixelsPerCubeX + (stickerCol * pixelsPerCubeX / cubeSize));
            const sourceY = Math.floor(row * pixelsPerCubeY + (stickerRow * pixelsPerCubeY / cubeSize));
            
            // Ensure we don't go out of bounds
            const clampedX = Math.min(sourceX, imageData.width - 1);
            const clampedY = Math.min(sourceY, imageData.height - 1);
            
            const pixelIndex = (clampedY * imageData.width + clampedX) * 4;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            emptyCube.face.stickers[stickerRow][stickerCol] = color;
          }
        }
        
        newCubes.push(emptyCube);
      }
    }
    
    updateMosaic({
      ...mosaicData,
      width,
      height,
      cubeType,
      cubes: newCubes
    });
    
    toast({
      title: "Generated",
      description: `Mosaic created using ${options?.method || 'advanced'} algorithm with sticker-level detail`,
    });
  }, [mosaicData, updateMosaic, toast]);

  const generateFromImage = useCallback(async (file: File, width: number, height: number, cubeType: CubeType) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('cubeType', cubeType);
      
      const response = await fetch('/api/generate-mosaic', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      
      updateMosaic({
        ...mosaicData,
        width,
        height,
        cubeType,
        cubes: data.mosaicData.flat()
      });
      
      toast({
        title: "Generated",
        description: "Mosaic created from image",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate mosaic",
        variant: "destructive",
      });
    }
  }, [mosaicData, updateMosaic, toast]);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const toggleOutlineColor = useCallback(() => {
    setOutlineColor(prev => prev === "#000000" ? "#FFFFFF" : "#000000");
  }, []);

  const clearCanvas = useCallback(() => {
    updateMosaic({
      ...mosaicData,
      cubes: []
    });
    
    toast({
      title: "Cleared",
      description: "Canvas cleared",
    });
  }, [mosaicData, updateMosaic, toast]);

  const fillBackground = useCallback((color: string) => {
    const cubeSize = getCubeSize(cubeType);
    const newCubes: MosaicCube[] = [];
    
    // Create filled cubes for the entire canvas
    for (let row = 0; row < mosaicData.height; row++) {
      for (let col = 0; col < mosaicData.width; col++) {
        const cube = createEmptyCube(row, col, cubeType);
        
        // Fill all stickers with the background color
        for (let stickerRow = 0; stickerRow < cubeSize; stickerRow++) {
          for (let stickerCol = 0; stickerCol < cubeSize; stickerCol++) {
            cube.face.stickers[stickerRow][stickerCol] = color;
          }
        }
        
        newCubes.push(cube);
      }
    }
    
    updateMosaic({
      ...mosaicData,
      cubes: newCubes
    });
    
    toast({
      title: "Background Set",
      description: "All squares filled with selected color",
    });
  }, [mosaicData, updateMosaic, toast, cubeType]);

  const hasContent = useCallback(() => {
    return mosaicData.cubes && mosaicData.cubes.length > 0 && 
           mosaicData.cubes.some(cube => 
             cube.face.stickers.some(row => 
               row.some(sticker => sticker !== "#FFFFFF")
             )
           );
  }, [mosaicData.cubes]);



  // Set up keyboard shortcuts
  const shortcuts = [
    createShortcuts.undo(undo),
    createShortcuts.redo(redo),
    createShortcuts.redoAlt(redo),
    createShortcuts.new(createNewProject),
    createShortcuts.save(exportProject),
    createShortcuts.brush(() => setSelectedTool("brush")),
    createShortcuts.eraser(() => setSelectedTool("eraser")),
    createShortcuts.zoomIn(() => setZoom(prev => Math.min(400, prev + 25))),
    createShortcuts.zoomOut(() => setZoom(prev => Math.max(25, prev - 25))),
    createShortcuts.resetZoom(() => setZoom(100)),
    createShortcuts.toggleGrid(toggleGrid)
  ];

  useKeyboardShortcuts(shortcuts);

  return {
    // Data
    mosaicData,
    projectName,
    colorPalette,
    
    // UI State
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
    
    // History
    canUndo,
    canRedo,
    
    // Actions
    createNewProject,
    exportProject,
    importProject,
    updateDimensions,
    onCubeUpdate,
    onCubeSelect,
    generateFromImageData,
    generateFromImage,
    undo,
    redo,
    clearCanvas,
    fillBackground,
    hasContent,
    
    // Setters
    setProjectName,
    setColorPalette,
    setSelectedTool,
    setSelectedColor,
    setZoom,
    setShowGrid,
    setOutlineColor,
    setSelectedCube,
    setShowLeftPanel,
    setCubeOutlineType,
    setBackgroundColor,
    toggleGrid,
    toggleOutlineColor,
  };
}