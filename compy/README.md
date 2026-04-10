# compy

Computer and session automation tools for Cowork and Dispatch.

## Skills

| Skill | Description |
|-------|-------------|
| **tmux-claude** | Launches a tmux session for a project and starts Claude Code in a dedicated window. Triggered via Dispatch by writing a trigger file that a launchd agent picks up — no Computer Use required. |

## Scripts

| Script | Description |
|--------|-------------|
| **t** | tmux session picker. Run without arguments for an fzf selector across configured directories and Claude Code worktrees. Pass a path directly to skip selection. Credit to ThePrimeagen. |
| **tc** | tmux + Claude Code launcher. Takes a project name, fuzzy-matches it against configured directories, creates a tmux session, and starts `claude` in a dedicated window. Matching priority: exact basename, substring, case-insensitive substring. |
| **tc-handler** | launchd helper for Dispatch integration. Reads a project name from `~/bin/.tc-trigger`, deletes the trigger file, and uses AppleScript to open Terminal and run `tc`. |
| **tmux-config-parser** | Shared config reader sourced by `t` and `tc`. Parses `~/.bork-ai/tmux-config.yml` and provides directory lists. |

## Dispatch Flow

The `tmux-claude` skill works from Cowork Dispatch without Computer Use:

1. You dispatch something like "start a claude session for stellar-theme"
2. The skill writes the project name to `~/bin/.tc-trigger` via the Write tool
3. The `com.borkweb.tc-handler` launchd agent detects the file change
4. `tc-handler` reads the project name, removes the trigger file, and runs `tc` via AppleScript
5. Terminal opens with a tmux session and Claude Code ready to go

## Configuration

Both `t` and `tc` read their search directories from `~/.bork-ai/tmux-config.yml`:

```yaml
directories:
  - path: ~/projects
    depth: 2
    worktrees: true

  - path: ~/git
    depth: 1
    worktrees: true

  - path: ~/sites
    depth: 1
    worktrees: true

extras:
  - /tmp
```

Each directory entry has a `path` to search, a `depth` for how many levels deep to look for project directories, and an optional `worktrees: true` to also search for Claude Code worktrees. The `extras` list adds static entries to the `t` picker (not used by `tc`).

## Setup

Run the install script to symlink the scripts into `~/bin/` and load the launchd agent:

```bash
./compy/scripts/install.sh
```

This will back up any existing `t`, `tc`, or `tc-handler` in `~/bin/` before symlinking, and create a default `~/.bork-ai/tmux-config.yml` if one doesn't exist.

### Prerequisites

- tmux
- fzf (for the `t` picker)
- Claude Code CLI (`claude`)
- Terminal.app allowed in System Settings > Privacy & Security > Automation
