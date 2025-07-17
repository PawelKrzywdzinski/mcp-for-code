import { FileInfo } from '../index.js';

export interface OptimizationContext {
  userId: string;
  previousTasks: string[];
  timeConstraint: number; // milliseconds
  qualityRequirement: number; // 0-1 scale
  tokenBudget: number;
}

export interface OptimizationResult {
  content: string;
  optimizedTokens: number;
  technique: string;
  confidence: number;
  timeTaken: number;
  qualityScore: number;
}

export interface TokenSavings {
  originalTokens: number;
  optimizedTokens: number;
  savedTokens: number;
  savingsPercentage: number;
  costSavings: number;
}

export class MasterTokenOptimizer {
  private techniques: OptimizationTechnique[] = [];
  private learningData: Map<string, OptimizationHistory> = new Map();
  
  constructor() {
    this.initializeTechniques();
  }

  private initializeTechniques() {
    this.techniques = [
      new ExtremeCompressionTechnique(),
      new SmartSummarizationTechnique(),
      new ContextualFilteringTechnique(),
      new StructuralOptimizationTechnique(),
      new SemanticCompressionTechnique(),
      new AdaptiveCachingTechnique(),
    ];
  }

  async optimizeIntelligently(
    files: FileInfo[],
    task: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const taskKey = this.generateTaskKey(task, context);
    
    // Select best technique based on context and history
    const technique = this.selectOptimalTechnique(task, context, files);
    
    // Apply optimization
    const result = await technique.optimize(files, task, context);
    
    // Learn from this optimization
    this.recordOptimization(taskKey, result, technique.name);
    
    const timeTaken = Date.now() - startTime;
    
    return {
      ...result,
      timeTaken,
      technique: technique.name,
    };
  }

  async optimizeRealTime(
    files: FileInfo[],
    task: string,
    targetTokens: number,
    timeLimit: number
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const context: OptimizationContext = {
      userId: 'default',
      previousTasks: [],
      timeConstraint: timeLimit,
      qualityRequirement: 0.8,
      tokenBudget: targetTokens,
    };

    // Use extreme compression for real-time scenarios
    const technique = this.techniques.find(t => t.name === 'ExtremeCompression') || this.techniques[0];
    
    const result = await technique.optimize(files, task, context);
    
    // If we're still over budget, apply additional compression
    if (result.optimizedTokens > targetTokens) {
      const secondaryResult = await this.applySecondaryCompression(result, targetTokens);
      return {
        ...secondaryResult,
        timeTaken: Date.now() - startTime,
        technique: `${technique.name} + Secondary`,
      };
    }
    
    return {
      ...result,
      timeTaken: Date.now() - startTime,
      technique: technique.name,
    };
  }

  private selectOptimalTechnique(
    task: string,
    context: OptimizationContext,
    files: FileInfo[]
  ): OptimizationTechnique {
    const taskType = this.classifyTask(task);
    const fileComplexity = this.calculateFileComplexity(files);
    const history = this.learningData.get(this.generateTaskKey(task, context));
    
    // Score each technique
    const scores = this.techniques.map(technique => {
      let score = 0;
      
      // Base compatibility score
      score += technique.getCompatibilityScore(taskType, fileComplexity);
      
      // Time constraint factor
      if (context.timeConstraint < 2000) {
        score += technique.name === 'ExtremeCompression' ? 20 : -10;
      }
      
      // Quality requirement factor
      if (context.qualityRequirement > 0.8) {
        score += technique.name === 'SmartSummarization' ? 15 : 0;
      }
      
      // Historical performance
      if (history) {
        const historyScore = history.techniques.get(technique.name)?.averageScore || 0;
        score += historyScore * 10;
      }
      
      return { technique, score };
    });
    
    // Return the highest scoring technique
    scores.sort((a, b) => b.score - a.score);
    return scores[0].technique;
  }

  private async applySecondaryCompression(
    result: OptimizationResult,
    targetTokens: number
  ): Promise<OptimizationResult> {
    const compressionRatio = targetTokens / result.optimizedTokens;
    const lines = result.content.split('\n');
    
    // Aggressive line reduction
    const importantLines = lines.filter((line, index) => {
      // Keep first and last lines
      if (index === 0 || index === lines.length - 1) return true;
      
      // Keep lines with class/function definitions
      if (line.match(/class|func|struct|enum|protocol/)) return true;
      
      // Keep lines with comments
      if (line.trim().startsWith('//')) return true;
      
      // Random sampling for other lines
      return Math.random() < compressionRatio;
    });
    
    const compressedContent = importantLines.join('\n');
    const newTokens = Math.ceil(compressedContent.length * 0.25);
    
    return {
      ...result,
      content: compressedContent,
      optimizedTokens: newTokens,
      confidence: result.confidence * 0.8, // Reduce confidence due to aggressive compression
    };
  }

