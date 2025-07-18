export interface DocumentationResult {
  title: string;
  url: string;
  content: string;
  relevance: number;
  source: string;
  lastUpdated?: Date;
  tags?: string[];
}

export interface SearchOptions {
  query: string;
  language?: string;
  framework?: string;
  maxResults?: number;
  includeExamples?: boolean;
  includeAPI?: boolean;
  includeTutorials?: boolean;
}

export abstract class DocumentationProvider {
  protected baseUrl: string;
  protected apiKey?: string;
  
  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  abstract search(options: SearchOptions): Promise<DocumentationResult[]>;
  abstract getApiReference(
    language: string,
    framework?: string,
    symbol?: string
  ): Promise<DocumentationResult[]>;
  abstract getExamples(
    language: string,
    framework?: string,
    topic?: string
  ): Promise<DocumentationResult[]>;
  
  protected async makeRequest(url: string, headers?: Record<string, string>): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Universal-Development-MCP/1.0',
        ...headers,
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });
    
    if (!response.ok) {
      throw new Error(`Documentation API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}