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
| **writing-commits** | `/commit` | Analyzes staged changes and generates conventional commit messages matching repository style. |
| **council** | — | Runs structured adversarial assessment of ideas, plans, and proposals through selected lenses, debate rounds, risk mapping, and a verdict. |
| **handoff** | `/handoff` | Writes handoff documentation so agents can communicate with relevant context and pick up from an optimal place. |
| **humanize** | `/humanize` | Detects and removes AI writing patterns (inflated language, em dash overuse, rule of three, hollow rhythm punches, etc.) on inline text or a file path; rewrites files in place. |
| **prototype** | `/prototype` | Scaffolds a frontend prototype or a backend prototype with a disposable state machine to test an idea. |
| **writing-sql** | — | Enforces strict vertical SQL formatting conventions for raw files, inline PHP, migrations, and framework query builders. |
| **writing-plans** | — | Applies concise writing style to plan documents — strips filler, bans inflated adjectives, requires structured decisions. |
| **agents-md-lint** | — | Audits AI agent instruction files (AGENTS.md, CLAUDE.md, etc.) and removes facts discoverable from code alone to save context tokens. |

## Commands

| Command | Description |
|---------|-------------|
| `/commit` | Check for unstaged changes, optionally stage them, then invoke writing-commits to craft the message. |

## Credits

* `council` is based on @Devattom's [workflow-debate](https://github.com/Devattom/.claude/tree/main/skills/workflow-debate) skill.
* `handoff` and `prototype` are from @mattpocock
* `humanize` originated from @blader's humanizer skill, with substantial extensions for the hand-cover diagnostic, hollow rhythm punches, and rewrite constraints
