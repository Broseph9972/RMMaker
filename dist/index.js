// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  projects;
  constructor() {
    this.projects = /* @__PURE__ */ new Map();
  }
  async getProject(id) {
    return this.projects.get(id);
  }
  async getAllProjects() {
    return Array.from(this.projects.values());
  }
  async createProject(insertProject) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const project = {
      name: insertProject.name,
      width: insertProject.width ?? 10,
      height: insertProject.height ?? 10,
      cubeType: insertProject.cubeType ?? "3x3",
      mosaicData: insertProject.mosaicData,
      colorPalette: insertProject.colorPalette ?? "standard",
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }
  async updateProject(id, updateData) {
    const existing = this.projects.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.projects.set(id, updated);
    return updated;
  }
  async deleteProject(id) {
    return this.projects.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  width: integer("width").notNull().default(10),
  height: integer("height").notNull().default(10),
  cubeType: text("cube_type").notNull().default("3x3"),
  mosaicData: jsonb("mosaic_data").notNull(),
  colorPalette: text("color_palette").notNull().default("standard"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/routes.ts
import multer from "multer";
import sharp from "sharp";
var upload = multer({ storage: multer.memoryStorage() });
async function registerRoutes(app2) {
  app2.get("/api/projects", async (_req, res) => {
    try {
      const projects2 = await storage.getAllProjects();
      res.json(projects2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app2.get("/api/projects/:id", async (req, res) => {
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
  app2.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });
  app2.patch("/api/projects/:id", async (req, res) => {
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
  app2.delete("/api/projects/:id", async (req, res) => {
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
  app2.get("/api/projects/:id/export", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const rmFileContent = JSON.stringify(project, null, 2);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${project.name}.rm"`);
      res.send(rmFileContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export project" });
    }
  });
  app2.post("/api/projects/import", upload.single("file"), async (req, res) => {
    try {
      if (!("file" in req) || !req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      const fileContent = req.file.buffer.toString("utf-8");
      const projectData = JSON.parse(fileContent);
      const { id, createdAt, updatedAt, ...insertData } = projectData;
      const validatedData = insertProjectSchema.parse(insertData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid .rm file format" });
    }
  });
  app2.post("/api/generate-mosaic", upload.single("image"), async (req, res) => {
    try {
      if (!("file" in req) || !req.file) {
        return res.status(400).json({ message: "No image provided" });
      }
      const { width = 10, height = 10, cubeType = "3x3" } = req.body;
      const cubeSize = cubeType === "2x2" ? 2 : cubeType === "4x4" ? 4 : 3;
      const totalStickerWidth = parseInt(width) * cubeSize;
      const totalStickerHeight = parseInt(height) * cubeSize;
      const { data, info } = await sharp(req.file.buffer).resize(totalStickerWidth, totalStickerHeight, {
        fit: "cover",
        kernel: sharp.kernel.nearest
      }).raw().toBuffer({ resolveWithObject: true });
      const mosaicData = [];
      for (let cubeRow = 0; cubeRow < parseInt(height); cubeRow++) {
        const row = [];
        for (let cubeCol = 0; cubeCol < parseInt(width); cubeCol++) {
          const stickers = [];
          for (let stickerRow = 0; stickerRow < cubeSize; stickerRow++) {
            const stickerRowArray = [];
            for (let stickerCol = 0; stickerCol < cubeSize; stickerCol++) {
              const pixelY = cubeRow * cubeSize + stickerRow;
              const pixelX = cubeCol * cubeSize + stickerCol;
              const pixelIndex = (pixelY * totalStickerWidth + pixelX) * info.channels;
              const r = data[pixelIndex];
              const g = data[pixelIndex + 1];
              const b = data[pixelIndex + 2];
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
  const httpServer = createServer(app2);
  return httpServer;
}
function rgbToRubikColor(r, g, b) {
  const colors = [
    { name: "white", rgb: [255, 255, 255], hex: "#FFFFFF" },
    { name: "red", rgb: [183, 18, 52], hex: "#B71234" },
    { name: "blue", rgb: [0, 70, 173], hex: "#0046AD" },
    { name: "green", rgb: [0, 155, 72], hex: "#009B48" },
    { name: "yellow", rgb: [255, 213, 0], hex: "#FFD500" },
    { name: "orange", rgb: [255, 88, 0], hex: "#FF5800" },
    { name: "black", rgb: [0, 0, 0], hex: "#000000" }
  ];
  let closestColor = colors[0];
  let minDistance = Infinity;
  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }
  return closestColor.hex;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
