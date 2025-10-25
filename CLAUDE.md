# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains custom Claude Code extensions including agents, skills, hooks, and commands for enhancing Claude Code workflows. It is designed as a plugin library to be installed and used across different projects.

## Architecture Overview

### Directory Structure

- **agents/**: Specialized agent configurations that handle domain-specific tasks
  - Each agent is defined in a markdown file with YAML frontmatter
  - Agents can be launched via the Task tool to handle complex workflows
  - Include descriptions, tool access, and specialized prompts

- **skills/**: Reusable skill packages invoked via the Skill tool
  - Skills are lightweight, focused capabilities
  - Located in individual subdirectories with SKILL.md files
  - Currently includes: commit-writer

- **hooks/**: Event-driven shell commands (currently placeholder)

- **commands/**: Custom slash commands (currently placeholder)

- **.claude-plugin/**: Plugin metadata and configuration
  - Contains plugin.json with package information

## Agents Architecture

Agents are markdown files with YAML frontmatter defining:
- `name`: Agent identifier
- `description`: Detailed description including auto-invocation triggers
- `tools`: Available tools (Bash, Read, Grep, Glob, etc.)
- `proactive`: Whether agent should be auto-invoked
- `color`: UI color coding
- `model`: Optional model override (e.g., opus)

### Available Agents

1. **github-pr-manager** (proactive)
   - Creates and updates GitHub PRs with smart context awareness
   - Auto-invoked on: "create PR", "update PR", "do PR"
   - Auto-detects current branch and repository info
   - Handles PR sizing (concise for small PRs, detailed for large)
   - Never @mentions PR author, only reviewers
   - Uses `gh` CLI for all GitHub operations

2. **laravel-rest-architect**
   - Designs and implements Laravel REST API endpoints
   - Focuses on RESTful conventions, validation, resources, and security
   - Implements thin controllers with service/repository pattern
   - Uses Opus model for complex architectural decisions

3. **melancholic-commit-writer**
   - Generates commit messages with technical accuracy and emotional depth
   - Specializes in PHP codebases
   - Follows conventional commit format with dark humor elements

4. **refactorer**
   - Handles code/API migrations with backwards compatibility
   - Creates migration plans, compatibility layers, and test coverage
   - Specializes in versioning strategies and phased rollouts

5. **wp-backend-optimizer**
   - Optimizes WordPress backend performance
   - Database optimization, caching strategies, efficient data structures
   - Balances performance with code readability

6. **wp-rest-endpoint-architect** (proactive)
   - Creates WordPress REST API endpoints with clean architecture
   - Enforces separation of concerns (thin controllers)
   - Business logic in service classes, data access in repositories
   - Avoids mocks in tests; inserts actual database rows

## Skills Architecture

Skills are invoked via the Skill tool with just the skill name (no arguments). When invoked, the skill's SKILL.md prompt expands into the conversation.

### Available Skills

1. **commit-writer**
   - Crafts conventional commit messages by analyzing git diffs and history
   - Follows Conventional Commits specification
   - Adapts to repository's existing commit style
   - Suggests splitting commits when changes span multiple concerns

## Development Workflow

### Installing the Plugin

```bash
# The setup.sh script is currently empty, so manual installation is required
# Copy or symlink this directory to your Claude Code plugins directory
```

### Creating New Agents

1. Create a new markdown file in `agents/`
2. Add YAML frontmatter with required fields
3. Write the agent prompt defining expertise and behavior
4. Test by invoking with Task tool

### Creating New Skills

1. Create a subdirectory in `skills/`
2. Add SKILL.md with YAML frontmatter
3. Define allowed tools and skill behavior
4. Document usage patterns and examples

## Key Design Patterns

### Agent Invocation
Agents are context-aware and can auto-invoke based on user intent. For proactive agents, Claude Code should detect trigger phrases and automatically launch the appropriate agent.

### Tool Access
Agents specify which tools they can use (Bash, Read, Grep, Glob, WebFetch, Task, etc.). This ensures agents have appropriate capabilities for their domain.

### Separation of Concerns
- Agents handle complex, multi-step workflows
- Skills provide focused, reusable capabilities
- Hooks respond to specific events
- Commands provide custom slash command behavior

### WordPress Patterns
WordPress-focused agents (wp-backend-optimizer, wp-rest-endpoint-architect) enforce:
- Service classes for business logic
- Repository pattern for data access
- Value objects for data integrity
- Dependency injection via DI container
- Integration tests with actual database rows (not mocks)

### Laravel Patterns
Laravel-focused agents (laravel-rest-architect) enforce:
- Thin controllers with service delegation
- Form Request validation classes
- API Resources for response formatting
- PSR-12 coding standards
- Comprehensive authorization with policies

## Testing Philosophy

- WordPress agents: Insert actual test data, avoid mocking
- All endpoints/features should have integration tests
- Test coverage for happy paths, edge cases, and authorization
- Performance tests for critical paths

## Plugin Metadata

- **Name**: claude-utilities
- **Version**: 1.0.0
- **License**: MIT
- **Repository**: https://github.com/borkweb/claude-utilities
