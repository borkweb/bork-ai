---
name: post-merge
description: Post-merge documentation nudge. After merging to the main branch, checks if the diff touched public APIs, config, or doc-relevant files. If so, reminds the developer to run /document-release. Also checks for outdated dependencies and suggests /dependency-audit when lockfiles changed. Non-blocking — just a helpful reminder.
event: post-merge
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Post-Merge Nudge

This hook runs automatically after `git merge` completes on the base branch. It's **non-blocking** — purely informational reminders about follow-up actions.

---

## Step 1: Detect context

```bash
BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo "main")
```

**Only run on the default branch.** If the current branch is not the default branch, exit silently. This hook is for "just merged a PR to main" situations, not for merging main into a feature branch.

```bash
if [ "$BRANCH" != "$DEFAULT_BRANCH" ]; then
  exit 0
fi
```

---

## Step 2: Analyze the merge

Get the files changed in the merge:

```bash
# Get the merge commit's parents and diff
MERGE_COMMIT=$(git rev-parse HEAD)
PARENT1=$(git rev-parse HEAD^1)
PARENT2=$(git rev-parse HEAD^2 2>/dev/null)

if [ -n "$PARENT2" ]; then
  # This was a merge commit — diff the second parent against HEAD
  FILES_CHANGED=$(git diff --name-only $PARENT1 $MERGE_COMMIT)
else
  # This was a fast-forward — diff the previous commit
  FILES_CHANGED=$(git diff --name-only HEAD~1 HEAD)
fi
```

---

## Step 3: Documentation relevance check

Scan the changed files for documentation-relevant patterns:

```bash
DOC_RELEVANT=false
REASONS=""
```

**Trigger conditions:**

| Pattern | Files matching | Reason |
|---------|---------------|--------|
| Public API changes | `*controller*`, `*route*`, `*endpoint*`, `*api*` | API docs may be stale |
| Config changes | `*.env*`, `*config*`, `*.yml`, `*.yaml`, `*settings*` | Setup docs may be stale |
| Schema changes | `*migration*`, `*schema*`, `*.sql` | Data model docs may be stale |
| New features | Commit messages contain `feat:` | Feature docs needed |
| Architecture changes | `*service*`, `*repository*`, `*provider*` added/removed | Architecture docs may be stale |
| CLI changes | `*command*`, `*artisan*`, `*cli*` | Usage docs may be stale |
| Dependency changes | `package.json`, `composer.json`, `Gemfile`, `requirements.txt`, `go.mod` | Setup docs may be stale |

Check each pattern:

```bash
echo "$FILES_CHANGED" | grep -iE '(controller|route|endpoint|api)' && REASONS="$REASONS\n  - API files changed"
echo "$FILES_CHANGED" | grep -iE '(\.env|config|settings)' && REASONS="$REASONS\n  - Config files changed"
echo "$FILES_CHANGED" | grep -iE '(migration|schema|\.sql)' && REASONS="$REASONS\n  - Schema/migration files changed"
echo "$FILES_CHANGED" | grep -iE '(command|artisan|cli)' && REASONS="$REASONS\n  - CLI/command files changed"
```

Also check if documentation files were NOT updated but probably should have been:

```bash
DOCS_UPDATED=$(echo "$FILES_CHANGED" | grep -iE '\.(md|rst|txt)$' | grep -ivE '(changelog|version|license)' | head -5)
```

---

## Step 4: Dependency check

```bash
LOCKFILES_CHANGED=$(echo "$FILES_CHANGED" | grep -iE '(package-lock|yarn\.lock|pnpm-lock|composer\.lock|Gemfile\.lock|Pipfile\.lock|go\.sum|Cargo\.lock)')
```

---

## Step 5: Output reminders

**If documentation is relevant AND no docs were updated:**
```
post-merge 📝 Documentation may need updating
  Reasons:
  - API files changed
  - Schema/migration files changed
  Suggestion: Run /document-release to auto-sync docs with this merge.
```

**If lockfiles changed:**
```
post-merge 📦 Dependencies changed
  Updated: [list lockfiles]
  Suggestion: Run /dependency-audit to check for new vulnerabilities.
```

**If VERSION file was not bumped but probably should have been:**
```bash
VERSION_BUMPED=$(echo "$FILES_CHANGED" | grep -E '^VERSION$')
HAS_FEAT=$(git log $PARENT1..$MERGE_COMMIT --oneline --format="%s" | grep -c "^feat:")
```
If features were added but VERSION wasn't bumped:
```
post-merge 🏷️  New features merged but VERSION not bumped.
  Suggestion: Run /ship or manually bump VERSION.
```

**If TODOS.md exists, check for items that might be resolved:**
```bash
if [ -f TODOS.md ]; then
  # Count open items
  OPEN_TODOS=$(grep -c '^\- \[ \]' TODOS.md 2>/dev/null || echo "0")
  if [ "$OPEN_TODOS" -gt 0 ]; then
    echo "post-merge 📋 $OPEN_TODOS open items in TODOS.md — any resolved by this merge?"
  fi
fi
```

**If everything is clean** (no reminders triggered):
```
post-merge ✓ Clean merge — no follow-up actions detected.
```

---

## Important Rules

- **Non-blocking.** This hook NEVER prevents or delays the merge. It's informational only.
- **Only on default branch.** Don't fire when merging main into a feature branch — that's noise.
- **Quiet when clean.** One line if nothing needs attention.
- **Specific suggestions.** Don't just say "docs might be stale" — say which skill to run and why.
- **Never modify files.** Read-only. No edits, no commits, no side effects.
- **Fast.** Under 5 seconds. Just file pattern matching and git commands.