  private classifyTask(task: string): TaskType {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('debug') || taskLower.includes('fix') || taskLower.includes('error')) {
      return TaskType.Debug;
    }
    
    if (taskLower.includes('implement') || taskLower.includes('add') || taskLower.includes('create')) {
      return TaskType.Implementation;
    }
    
    if (taskLower.includes('refactor') || taskLower.includes('improve') || taskLower.includes('optimize')) {
      return TaskType.Refactoring;
    }
    
    if (taskLower.includes('test') || taskLower.includes('unit') || taskLower.includes('spec')) {
      return TaskType.Testing;
    }
    
    return TaskType.General;
  }

  private calculateFileComplexity(files: FileInfo[]): number {
    if (files.length === 0) return 0;
    
    const totalComplexity = files.reduce((sum, file) => {
      let complexity = 0;
      complexity += (file.classes?.length || 0) * 5;
      complexity += (file.functions?.length || 0) * 2;
      complexity += (file.complexity || 0);
      return sum + complexity;
    }, 0);
    
    return totalComplexity / files.length;
  }

  private generateTaskKey(task: string, context: OptimizationContext): string {
    return `${task.substring(0, 50)}_${context.tokenBudget}_${context.qualityRequirement}`;
  }

  private recordOptimization(
    taskKey: string,
    result: OptimizationResult,
    techniqueName: string
  ) {
    let history = this.learningData.get(taskKey);
    
    if (!history) {
      history = {
        totalOptimizations: 0,
        techniques: new Map(),
      };
      this.learningData.set(taskKey, history);
    }
    
    history.totalOptimizations++;
    
    let techniqueHistory = history.techniques.get(techniqueName);
    if (!techniqueHistory) {
      techniqueHistory = {
        usageCount: 0,
        averageScore: 0,
        averageTokens: 0,
      };
      history.techniques.set(techniqueName, techniqueHistory);
    }
    
    techniqueHistory.usageCount++;
    techniqueHistory.averageScore = (
      (techniqueHistory.averageScore * (techniqueHistory.usageCount - 1)) +
      result.qualityScore
    ) / techniqueHistory.usageCount;
    
    techniqueHistory.averageTokens = (
      (techniqueHistory.averageTokens * (techniqueHistory.usageCount - 1)) +
      result.optimizedTokens
    ) / techniqueHistory.usageCount;
  }

  calculateTokenSavings(originalTokens: number, optimizedTokens: number): TokenSavings {
    const savedTokens = originalTokens - optimizedTokens;
    const savingsPercentage = (savedTokens / originalTokens) * 100;
    const costSavings = savedTokens * 0.0003; // Assuming $0.0003 per token
    
    return {
      originalTokens,
      optimizedTokens,
      savedTokens,
      savingsPercentage,
      costSavings,
    };
  }
}

// Optimization Techniques

abstract class OptimizationTechnique {
  abstract name: string;
  
  abstract optimize(
    files: FileInfo[],
    task: string,
    context: OptimizationContext
  ): Promise<OptimizationResult>;
  
  abstract getCompatibilityScore(taskType: TaskType, fileComplexity: number): number;
  
  protected estimateTokens(content: string): number {
    return Math.ceil(content.length * 0.25);
  }
}

class ExtremeCompressionTechnique extends OptimizationTechnique {
  name = 'ExtremeCompression';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const relevantFiles = this.selectMostRelevantFiles(files, task, 3);
    let content = `Task: ${task}\n\n`;
    
    for (const file of relevantFiles) {
      content += `${file.path}:\n`;
      
      // Extreme compression: only key information
      if (file.classes && file.classes.length > 0) {
        content += `Classes: ${file.classes.slice(0, 3).join(', ')}\n`;
      }
      
      if (file.functions && file.functions.length > 0) {
        content += `Functions: ${file.functions.slice(0, 5).join(', ')}\n`;
      }
      
      // Only include first 200 characters of content
      if (file.content) {
        const snippet = file.content.substring(0, 200);
        content += `Code: ${snippet}...\n`;
      }
      
      content += '\n';
    }
    
    const tokens = this.estimateTokens(content);
    
    return {
      content,
      optimizedTokens: tokens,
      technique: this.name,
      confidence: 0.85,
      timeTaken: 0,
      qualityScore: 0.8,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    return 80; // Always high compatibility for extreme compression
  }
  
