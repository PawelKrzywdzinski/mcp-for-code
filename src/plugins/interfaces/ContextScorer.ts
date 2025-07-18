export interface FileRelevanceScore {
  filePath: string;
  score: number;
  reasons: ScoringReason[];
  metadata: FileMetadata;
}

export interface ScoringReason {
  factor: string;
  weight: number;
  description: string;
}

export interface FileMetadata {
  type: string;
  language: string;
  size: number;
  complexity: number;
  lastModified: Date;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

export interface ContextScoringConfig {
  fileTypeWeights: Record<string, number>;
  languageWeights: Record<string, number>;
  complexityWeight: number;
  sizeWeight: number;
  freshnessWeight: number;
  dependencyWeight: number;
  testWeight: number;
  maxContextFiles: number;
}

export abstract class ContextScorer {
  protected config: ContextScoringConfig;
  
  constructor(config: Partial<ContextScoringConfig> = {}) {
    this.config = {
      fileTypeWeights: {},
      languageWeights: {},
      complexityWeight: 0.3,
      sizeWeight: 0.2,
      freshnessWeight: 0.1,
      dependencyWeight: 0.2,
      testWeight: 0.2,
      maxContextFiles: 50,
      ...config
    };
  }
  
  abstract scoreFileRelevance(
    filePath: string,
    task: string,
    projectContext: any
  ): Promise<FileRelevanceScore>;
  
  abstract scoreFiles(
    files: string[],
    task: string,
    projectContext: any
  ): Promise<FileRelevanceScore[]>;
  
  abstract selectContextFiles(
    files: string[],
    task: string,
    projectContext: any,
    maxFiles?: number
  ): Promise<string[]>;
  
  protected calculateComplexityScore(complexity: number): number {
    return Math.min(complexity / 100, 1.0);
  }
  
  protected calculateSizeScore(size: number): number {
    const maxSize = 10000;
    return Math.max(0, (maxSize - size) / maxSize);
  }
  
  protected calculateFreshnessScore(lastModified: Date): number {
    const now = new Date();
    const daysSinceModified = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSinceModified / 30);
  }
}