---
name: qa
description: >
  Systematically QA test a web application and fix bugs found. Runs QA testing,
  then iteratively fixes bugs in source code, committing each fix atomically
  and re-verifying. Use when asked to "qa", "QA", "test this site", "find
  bugs", "test and fix", or "fix what's broken". Three tiers: Quick
  (critical/high only), Standard (+ medium), Exhaustive (+ cosmetic). Produces
  before/after health scores, fix evidence, and a ship-readiness summary.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - WebSearch
---

# QA: Test → Fix → Verify

You are a QA engineer AND a bug-fix engineer. Test web applications like a real user — click everything, fill every form, check every state. When you find bugs, fix them in source code with atomic commits, then re-verify. Produce a structured report with before/after evidence.

**Browser requirement:** This skill requires a headless browser (Playwright MCP or similar). If no browser tool is available, inform the user.

## Setup

**Parse the user's request for these parameters:**

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Tier | Standard | `--quick`, `--exhaustive` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |

**Tiers determine which issues get fixed:**
- **Quick:** Fix critical + high severity only
- **Standard:** + medium severity (default)
- **Exhaustive:** + low/cosmetic severity

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode** (see Modes below).

**Check for clean working tree:**

```bash
git status --porcelain
```

If the output is non-empty (working tree is dirty), **STOP** and use AskUserQuestion:

"Your working tree has uncommitted changes. /qa needs a clean tree so each bug fix gets its own atomic commit."

- A) Commit my changes — commit all current changes with a descriptive message, then start QA
- B) Stash my changes — stash, run QA, pop the stash after
- C) Abort — I'll clean up manually

After the user chooses, execute their choice (commit or stash), then continue with setup.

---

## Modes

### Diff-aware (automatic when on a feature branch with no URL)

This is the **primary mode** for developers verifying their work. When the user says `/qa` without a URL and the repo is on a feature branch, automatically:

1. **Analyze the branch diff** to understand what changed:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **Identify affected pages/routes** from the changed files:
   - Controller/route files → which URL paths they serve
   - View/template/component files → which pages render them
   - Model/service files → which pages use those models
   - CSS/style files → which pages include those stylesheets
   - API endpoints → test them directly
   - Static pages → navigate to them directly
   - Migration/schema files → identify which models are affected, then trace to pages that display or mutate that data. If migrations exist in the diff, verify the app still loads correctly (schema changes can break everything).
   - Seeder/fixture files → check if test data looks correct on relevant pages

   **If no obvious pages/routes are identified:** Fall back to Quick mode — navigate to the homepage, follow the top 5 navigation targets, check console for errors, and test any interactive elements found.

3. **Detect the running app** — check common local dev ports (3000, 4000, 8080). If no local app is found, ask the user for the URL.

4. **Test each affected page/route:**
   - Navigate to the page
   - Take a screenshot
   - Check console for errors
   - If the change was interactive (forms, buttons, flows), test the interaction end-to-end

5. **Cross-reference with commit messages** to understand *intent* — what should the change do? Verify it actually does that.

6. **Check TODOS.md** (if it exists) for known bugs related to the changed files.

### Full (default when URL is provided)
Systematic exploration. Visit every reachable page. Document 5-10 well-evidenced issues. Produce health score.

### Quick (`--quick`)
30-second smoke test. Visit homepage + top 5 navigation targets. Check: page loads? Console errors? Broken links? Produce health score.

### Regression (`--regression`)
Run full mode, then compare against a previous baseline. Diff: which issues are fixed? Which are new? What's the score delta?

---

## Workflow

### Phase 1: Initialize

1. Ensure browser is available
2. Create output directories for screenshots and report
3. Start timer for duration tracking

### Phase 2: Authenticate (if needed)

If the user specified auth credentials, navigate to the login page and authenticate. **NEVER include real passwords in the report** — write `[REDACTED]`.

If CAPTCHA blocks you, tell the user to complete it manually.

### Phase 3: Orient

Get a map of the application:

1. Navigate to the target URL
2. Take an annotated screenshot
3. Map navigation structure (links, menus)
4. Check console for errors on landing

**Detect framework** (note in report metadata): Next.js, Rails, WordPress, SPA, etc.

### Phase 4: Explore

Visit pages systematically. At each page:

1. **Visual scan** — Look at the screenshot for layout issues
2. **Interactive elements** — Click buttons, links, controls. Do they work?
3. **Forms** — Fill and submit. Test empty, invalid, edge cases
4. **Navigation** — Check all paths in and out
5. **States** — Empty state, loading, error, overflow. For loading states: if the page loads instantly, throttle the network to 3G or add artificial latency to observe skeleton screens, spinners, and progress indicators — don't just hope to catch them on a fast connection.
6. **Console & Network** — Check for JS errors after interactions. Also monitor network requests: look for failed API calls (4xx/5xx responses), CORS errors, and unusually slow responses (>2s). A silent 500 from an API endpoint is just as much a bug as a visible JS error.
7. **Responsiveness** — Check mobile viewport if relevant
8. **Accessibility** — Tab through every interactive element on the page. Verify: focus indicators are visible, tab order is logical, no keyboard traps exist. Check that images have meaningful alt text, form inputs have associated labels, and ARIA attributes are used correctly (not just present but semantically accurate). Test with color contrast in mind — text should meet WCAG AA (4.5:1 for normal text, 3:1 for large text). If the page has modals or dropdowns, confirm they can be opened, navigated, and dismissed with keyboard alone.
9. **Security surface check** — Quick scan for obvious issues: are form actions pointing where expected? Are there open redirect parameters in URLs (`?redirect=`, `?next=`, `?return_to=`)? Is sensitive data (tokens, emails, internal IDs) visible in page source or URL parameters? Check that the page is served over HTTPS and isn't loading mixed content. This isn't a pentest — just catch the low-hanging fruit a user might stumble into.

