import { LanguagePlugin } from '../../interfaces/LanguagePlugin.js';
import { JavaScriptParser } from './JavaScriptParser.js';
import { NodeDependencyAnalyzer } from './NodeDependencyAnalyzer.js';
import { JavaScriptContextScorer } from './JavaScriptContextScorer.js';
import { MDNDocumentationProvider } from './MDNDocumentationProvider.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class JavaScriptPlugin implements LanguagePlugin {
  readonly name = 'javascript';
  readonly displayName = 'JavaScript/TypeScript';
  readonly fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  readonly projectFilePatterns = ['package.json', 'tsconfig.json', 'jsconfig.json'];
  readonly configFiles = [
    'package.json', 'tsconfig.json', 'jsconfig.json', 
    '.eslintrc.*', 'prettier.config.*', 'webpack.config.*',
    'vite.config.*', 'rollup.config.*', 'babel.config.*'
  ];
  readonly buildFiles = [
    'package.json', 'webpack.config.*', 'vite.config.*',
    'rollup.config.*', 'esbuild.config.*', 'tsup.config.*'
  ];
  
  readonly parser = new JavaScriptParser();
  readonly dependencyAnalyzer = new NodeDependencyAnalyzer();
  readonly contextScorer = new JavaScriptContextScorer();
  readonly documentationProvider = new MDNDocumentationProvider();
  
  async isApplicable(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const tsconfigPath = path.join(projectPath, 'tsconfig.json');
      const jsconfigPath = path.join(projectPath, 'jsconfig.json');
      
      const hasPackageJson = await this.fileExists(packageJsonPath);
      const hasTsConfig = await this.fileExists(tsconfigPath);
      const hasJsConfig = await this.fileExists(jsconfigPath);
      
      if (hasPackageJson || hasTsConfig || hasJsConfig) {
        return true;
      }
      
      const jsFiles = await this.findJavaScriptFiles(projectPath);
      return jsFiles.length > 0;
    } catch {
      return false;
    }
  }
  
  getProjectType(): string {
    return 'javascript';
  }
  
  getPriority(): number {
    return 80;
  }
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  private async findJavaScriptFiles(projectPath: string): Promise<string[]> {
    const glob = await import('glob');
    const pattern = path.join(projectPath, '**/*.{js,jsx,ts,tsx,mjs,cjs}');
    
    try {
      return await glob.glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
      });
    } catch {
      return [];
    }
  }
}