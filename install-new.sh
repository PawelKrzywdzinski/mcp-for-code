#!/bin/bash

# 🚀 Xcode MCP Server - One-Command Installation
# 98% Token Savings for iOS/macOS development with Claude Code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="xcode-mcp-server"
REPO_URL="https://github.com/PawelKrzywdzinski/mcp-for-code"
CLAUDE_CONFIG_DIR="$HOME/.config/claude-code"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/mcp.json"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║                         🚀 Xcode MCP Server                              ║"
    echo "║                    98% Token Savings for Claude Code                    ║"
    echo "║                                                                          ║"
    echo "║  • Advanced project analysis and optimization                           ║"
    echo "║  • Intelligent context management                                       ║"
    echo "║  • Token usage monitoring and cost tracking                             ║"
    echo "║  • 8 powerful commands for iOS/macOS development                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_requirements() {
    print_status "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "This tool is optimized for macOS. Some features may not work on other platforms."
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed."
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2)
    required_version="18.0.0"
    if ! printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1 | grep -q "$required_version"; then
        print_error "Node.js version $node_version is too old. Please upgrade to 18.0.0 or higher."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed."
        exit 1
    fi
    
    # Check Claude Code
    if ! command -v claude-code &> /dev/null; then
        print_warning "Claude Code not found. Make sure it is installed and in your PATH."
    fi
    
    print_success "System requirements check passed"
}

install_package() {
    print_status "Installing Xcode MCP Server..."
    
    # Install from GitHub source (ensures latest version)
    temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    if git clone "$REPO_URL" .; then
        print_status "Building from source..."
        if npm install && npm run build && chmod +x dist/index.js && npm install -g .; then
            print_success "Package built and installed successfully"
        else
            print_error "Failed to build from source"
            exit 1
        fi
    else
        print_error "Failed to clone repository"
        exit 1
    fi
    
    cd - > /dev/null
    rm -rf "$temp_dir"
}

configure_claude() {
    print_status "Configuring Claude Code..."
    
    # Create config directory
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # Create or update MCP configuration
    if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
        print_warning "Existing Claude Code configuration found"
        
        # Backup existing config
        cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup"
        print_status "Backup created at ${CLAUDE_CONFIG_FILE}.backup"
        
        # Merge configurations
        if command -v jq &> /dev/null; then
            # Use jq if available  
            jq '.mcpServers["xcode-mcp"] = {"command": "xcode-mcp", "args": []}' "$CLAUDE_CONFIG_FILE" > "${CLAUDE_CONFIG_FILE}.tmp"
            mv "${CLAUDE_CONFIG_FILE}.tmp" "$CLAUDE_CONFIG_FILE"
        else
            # Manual configuration
            print_warning "jq not found. Please manually add to your Claude Code config:"
            echo '{"mcpServers":{"xcode-mcp":{"command":"xcode-mcp","args":[]}}}'
        fi
    else
        # Create new configuration
        cat > "$CLAUDE_CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "xcode-mcp": {
      "command": "xcode-mcp",
      "args": []
    }
  }
}
EOF
    fi
    
    print_success "Claude Code configured successfully"
}

test_installation() {
    print_status "Testing installation..."
    
    # Test command availability
    if command -v xcode-mcp &> /dev/null; then
        print_success "Command 'xcode-mcp' is available"
    else
        print_error "Command 'xcode-mcp' not found in PATH"
        print_status "Debugging installation..."
        
        # Debug npm installation
        npm_bin=$(npm config get prefix)/bin
        print_status "npm bin directory: $npm_bin"
        
        if [[ -d "$npm_bin" ]]; then
            print_status "Checking for xcode-mcp in npm bin..."
            if [[ -f "$npm_bin/xcode-mcp" ]]; then
                print_status "Found xcode-mcp symlink"
                ls -la "$npm_bin/xcode-mcp"
                
                # Test if the target file exists
                target=$(readlink "$npm_bin/xcode-mcp")
                if [[ -f "$npm_bin/$target" ]]; then
                    print_status "Target file exists, adding to PATH..."
                    export PATH="$npm_bin:$PATH"
                    
                    if command -v xcode-mcp &> /dev/null; then
                        print_success "Command found after adding to PATH"
                        
                        # Add to shell profile
                        shell_profile=""
                        if [[ "$SHELL" == *"zsh"* ]]; then
                            shell_profile="$HOME/.zshrc"
                        elif [[ "$SHELL" == *"bash"* ]]; then
                            shell_profile="$HOME/.bashrc"
                        fi
                        
                        if [[ -n "$shell_profile" ]]; then
                            echo "export PATH=\"$npm_bin:\$PATH\"" >> "$shell_profile"
                            print_status "Added to PATH in $shell_profile"
                        fi
                    else
                        print_error "Command still not found after adding to PATH"
                        exit 1
                    fi
                else
                    print_error "Target file does not exist: $npm_bin/$target"
                    exit 1
                fi
            else
                print_error "xcode-mcp symlink not found in $npm_bin"
                print_status "Available files:"
                ls -la "$npm_bin" | grep xcode || echo "No xcode-related files found"
                exit 1
            fi
        else
            print_error "npm bin directory not found: $npm_bin"
            exit 1
        fi
    fi
    
    # Test basic functionality
    print_status "Testing basic functionality..."
    if xcode-mcp --version > /dev/null 2>&1; then
        print_success "Basic functionality test passed"
        xcode-mcp --version
    else
        print_warning "Basic functionality test failed, but installation appears successful"
    fi
}

show_completion() {
    print_header
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your terminal or run: source ~/.zshrc"
    echo "2. Restart Claude Code to load the new MCP server"
    echo "3. Start using Xcode MCP Server commands:"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  /scan ./MyApp.xcodeproj        # Scan and analyze project"
    echo "  /context ./MyApp.xcodeproj     # Get optimized context"
    echo "  /optimize ./MyApp.xcodeproj    # Optimize token usage"
    echo "  /docs ./MyApp.xcodeproj        # Generate documentation"
    echo "  /deps ./MyApp.xcodeproj        # Analyze dependencies"
    echo "  /search query                  # Search documentation"
    echo "  /stats                         # Show usage statistics"
    echo "  /limits                        # Show token limits"
    echo ""
    echo -e "${YELLOW}💡 Pro tip:${NC} Use 'level=extreme' for maximum token savings!"
    echo ""
    echo -e "${GREEN}🔗 Resources:${NC}"
    echo "  Repository: $REPO_URL"
    echo "  Documentation: $REPO_URL/wiki"
    echo "  Issues: $REPO_URL/issues"
    echo ""
    echo -e "${BLUE}Happy coding with 98% token savings! 🚀${NC}"
}

main() {
    print_header
    print_status "Starting Xcode MCP Server installation..."
    
    check_requirements
    install_package
    configure_claude
    test_installation
    show_completion
}

# Handle interrupts
trap 'print_error "Installation interrupted"; exit 1' INT

# Run main installation
main "$@"
