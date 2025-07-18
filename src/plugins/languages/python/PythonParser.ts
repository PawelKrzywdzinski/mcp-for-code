import { ProjectParser, ProjectStructure, SourceFile, ProjectTarget, BuildConfiguration } from '../../interfaces/ProjectParser.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class PythonParser extends ProjectParser {
  async parseProject(projectPath: string): Promise<ProjectStructure> {
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    const setupPy = await this.parseSetupPy(projectPath);
    const requirements = await this.parseRequirements(projectPath);
    const sourceFiles = await this.getSourceFiles(projectPath);
    const buildConfig = await this.parseBuildConfiguration(projectPath);
    
    const projectName = pyprojectToml?.project?.name || 
                       setupPy?.name || 
                       path.basename(projectPath);
    
    const framework = this.detectFramework(pyprojectToml, setupPy, requirements);
    
    return {
      name: projectName,
      type: this.detectProjectType(pyprojectToml, setupPy, sourceFiles),
      path: projectPath,
      language: 'python',
      framework,
      version: pyprojectToml?.project?.version || setupPy?.version,
      targets: await this.extractTargets(pyprojectToml, setupPy),
      sourceFiles,
      buildConfig,
      metadata: {
        pyprojectToml,
        setupPy,
        requirements,
        pythonVersion: await this.detectPythonVersion(projectPath),
        packageManager: await this.detectPackageManager(projectPath)
      }
    };
  }
  
  async getSourceFiles(projectPath: string): Promise<SourceFile[]> {
    const glob = await import('glob');
    const pattern = path.join(projectPath, '**/*.{py,pyx,pyi,pyw}');
    
    const files = await glob.glob(pattern, {
      ignore: [
        '**/venv/**', '**/.venv/**', '**/env/**', '**/.env/**',
        '**/site-packages/**', '**/__pycache__/**', '**/build/**',
        '**/dist/**', '**/.pytest_cache/**', '**/.mypy_cache/**'
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
          language: 'python',
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
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    const setupPy = await this.parseSetupPy(projectPath);
    
    return {
      packageManager: await this.detectPackageManager(projectPath),
      pythonVersion: await this.detectPythonVersion(projectPath),
      framework: this.detectFramework(pyprojectToml, setupPy, null),
      buildTool: this.detectBuildTool(projectPath),
      hasPoetry: await this.fileExists(path.join(projectPath, 'poetry.lock')),
      hasPipenv: await this.fileExists(path.join(projectPath, 'Pipfile')),
      hasVirtualEnv: await this.detectVirtualEnv(projectPath),
      hasMyPy: await this.hasMyPyConfig(projectPath),
      hasPytest: await this.hasPytestConfig(projectPath)
    };
  }
  
  private async parsePyprojectToml(projectPath: string): Promise<any> {
    try {
      const tomlPath = path.join(projectPath, 'pyproject.toml');
      const content = await this.readFile(tomlPath);
      const toml = await import('@iarna/toml');
      return toml.parse(content);
    } catch {
      return null;
    }
  }
  
  private async parseSetupPy(projectPath: string): Promise<any> {
    try {
      const setupPath = path.join(projectPath, 'setup.py');
      const content = await this.readFile(setupPath);
      
      const setupMatch = content.match(/setup\s*\(\s*([^)]*)\)/s);
      if (setupMatch) {
        return this.parseSetupArgs(setupMatch[1]);
      }
    } catch {
      return null;
    }
    return null;
  }
  
  private async parseRequirements(projectPath: string): Promise<string[]> {
    try {
      const reqPath = path.join(projectPath, 'requirements.txt');
      const content = await this.readFile(reqPath);
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
    } catch {
      return [];
    }
  }
  
  private async parseBuildConfiguration(projectPath: string): Promise<BuildConfiguration> {
    const buildTool = this.detectBuildTool(projectPath);
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    
    return {
      buildSystem: buildTool,
      buildFiles: await this.findBuildFiles(projectPath),
      targets: this.extractBuildTargets(pyprojectToml),
      scripts: pyprojectToml?.project?.scripts || {},
      environment: process.env as Record<string, string>
    };
  }
  
  private async extractTargets(pyprojectToml: any, setupPy: any): Promise<ProjectTarget[]> {
    const targets: ProjectTarget[] = [];
    
    const entryPoints = pyprojectToml?.project?.scripts || setupPy?.entry_points?.console_scripts || {};
    
    for (const [name, script] of Object.entries(entryPoints)) {
      targets.push({
        name,
        type: 'executable',
        sourceFiles: [script as string],
        dependencies: [],
        buildSettings: {}
      });
    }
    
    if (pyprojectToml?.project?.name || setupPy?.name) {
      targets.push({
        name: 'package',
        type: 'library',
        sourceFiles: [],
        dependencies: Object.keys(pyprojectToml?.project?.dependencies || setupPy?.install_requires || {}),
        buildSettings: {}
      });
    }
    
    return targets;
  }
  
  private detectProjectType(pyprojectToml: any, setupPy: any, sourceFiles: SourceFile[]): string {
    if (pyprojectToml?.project?.scripts || setupPy?.entry_points?.console_scripts) {
      return 'cli-tool';
    }
    
    if (this.hasWebFramework(pyprojectToml, setupPy)) {
      return 'web-app';
    }
    
    if (this.hasTestFiles(sourceFiles)) {
      return 'library-with-tests';
    }
    
    if (pyprojectToml?.project?.name || setupPy?.name) {
      return 'library';
    }
    
    return 'script';
  }
  
  private detectFramework(pyprojectToml: any, setupPy: any, requirements: string[] | null): string | undefined {
    const allDeps = [
      ...Object.keys(pyprojectToml?.project?.dependencies || {}),
      ...Object.keys(setupPy?.install_requires || {}),
      ...(requirements || [])
    ];
    
    if (allDeps.some(dep => dep.includes('django'))) return 'Django';
    if (allDeps.some(dep => dep.includes('flask'))) return 'Flask';
    if (allDeps.some(dep => dep.includes('fastapi'))) return 'FastAPI';
    if (allDeps.some(dep => dep.includes('tornado'))) return 'Tornado';
    if (allDeps.some(dep => dep.includes('pyramid'))) return 'Pyramid';
    if (allDeps.some(dep => dep.includes('bottle'))) return 'Bottle';
    if (allDeps.some(dep => dep.includes('streamlit'))) return 'Streamlit';
    if (allDeps.some(dep => dep.includes('dash'))) return 'Dash';
    
    return undefined;
  }
  
  private async detectPackageManager(projectPath: string): Promise<string> {
    if (await this.fileExists(path.join(projectPath, 'poetry.lock'))) return 'poetry';
    if (await this.fileExists(path.join(projectPath, 'Pipfile'))) return 'pipenv';
    if (await this.fileExists(path.join(projectPath, 'requirements.txt'))) return 'pip';
    return 'pip';
  }
  
  private async detectPythonVersion(projectPath: string): Promise<string> {
    try {
      const pyprojectToml = await this.parsePyprojectToml(projectPath);
      const pythonRequires = pyprojectToml?.project?.requires_python;
      if (pythonRequires) return pythonRequires;
      
      const runtimePath = path.join(projectPath, 'runtime.txt');
      if (await this.fileExists(runtimePath)) {
        const content = await this.readFile(runtimePath);
        const match = content.match(/python-(\d+\.\d+)/);
        if (match) return match[1];
      }
    } catch {
      // Fall through
    }
    
    return '3.9+';
  }
  
  private detectBuildTool(projectPath: string): string {
    return 'setuptools';
  }
  
  private async findBuildFiles(projectPath: string): Promise<string[]> {
    const buildFiles = [
      'pyproject.toml', 'setup.py', 'setup.cfg', 'Makefile', 'tox.ini'
    ];
    
    const found: string[] = [];
    for (const file of buildFiles) {
      if (await this.fileExists(path.join(projectPath, file))) {
        found.push(file);
      }
    }
    
    return found;
  }
  
  private extractBuildTargets(pyprojectToml: any): string[] {
    const targets = ['install', 'build', 'test'];
    
    if (pyprojectToml?.build_system?.build_backend) {
      targets.push('wheel', 'sdist');
    }
    
    return targets;
  }
  
  private getFileType(filePath: string): string {
    const basename = path.basename(filePath);
    
    if (basename.startsWith('test_') || basename.endsWith('_test.py')) return 'test';
    if (basename === 'setup.py' || basename === 'conftest.py') return 'config';
    if (basename === '__init__.py') return 'module';
    if (basename.endsWith('.pyi')) return 'types';
    
    return 'source';
  }
  
  private extractImports(content: string): string[] {
    const importRegex = /(?:^from\s+([^\s]+)\s+import|^import\s+([^\s]+))/gm;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importName = match[1] || match[2];
      if (importName && !importName.startsWith('.')) {
        imports.push(importName.split('.')[0]);
      }
    }
    
    return [...new Set(imports)];
  }
  
  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    const allMatch = content.match(/__all__\s*=\s*\[(.*?)\]/s);
    if (allMatch) {
      const allItems = allMatch[1].match(/'([^']+)'|"([^"]+)"/g);
      if (allItems) {
        exports.push(...allItems.map(item => item.replace(/['"]/g, '')));
      }
    }
    
    const defRegex = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
    let match;
    while ((match = defRegex.exec(content)) !== null) {
      if (!match[1].startsWith('_')) {
        exports.push(match[1]);
      }
    }
    
    const classRegex = /^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
    while ((match = classRegex.exec(content)) !== null) {
      if (!match[1].startsWith('_')) {
        exports.push(match[1]);
      }
    }
    
    return [...new Set(exports)];
  }
  
  private calculateCyclomaticComplexity(content: string): number {
    const complexityPatterns = [
      /\bif\s+/g,
      /\belif\s+/g,
      /\bwhile\s+/g,
      /\bfor\s+/g,
      /\btry\s*:/g,
      /\bexcept\s+/g,
      /\band\b/g,
      /\bor\b/g
    ];
    
    let complexity = 1;
    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    }
    
    return complexity;
  }
  
  private parseSetupArgs(setupArgs: string): any {
    const result: any = {};
    
    const nameMatch = setupArgs.match(/name\s*=\s*['"]([^'"]+)['"]/);
    if (nameMatch) result.name = nameMatch[1];
    
    const versionMatch = setupArgs.match(/version\s*=\s*['"]([^'"]+)['"]/);
    if (versionMatch) result.version = versionMatch[1];
    
    return result;
  }
  
  private hasWebFramework(pyprojectToml: any, setupPy: any): boolean {
    const webFrameworks = ['django', 'flask', 'fastapi', 'tornado', 'pyramid'];
    const allDeps = [
      ...Object.keys(pyprojectToml?.project?.dependencies || {}),
      ...Object.keys(setupPy?.install_requires || {})
    ];
    
    return webFrameworks.some(framework => 
      allDeps.some(dep => dep.toLowerCase().includes(framework))
    );
  }
  
  private hasTestFiles(sourceFiles: SourceFile[]): boolean {
    return sourceFiles.some(file => file.type === 'test');
  }
  
  private async detectVirtualEnv(projectPath: string): Promise<boolean> {
    const venvPaths = ['venv', '.venv', 'env', '.env'];
    
    for (const venvPath of venvPaths) {
      if (await this.fileExists(path.join(projectPath, venvPath))) {
        return true;
      }
    }
    
    return false;
  }
  
  private async hasMyPyConfig(projectPath: string): Promise<boolean> {
    const configFiles = ['mypy.ini', '.mypy.ini', 'setup.cfg'];
    
    for (const configFile of configFiles) {
      if (await this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
    }
    
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    return !!pyprojectToml?.tool?.mypy;
  }
  
  private async hasPytestConfig(projectPath: string): Promise<boolean> {
    const configFiles = ['pytest.ini', '.pytest.ini', 'setup.cfg', 'tox.ini'];
    
    for (const configFile of configFiles) {
      if (await this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
    }
    
    const pyprojectToml = await this.parsePyprojectToml(projectPath);
    return !!pyprojectToml?.tool?.pytest;
  }
}