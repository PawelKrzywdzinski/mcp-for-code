# Contributing to MCP for Code

Thank you for your interest in contributing to MCP for Code! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/mcp-for-code.git
   cd mcp-for-code
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy the example configuration:
   ```bash
   cp config.example.json config.json
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Run tests to ensure everything is working:
   ```bash
   npm test
   ```

### Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure they follow the coding standards:
   ```bash
   npm run lint
   npm run format
   ```

3. Write tests for your changes:
   ```bash
   npm test
   ```

4. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: add new code analysis tool"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a pull request on GitHub

## Project Structure

```
mcp-for-code/
├── src/
│   ├── index.ts           # Main MCP server entry point
│   ├── tools/             # Individual tool implementations
│   ├── utils/             # Utility functions
│   └── __tests__/         # Test files
├── docs/                  # Documentation
├── examples/              # Usage examples
├── config.example.json    # Example configuration
└── README.md
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all code
- Follow the existing code style (enforced by ESLint and Prettier)
- Include type annotations for function parameters and return types
- Use interfaces for complex object types
- Prefer `const` over `let` when possible

### Code Quality

- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names
- Follow the single responsibility principle

### Testing

- Write unit tests for all new functionality
- Aim for at least 80% code coverage
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies

Example test structure:
```typescript
describe('CodeAnalyzer', () => {
  describe('analyzeComplexity', () => {
    it('should calculate complexity correctly for simple functions', () => {
      // Test implementation
    });
  });
});
```

## Pull Request Guidelines

### Before Submitting

- Ensure all tests pass: `npm test`
- Ensure code follows style guidelines: `npm run lint`
- Update documentation if needed
- Add or update tests for your changes

### Pull Request Description

Please include:
- A clear description of the changes
- The motivation for the changes
- Any breaking changes
- Screenshots (if applicable)
- Related issue numbers

### Pull Request Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

## Adding New Tools

When adding new MCP tools, please:

1. Create a new file in `src/tools/`
2. Follow the existing tool structure
3. Include comprehensive input validation
4. Add proper error handling
5. Write unit tests
6. Update the README with tool documentation

Example tool structure:
```typescript
export interface ToolNameArgs {
  param1: string;
  param2?: number;
}

export async function toolName(args: ToolNameArgs): Promise<ToolResponse> {
  // Implementation
}
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Include usage examples
- Update configuration documentation if needed

## Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment information (Node.js version, OS, etc.)
- Error logs if applicable

## Feature Requests

When requesting features, please:
- Provide a clear use case
- Explain why the feature would be valuable
- Consider backward compatibility
- Suggest implementation approach if possible

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release PR
4. Tag the release after merging
5. Publish to npm (maintainers only)

## Getting Help

If you need help:
- Check existing issues on GitHub
- Ask questions in pull request comments
- Reach out to maintainers

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing to MCP for Code!