import { type CubeType, type MosaicCube, type MosaicData } from "@shared/schema";

export function createEmptyMosaic(width: number, height: number, cubeType: CubeType): MosaicData {
  return {
    width,
    height,
    cubeType,
    cubes: []
  };
}

export function getCubeSize(cubeType: CubeType): number {
  switch (cubeType) {
    case "2x2": return 2;
    case "4x4": return 4;
    default: return 3;
  }
}

export function createEmptyCube(row: number, col: number, cubeType: CubeType): MosaicCube {
  const size = getCubeSize(cubeType);
  
  return {
    face: {
      stickers: Array(size).fill(null).map(() => Array(size).fill("#ffffff"))
    },
    position: { row, col }
  };
}

export function resizeMosaic(
  currentData: MosaicData, 
  newWidth: number, 
  newHeight: number
): MosaicData {
  const newCubes = currentData.cubes.filter(cube => 
    cube.position.row < newHeight && cube.position.col < newWidth
  );

  return {
    ...currentData,
    width: newWidth,
    height: newHeight,
    cubes: newCubes
  };
}

export function fillCubeWithColor(cube: MosaicCube, color: string): MosaicCube {
  const newStickers = cube.face.stickers.map(row => 
    row.map(() => color)
  );
  
  return {
    ...cube,
    face: { stickers: newStickers }
  };
}

export function clearCube(cube: MosaicCube): MosaicCube {
  const newStickers = cube.face.stickers.map(row => 
    row.map(() => "#ffffff")
  );
  
  return {
    ...cube,
    face: { stickers: newStickers }
  };
}

export function getUsedColors(mosaicData: MosaicData): Set<string> {
  const colors = new Set<string>();
  
  mosaicData.cubes.forEach(cube => {
    cube.face.stickers.forEach(row => {
      row.forEach(color => {
        if (color && color !== "#ffffff") {
          colors.add(color);
        }
      });
    });
  });
  
  return colors;
}
