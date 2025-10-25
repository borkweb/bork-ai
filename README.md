# bork-ai

A comprehensive Claude Code plugin providing specialized agents, skills, and tools for enhanced development workflows.

## Features

- **Specialized Agents**: Domain-specific agents for GitHub PR management, Laravel/WordPress development, code migration, and more
- **Skills**: Reusable capabilities like commit message generation
- **MCP Integration**: Playwright browser automation through Model Context Protocol
- **Best Practices**: TDD, debugging patterns, and collaboration workflows

## Installation

### Add the marketplace

Add the marketplace for this repo (the marketplace is the same name as the plugin: `bork-ai`)

```bash
claude
/plugin marketplace add borkweb/bork-ai
```

### Install the plugin

```bash
/plugin install bork-ai@bork-ai
```

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
