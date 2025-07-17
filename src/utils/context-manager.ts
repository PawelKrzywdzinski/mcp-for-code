import { ProjectFile } from './xcode-parser.js';

export class ContextManager {
  private maxTokens: number;
  private tokenPerChar: number = 0.25;

  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
  }

  async selectRelevantFiles(
    files: ProjectFile[],
    task: string,
    filePattern?: string
  ): Promise<ProjectFile[]> {
    let relevantFiles = files;

    if (filePattern) {
      const patterns = filePattern.split(',').map(p => p.trim());
      relevantFiles = relevantFiles.filter(file => 
        patterns.some(pattern => this.matchesPattern(file.path, pattern))
      );
    }

    const scoredFiles = relevantFiles.map(file => ({
      file,
      score: this.calculateRelevanceScore(file, task)
    }));

    scoredFiles.sort((a, b) => b.score - a.score);

    const selectedFiles: ProjectFile[] = [];
    let currentTokens = 0;

    for (const { file } of scoredFiles) {
      const fileTokens = this.estimateTokens(file);
      
      if (currentTokens + fileTokens <= this.maxTokens) {
        selectedFiles.push(file);
        currentTokens += fileTokens;
      }
    }

    return selectedFiles;
  }

  private calculateRelevanceScore(file: ProjectFile, task: string): number {
    let score = 0;
    const taskLower = task.toLowerCase();

    // File type scoring
    switch (file.type) {
      case 'swift': score += 10; break;
      case 'storyboard': score += 5; break;
      case 'objc': score += 8; break;
      case 'objc-header': score += 6; break;
      case 'plist': score += 3; break;
      case 'json': score += 2; break;
      default: score += 1;
    }

    // File name relevance
    if (file.name.toLowerCase().includes(taskLower)) {
      score += 20;
    }

    // Content relevance
    if (file.content) {
      const contentLower = file.content.toLowerCase();
      const taskWords = taskLower.split(' ');
      
      for (const word of taskWords) {
        if (word.length > 2) {
          const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
          score += occurrences * 2;
        }
      }
    }

    // Class name relevance
    if (file.classes) {
      for (const className of file.classes) {
        if (className.toLowerCase().includes(taskLower)) {
          score += 15;
        }
      }
    }

    // Function name relevance
    if (file.functions) {
      for (const funcName of file.functions) {
        if (funcName.toLowerCase().includes(taskLower)) {
          score += 10;
        }
      }
    }

    // Complexity penalty (prefer simpler files for better understanding)
    if (file.complexity && file.complexity > 10) {
      score -= file.complexity * 0.5;
    }

    return score;
  }

  private estimateTokens(file: ProjectFile): number {
    let tokens = 20; // Base tokens for file metadata
    
    if (file.content) {
      tokens += file.content.length * this.tokenPerChar;
    } else {
      tokens += file.size * this.tokenPerChar * 0.1; // Estimate if no content
    }
    
    return Math.ceil(tokens);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(regexPattern).test(filePath);
  }

  buildContext(files: ProjectFile[], task: string): string {
    let context = `# Context for task: ${task}\n\n`;
    
    context += `## Project Structure\n`;
    context += `Selected ${files.length} relevant files:\n\n`;
    
    for (const file of files) {
      context += `### ${file.name} (${file.type})\n`;
      context += `Path: ${file.path}\n`;
      
      if (file.classes && file.classes.length > 0) {
        context += `Classes: ${file.classes.join(', ')}\n`;
      }
      
      if (file.functions && file.functions.length > 0) {
        context += `Functions: ${file.functions.slice(0, 5).join(', ')}`;
        if (file.functions.length > 5) context += '...';
        context += '\n';
      }
      
      if (file.content) {
        // Truncate very long content
        let content = file.content;
        if (content.length > 2000) {
          content = content.substring(0, 2000) + '\n... (truncated)';
        }
        context += `\n\`\`\`${file.type}\n${content}\n\`\`\`\n\n`;
      }
    }
    
    return context;
  }
}