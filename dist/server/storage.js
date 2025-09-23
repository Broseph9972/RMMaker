import { randomUUID } from "crypto";
export class MemStorage {
    constructor() {
        Object.defineProperty(this, "projects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.projects = new Map();
    }
    async getProject(id) {
        return this.projects.get(id);
    }
    async getAllProjects() {
        return Array.from(this.projects.values());
    }
    async createProject(insertProject) {
        const id = randomUUID();
        const now = new Date();
        const project = {
            ...insertProject,
            id,
            createdAt: now,
            updatedAt: now
        };
        this.projects.set(id, project);
        return project;
    }
    async updateProject(id, updateData) {
        const existing = this.projects.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...updateData,
            updatedAt: new Date(),
        };
        this.projects.set(id, updated);
        return updated;
    }
    async deleteProject(id) {
        return this.projects.delete(id);
    }
}
export const storage = new MemStorage();
