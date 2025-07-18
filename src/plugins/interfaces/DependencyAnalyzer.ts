export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'indirect';
  scope: 'production' | 'development' | 'test' | 'optional';
  source: string;
  path?: string;
  description?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  vulnerabilities?: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  reference?: string;
  range?: string;
  fixedIn?: string;
}

export interface DependencyGraph {
  dependencies: Dependency[];
  devDependencies: Dependency[];
  optionalDependencies: Dependency[];
  conflicts: DependencyConflict[];
  totalSize: number;
  outdated: OutdatedDependency[];
}

export interface DependencyConflict {
  package: string;
  versions: string[];
  cause: string;
  resolution?: string;
}

export interface OutdatedDependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  wantedVersion: string;
  type: string;
}

export abstract class DependencyAnalyzer {
  abstract analyzeDependencies(projectPath: string): Promise<DependencyGraph>;
  abstract checkForUpdates(projectPath: string): Promise<OutdatedDependency[]>;
  abstract findVulnerabilities(projectPath: string): Promise<SecurityVulnerability[]>;
  abstract resolveDependencyTree(projectPath: string): Promise<Dependency[]>;
  
  protected async parseManifestFile(filePath: string): Promise<any> {
    const content = await this.readFile(filePath);
    const path = await import('path');
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.json':
        return JSON.parse(content);
      case '.yaml':
      case '.yml':
        const yaml = await import('yaml');
        return yaml.parse(content);
      case '.toml':
        const toml = await import('@iarna/toml');
        return toml.parse(content);
      default:
        throw new Error(`Unsupported manifest file format: ${ext}`);
    }
  }
  
  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  }
}