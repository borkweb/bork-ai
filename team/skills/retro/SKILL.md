---
name: retro
description: >
  Weekly engineering retrospective. Analyzes commit history, work patterns, and
  code quality metrics with persistent history and trend tracking. Team-aware:
  breaks down per-person contributions with praise and growth areas. Use when
  asked to "weekly retro", "what did we ship", or "engineering retrospective".
  Proactively suggest at the end of a work week or sprint.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

## Prerequisites & Error Handling

Before gathering any data, verify the environment is usable:

```bash
# 1. Confirm we're in a git repo
git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT_A_GIT_REPO"

# 2. Detect default branch
gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo "GH_UNAVAILABLE"

# 3. Check gh authentication
gh auth status 2>/dev/null || echo "GH_NOT_AUTHENTICATED"
```

**Handling failures:**
- Not a git repo → Tell the user and stop.
- `gh` unavailable or not authenticated → Warn the user that PR and code review metrics will be unavailable. Fall back to commit-message-based PR detection and skip review metrics. Continue with everything else.
- Default branch detection fails → Fall back to `main`, then `master`. Check with `git rev-parse --verify origin/main` before proceeding.

Use the detected default branch name wherever the instructions say `origin/<default>` below.

---

# Weekly Engineering Retrospective

Generates a comprehensive engineering retrospective analyzing commit history, work patterns, code review health, and quality metrics. Team-aware: identifies the user running the command, then analyzes every contributor with per-person praise and growth opportunities.

## Arguments
- `/retro` — default: last 7 days
- `/retro 24h` — last 24 hours
- `/retro 14d` — last 14 days
- `/retro 30d` — last 30 days
- `/retro compare` — compare current window vs prior same-length window
- `/retro compare 14d` — compare with explicit window
- `/retro 7d src/` — scope to a subdirectory (monorepo support)

## Instructions

Parse the argument to determine the time window and optional path filter. Default to 7 days if no argument given. If a path is provided, append `-- <path>` to all git log commands to scope results to that subtree. All times should be reported in the user's **local timezone**.

**Midnight-aligned windows:** For day (`d`) and week (`w`) units, compute an absolute start date at local midnight, not a relative string. Use `--since="YYYY-MM-DDT00:00:00"` for git log queries. For hour (`h`) units, use `--since="N hours ago"`.

**Argument validation:** If the argument doesn't match a number followed by `d`, `h`, or `w`, the word `compare`, or `compare` followed by a number and `d`/`h`/`w` (optionally followed by a path), show usage and stop.

### Step 1: Gather Raw Data

First, fetch origin and identify the current user:
```bash
git fetch origin <default> --quiet
git config user.name
git config user.email
```

The name returned by `git config user.name` is **"you"** — the person reading this retro. All other authors are teammates.

Run these git commands in parallel. Commands 1-3 are structured to minimize redundant git traversals — each serves a distinct purpose (summary stats, per-file numstat, and timestamped ordering respectively):

```bash
# 1. All commits with timestamps, subject, hash, author, and change stats
git log origin/<default> --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. Per-commit file-level LOC breakdown with author (for test LOC ratio and hotspots)
git log origin/<default> --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. Commit timestamps sorted chronologically (for session detection and hourly distribution)
git log origin/<default> --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. Per-author commit counts
git shortlog origin/<default> --since="<window>" -sn --no-merges

# 5. TODOS.md backlog (if available)
cat TODOS.md 2>/dev/null || true

# 6. Test file count (comprehensive detection across ecosystems)
find . \( -name node_modules -o -name vendor -o -name dist -o -name build -o -name .git \) -prune -o \
  \( -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.*' -o -name '*_spec.*' \
     -o -name '*Test.php' -o -name '*_test.go' -o -name '*_test.py' \) \
  -print 2>/dev/null | wc -l

# 7. Test files changed in window (same broad patterns)
git log origin/<default> --since="<window>" --format="" --name-only | \
  grep -E '\.(test|spec)\.|Test\.php|_test\.(go|py)|__tests__/' | sort -u | wc -l

# 8. Regression test commits in window
git log origin/<default> --since="<window>" --oneline --grep="test(qa):" --grep="test(design):" --grep="test: coverage"
```

If a path filter was provided, append `-- <path>` to commands 1-4, 7, and 8.

### Step 1b: Gather PR & Review Data via GitHub API

This step provides much richer data than parsing commit messages for `#123` references (which catches false positives like issue refs and version bumps). If `gh` is unavailable, skip this step and note in the output that PR/review metrics are unavailable.

```bash
# Merged PRs in window — gives accurate PR list with metadata
gh pr list --state merged --search "merged:>=<YYYY-MM-DD>" --json number,title,additions,deletions,mergedAt,author,reviewRequests,reviews,comments,createdAt --limit 100

# If the above returns too many results or you need finer filtering:
gh pr list --state merged --search "merged:>=<YYYY-MM-DD> merged:<=<YYYY-MM-DD>" --json number,title,additions,deletions,mergedAt,author,reviewRequests,reviews,comments,createdAt --limit 100
```

From the PR data, extract:
- **PR count and size distribution** (replaces commit-message grep)
- **Review turnaround**: time from PR creation to first review
- **Review engagement**: average comments per PR, reviews given per person
- **Time to merge**: creation → merge duration
- **Approval-to-merge latency**: last approval → merge

These are some of the most actionable eng health metrics — they tell you about collaboration patterns and process bottlenecks in ways that commit history alone cannot.

