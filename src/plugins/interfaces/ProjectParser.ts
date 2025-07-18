export interface ProjectStructure {
  name: string;
  type: string;
  path: string;
  language: string;
  framework?: string;
  version?: string;
  targets: ProjectTarget[];
  sourceFiles: SourceFile[];
  buildConfig: BuildConfiguration;
  metadata: Record<string, any>;
}

export interface ProjectTarget {
  name: string;
  type: string;
  platform?: string;
  sourceFiles: string[];
  dependencies: string[];
  buildSettings: Record<string, any>;
}

export interface SourceFile {
  path: string;
  type: string;
  language: string;
  size: number;
  complexity?: number;
  dependencies: string[];
  exports?: string[];
  lastModified: Date;
}

export interface BuildConfiguration {
  buildSystem: string;
  buildFiles: string[];
  targets: string[];
  scripts: Record<string, string>;
  environment: Record<string, string>;
}

export abstract class ProjectParser {
  abstract parseProject(projectPath: string): Promise<ProjectStructure>;
  abstract getSourceFiles(projectPath: string): Promise<SourceFile[]>;
  abstract analyzeComplexity(filePath: string): Promise<number>;
  abstract extractMetadata(projectPath: string): Promise<Record<string, any>>;
  
  protected async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }
  
  protected async fileExists(filePath: string): Promise<boolean> {
    const fs = await import('fs/promises');
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}