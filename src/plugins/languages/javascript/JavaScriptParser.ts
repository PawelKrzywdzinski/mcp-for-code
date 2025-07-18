import { ProjectParser, ProjectStructure, SourceFile, ProjectTarget, BuildConfiguration } from '../../interfaces/ProjectParser.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class JavaScriptParser extends ProjectParser {
  async parseProject(projectPath: string): Promise<ProjectStructure> {
    const packageJson = await this.parsePackageJson(projectPath);
    const tsConfig = await this.parseTsConfig(projectPath);
    const sourceFiles = await this.getSourceFiles(projectPath);
    const buildConfig = await this.parseBuildConfiguration(projectPath);
    
    const projectName = packageJson?.name || path.basename(projectPath);
    const language = tsConfig ? 'typescript' : 'javascript';
    const framework = this.detectFramework(packageJson);
    
    return {
      name: projectName,
      type: this.detectProjectType(packageJson),
      path: projectPath,
      language,
      framework,
      version: packageJson?.version,
      targets: await this.extractTargets(packageJson, tsConfig),
      sourceFiles,
      buildConfig,
      metadata: {
        packageJson,
        tsConfig,
        engines: packageJson?.engines,
        scripts: packageJson?.scripts
      }
    };
  }
  
  async getSourceFiles(projectPath: string): Promise<SourceFile[]> {
    const glob = await import('glob');
    const pattern = path.join(projectPath, '**/*.{js,jsx,ts,tsx,mjs,cjs}');
    
    const files = await glob.glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    });
    
    const sourceFiles: SourceFile[] = [];
    
    for (const filePath of files) {
      try {
        const stats = await fs.stat(filePath);
        const content = await this.readFile(filePath);
        const complexity = await this.analyzeComplexity(filePath);
        const dependencies = this.extractImports(content);
        const exports = this.extractExports(content);
        
        sourceFiles.push({
          path: filePath,
          type: this.getFileType(filePath),
          language: this.getFileLanguage(filePath),
          size: stats.size,
          complexity,
          dependencies,
          exports,
          lastModified: stats.mtime
        });
      } catch (error) {
        console.warn(`Failed to analyze file ${filePath}:`, error);
      }
    }
    
    return sourceFiles;
  }
  
  async analyzeComplexity(filePath: string): Promise<number> {
    try {
      const content = await this.readFile(filePath);
      return this.calculateCyclomaticComplexity(content);
    } catch {
      return 0;
    }
  }
  
  async extractMetadata(projectPath: string): Promise<Record<string, any>> {
    const packageJson = await this.parsePackageJson(projectPath);
    const tsConfig = await this.parseTsConfig(projectPath);
    
    return {
      packageManager: await this.detectPackageManager(projectPath),
      nodeVersion: packageJson?.engines?.node,
      framework: this.detectFramework(packageJson),
      buildTool: this.detectBuildTool(projectPath),
      hasTypeScript: await this.fileExists(path.join(projectPath, 'tsconfig.json')),
      hasESLint: await this.fileExists(path.join(projectPath, '.eslintrc.js')) ||
                 await this.fileExists(path.join(projectPath, '.eslintrc.json')),
      hasPrettier: await this.fileExists(path.join(projectPath, 'prettier.config.js')) ||
                   packageJson?.devDependencies?.prettier !== undefined
    };
  }
  
  private async parsePackageJson(projectPath: string): Promise<any> {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const content = await this.readFile(packagePath);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  private async parseTsConfig(projectPath: string): Promise<any> {
    try {
      const tsconfigPath = path.join(projectPath, 'tsconfig.json');
      const content = await this.readFile(tsconfigPath);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  private async parseBuildConfiguration(projectPath: string): Promise<BuildConfiguration> {
    const packageJson = await this.parsePackageJson(projectPath);
    const buildTool = this.detectBuildTool(projectPath);
    
    return {
      buildSystem: buildTool,
      buildFiles: await this.findBuildFiles(projectPath),
      targets: Object.keys(packageJson?.scripts || {}),
      scripts: packageJson?.scripts || {},
      environment: process.env as Record<string, string>
    };
  }
  
  private async extractTargets(packageJson: any, tsConfig: any): Promise<ProjectTarget[]> {
    const targets: ProjectTarget[] = [];
    
    if (packageJson?.main) {
      targets.push({
        name: 'main',
        type: 'library',
        sourceFiles: [packageJson.main],
        dependencies: Object.keys(packageJson.dependencies || {}),
        buildSettings: {}
      });
    }
    
    if (packageJson?.bin) {
      targets.push({
        name: 'cli',
        type: 'executable',
        sourceFiles: Array.isArray(packageJson.bin) ? packageJson.bin : [packageJson.bin],
        dependencies: Object.keys(packageJson.dependencies || {}),
        buildSettings: {}
      });
    }
    
    return targets;
  }
  
  private detectProjectType(packageJson: any): string {
    if (packageJson?.dependencies?.react || packageJson?.devDependencies?.react) {
      return 'react-app';
    }
    if (packageJson?.dependencies?.vue || packageJson?.devDependencies?.vue) {
      return 'vue-app';
    }
    if (packageJson?.dependencies?.angular || packageJson?.devDependencies?.angular) {
      return 'angular-app';
    }
    if (packageJson?.dependencies?.next || packageJson?.devDependencies?.next) {
      return 'nextjs-app';
    }
    if (packageJson?.dependencies?.express) {
      return 'express-app';
    }
    if (packageJson?.bin) {
      return 'cli-tool';
    }
    if (packageJson?.main) {
      return 'library';
    }
    return 'node-app';
  }
  
  private detectFramework(packageJson: any): string | undefined {
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    
    if (deps.react) return 'React';
    if (deps.vue) return 'Vue.js';
    if (deps.angular) return 'Angular';
    if (deps.svelte) return 'Svelte';
    if (deps.express) return 'Express.js';
    if (deps.fastify) return 'Fastify';
    if (deps.next) return 'Next.js';
    if (deps.nuxt) return 'Nuxt.js';
    
    return undefined;
  }
  
  private async detectPackageManager(projectPath: string): Promise<string> {
    if (await this.fileExists(path.join(projectPath, 'yarn.lock'))) return 'yarn';
    if (await this.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (await this.fileExists(path.join(projectPath, 'package-lock.json'))) return 'npm';
    return 'npm';
  }
  
  private detectBuildTool(projectPath: string): string {
    // This would check for webpack, vite, rollup, etc.
    return 'npm';
  }
  
  private async findBuildFiles(projectPath: string): Promise<string[]> {
    const buildFiles = [
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      'esbuild.config.js', 'tsup.config.js', 'package.json'
    ];
    
    const found: string[] = [];
    for (const file of buildFiles) {
      if (await this.fileExists(path.join(projectPath, file))) {
        found.push(file);
      }
    }
    
    return found;
  }
  
  private getFileType(filePath: string): string {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    
    if (basename.includes('.test.') || basename.includes('.spec.')) return 'test';
    if (basename.includes('.config.')) return 'config';
    if (ext === '.tsx' || ext === '.jsx') return 'component';
    if (ext === '.ts' || ext === '.js') return 'source';
    return 'unknown';
  }
  
  private getFileLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    return ext === '.ts' || ext === '.tsx' ? 'typescript' : 'javascript';
  }
  
  private extractImports(content: string): string[] {
    const importRegex = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }
    
    return imports;
  }
  
  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)|export\s*\{\s*([^}]+)\s*\}/g;
    const exports: string[] = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      } else if (match[2]) {
        const namedExports = match[2].split(',').map(exp => exp.trim().split(' as ')[0]);
        exports.push(...namedExports);
      }
    }
    
    return exports;
  }
  
  private calculateCyclomaticComplexity(content: string): number {
    const complexityPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*?\s*:/g,
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1;
    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    }
    
    return complexity;
  }
}