### Step 1c: Compute Version Range

```bash
# Find the most recent tag before the window and the most recent tag within/after it
git tag --sort=-version:refname --merged origin/<default> | head -20
```

Compare the latest tag against the earliest tag that falls within (or just before) the retro window. If no tags exist, omit the version range row from the metrics table rather than guessing.

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
| Version range | vX.Y.Z → vX.Y.Z (omit if no tags) |
| Active days | N |
| Detected sessions | N |
| Avg LOC/session-hour | N |
| Avg commits/active-hour | N |
| Files touched/session | N |
| Test Health | N total tests · M added this period · K regression tests |
| Avg review turnaround | Nh (if gh available) |
| Avg time to merge | Nh (if gh available) |
| Avg comments/PR | N (if gh available) |

LOC/session-hour is useful for throughput, but it rewards verbosity. The commits/active-hour and files-touched/session metrics balance this by capturing how much ground is being covered regardless of line count.

Then show a **per-author leaderboard** immediately below:

```
Contributor         Commits   +/-          Reviews given   Top area
You (name)               32   +2400/-300              5   src/
alice                    12   +800/-150               8   app/services/
bob                       3   +120/-40                2   tests/
```

Sort by commits descending. The current user always appears first, labeled "You (name)". Include "Reviews given" column only if gh data is available.

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

Detect sessions using a **45-minute gap** threshold between consecutive commits. This works well for most synchronous workflows. For teams that work more asynchronously (long gaps between commit bursts), a 90-minute threshold may be more appropriate — use your judgment based on the data. If most "sessions" contain only 1 commit, the threshold is probably too tight.

For each session report start/end time, commit count, and duration.

Classify sessions:
- **Deep sessions** (50+ min)
- **Medium sessions** (20-50 min)
- **Micro sessions** (<20 min)

Calculate total active coding time, average session length, and these per-session metrics:
- LOC per hour of active time (round to nearest 50)
- Commits per active hour
- Files touched per session

### Step 5: Commit Type Breakdown

Categorize by conventional commit prefix (feat/fix/refactor/test/chore/docs). Show as percentage bar. Flag if fix ratio exceeds 50%.

### Step 6: Hotspot Analysis

From the numstat data in Step 1 (command 2), extract the top 10 most-changed files. Flag files changed 5+ times (churn hotspots). These are refactoring candidates — a file that gets touched in many separate PRs often has too many responsibilities.

### Step 7: PR Size Distribution

Using the GitHub API data from Step 1b (or commit-based estimation if gh is unavailable), bucket PR sizes:

| Bucket | LOC range |
|--------|-----------|
| Small  | < 100     |
| Medium | 100–500   |
| Large  | 500–1500  |
| XL     | 1500+     |

If gh data is available, also include:
- Median review turnaround per bucket (large PRs tend to wait longer — this makes that visible)
- Percentage of PRs in each bucket

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
7. Review participation (reviews given/received, if gh available)

**For the current user ("You"):** Deepest treatment. Include session analysis, time patterns, focus score. Frame in first person.

**For each teammate:** 2-3 sentences on contributions, then:
- **Praise** (1-2 specific things): Anchored in actual commits. Not "great work" — say exactly what was good.
- **Opportunity for growth** (1 specific thing): Frame as investment, not criticism. Anchored in data.

**If solo repo:** Skip team breakdown.

**AI collaboration note:** If many commits have `Co-Authored-By` AI trailers, note the AI-assisted commit percentage as a team metric.

### Step 10: Week-over-Week Trends (if window >= 14d)

Split into weekly buckets and show trends for commits, LOC, test ratio, fix ratio, session count. If gh data is available, also trend review turnaround and time-to-merge.

### Step 11: Streak Tracking

```bash
# Team streak: all unique commit dates
git log origin/<default> --format="%ad" --date=format:"%Y-%m-%d" | sort -u

# Personal streak: only the current user's commits
git log origin/<default> --author="<user_name>" --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```

Report two streak variants:
- **Calendar streak**: consecutive calendar days with commits (counting backward from today)
- **Workday streak**: consecutive weekdays (Mon–Fri) with commits, skipping weekends

The workday streak is the primary metric — it rewards consistent daily practice without penalizing healthy weekend breaks. Show the calendar streak as a secondary note for those who are curious.

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

Save a JSON snapshot with metrics, per-author data, version range, streak, review metrics, and tweetable summary. Use sequential filenames: `.context/retros/{date}-{N}.json`.

### Step 14: Write the Narrative

Structure the output as:

---

**Tweetable summary** (first line):
```
Week of Mar 1: 47 commits (3 contributors), 3.2k LOC, 38% tests, 12 PRs, peak: 10pm | Workday streak: 23d
```

## Engineering Retro: [date range]

### Summary Table
### Trends vs Last Retro (if available)
### Time & Session Patterns
### Shipping Velocity
### Code Review Health (if gh available)
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
1. Compute the current window boundaries: `--since="<start>" --until="<end>"` where end is now
2. Compute the prior window: `--since="<prior_start>" --until="<start>"` — the `--until` of the prior window is exactly the `--since` of the current window, ensuring no overlap and no gap
3. Run the full data-gathering steps for both windows
4. Show side-by-side comparison table with deltas and arrows (↑/↓)
5. Write a brief narrative highlighting improvements and regressions
6. Save only the current-window snapshot

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
- If `gh` is not available, gracefully degrade: skip PR/review metrics sections and note their absence, but produce everything else
