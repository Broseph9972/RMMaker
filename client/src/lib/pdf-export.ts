import jsPDF from 'jspdf';
import { type Project, type MosaicData } from '@shared/schema';
import { getCubeSize } from './mosaic-utils';

// Helper to convert hex to RGB, as jsPDF uses RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

export function exportToPdf(project: Project): void {
  const { mosaicData, name } = project;
  if (!mosaicData) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // --- Title Page ---
  doc.setFontSize(24);
  doc.text(name, pageWidth / 2, margin + 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`Mosaic Dimensions: ${mosaicData.width} x ${mosaicData.height} cubes`, pageWidth / 2, margin + 40, { align: 'center' });
  doc.text(`Cube Type: ${mosaicData.cubeType}`, pageWidth / 2, margin + 60, { align: 'center' });

  // --- Assembly Instructions ---
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Assembly Instructions', margin, margin);

  const { width: mosaicWidth, height: mosaicHeight, cubes, cubeType } = mosaicData;
  const stickersPerSide = getCubeSize(cubeType);
  const stickerSize = 8;
  const cubePadding = 2;
  const cubeDrawingSize = stickerSize * stickersPerSide + cubePadding * 2;
  
  const totalGridWidth = mosaicWidth * cubeDrawingSize;
  const scale = totalGridWidth > contentWidth ? contentWidth / totalGridWidth : 1;

  const scaledStickerSize = stickerSize * scale;
  const scaledCubeDrawingSize = cubeDrawingSize * scale;
  const startX = margin;
  let currentY = margin + 30;

  for (let i = 0; i < cubes.length; i++) {
    const cube = cubes[i];
    const rowIndex = Math.floor(i / mosaicWidth);
    const colIndex = i % mosaicWidth;

    const cubeX = startX + colIndex * scaledCubeDrawingSize;
    const cubeY = currentY + rowIndex * scaledCubeDrawingSize;

    if (cubeY + scaledCubeDrawingSize > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      // Redraw headers on new page
      doc.setFontSize(18);
      doc.text('Assembly Instructions (continued)', margin, margin);
    }
    
    const adjustedCubeY = currentY + rowIndex * scaledCubeDrawingSize;

    // Draw cube background (optional, for visual separation)
    doc.setFillColor(240, 240, 240);
    doc.rect(cubeX, adjustedCubeY, scaledCubeDrawingSize, scaledCubeDrawingSize, 'F');

    // Draw stickers
    cube.face.stickers.forEach((row, rIdx) => {
      row.forEach((color, cIdx) => {
        if (color) {
          const [r, g, b] = hexToRgb(color);
          doc.setFillColor(r, g, b);
          doc.rect(
            cubeX + (cIdx * scaledStickerSize),
            adjustedCubeY + (rIdx * scaledStickerSize),
            scaledStickerSize,
            scaledStickerSize,
            'F'
          );
        }
      });
    });

    // Draw grid lines for stickers
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    const totalStickerGridSize = stickersPerSide * scaledStickerSize;
    for (let j = 1; j < stickersPerSide; j++) {
      // Vertical
      doc.line(cubeX + j * scaledStickerSize, adjustedCubeY, cubeX + j * scaledStickerSize, adjustedCubeY + totalStickerGridSize);
      // Horizontal
      doc.line(cubeX, adjustedCubeY + j * scaledStickerSize, cubeX + totalStickerGridSize, adjustedCubeY + j * scaledStickerSize);
    }

    // Draw cube border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(cubeX, adjustedCubeY, scaledCubeDrawingSize, scaledCubeDrawingSize, 'S');
    
    // Draw coordinates
    doc.setFontSize(6 * scale);
    const coordText = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
    doc.text(coordText, cubeX + scaledCubeDrawingSize / 2, adjustedCubeY + scaledCubeDrawingSize + (8 * scale), { align: 'center' });
  }

  doc.save(`${name.replace(/\s/g, '_')}_mosaic.pdf`);
}