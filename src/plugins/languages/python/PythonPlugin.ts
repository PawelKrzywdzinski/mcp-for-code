import { LanguagePlugin } from '../../interfaces/LanguagePlugin.js';
import { PythonParser } from './PythonParser.js';
import { PipDependencyAnalyzer } from './PipDependencyAnalyzer.js';
import { PythonContextScorer } from './PythonContextScorer.js';
import { PythonDocumentationProvider } from './PythonDocumentationProvider.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class PythonPlugin implements LanguagePlugin {
  readonly name = 'python';
  readonly displayName = 'Python';
  readonly fileExtensions = ['.py', '.pyx', '.pyi', '.pyw'];
  readonly projectFilePatterns = ['pyproject.toml', 'setup.py', 'requirements.txt', 'Pipfile'];
  readonly configFiles = [
    'pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt',
    'Pipfile', 'Pipfile.lock', 'poetry.lock', 'tox.ini',
    'pytest.ini', '.flake8', 'mypy.ini', '.pylintrc'
  ];
  readonly buildFiles = [
    'pyproject.toml', 'setup.py', 'setup.cfg', 'Makefile',
    'tox.ini', 'noxfile.py'
  ];
  
  readonly parser = new PythonParser();
  readonly dependencyAnalyzer = new PipDependencyAnalyzer();
  readonly contextScorer = new PythonContextScorer();
  readonly documentationProvider = new PythonDocumentationProvider();
  
  async isApplicable(projectPath: string): Promise<boolean> {
    try {
      const pythonConfigFiles = [
        'pyproject.toml', 'setup.py', 'requirements.txt', 'Pipfile'
      ];
      
      for (const configFile of pythonConfigFiles) {
        if (await this.fileExists(path.join(projectPath, configFile))) {
          return true;
        }
      }
      
      const pythonFiles = await this.findPythonFiles(projectPath);
      return pythonFiles.length > 0;
    } catch {
      return false;
    }
  }
  
  getProjectType(): string {
    return 'python';
  }
  
  getPriority(): number {
    return 75;
  }
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  private async findPythonFiles(projectPath: string): Promise<string[]> {
    const glob = await import('glob');
    const pattern = path.join(projectPath, '**/*.{py,pyx,pyi,pyw}');
    
    try {
      return await glob.glob(pattern, {
        ignore: [
          '**/venv/**', '**/.venv/**', '**/env/**', '**/.env/**',
          '**/site-packages/**', '**/__pycache__/**', '**/build/**',
          '**/dist/**', '**/.pytest_cache/**', '**/.mypy_cache/**'
        ]
      });
    } catch {
      return [];
    }
  }
}