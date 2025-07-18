import { DependencyAnalyzer, DependencyGraph, Dependency, OutdatedDependency, SecurityVulnerability } from '../../interfaces/DependencyAnalyzer.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class PipDependencyAnalyzer extends DependencyAnalyzer {
  async analyzeDependencies(projectPath: string): Promise<DependencyGraph> {
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    const requirementsTxt = await this.parseRequirements(projectPath);
    
    const dependencies = await this.extractDependencies(pyprojectToml, requirementsTxt, 'production');
    const devDependencies = await this.extractDependencies(pyprojectToml, requirementsTxt, 'development');
    const optionalDependencies = await this.extractDependencies(pyprojectToml, requirementsTxt, 'optional');
    
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
      const outdated: OutdatedDependency[] = [];
      const allDeps = await this.getAllDependencies(projectPath);
      
      for (const [name, currentVersion] of Object.entries(allDeps)) {
        try {
          const latestVersion = await this.getLatestVersion(name);
          if (currentVersion !== latestVersion) {
            outdated.push({
              name,
              currentVersion: currentVersion as string,
              latestVersion,
              wantedVersion: latestVersion,
              type: this.getDependencyType(name, allDeps)
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
    const dependencies: Dependency[] = [];
    const allDeps = await this.getAllDependencies(projectPath);
    
    for (const [name, version] of Object.entries(allDeps)) {
      const packageInfo = await this.getPackageInfo(name, version as string);
      
      dependencies.push({
        name,
        version: version as string,
        type: 'direct',
        scope: this.getDependencyType(name, allDeps) as any,
        source: 'pypi',
        description: packageInfo?.summary,
        license: packageInfo?.license,
        homepage: packageInfo?.home_page,
        repository: packageInfo?.project_urls?.Repository
      });
    }
    
    return dependencies;
  }
  
  private async parsePyprojectToml(projectPath: string): Promise<any> {
    try {
      const tomlPath = path.join(projectPath, 'pyproject.toml');
      const content = await fs.readFile(tomlPath, 'utf-8');
      const toml = await import('@iarna/toml');
      return toml.parse(content);
    } catch {
      return null;
    }
  }
  
  private async parseRequirements(projectPath: string): Promise<string[]> {
    try {
      const reqPath = path.join(projectPath, 'requirements.txt');
      const content = await fs.readFile(reqPath, 'utf-8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
    } catch {
      return [];
    }
  }
  
  private async getAllDependencies(projectPath: string): Promise<Record<string, string>> {
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    const requirementsTxt = await this.parseRequirements(projectPath);
    
    const deps: Record<string, string> = {};
    
    // From pyproject.toml
    if (pyprojectToml?.project?.dependencies) {
      for (const dep of pyprojectToml.project.dependencies) {
        const [name, version] = this.parseDependencyString(dep);
        deps[name] = version;
      }
    }
    
    // From requirements.txt
    for (const dep of requirementsTxt) {
      if (!deps[dep]) {
        deps[dep] = 'latest';
      }
    }
    
    return deps;
  }
  
  private async extractDependencies(pyprojectToml: any, requirementsTxt: string[], scope: string): Promise<Dependency[]> {
    const deps: Dependency[] = [];
    let depList: string[] = [];
    
    switch (scope) {
      case 'production':
        depList = pyprojectToml?.project?.dependencies || requirementsTxt;
        break;
      case 'development':
        depList = pyprojectToml?.project?.['optional-dependencies']?.dev || [];
        break;
      case 'optional':
        depList = pyprojectToml?.project?.['optional-dependencies']?.optional || [];
        break;
    }
    
    for (const depString of depList) {
      const [name, version] = this.parseDependencyString(depString);
      const packageInfo = await this.getPackageInfo(name, version);
      
      deps.push({
        name,
        version,
        type: 'direct',
        scope: scope as any,
        source: 'pypi',
        description: packageInfo?.summary,
        license: packageInfo?.license,
        homepage: packageInfo?.home_page,
        repository: packageInfo?.project_urls?.Repository
      });
    }
    
    return deps;
  }
  
  private parseDependencyString(depString: string): [string, string] {
    const match = depString.match(/^([a-zA-Z0-9_-]+)(?:[>=<~!]+(.+))?$/);
    if (match) {
      return [match[1], match[2] || 'latest'];
    }
    return [depString, 'latest'];
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
        totalSize += packageInfo?.size || 0;
      } catch {
        continue;
      }
    }
    
    return totalSize;
  }
  
  private async getLatestVersion(packageName: string): Promise<string> {
    try {
      const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);
      const data = await response.json();
      return data.info.version;
    } catch {
      return 'unknown';
    }
  }
  
  private async getPackageInfo(name: string, version: string): Promise<any> {
    try {
      const response = await fetch(`https://pypi.org/pypi/${name}/${version}/json`);
      return (await response.json()).info;
    } catch {
      return null;
    }
  }
  
  private async checkPackageVulnerabilities(name: string, version: string): Promise<SecurityVulnerability[]> {
    return [];
  }
  
  private getDependencyType(name: string, allDeps: Record<string, string>): string {
    return 'production';
  }
}