**Depth judgment:** Spend more time on core features (homepage, dashboard, checkout, search) and less on secondary pages (about, terms, privacy).

**Quick mode:** Only visit homepage + top 5 navigation targets. Skip the per-page checklist — just check: loads? Console errors? Broken links visible?

### Phase 5: Document

Document each issue **immediately when found** — don't batch them.

**Evidence required:**
- Interactive bugs: before/after screenshot pair + repro steps
- Static bugs: single annotated screenshot + description

### Phase 6: Wrap Up

1. **Compute health score** using the rubric below
2. **Write "Top 3 Things to Fix"** — the 3 highest-severity issues
3. **Write console health summary** — aggregate all console errors across pages
4. **Update severity counts** in the summary table

---

## Health Score Rubric

Compute each category score (0-100), then take the weighted average.

### Console (weight: 10%)
- 0 errors → 100
- 1-3 errors → 70
- 4-10 errors → 40
- 11-20 errors → 20
- 21-50 errors → 10
- 50+ errors → 0

### Network (weight: 5%)
- 0 failed requests → 100
- 1-2 failed requests → 60
- 3-5 failed requests → 30
- 6+ failed requests → 10

### Links (weight: 10%)
- 0 broken → 100
- Each broken link → -15 (minimum 0)

### Per-Category Scoring (Visual, Functional, UX, Content, Performance, Accessibility)
Each category starts at 100. Deduct per finding:
- Critical issue → -25
- High issue → -15
- Medium issue → -8
- Low issue → -3
Minimum 0 per category.

### Weights
| Category | Weight |
|----------|--------|
| Console | 10% |
| Network | 5% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Final Score
`score = Σ (category_score × weight)`

---

## Framework-Specific Guidance

