---
name: retro
description: Weekly engineering retrospective. Analyzes commit history, work patterns, and code quality metrics with persistent history and trend tracking. Team-aware: breaks down per-person contributions with praise and growth areas. Use when asked to "weekly retro", "what did we ship", or "engineering retrospective". Proactively suggest at the end of a work week or sprint.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - AskUserQuestion
---

## Detect default branch

Before gathering data, detect the repo's default branch name:
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

If this fails, fall back to `main`. Use the detected name wherever the instructions
say `origin/<default>` below.

---

# Weekly Engineering Retrospective

Generates a comprehensive engineering retrospective analyzing commit history, work patterns, and code quality metrics. Team-aware: identifies the user running the command, then analyzes every contributor with per-person praise and growth opportunities.

## Arguments
- `/retro` — default: last 7 days
- `/retro 24h` — last 24 hours
- `/retro 14d` — last 14 days
- `/retro 30d` — last 30 days
- `/retro compare` — compare current window vs prior same-length window
- `/retro compare 14d` — compare with explicit window

## Instructions

Parse the argument to determine the time window. Default to 7 days if no argument given. All times should be reported in the user's **local timezone**.

**Midnight-aligned windows:** For day (`d`) and week (`w`) units, compute an absolute start date at local midnight, not a relative string. Use `--since="YYYY-MM-DDT00:00:00"` for git log queries. For hour (`h`) units, use `--since="N hours ago"`.

**Argument validation:** If the argument doesn't match a number followed by `d`, `h`, or `w`, the word `compare`, or `compare` followed by a number and `d`/`h`/`w`, show usage and stop.

### Step 1: Gather Raw Data

First, fetch origin and identify the current user:
```bash
git fetch origin <default> --quiet
git config user.name
git config user.email
```

The name returned by `git config user.name` is **"you"** — the person reading this retro. All other authors are teammates.

Run ALL of these git commands in parallel (they are independent):

```bash
# 1. All commits in window with timestamps, subject, hash, AUTHOR, files changed
git log origin/<default> --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. Per-commit test vs total LOC breakdown with author
git log origin/<default> --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. Commit timestamps for session detection and hourly distribution
git log origin/<default> --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. Files most frequently changed (hotspot analysis)
git log origin/<default> --since="<window>" --format="" --name-only | grep -v '^$' | sort | uniq -c | sort -rn

# 5. PR numbers from commit messages
git log origin/<default> --since="<window>" --format="%s" | grep -oE '#[0-9]+' | sed 's/^#//' | sort -n | uniq | sed 's/^/#/'

# 6. Per-author file hotspots
git log origin/<default> --since="<window>" --format="AUTHOR:%aN" --name-only

# 7. Per-author commit counts
git shortlog origin/<default> --since="<window>" -sn --no-merges

# 8. TODOS.md backlog (if available)
cat TODOS.md 2>/dev/null || true

# 9. Test file count
find . -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.*' -o -name '*_spec.*' 2>/dev/null | grep -v node_modules | wc -l

# 10. Regression test commits in window
git log origin/<default> --since="<window>" --oneline --grep="test(qa):" --grep="test(design):" --grep="test: coverage"

# 11. Test files changed in window
git log origin/<default> --since="<window>" --format="" --name-only | grep -E '\.(test|spec)\.' | sort -u | wc -l
```

### Step 2: Compute Metrics

Calculate and present these metrics in a summary table:

| Metric | Value |
|--------|-------|
| Commits to main | N |
| Contributors | N |
| PRs merged | N |
| Total insertions | N |
| Total deletions | N |
| Net LOC added | N |
| Test LOC (insertions) | N |
| Test LOC ratio | N% |
| Version range | vX.Y.Z → vX.Y.Z |
| Active days | N |
| Detected sessions | N |
| Avg LOC/session-hour | N |
| Test Health | N total tests · M added this period · K regression tests |

Then show a **per-author leaderboard** immediately below:

```
Contributor         Commits   +/-          Top area
You (name)               32   +2400/-300   src/
alice                    12   +800/-150    app/services/
bob                       3   +120/-40     tests/
```

Sort by commits descending. The current user always appears first, labeled "You (name)".

**Backlog Health (if TODOS.md exists):** Compute total open TODOs, P0/P1 count, items completed this period, items added this period. Include in the metrics table.

### Step 3: Commit Time Distribution

Show hourly histogram in local time:

```
Hour  Commits  ████████████████
 00:    4      ████
 07:    5      █████
 ...
```

Identify peak hours, dead zones, bimodal patterns, and late-night coding clusters.

### Step 4: Work Session Detection

Detect sessions using **45-minute gap** threshold between consecutive commits. For each session report start/end time, commit count, and duration.

