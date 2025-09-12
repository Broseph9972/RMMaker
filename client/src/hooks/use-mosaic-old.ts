import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { type MosaicData, type MosaicCube, type CubeType } from "@shared/schema";
import { createEmptyMosaic, resizeMosaic, fillCubeWithColor, clearCube } from "@/lib/mosaic-utils";
import { readRMFile } from "@/lib/file-handlers";
import { type MosaicOptions } from "@/lib/advanced-algorithms";
import { useHistory } from "@/hooks/use-history";
import { useKeyboardShortcuts, createShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function useMosaic() {
  const { toast } = useToast();
  
  // Default project state - always loaded
  const [mosaicData, setMosaicData] = useState<MosaicData>(() => 
    createEmptyMosaic(10, 10, "3x3")
  );
  const [projectName, setProjectName] = useState("Untitled Mosaic");
  const [colorPalette, setColorPalette] = useState("standard");
  
  // UI State
  const [selectedTool, setSelectedTool] = useState("brush");
  const [selectedColor, setSelectedColor] = useState("#B71234");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [selectedCube, setSelectedCube] = useState<MosaicCube | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  // History management with undo/redo
  const {
    state: mosaicDataWithHistory,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory
  } = useHistory(mosaicData);

  // Remove old project queries - we're managing state locally now

  // Simple local actions

  // Derived state
  const cubeType = mosaicData?.cubeType || "3x3";

  // Sync mosaicData with history state
  const actualMosaicData = mosaicDataWithHistory;

  // Actions
  const createNewProject = useCallback(() => {
    const newMosaic = createEmptyMosaic(10, 10, "3x3");
    setMosaicData(newMosaic);
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
  }, [projectName, mosaicData, colorPalette, toast]);

  const importProject = useCallback(async (file: File) => {
    try {
      const projectData = await readRMFile(file);
      setMosaicData(projectData.mosaicData);
      setProjectName(projectData.name || "Imported Mosaic");
      setColorPalette(projectData.colorPalette || "standard");
      
      toast({
        title: "Imported",
        description: "Project imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import project",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateMosaicDimensions = useCallback((width: number, height: number) => {
    const newMosaicData = resizeMosaic(mosaicData, width, height);
    setMosaicData(newMosaicData);
  }, [mosaicData]);

  const setCubeType = useCallback((type: CubeType) => {
    setMosaicData(prev => ({ ...prev, cubeType: type }));
  }, []);

  const selectCube = useCallback((cube: MosaicCube | null) => {
    setSelectedCube(cube);
  }, []);

  const updateCube = useCallback((cube: MosaicCube) => {
    setMosaicData(prev => {
      const newLayers = prev.layers.map(layer => {
        if (layer.id === prev.activeLayerId) {
          const existingIndex = layer.cubes.findIndex(c => 
            c.position.row === cube.position.row && c.position.col === cube.position.col
          );
          
          const newCubes = [...layer.cubes];
          if (existingIndex >= 0) {
            newCubes[existingIndex] = cube;
          } else {
            newCubes.push(cube);
          }
          
          return { ...layer, cubes: newCubes };
        }
        return layer;
      });

      return { ...prev, layers: newLayers };
    });
  }, []);

  const generateFromImageData = useCallback((imageData: ImageData, width: number, height: number, cubeType: CubeType, options?: MosaicOptions) => {
    // Convert ImageData to mosaic cubes
    const newCubes: MosaicCube[] = [];
    const data = imageData.data;
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const pixelIndex = (row * width + col) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        const emptyCube = { row, col, face: { stickers: Array(cubeType).fill(null).map(() => Array(cubeType).fill("#ffffff")) } };
        const cube = fillCubeWithColor(emptyCube, color);
        newCubes.push(cube);
      }
    }
    
    setMosaicData(prev => ({
      ...prev,
      width,
      height,
      cubeType,
      layers: [{
        ...prev.layers[0],
        cubes: newCubes
      }]
    }));
    
    toast({
      title: "Generated",
      description: `Mosaic created using ${options?.method || 'advanced'} algorithm`,
    });
  }, [toast]);

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
      
      setMosaicData(prev => ({
        ...prev,
        width,
        height,
        cubeType,
        layers: [{
          ...prev.layers[0],
          cubes: data.mosaicData.flat()
        }]
      }));
      
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
  }, [toast]);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const toggleOutlineColor = useCallback(() => {
    setOutlineColor(prev => prev === "#000000" ? "#FFFFFF" : "#000000");
  }, []);

  const undo = useCallback(() => {
    // TODO: Implement undo functionality with history
    toast({
      title: "Info",
      description: "Undo functionality coming soon",
    });
  }, [toast]);

  const redo = useCallback(() => {
    // TODO: Implement redo functionality with history
    toast({
      title: "Info",
      description: "Redo functionality coming soon",
    });
  }, [toast]);

  const clearCanvas = useCallback(() => {
    setMosaicData(prev => ({
      ...prev,
      layers: prev.layers.map(layer => ({ ...layer, cubes: [] }))
    }));
    
    toast({
      title: "Cleared",
      description: "Canvas cleared",
    });
  }, [toast]);

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
    showRightPanel,
    history,
    
    // Actions
    createNewProject,
    exportProject,
    importProject,
    updateMosaicDimensions,
    setCubeType,
    setSelectedTool,
    setSelectedColor,
    setZoom,
    setShowLeftPanel,
    setShowRightPanel,
    setProjectName,
    setColorPalette,
    toggleGrid,
    toggleOutlineColor,
    selectCube,
    updateCube,
    generateFromImage,
    generateFromImageData,
    undo,
    redo,
    clearCanvas,
  };
}
