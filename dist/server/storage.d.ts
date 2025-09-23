import { type Project, type InsertProject } from "@shared/schema";
export interface IStorage {
    getProject(id: string): Promise<Project | undefined>;
    getAllProjects(): Promise<Project[]>;
    createProject(project: InsertProject): Promise<Project>;
    updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
    deleteProject(id: string): Promise<boolean>;
}
export declare class MemStorage implements IStorage {
    private projects;
    constructor();
    getProject(id: string): Promise<Project | undefined>;
    getAllProjects(): Promise<Project[]>;
    createProject(insertProject: InsertProject): Promise<Project>;
    updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined>;
    deleteProject(id: string): Promise<boolean>;
}
export declare const storage: MemStorage;