Classify sessions:
- **Deep sessions** (50+ min)
- **Medium sessions** (20-50 min)
- **Micro sessions** (<20 min)

Calculate total active coding time, average session length, LOC per hour of active time.

### Step 5: Commit Type Breakdown

Categorize by conventional commit prefix (feat/fix/refactor/test/chore/docs). Show as percentage bar. Flag if fix ratio exceeds 50%.

### Step 6: Hotspot Analysis

Show top 10 most-changed files. Flag files changed 5+ times (churn hotspots).

### Step 7: PR Size Distribution

Bucket PR sizes: Small (<100 LOC), Medium (100-500), Large (500-1500), XL (1500+).

### Step 8: Focus Score + Ship of the Week

**Focus score:** Percentage of commits touching the single most-changed top-level directory.

**Ship of the week:** Auto-identify the single highest-LOC PR in the window. Highlight PR number, title, LOC, and why it matters.

### Step 9: Team Member Analysis

For each contributor (including the current user), compute:
1. Commits and LOC
2. Areas of focus (top 3 directories)
3. Commit type mix
4. Session patterns
5. Test discipline (personal test LOC ratio)
6. Biggest ship

**For the current user ("You"):** Deepest treatment. Include session analysis, time patterns, focus score. Frame in first person.

**For each teammate:** 2-3 sentences on contributions, then:
- **Praise** (1-2 specific things): Anchored in actual commits. Not "great work" — say exactly what was good.
- **Opportunity for growth** (1 specific thing): Frame as investment, not criticism. Anchored in data.

**If solo repo:** Skip team breakdown.

**AI collaboration note:** If many commits have `Co-Authored-By` AI trailers, note the AI-assisted commit percentage as a team metric.

### Step 10: Week-over-Week Trends (if window >= 14d)

Split into weekly buckets and show trends for commits, LOC, test ratio, fix ratio, session count.

### Step 11: Streak Tracking

```bash
# Team streak: all unique commit dates
git log origin/<default> --format="%ad" --date=format:"%Y-%m-%d" | sort -u

# Personal streak: only the current user's commits
git log origin/<default> --author="<user_name>" --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```

Count consecutive days backward from today.

### Step 12: Load History & Compare

Check for prior retro history:
```bash
ls -t .context/retros/*.json 2>/dev/null
```

**If prior retros exist:** Load the most recent. Calculate deltas and include a **Trends vs Last Retro** section.

**If no prior retros exist:** Skip comparison. Append: "First retro recorded — run again next week to see trends."

### Step 13: Save Retro History

```bash
mkdir -p .context/retros
```

Save a JSON snapshot with metrics, per-author data, version range, streak, and tweetable summary. Use sequential filenames: `.context/retros/{date}-{N}.json`.

### Step 14: Write the Narrative

Structure the output as:

---

**Tweetable summary** (first line):
```
Week of Mar 1: 47 commits (3 contributors), 3.2k LOC, 38% tests, 12 PRs, peak: 10pm | Streak: 47d
```

## Engineering Retro: [date range]

### Summary Table
### Trends vs Last Retro (if available)
### Time & Session Patterns
### Shipping Velocity
### Code Quality Signals
### Test Health
### Focus & Highlights
### Your Week (personal deep-dive)
### Team Breakdown (if multi-contributor)
### Top 3 Team Wins
### 3 Things to Improve
### 3 Habits for Next Week
### Week-over-Week Trends (if applicable)

---

## Compare Mode

When the user runs `/retro compare`:
1. Compute metrics for the current window
2. Compute metrics for the immediately prior same-length window (using `--since` and `--until` to avoid overlap)
3. Show side-by-side comparison table with deltas and arrows
4. Write a brief narrative highlighting improvements and regressions
5. Save only the current-window snapshot

## Tone

- Encouraging but candid, no coddling
- Specific and concrete — always anchor in actual commits/code
- Skip generic praise ("great job!") — say exactly what was good and why
- Frame improvements as leveling up, not criticism
- **Praise should feel like something you'd actually say in a 1:1**
- **Growth suggestions should feel like investment advice**
- Never compare teammates against each other negatively
- Keep total output around 3000-4500 words
- Use markdown tables and code blocks for data, prose for narrative
- Output directly to the conversation — do NOT write to filesystem (except `.context/retros/` JSON)

## Important Rules

- ALL narrative output goes directly to the user in the conversation. The ONLY file written is the `.context/retros/` JSON snapshot.
- Use `origin/<default>` for all git queries (not local main which may be stale)
- Display all timestamps in the user's local timezone
- If the window has zero commits, say so and suggest a different window
- Round LOC/hour to nearest 50
- Treat merge commits as PR boundaries
- On first run (no prior retros), skip comparison sections gracefully
