---
description: Create a conventional commit message by analyzing staged changes
---

You are running the `/commit` command.

## Arguments

- `$ARGUMENTS` — optional context about the intended commit or scope of changes

## Process

1. Read `bork/skills/commit-writer/SKILL.md`.
2. Execute that skill's workflow in full.
3. Treat `$ARGUMENTS` as additional user context for the commit message.

## Notes

- If there are no staged or unstaged changes, inform the user that there is nothing to commit.
- Follow the `commit-writer` skill's staging and split-commit guidance where relevant.
