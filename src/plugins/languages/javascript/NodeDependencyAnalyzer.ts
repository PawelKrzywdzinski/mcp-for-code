import { DependencyAnalyzer, DependencyGraph, Dependency, OutdatedDependency, SecurityVulnerability } from '../../interfaces/DependencyAnalyzer.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class NodeDependencyAnalyzer extends DependencyAnalyzer {
  async analyzeDependencies(projectPath: string): Promise<DependencyGraph> {
    const packageJson = await this.parsePackageJson(projectPath);
    const lockFile = await this.parseLockFile(projectPath);
    
    const dependencies = await this.extractDependencies(packageJson, 'production');
    const devDependencies = await this.extractDependencies(packageJson, 'development');
    const optionalDependencies = await this.extractDependencies(packageJson, 'optional');
    
    const allDeps = [...dependencies, ...devDependencies, ...optionalDependencies];
    const conflicts = this.findConflicts(allDeps);
    const totalSize = await this.calculateTotalSize(allDeps);
    const outdated = await this.checkForUpdates(projectPath);
    
    return {
      dependencies,
      devDependencies,
      optionalDependencies,
      conflicts,
      totalSize,
      outdated
    };
  }
  
  async checkForUpdates(projectPath: string): Promise<OutdatedDependency[]> {
    try {
      const packageJson = await this.parsePackageJson(projectPath);
      const outdated: OutdatedDependency[] = [];
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.optionalDependencies
      };
      
      for (const [name, currentVersion] of Object.entries(allDeps)) {
        try {
          const latestVersion = await this.getLatestVersion(name);
          if (currentVersion !== latestVersion) {
            outdated.push({
              name,
              currentVersion: currentVersion as string,
              latestVersion,
              wantedVersion: latestVersion,
              type: this.getDependencyType(packageJson, name)
            });
          }
        } catch (error) {
          console.warn(`Failed to check updates for ${name}:`, error);
        }
      }
      
      return outdated;
    } catch {
      return [];
    }
  }
  
  async findVulnerabilities(projectPath: string): Promise<SecurityVulnerability[]> {
    try {
      const vulnerabilities: SecurityVulnerability[] = [];
      const dependencies = await this.resolveDependencyTree(projectPath);
      
      for (const dep of dependencies) {
        const vulns = await this.checkPackageVulnerabilities(dep.name, dep.version);
        vulnerabilities.push(...vulns);
      }
      
      return vulnerabilities;
    } catch {
      return [];
    }
  }
  
  async resolveDependencyTree(projectPath: string): Promise<Dependency[]> {
    const packageJson = await this.parsePackageJson(projectPath);
    const lockFile = await this.parseLockFile(projectPath);
    
    const dependencies: Dependency[] = [];
    const visited = new Set<string>();
    
    const resolveDep = async (name: string, version: string, type: 'direct' | 'indirect', scope: string) => {
      const key = `${name}@${version}`;
      if (visited.has(key)) return;
      visited.add(key);
      
      const packageInfo = await this.getPackageInfo(name, version);
      
      dependencies.push({
        name,
        version,
        type,
        scope: scope as any,
        source: 'npm',
        description: packageInfo?.description,
        license: packageInfo?.license,
        homepage: packageInfo?.homepage,
        repository: packageInfo?.repository?.url
      });
      
      if (packageInfo?.dependencies) {
        for (const [depName, depVersion] of Object.entries(packageInfo.dependencies)) {
          await resolveDep(depName, depVersion as string, 'indirect', scope);
        }
      }
    };
    
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        await resolveDep(name, version as string, 'direct', 'production');
      }
    }
    
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        await resolveDep(name, version as string, 'direct', 'development');
      }
    }
    
    return dependencies;
  }
  
  private async parsePackageJson(projectPath: string): Promise<any> {
    const packagePath = path.join(projectPath, 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    return JSON.parse(content);
  }
  
  private async parseLockFile(projectPath: string): Promise<any> {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    
    for (const lockFile of lockFiles) {
      try {
        const lockPath = path.join(projectPath, lockFile);
        const content = await fs.readFile(lockPath, 'utf-8');
        
        if (lockFile === 'package-lock.json') {
          return JSON.parse(content);
        } else if (lockFile === 'pnpm-lock.yaml') {
          const yaml = await import('yaml');
          return yaml.parse(content);
        } else {
          return this.parseYarnLock(content);
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }
  
  private parseYarnLock(content: string): any {
    const lines = content.split('\n');
    const dependencies: any = {};
    let currentPackage = '';
    
    for (const line of lines) {
      if (line.match(/^[^#\s]/)) {
        currentPackage = line.split(':')[0].replace(/['"]/g, '');
      } else if (line.includes('version') && currentPackage) {
        const version = line.split('version')[1].replace(/[^0-9.]/g, '');
        dependencies[currentPackage] = { version };
      }
    }
    
    return { dependencies };
  }
  
  private async extractDependencies(packageJson: any, scope: string): Promise<Dependency[]> {
    const deps: Dependency[] = [];
    let depList: Record<string, string> = {};
    
    switch (scope) {
      case 'production':
        depList = packageJson.dependencies || {};
        break;
      case 'development':
        depList = packageJson.devDependencies || {};
        break;
      case 'optional':
        depList = packageJson.optionalDependencies || {};
        break;
    }
    
    for (const [name, version] of Object.entries(depList)) {
      const packageInfo = await this.getPackageInfo(name, version as string);
      
      deps.push({
        name,
        version: version as string,
        type: 'direct',
        scope: scope as any,
        source: 'npm',
        description: packageInfo?.description,
        license: packageInfo?.license,
        homepage: packageInfo?.homepage,
        repository: packageInfo?.repository?.url
      });
    }
    
    return deps;
  }
  
  private findConflicts(dependencies: Dependency[]): any[] {
    const conflicts: any[] = [];
    const packageVersions = new Map<string, string[]>();
    
    for (const dep of dependencies) {
      if (!packageVersions.has(dep.name)) {
        packageVersions.set(dep.name, []);
      }
      packageVersions.get(dep.name)!.push(dep.version);
    }
    
    for (const [packageName, versions] of packageVersions) {
      const uniqueVersions = [...new Set(versions)];
      if (uniqueVersions.length > 1) {
        conflicts.push({
          package: packageName,
          versions: uniqueVersions,
          cause: 'Multiple versions required',
          resolution: `Use ${uniqueVersions[0]}`
        });
      }
    }
    
    return conflicts;
  }
  
  private async calculateTotalSize(dependencies: Dependency[]): Promise<number> {
    let totalSize = 0;
    
    for (const dep of dependencies) {
      try {
        const packageInfo = await this.getPackageInfo(dep.name, dep.version);
        totalSize += packageInfo?.dist?.unpackedSize || 0;
      } catch {
        continue;
      }
    }
    
    return totalSize;
  }
  
  private async getLatestVersion(packageName: string): Promise<string> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
      const data = await response.json();
      return data.version;
    } catch {
      return 'unknown';
    }
  }
  
  private async getPackageInfo(name: string, version: string): Promise<any> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${name}/${version}`);
      return await response.json();
    } catch {
      return null;
    }
  }
  
  private async checkPackageVulnerabilities(name: string, version: string): Promise<SecurityVulnerability[]> {
    return [];
  }
  
  private getDependencyType(packageJson: any, name: string): string {
    if (packageJson.dependencies?.[name]) return 'production';
    if (packageJson.devDependencies?.[name]) return 'development';
    if (packageJson.optionalDependencies?.[name]) return 'optional';
    return 'unknown';
  }
}