# Contributing to Xcode MCP Server

Thank you for your interest in contributing to the Xcode MCP Server! This project aims to provide 98% token savings for iOS/macOS development with Claude Code.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
3. **Install dependencies**: `npm install`
4. **Build the project**: `npm run build`
5. **Run tests**: `npm test`

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- TypeScript 5+
- Xcode 15+ (for testing)
- Claude Code

### Local Development
```bash
# Clone the repository
git clone https://github.com/PolyakPawel/mcp-for-code.git
cd mcp-for-code

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## 📋 Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write comprehensive tests
- Document public APIs
- Keep functions small and focused

### Commit Messages
Use conventional commits format:
```
type(scope): description

feat(optimizer): add extreme compression technique
fix(parser): handle empty project files
docs(readme): update installation instructions
test(utils): add dependency analyzer tests
```

### Pull Request Process

1. **Create a feature branch** from `main`
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following the style guide

3. **Add tests** for new functionality
```bash
npm test
```

4. **Update documentation** if needed

5. **Ensure linting passes**
```bash
npm run lint
```

6. **Create a pull request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots/examples if applicable

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
src/
├── __tests__/
│   ├── index.test.ts          # Main server tests
│   ├── utils/
│   │   ├── parser.test.ts     # Parser tests
│   │   └── optimizer.test.ts  # Optimizer tests
│   └── integration/
│       └── e2e.test.ts        # End-to-end tests
```

### Writing Tests
- Use Jest framework
- Test both happy and error paths
- Mock external dependencies
- Aim for >80% code coverage

## 🏗 Architecture

### Project Structure
```
src/
├── index.ts                    # Main MCP server
├── utils/
│   ├── xcode-parser.ts        # Xcode project parsing
│   ├── context-manager.ts     # Context optimization
│   └── dependency-analyzer.ts # Dependency analysis
├── optimization/
│   └── master-optimizer.ts    # Token optimization engine
└── __tests__/                 # Test files
```

### Key Components

1. **MCP Server** (`index.ts`)
   - Handles 8 main commands
   - Manages token statistics
   - Implements caching system

2. **Xcode Parser** (`utils/xcode-parser.ts`)
   - Parses .xcodeproj files
   - Analyzes Swift code
   - Extracts project metadata

3. **Context Manager** (`utils/context-manager.ts`)
   - Scores file relevance
   - Manages token budgets
   - Builds optimized context

4. **Master Optimizer** (`optimization/master-optimizer.ts`)
   - Implements 6 optimization techniques
   - Provides intelligent technique selection
   - Tracks performance metrics

## 🎯 Areas for Contribution

### High Priority
- **Optimization Techniques**: New token compression methods
- **Language Support**: Objective-C, SwiftUI improvements
- **Performance**: Faster project scanning and analysis
- **Documentation**: More examples and guides

### Medium Priority
- **Testing**: Additional test coverage
- **Error Handling**: Better error messages and recovery
- **Configuration**: More customization options
- **Integrations**: Support for other IDEs

### Low Priority
- **UI/UX**: Better command-line interface
- **Monitoring**: Advanced analytics
- **Platform Support**: Windows/Linux compatibility

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**:
   - OS version
   - Node.js version
   - Xcode version
   - Claude Code version

2. **Steps to reproduce**:
   - Exact commands used
   - Project structure
   - Expected vs actual behavior

3. **Logs and output**:
   - Error messages
   - Stack traces
   - Debug output

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Environment
- OS: macOS 14.0
- Node.js: 20.11.0
- Xcode: 15.2
- Claude Code: latest

## Steps to Reproduce
1. Run `/scan ./MyApp.xcodeproj`
2. See error...

## Expected Behavior
Should scan project successfully

## Actual Behavior
Error: Cannot read project file

## Additional Context
- Project size: 50 files
- Swift version: 5.9
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Describe the use case** clearly
3. **Explain the benefit** to users
4. **Consider implementation complexity**

### Feature Request Template
```markdown
## Feature Description
Brief description of the proposed feature

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Any alternative approaches considered?

## Additional Context
Mockups, examples, or related issues
```

## 🔐 Security

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. **Email**: security@your-domain.com
3. **Include**: Detailed description and steps to reproduce
4. **Wait**: For acknowledgment before public disclosure

## 📄 Documentation

### Updating Documentation
- Update README.md for user-facing changes
- Update API docs for code changes
- Add examples for new features
- Keep inline comments current

### Documentation Standards
- Use clear, concise language
- Include code examples
- Provide troubleshooting tips
- Keep formatting consistent

## 🏆 Recognition

Contributors will be:
- Added to the CONTRIBUTORS.md file
- Mentioned in release notes
- Invited to join the core team (for significant contributions)

## 📞 Getting Help

Need help contributing?

- **GitHub Discussions**: Ask questions and get help
- **GitHub Issues**: Report bugs and request features
- **Email**: pawel@your-domain.com

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make iOS/macOS development more efficient! 🎯