  private selectMostRelevantFiles(files: FileInfo[], task: string, count: number): FileInfo[] {
    const taskWords = task.toLowerCase().split(' ');
    
    const scored = files.map(file => {
      let score = 0;
      
      // File name relevance
      if (taskWords.some(word => file.path.toLowerCase().includes(word))) {
        score += 20;
      }
      
      // Class name relevance
      if (file.classes) {
        for (const className of file.classes) {
          if (taskWords.some(word => className.toLowerCase().includes(word))) {
            score += 15;
          }
        }
      }
      
      // File type priority
      if (file.type === 'swift') score += 10;
      
      return { file, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(item => item.file);
  }
}

class SmartSummarizationTechnique extends OptimizationTechnique {
  name = 'SmartSummarization';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const relevantFiles = this.selectRelevantFiles(files, task, context.tokenBudget);
    let content = `Context for: ${task}\n\n`;
    
    for (const file of relevantFiles) {
      content += `## ${file.path}\n`;
      content += `Type: ${file.type}, Size: ${file.size} bytes\n`;
      
      if (file.classes && file.classes.length > 0) {
        content += `Classes: ${file.classes.join(', ')}\n`;
      }
      
      if (file.functions && file.functions.length > 0) {
        const funcList = file.functions.slice(0, 8).join(', ');
        content += `Functions: ${funcList}${file.functions.length > 8 ? '...' : ''}\n`;
      }
      
      if (file.content) {
        const summary = this.summarizeCode(file.content);
        content += `Summary: ${summary}\n`;
      }
      
      content += '\n';
    }
    
    const tokens = this.estimateTokens(content);
    
    return {
      content,
      optimizedTokens: tokens,
      technique: this.name,
      confidence: 0.9,
      timeTaken: 0,
      qualityScore: 0.9,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    if (fileComplexity > 20) return 90;
    if (taskType === TaskType.Implementation) return 85;
    return 70;
  }
  
  private selectRelevantFiles(files: FileInfo[], task: string, tokenBudget: number): FileInfo[] {
    const selected: FileInfo[] = [];
    let currentTokens = 0;
    const maxTokensPerFile = tokenBudget / 5; // Distribute budget across files
    
    // Sort by relevance
    const sorted = files.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, task);
      const bScore = this.calculateRelevanceScore(b, task);
      return bScore - aScore;
    });
    
    for (const file of sorted) {
      const estimatedTokens = this.estimateTokens(file.content || '');
      if (currentTokens + estimatedTokens <= tokenBudget && estimatedTokens <= maxTokensPerFile) {
        selected.push(file);
        currentTokens += estimatedTokens;
      }
    }
    
    return selected;
  }
  
  private calculateRelevanceScore(file: FileInfo, task: string): number {
    let score = 0;
    const taskLower = task.toLowerCase();
    
    if (file.path.toLowerCase().includes(taskLower)) score += 30;
    if (file.classes?.some(cls => cls.toLowerCase().includes(taskLower))) score += 25;
    if (file.functions?.some(func => func.toLowerCase().includes(taskLower))) score += 20;
    if (file.type === 'swift') score += 10;
    
    return score;
  }
  
  private summarizeCode(code: string): string {
    const lines = code.split('\n');
    const importantLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('class') ||
             trimmed.startsWith('func') ||
             trimmed.startsWith('struct') ||
             trimmed.startsWith('enum') ||
             trimmed.startsWith('protocol') ||
             trimmed.startsWith('//');
    });
    
    return importantLines.slice(0, 3).join(' | ');
  }
}

class ContextualFilteringTechnique extends OptimizationTechnique {
  name = 'ContextualFiltering';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const filtered = this.filterByContext(files, task, context);
    let content = `Filtered context for: ${task}\n\n`;
    
    for (const file of filtered) {
      content += `${file.path}:\n`;
      
      if (file.content) {
        const relevantSnippets = this.extractRelevantSnippets(file.content, task);
        content += relevantSnippets.join('\n');
      }
      
      content += '\n---\n';
    }
    
    const tokens = this.estimateTokens(content);
    
    return {
      content,
      optimizedTokens: tokens,
      technique: this.name,
      confidence: 0.85,
      timeTaken: 0,
      qualityScore: 0.85,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    if (taskType === TaskType.Debug) return 85;
    return 75;
  }
  
  private filterByContext(files: FileInfo[], task: string, context: OptimizationContext): FileInfo[] {
    const taskWords = task.toLowerCase().split(' ');
    
    return files.filter(file => {
      // Always include files mentioned in previous tasks
      if (context.previousTasks.some(prev => prev.includes(file.path))) {
        return true;
      }
      
      // Include files with relevant names
      if (taskWords.some(word => file.path.toLowerCase().includes(word))) {
        return true;
      }
      
      // Include files with relevant classes/functions
      if (file.classes?.some(cls => taskWords.some(word => cls.toLowerCase().includes(word)))) {
        return true;
      }
      
      return false;
    });
  }
  
