import { DocumentationProvider, DocumentationResult, SearchOptions } from '../../interfaces/DocumentationProvider.js';

export class PythonDocumentationProvider extends DocumentationProvider {
  constructor() {
    super('https://docs.python.org');
  }
  
  async search(options: SearchOptions): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    try {
      const searchUrl = `${this.baseUrl}/3/search.html?q=${encodeURIComponent(options.query)}`;
      
      // Since we can't easily parse the Python docs search, provide fallback results
      return this.getFallbackResults(options);
    } catch (error) {
      console.warn('Python docs search failed:', error);
      return this.getFallbackResults(options);
    }
  }
  
  async getApiReference(
    language: string,
    framework?: string,
    symbol?: string
  ): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    if (language === 'python') {
      const searchQueries = [
        symbol ? `${symbol} Python` : 'Python API',
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
    
    if (language === 'python') {
      const exampleQueries = [
        topic ? `${topic} Python examples` : 'Python examples',
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
  
  private getFallbackResults(options: SearchOptions): DocumentationResult[] {
    const query = options.query.toLowerCase();
    const framework = options.framework?.toLowerCase();
    
    const pythonDocs: DocumentationResult[] = [
      {
        title: 'Python Standard Library',
        url: 'https://docs.python.org/3/library/index.html',
        content: 'Complete Python standard library reference',
        relevance: 0.8,
        source: 'Python Docs',
        tags: ['python', 'stdlib']
      },
      {
        title: 'Python Language Reference',
        url: 'https://docs.python.org/3/reference/index.html',
        content: 'Python language syntax and semantics',
        relevance: 0.7,
        source: 'Python Docs',
        tags: ['python', 'language']
      },
      {
        title: 'Python Tutorial',
        url: 'https://docs.python.org/3/tutorial/index.html',
        content: 'Official Python tutorial and examples',
        relevance: 0.6,
        source: 'Python Docs',
        tags: ['python', 'tutorial']
      }
    ];
    
    // Add framework-specific documentation
    if (framework === 'django') {
      pythonDocs.push({
        title: 'Django Documentation',
        url: 'https://docs.djangoproject.com/',
        content: 'Complete Django web framework documentation',
        relevance: 0.9,
        source: 'Django Docs',
        tags: ['django', 'web', 'framework']
      });
    }
    
    if (framework === 'flask') {
      pythonDocs.push({
        title: 'Flask Documentation',
        url: 'https://flask.palletsprojects.com/',
        content: 'Flask micro web framework documentation',
        relevance: 0.9,
        source: 'Flask Docs',
        tags: ['flask', 'web', 'framework']
      });
    }
    
    if (framework === 'fastapi') {
      pythonDocs.push({
        title: 'FastAPI Documentation',
        url: 'https://fastapi.tiangolo.com/',
        content: 'Modern, fast web framework for building APIs with Python',
        relevance: 0.9,
        source: 'FastAPI Docs',
        tags: ['fastapi', 'api', 'framework']
      });
    }
    
    // Add topic-specific documentation
    if (query.includes('async') || query.includes('asyncio')) {
      pythonDocs.push({
        title: 'Python asyncio',
        url: 'https://docs.python.org/3/library/asyncio.html',
        content: 'Asynchronous I/O, event loop, coroutines and tasks',
        relevance: 0.9,
        source: 'Python Docs',
        tags: ['python', 'async', 'asyncio']
      });
    }
    
    if (query.includes('dataclass') || query.includes('typing')) {
      pythonDocs.push({
        title: 'Python typing',
        url: 'https://docs.python.org/3/library/typing.html',
        content: 'Support for type hints and annotations',
        relevance: 0.8,
        source: 'Python Docs',
        tags: ['python', 'typing', 'annotations']
      });
    }
    
    if (query.includes('test') || query.includes('pytest')) {
      pythonDocs.push({
        title: 'pytest Documentation',
        url: 'https://docs.pytest.org/',
        content: 'Python testing framework documentation',
        relevance: 0.8,
        source: 'pytest Docs',
        tags: ['python', 'testing', 'pytest']
      });
    }
    
    return pythonDocs
      .filter(result => {
        return result.title.toLowerCase().includes(query) || 
               result.content.toLowerCase().includes(query) ||
               result.tags?.some(tag => query.includes(tag));
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.maxResults || 10);
  }
  
  protected async makeRequest(url: string, headers?: Record<string, string>): Promise<any> {
    try {
      return await super.makeRequest(url, headers);
    } catch (error) {
      console.warn(`Python docs request failed for ${url}:`, error);
      return { results: [] };
    }
  }
}