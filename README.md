# bork-ai

A comprehensive Claude Code plugin providing specialized agents, skills, and tools for enhanced development workflows.

## Features

- **Specialized Agents**: Domain-specific agents for GitHub PR management, Laravel/WordPress development, code migration, and more
- **Skills**: Reusable capabilities like commit message generation
- **MCP Integration**: Playwright browser automation through Model Context Protocol
- **Best Practices**: TDD, debugging patterns, and collaboration workflows

## Installation

### Using Claude Code CLI

```bash
# Install from GitHub
claude mcp add-plugin https://github.com/borkweb/bork-ai
```

### Manual Installation

1. Clone this repository:
```bash
git clone https://github.com/borkweb/bork-ai.git
cd bork-ai
```

2. Install the plugin:
```bash
# Link to Claude Code plugins directory
claude mcp add-plugin .
```

### Verify Installation

After installation, you can verify the plugin is loaded:

```bash
claude mcp list-plugins
```

You should see `bork-ai` in the list of installed plugins.

## Available Agents

- **github-pr-manager**: Creates and updates GitHub PRs with smart context awareness
- **laravel-rest-architect**: Designs Laravel REST API endpoints following best practices
- **melancholic-commit-writer**: Generates commit messages with emotional depth
- **refactorer**: Handles code migrations with backwards compatibility
- **wp-backend-optimizer**: Optimizes WordPress backend performance
- **wp-rest-endpoint-architect**: Creates WordPress REST endpoints with clean architecture

## Available Skills

- **commit-writer**: Crafts conventional commit messages by analyzing git diffs

## Usage

### Using Agents

Agents are automatically invoked based on context. For example:

```bash
# GitHub PR management
"create PR"
"update PR"

# Or manually invoke with Task tool
```

### Using Skills

Invoke skills directly:

```bash
# Generate a commit message
Use the commit-writer skill to analyze staged changes
```

## Requirements

- Claude Code CLI
- Node.js (for Playwright MCP server)

## License

MIT
