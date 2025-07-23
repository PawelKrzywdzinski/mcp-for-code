# 🚀 Universal Development MCP Server

**98% Token Savings** for ALL programming languages with Claude Code

[![CI](https://github.com/PawelKrzywdzinski/mcp-for-code/actions/workflows/ci.yml/badge.svg)](https://github.com/PawelKrzywdzinski/mcp-for-code/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/universal-dev-mcp-server.svg)](https://badge.fury.io/js/universal-dev-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌐 Universal Language Support

Now supports **ALL major programming languages** through a powerful plugin architecture:

- **JavaScript/TypeScript** (React, Vue, Angular, Node.js, Express, Next.js)
- **Python** (Django, Flask, FastAPI, Data Science, ML)
- **Java** (Spring Boot, Maven, Gradle)
- **Go** (Gin, Echo, Modules)
- **Rust** (Cargo, Tokio, Actix)
- **Swift/Objective-C** (iOS, macOS, Xcode)
- **C/C++** (CMake, Make)
- **And more...**

## ⚡ One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/PawelKrzywdzinski/mcp-for-code/main/install-universal.sh | sh
```

## 🚀 Quick Start

```bash
# Scan any project type - NOW with auto-documentation!
/scan ./my-react-app level=extreme
/scan ./my-python-project level=extreme
/scan ./MyApp.xcodeproj level=extreme

# ✨ NEW: Auto-creates comprehensive workspace:
# ├── 📄 README.md (enhanced)
# ├── 📁 .claude-mcp/
# │   ├── 📚 API_DOCS.md
# │   ├── 🛠️ DEVELOPMENT_GUIDE.md
# │   └── ⚙️ project-context.json

# Get context for any language
/context ./my-node-project "implement REST API" tokens=800 mode=fast
/context ./my-django-app "fix authentication bug" tokens=1000 mode=balance

# Extreme optimization for any codebase
/optimize ./my-go-service "optimize database queries" target=300 mode=speed

# Check your savings
/stats detailed=true
```

## 📊 Results Across All Languages

| Language | Without Optimization | With Optimization | Savings |
|----------|---------------------|------------------|---------|
| JavaScript/TypeScript | 52,000 tokens ($15.60) | 1,040 tokens ($0.31) | **98.0%** |
| Python | 48,000 tokens ($14.40) | 960 tokens ($0.29) | **98.0%** |
| Java | 65,000 tokens ($19.50) | 1,300 tokens ($0.39) | **98.0%** |
| Go | 42,000 tokens ($12.60) | 840 tokens ($0.25) | **98.0%** |
| Swift/Objective-C | 47,000 tokens ($14.10) | 650 tokens ($0.20) | **98.6%** |

## 🔧 Universal Commands

### Main Commands
- `/scan <path>` - Scan any project type with auto-detection
- `/context <path> <task>` - Get optimized context for any language
- `/optimize <path> <task>` - Extreme token optimization
- `/docs <path>` - Generate documentation for any project
- `/deps <path>` - Analyze dependencies (npm, pip, cargo, maven, etc.)
- `/search <query>` - Search documentation for any language/framework
- `/stats` - Token usage statistics
- `/limits` - Manage token limits
- `/plugins` - List available language plugins

### Language Detection
The system automatically detects project types:
- **package.json** → JavaScript/TypeScript
- **requirements.txt, pyproject.toml** → Python
- **pom.xml, build.gradle** → Java
- **go.mod** → Go
- **Cargo.toml** → Rust
- **.xcodeproj** → Swift/Objective-C

## 💡 Language-Specific Examples

### React/Node.js Project
```bash
/scan ./my-react-app level=extreme
/context ./my-react-app "implement user authentication with JWT" tokens=1000 mode=balance
# Result: 94% token savings, React-specific context scoring
```

### Python Django Project
```bash
/scan ./my-django-project level=extreme  
/optimize ./my-django-project "fix database N+1 queries" target=250 mode=speed
# Result: 97% token savings, Django-aware optimization
```

### Go Microservice
```bash
/scan ./my-go-service level=extreme
/context ./my-go-service "implement gRPC endpoints" tokens=800 mode=fast
# Result: 95% token savings, Go module analysis
```

### Java Spring Boot
```bash
/scan ./my-spring-app level=extreme
/deps ./my-spring-app check=true
# Result: Maven/Gradle dependency analysis with update suggestions
```

## 📈 Advanced Features

### Plugin Architecture
- **Language Plugins** - Modular support for each language
- **Smart Detection** - Auto-identifies project type and language
- **Context Scoring** - Language-specific relevance algorithms
- **Documentation Providers** - MDN, Python docs, Go docs, etc.

### Universal Optimization
- **6 Optimization Techniques** - Works across all languages
- **Smart Caching** - Language-agnostic project caching
- **Token Tracking** - Universal usage monitoring
- **Dependency Analysis** - Supports all major package managers

### Framework Support
- **Frontend**: React, Vue, Angular, Svelte
- **Backend**: Express, Django, Flask, Spring Boot, Gin
- **Mobile**: iOS, Android, React Native, Flutter
- **Desktop**: Electron, Tauri, Qt

## 🎯 How It Works

1. **Auto-Detection** - Identifies project language and framework
2. **Plugin Selection** - Chooses appropriate language plugin
3. **Smart Analysis** - Uses language-specific parsing and scoring
4. **Universal Optimization** - Applies cross-language token compression
5. **Context Generation** - Provides optimized, relevant code context

## 🔍 Universal Statistics

**After each command:**
```
💰 Saved: 46,350 tokens (98.6%) | Cost: $1.39 | Language: TypeScript | Remaining: 37,550 tokens today
```

**Full stats with `/stats detailed=true`:**
```
┌─────────────────────── 📊 UNIVERSAL MCP DASHBOARD ────────────────────────┐
│ 📅 Daily Usage:       3,785 / 50,000 tokens │
│ 🔋 Daily Remaining:  46,215 tokens (92.4%) │
│ 💰 Tokens Saved:    523,150 tokens │
│ 💵 Money Saved:      $156.95 USD │
├─────────────────────── 🔌 PLUGIN STATUS ──────────────────────────┤
│ 🔹 Active Plugins:   6 │
│ 🔹 Supported Languages: javascript, python, java, go, rust, swift │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔌 Plugin System

### List Available Plugins
```bash
/plugins
# Shows all supported languages and their capabilities

/plugins language=python
# Filter by specific language
```

### Plugin Information
Each plugin provides:
- **Language-specific parsing** (AST analysis, imports, exports)
- **Context scoring** (relevance algorithms for each language)
- **Dependency analysis** (package managers: npm, pip, cargo, etc.)
- **Documentation search** (language-specific docs)

## ⚙️ Configuration

### Universal MCP Configuration
```json
{
  "mcpServers": {
    "universal-dev": {
      "command": "npx",
      "args": ["universal-dev-mcp-server"]
    }
  }
}
```

### Legacy Xcode Support
```json
{
  "mcpServers": {
    "xcode-legacy": {
      "command": "npx", 
      "args": ["universal-dev-mcp-server", "--legacy-xcode"]
    }
  }
}
```

## 🛠 Requirements

- **Node.js 18+**
- **Claude Code**
- **Any supported development environment**

## 📋 Manual Installation

```bash
# 1. Clone and install
git clone https://github.com/PawelKrzywdzinski/mcp-for-code.git
cd mcp-for-code
npm install && npm run build && npm install -g .

# 2. Configure Claude Code
mkdir -p ~/.config/claude-code
echo '{"mcpServers":{"universal-dev":{"command":"universal-dev-mcp-server","args":[]}}}' > ~/.config/claude-code/mcp.json

# 3. Test with any project
universal-dev-mcp-server --help
```

## 🌟 Migration from Xcode MCP

Existing users get **backward compatibility**:

```bash
# Old Xcode commands still work
/scan ./MyApp.xcodeproj level=extreme

# New universal commands
/scan ./my-react-app level=extreme
/scan ./my-python-project level=extreme
```

## 📚 Advanced Usage

### Multi-Language Projects
```bash
# Scan a monorepo with multiple languages
/scan ./monorepo level=extreme
# Auto-detects: frontend (React), backend (Python), mobile (Swift)
```

### Language-Specific Optimization
```bash
# Python-specific context
/context ./django-app "implement async views" tokens=800 mode=balance

# JavaScript-specific context  
/context ./react-app "optimize bundle size" tokens=600 mode=fast

# Go-specific context
/context ./go-service "implement middleware" tokens=500 mode=speed
```

### Cross-Language Documentation
```bash
# Search documentation for any language
/search "async programming" language=python
/search "middleware patterns" language=go  
/search "component lifecycle" framework=react
```

## 🆕 Auto-Documentation & Fast Session Startup

### Comprehensive Project Workspace
When you first scan a project, MCP now automatically creates:

- **📄 Enhanced README.md** - Complete project overview
- **📁 .claude-mcp/ workspace** with:
  - **📚 API_DOCS.md** - Auto-generated API documentation
  - **🛠️ DEVELOPMENT_GUIDE.md** - MCP-optimized workflow guide
  - **⚙️ project-context.json** - Session restoration data

### Lightning-Fast Subsequent Sessions
```bash
# First scan: Creates complete workspace
/scan ./my-project level=extreme
# ✅ README.md (Enhanced)
# ✅ .claude-mcp/API_DOCS.md  
# ✅ .claude-mcp/DEVELOPMENT_GUIDE.md
# ✅ .claude-mcp/project-context.json

# Later sessions: Instant restoration
/scan ./my-project level=extreme
# 🔄 Session restored - Workspace ready!
# 📁 Documentation: Available
# ⚡ Context: Pre-loaded
```

### Intelligent Documentation Generation
```bash
# Language-aware documentation
/docs ./swift-app type=readme     # Swift-optimized README
/docs ./python-api type=all       # Python API docs + guides
/docs ./react-app type=readme     # React component documentation
```

## 🚀 Getting Started

1. **Install** with one command  
2. **Scan** any project type
3. **Start** saving tokens immediately

```bash
curl -fsSL https://raw.githubusercontent.com/PawelKrzywdzinski/mcp-for-code/main/install-universal.sh | sh
/scan ./your-project level=extreme
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Pull requests welcome! We especially need:
- **New language plugins** (Ruby, PHP, C#, Kotlin, etc.)
- **Framework support** (Laravel, Rails, .NET, etc.)  
- **Package manager integrations**

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📞 Support

- [GitHub Issues](https://github.com/PawelKrzywdzinski/mcp-for-code/issues)
- [Documentation](https://github.com/PawelKrzywdzinski/mcp-for-code/wiki)
- [Discussions](https://github.com/PawelKrzywdzinski/mcp-for-code/discussions)

---

**Start saving tokens across ALL your projects today!** 🎯

```bash
curl -fsSL https://raw.githubusercontent.com/PawelKrzywdzinski/mcp-for-code/main/install-universal.sh | sh
```

## ☕ Support the Project

If this tool saved you time and tokens, consider buying me a coffee (or cigarettes... or a shiny new MacBook) 😄

[![PayPal](https://img.shields.io/badge/PayPal-Support-blue.svg?logo=paypal)](https://www.paypal.com/paypalme/PawelKrzywdzinski)

*Every donation helps fuel late-night coding sessions and keeps the token optimization algorithms running smooth! ☕🚬💻*