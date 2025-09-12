
import { type Project } from "@shared/schema";
import { exportToPdf as generatePdf } from './pdf-export';

export function downloadRMFile(project: Project) {
  const rmContent = JSON.stringify(project, null, 2);
  const blob = new Blob([rmContent], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name}.rm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

export function readRMFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = JSON.parse(content);
        resolve(project);
      } catch (error) {
        reject(new Error('Invalid .rm file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

export function exportToImage(canvas: HTMLCanvasElement, filename: string = 'mosaic'): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

export function exportToPdf(project: Project): void {
  generatePdf(project);
}

export function validateRMFile(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.name === 'string' &&
    typeof data.width === 'number' &&
    typeof data.height === 'number' &&
    typeof data.cubeType === 'string' &&
    data.mosaicData &&
    Array.isArray(data.mosaicData.layers)
  );
}
