---
name: ship
description: |
  Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION,
  update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy",
  "push to main", "create a PR", or "merge and push".
  Proactively suggest when the user says code is ready or asks about deploying.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

---

# Ship: Fully Automated Ship Workflow

You are running the `/ship` workflow. This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step. The user said `/ship` which means DO IT. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved (stop, show conflicts)
- Test failures (stop, show failures)
- Pre-landing review finds ASK items that need user judgment
- MINOR or MAJOR version bump needed (ask — see Step 4)

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick MICRO or PATCH — see Step 4)
- CHANGELOG content (auto-generate from diff)
- Commit message approval (auto-commit)
- Multi-file changesets (auto-split into bisectable commits)
- TODOS.md completed-item detection (auto-mark)
- Auto-fixable review findings (dead code, N+1, stale comments — fixed automatically)

---

## Step 1: Pre-flight

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch. Ship from a feature branch."

2. Run `git status` (never use `-uall`). Uncommitted changes are always included — no need to ask.

3. Run `git diff <base>...HEAD --stat` and `git log <base>..HEAD --oneline` to understand what's being shipped.

---

## Step 2: Merge the base branch (BEFORE tests)

Fetch and merge the base branch into the feature branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**If there are merge conflicts:** Try to auto-resolve if they are simple (VERSION, schema, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them.

**If already up to date:** Continue silently.

---

## Step 3: Run tests (on merged code)

Detect the project's test command from the codebase (package.json scripts, Makefile, Gemfile, etc.) and run it.

**If any test fails:** Show the failures and **STOP**. Do not proceed.

**If all pass:** Continue silently — just note the counts briefly.

---

## Step 3.5: Pre-Landing Review

Review the diff for structural issues that tests don't catch.

1. Read the `checklist.md` from the review skill directory. If not available, use built-in knowledge of common review patterns (SQL safety, race conditions, LLM trust boundaries, enum completeness).

2. Run `git diff origin/<base>` to get the full diff.

3. Apply the review in two passes:
   - **Pass 1 (CRITICAL):** SQL & Data Safety, Race Conditions, LLM Output Trust Boundary, Enum Completeness
   - **Pass 2 (INFORMATIONAL):** Conditional Side Effects, Dead Code, Test Gaps, Performance

4. **Check for frontend changes:**
   ```bash
   git diff origin/<base> --name-only | grep -E '\.(css|scss|less|tsx|jsx|vue|svelte|html|blade\.php)$' | head -5
   ```
   If frontend files changed, also apply design review checks (AI slop, typography, spacing, accessibility).

5. **Classify each finding as AUTO-FIX or ASK.** Critical findings lean toward ASK; informational lean toward AUTO-FIX.

6. **Auto-fix all AUTO-FIX items.** Output one line per fix:
   `[AUTO-FIXED] [file:line] Problem → what you did`

7. **If ASK items remain,** present them in ONE AskUserQuestion:
   - List each with number, severity, problem, recommended fix
   - Per-item options: A) Fix  B) Skip
   - Overall RECOMMENDATION

8. **After all fixes (auto + user-approved):**
   - If ANY fixes were applied: commit fixed files, then **re-run tests** before continuing.
   - If no fixes applied: continue to Step 4.

9. Output summary: `Pre-Landing Review: N issues — M auto-fixed, K asked (J fixed, L skipped)`

Save the review output — it goes into the PR body in Step 8.

---

## Step 3.7: Adversarial review (large diffs only)

For diffs over 200 lines, dispatch an adversarial reviewer via the Agent tool:

Subagent prompt:
"Read the diff for this branch with `git diff origin/<base>`. Think like an attacker and a chaos engineer. Find edge cases, race conditions, security holes, resource leaks, failure modes, and silent data corruption paths. Be adversarial. Be thorough. No compliments — just the problems. For each finding, classify as FIXABLE or INVESTIGATE."

Present findings. FIXABLE findings flow into the Fix-First pipeline. INVESTIGATE findings are informational only.

For diffs under 200 lines, skip this step.

---

## Step 4: Version bump (auto-decide)

If a `VERSION` file exists:

1. Read the current version.

2. **Auto-decide the bump level based on the diff:**
   - Count lines changed
   - **MICRO/PATCH** (auto): < 50 lines = micro, 50+ lines = patch
   - **MINOR:** **ASK the user** — only for major features or significant architectural changes
   - **MAJOR:** **ASK the user** — only for milestones or breaking changes

3. Compute and write the new version.

If no `VERSION` file exists, skip this step.

---

## Step 5: CHANGELOG (auto-generate)

If a `CHANGELOG.md` exists:

1. Read the header to know the format.

2. Auto-generate the entry from **ALL commits on the branch**:
   - Use `git log <base>..HEAD --oneline` and `git diff <base>...HEAD`
   - Categorize: `### Added`, `### Changed`, `### Fixed`, `### Removed`
   - Write concise, descriptive bullet points
   - Insert after the file header, dated today

**Do NOT ask the user to describe changes.** Infer from the diff and commit history.

If no `CHANGELOG.md` exists, skip this step.

---

## Step 5.5: TODOS.md (auto-update)

If `TODOS.md` exists:

1. Cross-reference the diff against open TODOs
2. **Auto-mark completed items** — only when the diff clearly shows the work is done (be conservative)
3. Move completed items to a Completed section with version and date
4. Output summary: `TODOS.md: N items marked complete. M items remaining.`

If `TODOS.md` doesn't exist, skip silently.

---

## Step 6: Commit (bisectable chunks)

**Goal:** Create small, logical commits that work well with `git bisect`.

1. Group changes into logical commits. Each = one coherent change.

2. **Commit ordering** (earlier first):
   - **Infrastructure:** migrations, config, routes
   - **Models & services** (with their tests)
   - **Controllers & views** (with their tests)
   - **VERSION + CHANGELOG + TODOS.md:** always in the final commit

3. **Rules:**
   - A model/service and its test go in the same commit
   - If total diff is small (< 50 lines across < 4 files), a single commit is fine
   - Each commit must be independently valid — no broken imports

4. Compose commit messages: `<type>: <summary>` (feat/fix/chore/refactor/docs)

---

## Step 6.5: Verification Gate

**IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Before pushing, re-verify if code changed during Steps 4-6:

1. If ANY code changed after Step 3's test run (review fixes, etc.), re-run tests. Paste fresh output.
2. If the project has a build step, run it.
3. **If tests fail:** STOP. Do not push.

---

## Step 7: Push

```bash
git push -u origin <branch-name>
```

---

## Step 8: Create PR

```bash
gh pr create --base <base> --title "<type>: <summary>" --body "$(cat <<'EOF'
## Summary
<bullet points from CHANGELOG or diff summary>

## Pre-Landing Review
<findings from Step 3.5, or "No issues found.">

## TODOS
<completed items, or "No TODO items completed in this PR.">

## Test plan
- [x] All tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Output the PR URL.**

---

## Important Rules

- **Never skip tests.** If tests fail, stop.
- **Never force push.** Use regular `git push` only.
- **Never ask for trivial confirmations** (e.g., "ready to push?", "create PR?"). DO stop for: version bumps (MINOR/MAJOR) and pre-landing review ASK items.
- **Split commits for bisectability** — each commit = one logical change.
- **TODOS.md completion detection must be conservative.** Only mark items done when the diff clearly shows it.
- **Never push without fresh verification evidence.** If code changed after Step 3, re-run before pushing.
- **The goal is: user says `/ship`, next thing they see is the PR URL.**
