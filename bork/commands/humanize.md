---
description: Remove AI writing patterns from text or a file to make it sound more natural and human-written
---

You are helping the user humanize text by removing signs of AI-generated writing.

## Parameters

- `$ARGUMENTS` — either a file path or inline text to humanize

## Process

1. **Determine input type**
   - If `$ARGUMENTS` is empty, use the AskUserQuestion tool to ask the user what they want to humanize (a file path or text)
   - If `$ARGUMENTS` looks like a file path (contains `/` or `.` extension), try reading it with the Read tool
     - If the file exists, use its contents as the input text
     - If the file does not exist, treat `$ARGUMENTS` as inline text instead
   - Otherwise, treat `$ARGUMENTS` as inline text to humanize

2. **Invoke the humanizer skill**
   - Use the Skill tool to invoke the `humanizer` skill
   - The skill will identify AI patterns and rewrite the text to sound natural
   - If the input was a file, apply the skill's output back to the file
   - If the input was inline text, present the humanized result directly to the user

## Important Notes

- The humanizer skill handles the full rewrite process including a draft, self-audit, and final revision
- Preserve the file's format (markdown, plain text, etc.) — only change the prose
- Do not alter code blocks, frontmatter, or structural markup unless they contain AI-patterned prose
