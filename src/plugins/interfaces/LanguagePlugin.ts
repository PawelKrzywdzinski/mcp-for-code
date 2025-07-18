import { ProjectParser } from './ProjectParser.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { ContextScorer } from './ContextScorer.js';
import { DocumentationProvider } from './DocumentationProvider.js';

export interface LanguagePlugin {
  readonly name: string;
  readonly displayName: string;
  readonly fileExtensions: string[];
  readonly projectFilePatterns: string[];
  readonly configFiles: string[];
  readonly buildFiles: string[];
  
  readonly parser: ProjectParser;
  readonly dependencyAnalyzer: DependencyAnalyzer;
  readonly contextScorer: ContextScorer;
  readonly documentationProvider?: DocumentationProvider;
  
  isApplicable(projectPath: string): Promise<boolean>;
  getProjectType(): string;
  getPriority(): number;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  supportedLanguages: string[];
  dependencies?: string[];
}