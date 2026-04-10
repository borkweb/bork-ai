---
name: tmux-claude
description: >
  Start a tmux session for a project and launch Claude Code in it.
  Use this skill whenever the user asks to "start a claude session",
  "open claude for a project", "launch claude in a project",
  "tmux claude for a project", or any variation of starting a coding
  session with Claude Code in a specific project directory. Also triggers
  for phrases like "spin up claude on my-project", "work on my-project
  with claude", or "open a terminal for a project with claude".
  This skill requires Computer Use to be enabled since it interacts
  with the host machine's terminal.
---

# tmux + Claude Code Launcher

This skill launches a tmux session for a given project and starts Claude Code
in a dedicated window. It relies on `~/bin/tc`, a shell script that searches
the user's project directories for a match by name.

## How it works

The user has a script at `~/bin/tc` that:
1. Takes a project name as an argument
2. Searches `~/projects` (depth 2), `~/git`, and `~/sites` (depth 1) for a matching directory
3. Creates or attaches to a tmux session named after the project
4. Opens a new tmux window named "claude" and starts `claude` (Claude Code CLI) in it

Matching is done in priority order: exact basename match, then substring, then case-insensitive substring.

## Requirements

- **Computer Use must be enabled.** The sandbox shell cannot interact with the host's tmux. This skill uses Computer Use to open Terminal.app and run the command on the host machine.
- The user must have `claude` (Claude Code CLI) installed and on their PATH.
- tmux must be installed on the host.

## Steps to execute

1. **Extract the project name** from the user's request. They'll say something like "start claude for stellar-theme" — the project name is "stellar-theme".

2. **Check that Computer Use is available.** If the `computer` tool or Chrome/desktop interaction tools are not available, inform the user:
   > "I need Computer Use enabled to interact with your terminal. You can enable it at Settings > Desktop app > Computer use. Once that's on, just ask me again!"

3. **Open Terminal.app** using Computer Use. If a Terminal window is already open and visible, you can use that instead.

4. **Run the command** in the terminal:
   ```
   ~/bin/tc <project-name>
   ```

5. **Confirm to the user** that the tmux session has been started and Claude is launching in the "claude" window.

## Example interactions

**User (via Dispatch):** "Start a claude session for stellar-theme"
**Action:** Open Terminal, run `~/bin/tc stellar-theme`
**Response:** "Done! I've started a tmux session for stellar-theme and launched Claude Code in a dedicated window."

**User (via Dispatch):** "Open claude on flavor-customizer"
**Action:** Open Terminal, run `~/bin/tc flavor-customizer`
**Response:** "Your tmux session for flavor-customizer is up with Claude Code ready to go."

## Troubleshooting

If the `tc` script reports "No project found matching: X", relay the error to the user and list the available projects if shown in the output.
