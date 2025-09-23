import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { insertProjectSchema } from "../shared/schema.ts";
import multer from "multer";
import sharp from "sharp";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all projects
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Export project as .rm file
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const rmFileContent = JSON.stringify(project, null, 2);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${project.name}.rm"`);
      res.send(rmFileContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // Import project from .rm file
  app.post("/api/projects/import", upload.single('file'), async (req: Request, res) => {
    try {
      if (!('file' in req) || !req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const projectData = JSON.parse(fileContent);
      
      // Remove ID and timestamps to create new project
      const { id, createdAt, updatedAt, ...insertData } = projectData;
      
      const validatedData = insertProjectSchema.parse(insertData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid .rm file format" });
    }
  });

  // Generate mosaic from image
  app.post("/api/generate-mosaic", upload.single('image'), async (req: Request, res) => {
    try {
      if (!('file' in req) || !req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const { width = 10, height = 10, cubeType = "3x3" } = req.body;
      
      // Calculate total sticker dimensions for detailed generation
      const cubeSize = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
      const totalStickerWidth = parseInt(width) * cubeSize;
      const totalStickerHeight = parseInt(height) * cubeSize;

      // Process image with Sharp to match sticker resolution
      const { data, info } = await sharp(req.file.buffer)
        .resize(totalStickerWidth, totalStickerHeight, { 
          fit: 'cover',
          kernel: sharp.kernel.nearest 
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert image data to mosaic colors with sticker-level detail
      const mosaicData = [];
      
      for (let cubeRow = 0; cubeRow < parseInt(height); cubeRow++) {
        const row = [];
        for (let cubeCol = 0; cubeCol < parseInt(width); cubeCol++) {
          // Create stickers array for this cube
          const stickers = [];
          
          for (let stickerRow = 0; stickerRow < cubeSize; stickerRow++) {
            const stickerRowArray = [];
            for (let stickerCol = 0; stickerCol < cubeSize; stickerCol++) {
              // Calculate pixel position for this sticker
              const pixelY = cubeRow * cubeSize + stickerRow;
              const pixelX = cubeCol * cubeSize + stickerCol;
              const pixelIndex = (pixelY * totalStickerWidth + pixelX) * info.channels;
              
              const r = data[pixelIndex];
              const g = data[pixelIndex + 1];
              const b = data[pixelIndex + 2];
              
              // Convert RGB to closest Rubik's cube color
              const color = rgbToRubikColor(r, g, b);
              stickerRowArray.push(color);
            }
            stickers.push(stickerRowArray);
          }
          
          row.push({
            face: { stickers },
            position: { row: cubeRow, col: cubeCol }
          });
        }
        mosaicData.push(row);
      }

      res.json({ mosaicData });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate mosaic" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to convert RGB to closest Rubik's cube color
function rgbToRubikColor(r: number, g: number, b: number): string {
  const colors = [
    { name: "white", rgb: [255, 255, 255], hex: "#FFFFFF" },
    { name: "red", rgb: [183, 18, 52], hex: "#B71234" },
    { name: "blue", rgb: [0, 70, 173], hex: "#0046AD" },
    { name: "green", rgb: [0, 155, 72], hex: "#009B48" },
    { name: "yellow", rgb: [255, 213, 0], hex: "#FFD500" },
    { name: "orange", rgb: [255, 88, 0], hex: "#FF5800" },
    { name: "black", rgb: [0, 0, 0], hex: "#000000" },
  ];

  let closestColor = colors[0];
  let minDistance = Infinity;

  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.rgb[0], 2) +
      Math.pow(g - color.rgb[1], 2) +
      Math.pow(b - color.rgb[2], 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor.hex;
}
