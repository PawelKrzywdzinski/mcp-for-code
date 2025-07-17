import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface XcodeProject {
  name: string;
  path: string;
  targets: XcodeTarget[];
  configurations: string[];
  files: ProjectFile[];
  buildSettings: Record<string, any>;
  infoPlist?: Record<string, any>;
}

export interface XcodeTarget {
  name: string;
  type: string;
  bundleId: string;
  deploymentTarget: string;
  files: string[];
  buildSettings: Record<string, any>;
}

export interface ProjectFile {
  path: string;
  name: string;
  type: FileType;
  size: number;
  lastModified: Date;
  content?: string;
  imports?: string[];
  classes?: string[];
  functions?: string[];
  complexity?: number;
}

export enum FileType {
  Swift = 'swift',
  ObjC = 'objc',
  ObjCHeader = 'objc-header',
  Storyboard = 'storyboard',
  XIB = 'xib',
  Plist = 'plist',
  JSON = 'json',
  Image = 'image',
  Other = 'other'
}

export class XcodeProjectParser {
  private projectPath: string;
  private projectName: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.projectName = path.basename(projectPath, '.xcodeproj');
  }

  async parse(): Promise<XcodeProject> {
    const project: XcodeProject = {
      name: this.projectName,
      path: this.projectPath,
      targets: [],
      configurations: ['Debug', 'Release'],
      files: [],
      buildSettings: {}
    };

    try {
      await this.parseProjectStructure(project);
      await this.analyzeProjectFiles(project);
      await this.parseInfoPlist(project);
    } catch (error) {
      console.error('Error parsing Xcode project:', error);
      // Return minimal structure if parsing fails
      project.targets = [{ 
        name: this.projectName, 
        type: 'application', 
        bundleId: `com.example.${this.projectName}`,
        deploymentTarget: '15.0',
        files: [],
        buildSettings: {}
      }];
    }

    return project;
  }

  private async parseProjectStructure(project: XcodeProject) {
    const pbxprojPath = path.join(this.projectPath, 'project.pbxproj');
    
    try {
      const pbxContent = await fs.readFile(pbxprojPath, 'utf8');
      const lines = pbxContent.split('\n');
      
      for (const line of lines) {
        if (line.includes('PBXNativeTarget')) {
          const targetMatch = line.match(/name = "([^"]+)"/);
          if (targetMatch) {
            const target: XcodeTarget = {
              name: targetMatch[1],
              type: 'application',
              bundleId: `com.example.${targetMatch[1]}`,
              deploymentTarget: '15.0',
              files: [],
              buildSettings: {}
            };
            project.targets.push(target);
          }
        }
      }
    } catch (error) {
      // If we can't read the project file, create a default target
      project.targets = [{ 
        name: this.projectName, 
        type: 'application', 
        bundleId: `com.example.${this.projectName}`,
        deploymentTarget: '15.0',
        files: [],
        buildSettings: {}
      }];
    }
  }

  private async analyzeProjectFiles(project: XcodeProject) {
    const projectDir = path.dirname(this.projectPath);
    const patterns = [
      '**/*.swift',
      '**/*.m',
      '**/*.h',
      '**/*.storyboard',
      '**/*.xib',
      '**/*.plist',
      '**/*.json'
    ];

    try {
      for (const pattern of patterns) {
        const files = await glob(pattern, { 
          cwd: projectDir,
          ignore: ['**/build/**', '**/DerivedData/**', '**/Pods/**', '**/node_modules/**']
        });

        for (const filePath of files.slice(0, 50)) { // Limit to prevent overwhelming
          const fullPath = path.join(projectDir, filePath);
          const file = await this.analyzeFile(fullPath, filePath);
          if (file) {
            project.files.push(file);
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing project files:', error);
    }
  }

  private async analyzeFile(fullPath: string, relativePath: string): Promise<ProjectFile | null> {
    try {
      const stats = await fs.stat(fullPath);
      const fileType = this.getFileType(fullPath);
      
      const file: ProjectFile = {
        path: relativePath,
        name: path.basename(fullPath),
        type: fileType,
        size: stats.size,
        lastModified: stats.mtime,
        imports: [],
        classes: [],
        functions: [],
        complexity: 0
      };

      if (fileType === FileType.Swift && stats.size < 100000) { // Only analyze reasonably sized files
        await this.analyzeSwiftFile(fullPath, file);
      }

      return file;
    } catch (error) {
      console.error(`Error analyzing file ${fullPath}:`, error);
      return null;
    }
  }

  private async analyzeSwiftFile(filePath: string, file: ProjectFile) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      file.content = content;

      // Extract imports
      const importMatches = content.match(/import\s+\w+/g);
      if (importMatches) {
        file.imports = importMatches.map(imp => imp.replace('import ', ''));
      }

      // Extract classes, structs, enums
      const classMatches = content.match(/(?:class|struct|enum)\s+(\w+)/g);
      if (classMatches) {
        file.classes = classMatches.map(cls => cls.split(' ')[1]);
      }

      // Extract functions
      const functionMatches = content.match(/func\s+(\w+)/g);
      if (functionMatches) {
        file.functions = functionMatches.map(func => func.replace('func ', ''));
      }

      // Calculate complexity
      file.complexity = this.calculateComplexity(content);
    } catch (error) {
      console.error(`Error analyzing Swift file ${filePath}:`, error);
    }
  }

  private calculateComplexity(content: string): number {
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'guard', 'catch'
    ];
    
    let complexity = 1;
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private getFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.swift': return FileType.Swift;
      case '.m': return FileType.ObjC;
      case '.h': return FileType.ObjCHeader;
      case '.storyboard': return FileType.Storyboard;
      case '.xib': return FileType.XIB;
      case '.plist': return FileType.Plist;
      case '.json': return FileType.JSON;
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg': return FileType.Image;
      default: return FileType.Other;
    }
  }

  private async parseInfoPlist(project: XcodeProject) {
    const infoPlistPath = path.join(
      path.dirname(this.projectPath),
      this.projectName,
      'Info.plist'
    );

    try {
      const plistContent = await fs.readFile(infoPlistPath, 'utf8');
      // Simple plist parsing - in production would use proper plist parser
      project.infoPlist = { bundleIdentifier: `com.example.${this.projectName}` };
    } catch (error) {
      // Info.plist not found or not readable
      project.infoPlist = { bundleIdentifier: `com.example.${this.projectName}` };
    }
  }
}