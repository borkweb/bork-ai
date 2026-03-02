---
name: agents-md-lint
description: Audit and trim AGENTS.md files by testing which facts AI agents can discover from code alone. Use when asked to lint, audit, optimize, prune, or trim AGENTS.md (or similar agent instruction files) in any repository. Removes redundant documentation that wastes context tokens.
---

# agents-md-lint

Audit AGENTS.md files by spawning a blind sub-agent that tries to rediscover each documented fact from code search alone. Facts it finds easily → remove. Facts it can't → keep.

## Workflow

### 1. Extract facts

Read all AGENTS.md files in the repo. List every distinct fact as a numbered item. Group by file.

### 2. Hide the files

```bash
# For each AGENTS.md found:
mv <path>/AGENTS.md <path>/AGENTS.md.hidden
```

Keep a list of hidden files to restore later.

### 3. Spawn a blind reviewer

Spawn a sub-agent (`mode: "run"`) with this task template:

```
You are reviewing the codebase at <REPO_PATH> to test what facts are easily discoverable.
You have NO documentation — just the code.

For EACH question below, answer using ONLY quick searches (grep, find, reading config files).
Spend no more than 1-2 searches per question. Answer briefly and rate confidence: HIGH / MEDIUM / LOW.

QUESTIONS:
<numbered list of questions, one per extracted fact>
```

Use a capable model (opus or equivalent) for reliable results.

### 4. Score results

Compare the sub-agent's answers against the original facts:

| Agent confidence | Agent correct? | Verdict |
|-----------------|----------------|---------|
| HIGH | Yes | **Remove** — easily discoverable |
| HIGH | Partially | **Keep** the missing detail only |
| MEDIUM | — | **Keep** — not reliably found |
| LOW | — | **Keep** — not discoverable |

### 5. Rewrite the files

Rewrite AGENTS.md with only the surviving facts. Principles:
- Keep it short — every line must earn its tokens
- No headers or sections with a single bullet (inline it)
- Don't repeat what's in CONTRIBUTING.md, README.md, or config files
- Group related facts naturally

### 6. Restore and clean up

```bash
# Restore hidden files that weren't being edited (e.g. other sub-projects)
mv <path>/AGENTS.md.hidden <path>/AGENTS.md
# Remove backup of files that were rewritten
rm <path>/AGENTS.md.hidden
```

### 7. Present results

Show a summary table:

```
| # | Fact | Discoverable? | Action |
|---|------|--------------|--------|
| 1 | ...  | ✅ HIGH      | Remove |
| 2 | ...  | ❌ LOW       | Keep   |
```

Report: total facts, removed count, kept count, line reduction percentage.

## Tips

- Test 20-30 facts per sub-agent run (more gets unreliable)
- For monorepos with multiple AGENTS.md, test each file separately
- Facts about *conventions* (naming rules, branch patterns) are usually NOT discoverable even if examples exist in git history — keep them
- Facts about *auth mechanisms* are often buried in middleware — usually worth keeping
- Facts about *known gotchas* (e.g. "use --forceExit") are almost never discoverable — keep them