  private extractRelevantSnippets(content: string, task: string): string[] {
    const lines = content.split('\n');
    const taskWords = task.toLowerCase().split(' ');
    const snippets: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      if (taskWords.some(word => lineLower.includes(word))) {
        // Include context around the relevant line
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length - 1, i + 1);
        const snippet = lines.slice(start, end + 1).join('\n');
        snippets.push(snippet);
      }
    }
    
    return snippets.slice(0, 10); // Limit number of snippets
  }
}

class StructuralOptimizationTechnique extends OptimizationTechnique {
  name = 'StructuralOptimization';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const structure = this.buildStructuralView(files, task);
    const tokens = this.estimateTokens(structure);
    
    return {
      content: structure,
      optimizedTokens: tokens,
      technique: this.name,
      confidence: 0.8,
      timeTaken: 0,
      qualityScore: 0.8,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    if (taskType === TaskType.Refactoring) return 90;
    return 70;
  }
  
  private buildStructuralView(files: FileInfo[], task: string): string {
    let content = `Structural view for: ${task}\n\n`;
    
    content += '## Project Structure\n';
    for (const file of files) {
      content += `${file.path} (${file.type})\n`;
      
      if (file.classes && file.classes.length > 0) {
        for (const cls of file.classes.slice(0, 3)) {
          content += `  └── ${cls}\n`;
        }
      }
      
      if (file.functions && file.functions.length > 0) {
        for (const func of file.functions.slice(0, 5)) {
          content += `      └── ${func}()\n`;
        }
      }
    }
    
    return content;
  }
}

class SemanticCompressionTechnique extends OptimizationTechnique {
  name = 'SemanticCompression';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const compressed = this.compressSemanticInfo(files, task);
    const tokens = this.estimateTokens(compressed);
    
    return {
      content: compressed,
      optimizedTokens: tokens,
      technique: this.name,
      confidence: 0.75,
      timeTaken: 0,
      qualityScore: 0.75,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    return 60; // Lower compatibility, more experimental
  }
  
  private compressSemanticInfo(files: FileInfo[], task: string): string {
    let content = `Semantic info for: ${task}\n\n`;
    
    const allClasses = files.flatMap(f => f.classes || []);
    const allFunctions = files.flatMap(f => f.functions || []);
    
    content += `Classes: ${allClasses.slice(0, 10).join(', ')}\n`;
    content += `Functions: ${allFunctions.slice(0, 15).join(', ')}\n`;
    
    // Compress by semantic similarity
    const relevantFiles = files.filter(f => 
      f.classes?.some(cls => task.toLowerCase().includes(cls.toLowerCase())) ||
      f.functions?.some(func => task.toLowerCase().includes(func.toLowerCase()))
    );
    
    for (const file of relevantFiles.slice(0, 3)) {
      content += `\n${file.path}: ${file.classes?.join(', ')} | ${file.functions?.slice(0, 5).join(', ')}\n`;
    }
    
    return content;
  }
}

class AdaptiveCachingTechnique extends OptimizationTechnique {
  name = 'AdaptiveCaching';
  
  async optimize(files: FileInfo[], task: string, context: OptimizationContext): Promise<OptimizationResult> {
    const cached = this.getCachedResult(task, context);
    if (cached) {
      return cached;
    }
    
    // Fallback to smart summarization
    const smartTechnique = new SmartSummarizationTechnique();
    const result = await smartTechnique.optimize(files, task, context);
    
    this.cacheResult(task, context, result);
    
    return {
      ...result,
      technique: this.name,
    };
  }
  
  getCompatibilityScore(taskType: TaskType, fileComplexity: number): number {
    return 50; // Lower priority, caching enhancement
  }
  
  private getCachedResult(task: string, context: OptimizationContext): OptimizationResult | null {
    // Mock caching - in real implementation would use persistent storage
    return null;
  }
  
  private cacheResult(task: string, context: OptimizationContext, result: OptimizationResult) {
    // Mock caching implementation
  }
}

// Supporting types

enum TaskType {
  Debug = 'debug',
  Implementation = 'implementation',
  Refactoring = 'refactoring',
  Testing = 'testing',
  General = 'general',
}

interface OptimizationHistory {
  totalOptimizations: number;
  techniques: Map<string, TechniqueHistory>;
}

interface TechniqueHistory {
  usageCount: number;
  averageScore: number;
  averageTokens: number;
}