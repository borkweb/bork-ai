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
---

# tmux + Claude Code Launcher

This skill launches a tmux session for a given project and starts Claude Code
in a dedicated window. It works by writing a trigger file that a launchd agent
on the host machine picks up and executes.

## How it works

The system has three parts:

1. **`~/bin/tc`** — A shell script that takes a project name, searches the
   user's project directories for a match, creates/attaches a tmux session,
   and starts Claude Code in a new window.

2. **`~/bin/tc-handler`** — A helper script invoked by launchd. It reads the
   project name from `~/bin/.tc-trigger`, deletes the trigger file, and uses
   AppleScript to open Terminal and run `tc` with that project name.

3. **`com.borkweb.tc-handler` launchd agent** — Watches `~/bin/.tc-trigger`
   for changes and runs `tc-handler` when the file appears.

Project directory matching (done by `tc`) uses this priority: exact basename
match, then substring, then case-insensitive substring. It searches
`~/projects` (depth 2), `~/git`, and `~/sites` (depth 1).

## Steps to execute

1. **Extract the project name** from the user's request. They'll say something
   like "start claude for stellar-theme" — the project name is "stellar-theme".

2. **Write the trigger file.** Use the **Write** file tool (not bash) to create
   the trigger file. The Write tool uses the host filesystem path directly,
   so this works regardless of session mount paths:

   ```
   Write to: /Users/matt/bin/.tc-trigger
   Content:  PROJECT_NAME
   ```

   Replace `PROJECT_NAME` with the actual project name extracted from the
   user's request. The file content should be just the project name, nothing
   else.

3. **Confirm to the user** that the trigger has been sent and their tmux
   session with Claude Code should be starting up momentarily.

That's it — just extract the name and write one file. The launchd agent on the
host detects the new file, reads the project name, opens Terminal, and runs
`~/bin/tc` which creates the tmux session and starts Claude.

## Example interactions

**User (via Dispatch):** "Start a claude session for stellar-theme"
**Action:** Write "stellar-theme" to `/Users/matt/bin/.tc-trigger`
**Response:** "Done! Your tmux session for stellar-theme is starting up with Claude Code in a dedicated window."

**User (via Dispatch):** "Open claude on flavor-customizer"
**Action:** Write "flavor-customizer" to `/Users/matt/bin/.tc-trigger`
**Response:** "On it — tmux session for flavor-customizer is launching with Claude Code ready to go."

## Troubleshooting

If the user reports nothing happened, check that:
- The launchd agent is loaded: `launchctl list | grep tc-handler`
- The trigger file was written: `cat ~/bin/.tc-trigger`
- The tc script can find the project: `~/bin/tc PROJECT_NAME`
- Terminal.app has permission to be controlled via AppleScript (System Settings > Privacy & Security > Automation)
