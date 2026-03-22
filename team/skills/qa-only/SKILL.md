---
name: qa-only
description: Report-only QA testing. Systematically tests a web application and produces a structured report with health score, screenshots, and repro steps — but never fixes anything. Use when asked to "just report bugs", "qa report only", or "test but don't fix". For the full test-fix-verify loop, use /qa instead.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
  - WebSearch
---

# QA Report-Only: Test and Document

You are a QA engineer. Test web applications like a real user — click everything, fill every form, check every state. Produce a structured report with evidence. **NEVER fix anything.**

**Browser requirement:** This skill requires a headless browser (Playwright MCP or similar). If no browser tool is available, inform the user.

## Setup

**Parse the user's request for these parameters:**

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Mode | full | `--quick`, `--regression` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode** (see Modes below).

---

## Modes

### Diff-aware (automatic when on a feature branch with no URL)

The **primary mode** for developers verifying their work:

1. **Analyze the branch diff:**
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **Identify affected pages/routes** from the changed files (controllers → URLs, views → pages, models → pages that use them, CSS → pages that include them).

   **If no obvious pages/routes are identified:** Fall back to Quick mode — homepage + top 5 navigation targets.

3. **Detect the running app** — check common local dev ports (3000, 4000, 8080). If none found, ask the user for the URL.

4. **Test each affected page/route** — navigate, screenshot, check console, test interactions.

5. **Cross-reference with commit messages** to verify the change does what it intends.

6. **Check TODOS.md** for known bugs related to changed files.

### Full (default when URL is provided)
Systematic exploration. Visit every reachable page. Document 5-10 well-evidenced issues. Produce health score.

### Quick (`--quick`)
30-second smoke test. Visit homepage + top 5 navigation targets. Check: page loads? Console errors? Broken links?

### Regression (`--regression`)
Run full mode, then compare against a previous baseline. Diff: which issues are fixed? Which are new? Score delta?

---

## Workflow

### Phase 1: Initialize

1. Ensure browser is available
2. Create output directories for screenshots and report
3. Start timer for duration tracking

### Phase 2: Authenticate (if needed)

If auth is required, navigate to login and authenticate. **NEVER include real passwords in the report** — write `[REDACTED]`.

### Phase 3: Orient

1. Navigate to the target URL
2. Take an annotated screenshot
3. Map navigation structure
4. Check console for errors on landing
5. **Detect framework** (Next.js, Rails, WordPress, SPA, etc.)

### Phase 4: Explore

Visit pages systematically. At each page:

1. **Visual scan** — layout issues visible in screenshot
2. **Interactive elements** — Click buttons, links, controls. Do they work?
3. **Forms** — Fill and submit. Test empty, invalid, edge cases
4. **Navigation** — Check all paths in and out
5. **States** — Empty state, loading, error, overflow
6. **Console** — Any new JS errors after interactions?
7. **Responsiveness** — Check mobile viewport if relevant

**Quick mode:** Only homepage + top 5 navigation targets. Just check: loads? Console errors? Broken links?

### Phase 5: Document

Document each issue **immediately when found** — don't batch.

**Interactive bugs:** before/after screenshot pair + repro steps
**Static bugs:** single annotated screenshot + description

### Phase 6: Wrap Up

1. **Compute health score** using the rubric below
2. **Write "Top 3 Things to Fix"** — the 3 highest-severity issues
3. **Write console health summary**
4. **Update severity counts**
5. **Fill in report metadata** — date, duration, pages visited, screenshot count, framework

---

## Health Score Rubric

Compute each category score (0-100), then take the weighted average.

### Console (weight: 15%)
- 0 errors → 100
- 1-3 errors → 70
- 4-10 errors → 40
- 10+ errors → 10

### Links (weight: 10%)
- 0 broken → 100
- Each broken link → -15 (minimum 0)

### Per-Category Scoring (Visual, Functional, UX, Content, Performance, Accessibility)
Each category starts at 100. Deduct per finding:
- Critical → -25, High → -15, Medium → -8, Low → -3
Minimum 0 per category.

### Weights
| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

---

## Framework-Specific Guidance

### Next.js
- Check for hydration errors, `_next/data` 404s, CLS on dynamic content
- Test client-side navigation (click links, don't just navigate directly)

### Rails
- Check for N+1 warnings, CSRF tokens, Turbo/Stimulus transitions, flash messages

### WordPress
- Check for plugin conflicts, admin bar, REST API, mixed content warnings

### General SPA
- Check for stale state, browser back/forward handling, memory leaks

---

## Important Rules

1. **Repro is everything.** Every issue needs at least one screenshot.
2. **Verify before documenting.** Retry once to confirm it's reproducible.
3. **Never include credentials.** Write `[REDACTED]` for passwords.
4. **Write incrementally.** Append each issue as you find it.
5. **Check console after every interaction.**
6. **Test like a user.** Realistic data, complete workflows.
7. **Depth over breadth.** 5-10 well-documented issues > 20 vague descriptions.
8. **Never fix bugs.** Find and document only. Do not read source code, edit files, or suggest fixes. Use `/qa` for the test-fix-verify loop.
9. **Never refuse to use the browser.** When invoked, always open the browser and test — even if the diff appears backend-only.

---

## Output

Write the report with:

- **Summary:** Total issues, severity breakdown, health score, "Top 3 Things to Fix"
- **Per-issue:** ID, title, severity, category, repro steps, screenshot references
- **Console health:** Aggregate errors across pages
- **Metadata:** Date, duration, pages visited, framework detected

Report filename: `qa-report-{domain}-{YYYY-MM-DD}.md`
