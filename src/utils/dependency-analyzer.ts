import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'spm' | 'cocoapods' | 'carthage';
  url?: string;
  documentation?: string;
  localPath?: string;
  isResolved: boolean;
  hasUpdates?: boolean;
}

export interface SPMPackage {
  name: string;
  url: string;
  version: string;
  products: string[];
  dependencies: string[];
}

export interface PodDependency {
  name: string;
  version: string;
  source: string;
  subspecs?: string[];
}

export class DependencyAnalyzer {
  private projectPath: string;
  private projectDir: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.projectDir = path.dirname(projectPath);
  }

  async analyzeDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];

    try {
      // Analyze Swift Package Manager dependencies
      const spmDeps = await this.analyzeSPMDependencies();
      dependencies.push(...spmDeps);

      // Analyze CocoaPods dependencies
      const podDeps = await this.analyzePodDependencies();
      dependencies.push(...podDeps);

      // Analyze Carthage dependencies
      const carthageDeps = await this.analyzeCarthageDependencies();
      dependencies.push(...carthageDeps);

      // Analyze local frameworks
      const localDeps = await this.analyzeLocalDependencies();
      dependencies.push(...localDeps);

    } catch (error) {
      console.error('Error analyzing dependencies:', error);
    }

    return dependencies;
  }

  private async analyzeSPMDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    const packageSwiftPath = path.join(this.projectDir, 'Package.swift');
    const packageResolvedPath = path.join(this.projectDir, 'Package.resolved');

    try {
      // Check if Package.swift exists
      if (await this.fileExists(packageSwiftPath)) {
        const packageContent = await fs.readFile(packageSwiftPath, 'utf8');
        const packageDeps = this.parseSPMPackageFile(packageContent);
        
        // Get resolved versions if available
        let resolvedVersions: Map<string, string> = new Map();
        if (await this.fileExists(packageResolvedPath)) {
          resolvedVersions = await this.parseSPMResolvedFile(packageResolvedPath);
        }

        for (const pkg of packageDeps) {
          const resolvedVersion = resolvedVersions.get(pkg.name) || pkg.version;
          
          dependencies.push({
            name: pkg.name,
            version: resolvedVersion,
            type: 'spm',
            url: pkg.url,
            documentation: this.generateDocURL(pkg.name, pkg.url),
            isResolved: resolvedVersions.has(pkg.name),
            hasUpdates: Math.random() > 0.8, // Mock update check
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing SPM dependencies:', error);
    }

    return dependencies;
  }

  private async analyzePodDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    const podfilePath = path.join(this.projectDir, 'Podfile');
    const podfileLockPath = path.join(this.projectDir, 'Podfile.lock');

    try {
      if (await this.fileExists(podfilePath)) {
        const podfileContent = await fs.readFile(podfilePath, 'utf8');
        const podDeps = this.parsePodfile(podfileContent);
        
        // Get locked versions if available
        let lockedVersions: Map<string, string> = new Map();
        if (await this.fileExists(podfileLockPath)) {
          lockedVersions = await this.parsePodfileLock(podfileLockPath);
        }

        for (const pod of podDeps) {
          const lockedVersion = lockedVersions.get(pod.name) || pod.version;
          
          dependencies.push({
            name: pod.name,
            version: lockedVersion,
            type: 'cocoapods',
            url: pod.source,
            documentation: this.generatePodDocURL(pod.name),
            isResolved: lockedVersions.has(pod.name),
            hasUpdates: Math.random() > 0.7, // Mock update check
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing CocoaPods dependencies:', error);
    }

    return dependencies;
  }

  private async analyzeCarthageDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    const cartfilePath = path.join(this.projectDir, 'Cartfile');
    const cartfileResolvedPath = path.join(this.projectDir, 'Cartfile.resolved');

    try {
      if (await this.fileExists(cartfilePath)) {
        const cartfileContent = await fs.readFile(cartfilePath, 'utf8');
        const carthageDeps = this.parseCarthageFile(cartfileContent);
        
        // Get resolved versions if available
        let resolvedVersions: Map<string, string> = new Map();
        if (await this.fileExists(cartfileResolvedPath)) {
          resolvedVersions = await this.parseCarthageResolvedFile(cartfileResolvedPath);
        }

        for (const dep of carthageDeps) {
          const resolvedVersion = resolvedVersions.get(dep.name) || dep.version;
          
          dependencies.push({
            name: dep.name,
            version: resolvedVersion,
            type: 'carthage',
            url: dep.url,
            documentation: this.generateDocURL(dep.name, dep.url),
            isResolved: resolvedVersions.has(dep.name),
            hasUpdates: Math.random() > 0.6, // Mock update check
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing Carthage dependencies:', error);
    }

    return dependencies;
  }

  private async analyzeLocalDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    
    try {
      // Look for local frameworks
      const frameworkPaths = await glob('**/*.framework', {
        cwd: this.projectDir,
        ignore: ['**/build/**', '**/DerivedData/**', '**/Carthage/**', '**/Pods/**'],
      });

      for (const frameworkPath of frameworkPaths) {
        const frameworkName = path.basename(frameworkPath, '.framework');
        const fullPath = path.join(this.projectDir, frameworkPath);
        
        dependencies.push({
          name: frameworkName,
          version: 'local',
          type: 'spm', // Default to SPM for local frameworks
          localPath: fullPath,
          isResolved: true,
          hasUpdates: false,
        });
      }

      // Look for local Swift packages
      const localPackages = await glob('**/Package.swift', {
        cwd: this.projectDir,
        ignore: ['**/build/**', '**/DerivedData/**', '**/Carthage/**', '**/Pods/**'],
      });

      for (const packagePath of localPackages) {
        if (packagePath !== 'Package.swift') { // Skip root Package.swift
          const packageDir = path.dirname(packagePath);
          const packageName = path.basename(packageDir);
          
          dependencies.push({
            name: packageName,
            version: 'local',
            type: 'spm',
            localPath: path.join(this.projectDir, packageDir),
            isResolved: true,
            hasUpdates: false,
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing local dependencies:', error);
    }

    return dependencies;
  }

  private parseSPMPackageFile(content: string): SPMPackage[] {
    const packages: SPMPackage[] = [];
    
    // Simple regex parsing for Package.swift
    const packageRegex = /\.package\s*\(\s*url:\s*"([^"]+)"\s*,\s*(?:from|exact|branch|revision):\s*"([^"]+)"\s*\)/g;
    
    let match;
    while ((match = packageRegex.exec(content)) !== null) {
      const url = match[1];
      const version = match[2];
      const name = this.extractPackageName(url);
      
      packages.push({
        name,
        url,
        version,
        products: [],
        dependencies: [],
      });
    }
    
    return packages;
  }

  private async parseSPMResolvedFile(resolvedPath: string): Promise<Map<string, string>> {
    const resolvedVersions = new Map<string, string>();
    
    try {
      const content = await fs.readFile(resolvedPath, 'utf8');
      const resolved = JSON.parse(content);
      
      if (resolved.pins) {
        for (const pin of resolved.pins) {
          const name = pin.identity || this.extractPackageName(pin.location);
          const version = pin.state?.version || pin.state?.revision || 'unknown';
          resolvedVersions.set(name, version);
        }
      }
    } catch (error) {
      console.error('Error parsing Package.resolved:', error);
    }
    
    return resolvedVersions;
  }

  private parsePodfile(content: string): PodDependency[] {
    const pods: PodDependency[] = [];
    
    // Simple regex parsing for Podfile
    const podRegex = /pod\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g;
    
    let match;
    while ((match = podRegex.exec(content)) !== null) {
      const name = match[1];
      const version = match[2] || 'latest';
      
      pods.push({
        name,
        version,
        source: `https://github.com/CocoaPods/Specs.git`,
      });
    }
    
    return pods;
  }

  private async parsePodfileLock(lockPath: string): Promise<Map<string, string>> {
    const lockedVersions = new Map<string, string>();
    
    try {
      const content = await fs.readFile(lockPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^\s*-\s+([^(]+)\s+\(([^)]+)\)/);
        if (match) {
          const name = match[1].trim();
          const version = match[2].trim();
          lockedVersions.set(name, version);
        }
      }
    } catch (error) {
      console.error('Error parsing Podfile.lock:', error);
    }
    
    return lockedVersions;
  }

  private parseCarthageFile(content: string): Array<{name: string, version: string, url: string}> {
    const deps: Array<{name: string, version: string, url: string}> = [];
    
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(github|git|binary)\s+"([^"]+)"\s*(?:>=|~>|==)?\s*"?([^"]*)"?/);
      if (match) {
        const type = match[1];
        const repo = match[2];
        const version = match[3] || 'latest';
        
        const name = repo.split('/').pop() || repo;
        const url = type === 'github' ? `https://github.com/${repo}` : repo;
        
        deps.push({ name, version, url });
      }
    }
    
    return deps;
  }

  private async parseCarthageResolvedFile(resolvedPath: string): Promise<Map<string, string>> {
    const resolvedVersions = new Map<string, string>();
    
    try {
      const content = await fs.readFile(resolvedPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^(github|git|binary)\s+"([^"]+)"\s+"([^"]+)"/);
        if (match) {
          const repo = match[2];
          const version = match[3];
          const name = repo.split('/').pop() || repo;
          
          resolvedVersions.set(name, version);
        }
      }
    } catch (error) {
      console.error('Error parsing Cartfile.resolved:', error);
    }
    
    return resolvedVersions;
  }

  private extractPackageName(url: string): string {
    const match = url.match(/\/([^/]+?)(?:\.git)?$/);
    return match ? match[1] : path.basename(url);
  }

  private generateDocURL(name: string, url?: string): string {
    if (url && url.includes('github.com')) {
      return `${url.replace('.git', '')}/blob/main/README.md`;
    }
    return `https://swiftpackageindex.com/${name}`;
  }

  private generatePodDocURL(name: string): string {
    return `https://cocoapods.org/pods/${name}`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async checkForUpdates(dependencies: DependencyInfo[]): Promise<DependencyInfo[]> {
    // Mock update checking - in real implementation would use package APIs
    return dependencies.map(dep => ({
      ...dep,
      hasUpdates: Math.random() > 0.7,
    }));
  }

  async generateDependencyReport(dependencies: DependencyInfo[]): Promise<string> {
    let report = '# Dependency Report\n\n';
    
    const spmDeps = dependencies.filter(d => d.type === 'spm');
    const podDeps = dependencies.filter(d => d.type === 'cocoapods');
    const carthageDeps = dependencies.filter(d => d.type === 'carthage');
    
    if (spmDeps.length > 0) {
      report += '## Swift Package Manager\n\n';
      for (const dep of spmDeps) {
        report += `- **${dep.name}** (${dep.version})`;
        if (dep.hasUpdates) report += ' ⚠️ Update available';
        report += '\n';
      }
      report += '\n';
    }
    
    if (podDeps.length > 0) {
      report += '## CocoaPods\n\n';
      for (const dep of podDeps) {
        report += `- **${dep.name}** (${dep.version})`;
        if (dep.hasUpdates) report += ' ⚠️ Update available';
        report += '\n';
      }
      report += '\n';
    }
    
    if (carthageDeps.length > 0) {
      report += '## Carthage\n\n';
      for (const dep of carthageDeps) {
        report += `- **${dep.name}** (${dep.version})`;
        if (dep.hasUpdates) report += ' ⚠️ Update available';
        report += '\n';
      }
      report += '\n';
    }
    
    report += `## Summary\n\n`;
    report += `Total dependencies: ${dependencies.length}\n`;
    report += `Updates available: ${dependencies.filter(d => d.hasUpdates).length}\n`;
    report += `Resolved: ${dependencies.filter(d => d.isResolved).length}\n`;
    
    return report;
  }
}