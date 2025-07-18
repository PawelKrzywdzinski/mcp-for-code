import { ContextScorer, FileRelevanceScore, ScoringReason, FileMetadata, ContextScoringConfig } from '../../interfaces/ContextScorer.js';
import * as path from 'path';

export class PythonContextScorer extends ContextScorer {
  constructor() {
    super({
      fileTypeWeights: {
        'source': 1.0,
        'module': 0.9,
        'config': 0.7,
        'test': 0.3,
        'types': 0.8,
        'documentation': 0.2
      },
      languageWeights: {
        'python': 1.0
      },
      complexityWeight: 0.3,
      sizeWeight: 0.2,
      freshnessWeight: 0.1,
      dependencyWeight: 0.2,
      testWeight: 0.2,
      maxContextFiles: 50
    });
  }
  
  async scoreFileRelevance(
    filePath: string,
    task: string,
    projectContext: any
  ): Promise<FileRelevanceScore> {
    const metadata = await this.analyzeFileMetadata(filePath);
    const reasons: ScoringReason[] = [];
    let score = 0;
    
    const typeScore = this.calculateTypeScore(metadata, reasons);
    const languageScore = this.calculateLanguageScore(metadata, reasons);
    const complexityScore = this.calculateComplexityScore(metadata.complexity);
    const sizeScore = this.calculateSizeScore(metadata.size);
    const freshnessScore = this.calculateFreshnessScore(metadata.lastModified);
    const taskRelevanceScore = this.calculateTaskRelevanceScore(filePath, task, reasons);
    const frameworkScore = this.calculateFrameworkScore(filePath, projectContext, reasons);
    
    score = (
      typeScore * this.config.fileTypeWeights[metadata.type] * 0.3 +
      languageScore * this.config.languageWeights[metadata.language] * 0.2 +
      complexityScore * this.config.complexityWeight +
      sizeScore * this.config.sizeWeight +
      freshnessScore * this.config.freshnessWeight +
      taskRelevanceScore * 0.4 +
      frameworkScore * 0.2
    );
    
    return {
      filePath,
      score: Math.max(0, Math.min(1, score)),
      reasons,
      metadata
    };
  }
  
  async scoreFiles(
    files: string[],
    task: string,
    projectContext: any
  ): Promise<FileRelevanceScore[]> {
    const scores: FileRelevanceScore[] = [];
    
    for (const file of files) {
      try {
        const score = await this.scoreFileRelevance(file, task, projectContext);
        scores.push(score);
      } catch (error) {
        console.warn(`Failed to score file ${file}:`, error);
      }
    }
    
    return scores.sort((a, b) => b.score - a.score);
  }
  
  async selectContextFiles(
    files: string[],
    task: string,
    projectContext: any,
    maxFiles?: number
  ): Promise<string[]> {
    const scores = await this.scoreFiles(files, task, projectContext);
    const limit = maxFiles || this.config.maxContextFiles;
    
    return scores
      .slice(0, limit)
      .filter(score => score.score > 0.1)
      .map(score => score.filePath);
  }
  
  private async analyzeFileMetadata(filePath: string): Promise<FileMetadata> {
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    
    const type = this.determineFileType(filePath);
    const language = 'python';
    const complexity = await this.estimateComplexity(filePath);
    const importance = this.determineImportance(filePath, type);
    const category = this.determineCategory(filePath);
    
    return {
      type,
      language,
      size: stats.size,
      complexity,
      lastModified: stats.mtime,
      importance,
      category
    };
  }
  
  private determineFileType(filePath: string): string {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);
    
    if (basename.startsWith('test_') || basename.endsWith('_test.py')) return 'test';
    if (basename === 'setup.py' || basename === 'conftest.py') return 'config';
    if (basename === '__init__.py') return 'module';
    if (basename.endsWith('.pyi')) return 'types';
    if (ext === '.md' || ext === '.txt' || ext === '.rst') return 'documentation';
    if (ext === '.py') return 'source';
    
