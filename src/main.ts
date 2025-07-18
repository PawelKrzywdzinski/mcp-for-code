#!/usr/bin/env node

import { UniversalMCPServer } from './UniversalMCPServer.js';

// CLI handling
function showVersion() {
  console.log('universal-dev-mcp-server version 2.0.0');
  console.log('98% Token Savings for Universal Development with Claude Code');
  console.log('Supports: JavaScript, TypeScript, Python, Java, Go, Rust, Swift, and more');
}

function showHelp() {
  console.log(`
🚀 Universal Development MCP Server v2.0.0

This is an MCP (Model Context Protocol) server for Claude Code.
It provides 98% token savings for any development environment.

Usage:
  universal-dev-mcp [options]

Options:
  --version, -v    Show version information
  --help, -h       Show this help message

Supported Languages:
  • JavaScript/TypeScript (React, Vue, Angular, Node.js)
  • Python (Django, Flask, FastAPI, Data Science)
  • Java (Spring, Maven, Gradle)
  • Go (Modules, Gin, Echo)
  • Rust (Cargo, Tokio, Actix)
  • Swift/Objective-C (iOS, macOS, Xcode)
  • And more through plugin system

MCP Server Commands (use within Claude Code):
  /scan <project>     Scan and analyze any project type
  /context <project>  Get optimized context for development
  /optimize <project> Optimize token usage with advanced algorithms
  /docs <project>     Generate intelligent documentation
  /deps <project>     Analyze project dependencies across all package managers
  /search <query>     Search documentation for any language/framework
  /stats             Show token usage statistics
  /limits            Show current token limits
  /plugins           List available language plugins

Installation:
  This server should be configured in your Claude Code MCP settings.
  It runs as a background process and communicates via stdio.

Example MCP Configuration:
{
  "mcpServers": {
    "universal-dev": {
      "command": "npx",
      "args": ["universal-dev-mcp-server"]
    }
  }
}

For more information, visit:
  https://github.com/PawelKrzywdzinski/mcp-for-code
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  showVersion();
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// If no CLI args, run as MCP server
if (args.length === 0) {
  const server = new UniversalMCPServer();
  server.run().catch(console.error);
} else {
  // Handle unknown arguments
  console.error('Unknown arguments:', args.join(' '));
  console.error('Use --help for usage information');
  process.exit(1);
}