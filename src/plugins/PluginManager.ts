import { LanguagePlugin, PluginMetadata } from './interfaces/LanguagePlugin.js';
import { ProjectStructure } from './interfaces/ProjectParser.js';

export class PluginManager {
  private plugins: Map<string, LanguagePlugin> = new Map();
  private pluginMetadata: Map<string, PluginMetadata> = new Map();
  
  async registerPlugin(plugin: LanguagePlugin, metadata: PluginMetadata): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
    this.pluginMetadata.set(plugin.name, metadata);
  }
  
  getPlugin(name: string): LanguagePlugin | undefined {
    return this.plugins.get(name);
  }
  
  getAllPlugins(): LanguagePlugin[] {
    return Array.from(this.plugins.values());
  }
  
  getPluginMetadata(name: string): PluginMetadata | undefined {
    return this.pluginMetadata.get(name);
  }
  
  async detectApplicablePlugins(projectPath: string): Promise<LanguagePlugin[]> {
    const applicablePlugins: LanguagePlugin[] = [];
    
    for (const plugin of this.plugins.values()) {
      try {
        if (await plugin.isApplicable(projectPath)) {
          applicablePlugins.push(plugin);
        }
      } catch (error) {
        console.warn(`Plugin ${plugin.name} failed applicability check:`, error);
      }
    }
    
    return applicablePlugins.sort((a, b) => b.getPriority() - a.getPriority());
  }
  
  async detectPrimaryPlugin(projectPath: string): Promise<LanguagePlugin | null> {
    const applicablePlugins = await this.detectApplicablePlugins(projectPath);
    return applicablePlugins.length > 0 ? applicablePlugins[0] : null;
  }
  
  async analyzeProject(projectPath: string): Promise<ProjectStructure | null> {
    const primaryPlugin = await this.detectPrimaryPlugin(projectPath);
    
    if (!primaryPlugin) {
      throw new Error(`No applicable plugin found for project at ${projectPath}`);
    }
    
    return await primaryPlugin.parser.parseProject(projectPath);
  }
  
  getPluginsByLanguage(language: string): LanguagePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => {
      const metadata = this.pluginMetadata.get(plugin.name);
      return metadata?.supportedLanguages.includes(language.toLowerCase());
    });
  }
  
  getPluginsByFileExtension(extension: string): LanguagePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.fileExtensions.includes(extension)
    );
  }
  
  async validatePlugin(plugin: LanguagePlugin): Promise<boolean> {
    try {
      if (!plugin.name || !plugin.parser || !plugin.dependencyAnalyzer || !plugin.contextScorer) {
        return false;
      }
      
      if (!Array.isArray(plugin.fileExtensions) || plugin.fileExtensions.length === 0) {
        return false;
      }
      
      if (typeof plugin.isApplicable !== 'function') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  unregisterPlugin(name: string): boolean {
    const removed = this.plugins.delete(name);
    this.pluginMetadata.delete(name);
    return removed;
  }
  
  clear(): void {
    this.plugins.clear();
    this.pluginMetadata.clear();
  }
  
  getStats(): { totalPlugins: number; pluginNames: string[] } {
    return {
      totalPlugins: this.plugins.size,
      pluginNames: Array.from(this.plugins.keys())
    };
  }
}