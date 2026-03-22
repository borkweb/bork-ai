---
description: Create a conventional commit message by analyzing staged changes
---

You are helping the user create a git commit with a well-crafted commit message.

## Process

1. **Check for unstaged changes**
   - Run `git status --short` to see both staged and unstaged changes
   - If there are unstaged changes (lines starting with ` M`, ` D`, `??`, etc.), ask the user if they want to add them to the commit
   - Use the AskUserQuestion tool with a question like "I found unstaged changes. Would you like to add them to the commit?"
   - Options should be: "Yes, add all unstaged changes" and "No, only commit staged changes"

2. **Add unstaged changes if requested**
   - If the user chose to add unstaged changes, run `git add -A` to stage all changes
   - Confirm what was added

3. **Invoke commit-writer skill**
   - Use the Skill tool to invoke the `commit-writer` skill
   - The skill will analyze the staged changes and generate a conventional commit message
   - Command: `Skill(command: "commit-writer")`

## Important Notes

- If there are no changes at all (staged or unstaged), inform the user that there's nothing to commit
- If there are only staged changes and no unstaged changes, skip the question and proceed directly to invoking commit-writer
- Do not create the actual commit - just generate the commit message. The commit-writer skill will handle that interaction.