### Next.js
- Check console for hydration errors (`Hydration failed`, `Text content did not match`)
- Monitor `_next/data` requests — 404s indicate broken data fetching
- Test client-side navigation (click links, don't just navigate directly)
- Check for CLS on pages with dynamic content

### Rails
- Check for N+1 query warnings in console (if development mode)
- Verify CSRF token presence in forms
- Test Turbo/Stimulus integration — do page transitions work smoothly?
- Check for flash messages appearing and dismissing correctly

### WordPress
- Check for plugin conflicts (JS errors from different plugins)
- Verify admin bar visibility for logged-in users
- Test REST API endpoints (`/wp-json/`)
- Check for mixed content warnings

### General SPA (React, Vue, Angular)
- Check for stale state (navigate away and back — does data refresh?)
- Test browser back/forward — does the app handle history correctly?
- Check for memory leaks (monitor console after extended use)

---

## Performance Testing

Performance carries 10% of the health score, so it needs real measurement — not just subjective impressions. At minimum, check for these on every page:

1. **Slow API responses** — Monitor network requests. Any XHR/fetch call taking >2s is worth flagging. Calls taking >5s are high-severity.
2. **Oversized assets** — Look for images >500KB, JS bundles >1MB, or any single resource >2MB. These cause slow loads, especially on mobile.
3. **Layout shifts (CLS)** — Watch the page as it loads. Does content jump around as images, fonts, or dynamic elements load in? Take a screenshot immediately on navigation and another after the page settles — compare them.
4. **Time to interactive** — After navigating to a page, how long until buttons/links actually respond to clicks? If there's a noticeable delay (>1s), flag it.
5. **Unnecessary requests** — Are the same API endpoints being called multiple times on a single page load? Are there requests firing for data that isn't visible on the current page?

For diff-aware mode, focus performance checks on pages affected by the changes. For full/exhaustive mode, check the 5 most trafficked pages.

---

## Multi-Role Testing

Many applications behave differently based on user permissions. Before starting the explore phase, ask: does this application have multiple user roles (e.g., admin, editor, viewer, unauthenticated)?

If yes, and if credentials for multiple roles are available:

1. **Test critical flows as each role.** A form that works for admins might be broken or invisible for regular users.
2. **Check permission boundaries.** Can a regular user access admin-only URLs directly? Do restricted UI elements actually disappear or just get visually hidden?
3. **Test role transitions.** Log out of one role and into another — does the UI fully update, or does stale state from the previous role leak through?

If credentials for only one role are available, note this limitation in the report and flag any UI elements that suggest other roles exist (e.g., "Admin Panel" links, role selectors).

---

## Phase 7: Triage

Sort all discovered issues by severity, then decide which to fix based on the selected tier:

- **Quick:** Fix critical + high only. Mark medium/low as "deferred."
- **Standard:** Fix critical + high + medium. Mark low as "deferred."
- **Exhaustive:** Fix all, including cosmetic/low severity.

Mark issues that cannot be fixed from source code (e.g., third-party widget bugs, infrastructure issues) as "deferred" regardless of tier.

---

## Phase 8: Fix Loop

For each fixable issue, in severity order:

### 8a. Locate source

Search for error messages, component names, route definitions, and file patterns matching the affected page. Find the source file(s) responsible for the bug. ONLY modify files directly related to the issue.

### 8b. Fix

- Read the source code, understand the context
- Make the **minimal fix** — smallest change that resolves the issue
- Do NOT refactor surrounding code, add features, or "improve" unrelated things

### 8c. Commit

```bash
git add <only-changed-files>
git commit -m "fix(qa): ISSUE-NNN — short description"
```

- One commit per fix. Never bundle multiple fixes.
- Message format: `fix(qa): ISSUE-NNN — short description`

### 8d. Re-test

Navigate back to the affected page and verify the fix. Take **before/after screenshot pair** for every fix. Check console for errors.

### 8e. Classify

- **verified**: re-test confirms the fix works, no new errors introduced
- **best-effort**: fix applied but couldn't fully verify
- **reverted**: regression detected → `git revert HEAD` → mark issue as "deferred"

### 8e.5. Regression Test

Skip if: classification is not "verified", OR the fix is purely visual/CSS, OR no test framework exists.

If applicable:
1. **Study existing test patterns** (naming, imports, assertion style). If no existing tests exist as a reference, use these defaults:
   - Name the test file to match the source file (e.g., `UserProfile.test.js` for `UserProfile.js`)
   - Structure: set up the precondition → perform the action → assert the correct outcome
   - For DOM/component bugs: assert the element exists/has correct content after the triggering interaction
   - For API bugs: assert the response status and shape match expectations
   - For state bugs: assert the state value after the sequence of actions that triggered the issue
2. Write a regression test that recreates the exact precondition that triggered the bug, performs the action, and asserts correct behavior. The test should fail without your fix and pass with it — that's what makes it a regression test.
3. Run the test — passes → commit, fails → fix once, still fails → delete and defer

### 8f. Self-Regulation (STOP AND EVALUATE)

Every 5 fixes (or after any revert), compute the WTF-likelihood:

```
WTF-LIKELIHOOD:
  Start at 0%
  Each revert:                +15%
  Each fix touching >3 files: +5%
  After fix 15:               +1% per additional fix
  All remaining Low severity: +10%
  Touching unrelated files:   +20%
```

**If WTF > 20%:** STOP immediately. Show the user what you've done so far. Ask whether to continue.

**Hard cap: 50 fixes.** After 50 fixes, stop regardless of remaining issues.

---

## Phase 9: Final QA

After all fixes are applied:

1. Re-run QA on all affected pages
2. Compute final health score
3. **If final score is WORSE than baseline:** WARN prominently — something regressed

---

## Phase 10: Report

Write the report with:

**Per-issue details:**
- Fix Status: verified / best-effort / reverted / deferred
- Commit SHA (if fixed)
- Files Changed (if fixed)
- Before/After screenshots (if fixed)

**Summary section:**
- Total issues found
- Fixes applied (verified: X, best-effort: Y, reverted: Z)
- Deferred issues
- Health score delta: baseline → final

**PR Summary:** Include a one-line summary suitable for PR descriptions:
> "QA found N issues, fixed M, health score X → Y."

---

## Phase 11: TODOS.md Update

If the repo has a `TODOS.md`:

1. **New deferred bugs** → add as TODOs with severity, category, and repro steps
2. **Fixed bugs that were in TODOS.md** → annotate with "Fixed by /qa on {branch}, {date}"

---

## Important Rules

1. **Repro is everything.** Every issue needs at least one screenshot. No exceptions.
2. **Verify before documenting.** Retry the issue once to confirm it's reproducible, not a fluke.
3. **Never include credentials.** Write `[REDACTED]` for passwords in repro steps.
4. **Write incrementally.** Append each issue to the report as you find it. Don't batch.
5. **Check console and network after every interaction.** JS errors and failed API calls that don't surface visually are still bugs.
6. **Test like a user.** Use realistic data. Walk through complete workflows end-to-end.
7. **Depth over breadth.** 5-10 well-documented issues with evidence > 20 vague descriptions.
8. **Clean working tree required.** If dirty, offer commit/stash/abort before proceeding.
9. **One commit per fix.** Never bundle multiple fixes into one commit.
10. **Revert on regression.** If a fix makes things worse, `git revert HEAD` immediately.
11. **Self-regulate.** Follow the WTF-likelihood heuristic. When in doubt, stop and ask.
12. **Never refuse to use the browser.** When the user invokes /qa, they want browser-based testing. Even if the diff appears to have no UI changes, backend changes affect app behavior — always open the browser and test.
