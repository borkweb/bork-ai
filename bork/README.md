# bork

General development tools for Claude Code projects.

## Agents

| Agent | Description |
|-------|-------------|
| **github-pr-manager** | Creates and updates GitHub PRs with smart context awareness. Auto-invoked on "create PR", "update PR", "do PR". |
| **laravel-rest-architect** | Designs and implements Laravel REST API endpoints with thin controllers, Form Request validation, and API Resources. |
| **refactorer** | Handles code/API migrations with backwards compatibility, phased rollouts, and comprehensive test coverage. |

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **commit-writer** | `/commit` | Analyzes staged changes and generates conventional commit messages matching repository style. |
| **council** | — | Runs structured adversarial assessment of ideas, plans, and proposals through selected lenses, debate rounds, risk mapping, and a verdict. |
| **humanizer** | `/humanize` | Detects and removes AI writing patterns (inflated language, em dash overuse, rule of three, etc.) to make text sound natural. |
| **writing-sql** | — | Enforces strict vertical SQL formatting conventions for raw files, inline PHP, migrations, and framework query builders. |
| **writing-plans** | — | Applies concise writing style to plan documents — strips filler, bans inflated adjectives, requires structured decisions. |
| **agents-md-lint** | — | Audits AI agent instruction files (AGENTS.md, CLAUDE.md, etc.) and removes facts discoverable from code alone to save context tokens. |

## Commands

| Command | Description |
|---------|-------------|
| `/commit` | Check for unstaged changes, optionally stage them, then invoke commit-writer to craft the message. |
| `/humanize` | Pass a file path or inline text to strip AI writing patterns and return humanized output. |