    return 'unknown';
  }
  
  private async estimateComplexity(filePath: string): Promise<number> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      
      const complexityIndicators = [
        /\bif\s+/g,
        /\belif\s+/g,
        /\bwhile\s+/g,
        /\bfor\s+/g,
        /\btry\s*:/g,
        /\bexcept\s+/g,
        /\band\b/g,
        /\bor\b/g,
        /\bclass\s+\w+/g,
        /\bdef\s+\w+/g,
        /\basync\s+def\s+\w+/g
      ];
      
      let complexity = 1;
      for (const pattern of complexityIndicators) {
        const matches = content.match(pattern);
        complexity += matches ? matches.length : 0;
      }
      
      return Math.min(complexity, 100);
    } catch {
      return 1;
    }
  }
  
  private determineImportance(filePath: string, type: string): 'critical' | 'high' | 'medium' | 'low' {
    const basename = path.basename(filePath);
    
    if (basename === '__init__.py') return 'critical';
    if (basename === 'main.py' || basename === 'app.py') return 'critical';
    if (basename === 'settings.py' || basename === 'config.py') return 'high';
    if (type === 'config') return 'high';
    if (type === 'module') return 'medium';
    if (type === 'test') return 'low';
    
    return 'medium';
  }
  
  private determineCategory(filePath: string): string {
    const dir = path.dirname(filePath);
    
    if (dir.includes('models')) return 'model';
    if (dir.includes('views')) return 'view';
    if (dir.includes('controllers')) return 'controller';
    if (dir.includes('utils') || dir.includes('helpers')) return 'utility';
    if (dir.includes('services')) return 'service';
    if (dir.includes('api')) return 'api';
    if (dir.includes('config')) return 'configuration';
    if (dir.includes('test') || dir.includes('tests')) return 'test';
    if (dir.includes('migrations')) return 'migration';
    
    return 'general';
  }
  
  private calculateTypeScore(metadata: FileMetadata, reasons: ScoringReason[]): number {
    const baseScore = this.config.fileTypeWeights[metadata.type] || 0.5;
    
    reasons.push({
      factor: 'file_type',
      weight: baseScore,
      description: `Python file type: ${metadata.type}`
    });
    
    return baseScore;
  }
  
  private calculateLanguageScore(metadata: FileMetadata, reasons: ScoringReason[]): number {
    const baseScore = this.config.languageWeights[metadata.language] || 0.5;
    
    reasons.push({
      factor: 'language',
      weight: baseScore,
      description: `Language: ${metadata.language}`
    });
    
    return baseScore;
  }
  
  private calculateTaskRelevanceScore(filePath: string, task: string, reasons: ScoringReason[]): number {
    const taskLower = task.toLowerCase();
    const filePathLower = filePath.toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    
    let relevance = 0;
    
    const keywords = this.extractTaskKeywords(taskLower);
    for (const keyword of keywords) {
      if (filePathLower.includes(keyword) || basename.includes(keyword)) {
        relevance += 0.3;
        reasons.push({
          factor: 'task_keyword',
          weight: 0.3,
          description: `Contains task keyword: ${keyword}`
        });
      }
    }
    
    if (taskLower.includes('test') && basename.includes('test')) {
      relevance += 0.5;
      reasons.push({
        factor: 'test_relevance',
        weight: 0.5,
        description: 'Test file for testing task'
      });
    }
    
    if (taskLower.includes('model') && basename.includes('model')) {
      relevance += 0.4;
      reasons.push({
        factor: 'model_relevance',
        weight: 0.4,
        description: 'Model file for model-related task'
      });
    }
    
    if (taskLower.includes('api') && (basename.includes('api') || basename.includes('view'))) {
      relevance += 0.4;
      reasons.push({
        factor: 'api_relevance',
        weight: 0.4,
        description: 'API/view file for API task'
      });
    }
    
    return Math.min(relevance, 1.0);
  }
  
  private calculateFrameworkScore(filePath: string, projectContext: any, reasons: ScoringReason[]): number {
    const framework = projectContext?.framework?.toLowerCase();
    const filePathLower = filePath.toLowerCase();
    
    let score = 0;
    
    if (framework === 'django') {
      if (filePathLower.includes('models.py') || filePathLower.includes('views.py') || 
          filePathLower.includes('urls.py') || filePathLower.includes('admin.py')) {
        score += 0.3;
        reasons.push({
          factor: 'framework_match',
          weight: 0.3,
          description: 'Django framework file'
        });
      }
    }
    
    if (framework === 'flask') {
      if (filePathLower.includes('app.py') || filePathLower.includes('routes.py') ||
          filePathLower.includes('blueprints')) {
        score += 0.3;
        reasons.push({
          factor: 'framework_match',
          weight: 0.3,
          description: 'Flask framework file'
        });
      }
    }
    
    if (framework === 'fastapi') {
      if (filePathLower.includes('main.py') || filePathLower.includes('router') ||
          filePathLower.includes('api')) {
        score += 0.3;
        reasons.push({
          factor: 'framework_match',
          weight: 0.3,
          description: 'FastAPI framework file'
        });
      }
    }
    
    return score;
  }
  
  private extractTaskKeywords(task: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    return task
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }
}