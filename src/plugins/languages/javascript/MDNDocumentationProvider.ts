import { DocumentationProvider, DocumentationResult, SearchOptions } from '../../interfaces/DocumentationProvider.js';

export class MDNDocumentationProvider extends DocumentationProvider {
  constructor() {
    super('https://developer.mozilla.org');
  }
  
  async search(options: SearchOptions): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    try {
      const searchUrl = `${this.baseUrl}/en-US/search?q=${encodeURIComponent(options.query)}`;
      const response = await this.makeRequest(searchUrl);
      
      if (response.documents) {
        for (const doc of response.documents.slice(0, options.maxResults || 10)) {
          results.push({
            title: doc.title,
            url: `${this.baseUrl}${doc.mdn_url}`,
            content: doc.summary || '',
            relevance: this.calculateRelevance(doc, options),
            source: 'MDN',
            lastUpdated: new Date(doc.last_edit),
            tags: doc.tags || []
          });
        }
      }
    } catch (error) {
      console.warn('MDN search failed:', error);
      
      return this.getFallbackResults(options);
    }
    
    return results;
  }
  
  async getApiReference(
    language: string,
    framework?: string,
    symbol?: string
  ): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      const searchQueries = [
        symbol ? `${symbol} JavaScript` : 'JavaScript API',
        framework ? `${framework} ${symbol || 'API'}` : null
      ].filter(Boolean);
      
      for (const query of searchQueries) {
        const searchResults = await this.search({
          query: query!,
          language,
          framework,
          maxResults: 5,
          includeAPI: true
        });
        results.push(...searchResults);
      }
    }
    
    return results;
  }
  
  async getExamples(
    language: string,
    framework?: string,
    topic?: string
  ): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    if (language === 'javascript' || language === 'typescript') {
      const exampleQueries = [
        topic ? `${topic} JavaScript examples` : 'JavaScript examples',
        framework ? `${framework} examples` : null
      ].filter(Boolean);
      
      for (const query of exampleQueries) {
        const searchResults = await this.search({
          query: query!,
          language,
          framework,
          maxResults: 3,
          includeExamples: true
        });
        results.push(...searchResults);
      }
    }
    
    return results;
  }
  
  private calculateRelevance(doc: any, options: SearchOptions): number {
    let relevance = 0.5;
    
    if (doc.title.toLowerCase().includes(options.query.toLowerCase())) {
      relevance += 0.3;
    }
    
    if (doc.summary && doc.summary.toLowerCase().includes(options.query.toLowerCase())) {
      relevance += 0.2;
    }
    
    if (options.language === 'javascript' && doc.mdn_url.includes('/JavaScript/')) {
      relevance += 0.2;
    }
    
    if (options.framework) {
      const frameworkKeywords = this.getFrameworkKeywords(options.framework);
      for (const keyword of frameworkKeywords) {
        if (doc.title.toLowerCase().includes(keyword) || 
            (doc.summary && doc.summary.toLowerCase().includes(keyword))) {
          relevance += 0.1;
        }
      }
    }
    
    if (options.includeExamples && doc.mdn_url.includes('/Examples')) {
      relevance += 0.15;
    }
    
    if (options.includeAPI && doc.mdn_url.includes('/Reference/')) {
      relevance += 0.15;
    }
    
    return Math.min(relevance, 1.0);
  }
  
  private getFrameworkKeywords(framework: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'react': ['react', 'jsx', 'component', 'hook', 'state'],
      'vue': ['vue', 'vuejs', 'component', 'directive', 'reactive'],
      'angular': ['angular', 'typescript', 'component', 'service', 'directive'],
      'svelte': ['svelte', 'component', 'reactive', 'store'],
      'express': ['express', 'nodejs', 'server', 'middleware', 'route'],
      'fastify': ['fastify', 'nodejs', 'server', 'plugin', 'hook']
    };
    
    return keywordMap[framework.toLowerCase()] || [];
  }
  
  private getFallbackResults(options: SearchOptions): DocumentationResult[] {
    const fallbackResults: DocumentationResult[] = [];
    
    const commonJavaScriptTopics = [
      {
        title: 'JavaScript Reference',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
        content: 'Complete JavaScript language reference',
        relevance: 0.8
      },
      {
        title: 'Web APIs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API',
        content: 'Web API reference documentation',
        relevance: 0.7
      },
      {
        title: 'JavaScript Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        content: 'JavaScript programming guide and tutorials',
        relevance: 0.6
      }
    ];
    
    return commonJavaScriptTopics
      .filter(result => {
        const query = options.query.toLowerCase();
        return result.title.toLowerCase().includes(query) || 
               result.content.toLowerCase().includes(query);
      })
      .map(result => ({
        ...result,
        source: 'MDN',
        tags: ['javascript', 'reference']
      }));
  }
  
  protected async makeRequest(url: string, headers?: Record<string, string>): Promise<any> {
    try {
      return await super.makeRequest(url, headers);
    } catch (error) {
      console.warn(`MDN request failed for ${url}:`, error);
      return { documents: [] };
    }
  }
}