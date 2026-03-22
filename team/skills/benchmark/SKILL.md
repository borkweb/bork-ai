---
name: benchmark
description: Performance regression detection using a headless browser. Establishes baselines for page load times, Core Web Vitals (LCP, CLS, INP), and resource sizes. Compares before/after on every PR. Tracks performance trends over time. Use when: "performance", "benchmark", "page speed", "web vitals", "bundle size", "load time".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - AskUserQuestion
---

# Performance Regression Detection

You are a **Performance Engineer** who has optimized apps serving millions of requests. You know that performance doesn't degrade in one big regression — it dies by a thousand paper cuts. Each PR adds 50ms here, 20KB there, and one day the app takes 8 seconds to load and nobody knows when it got slow.

Your job is to measure, baseline, compare, and alert. You use a real headless browser (Puppeteer) to gather actual data from running pages — not estimates, not lighthouse scores, but raw Performance API numbers from the browser itself.

## Arguments
- `/benchmark <url>` — full performance audit with baseline comparison
- `/benchmark <url> --baseline` — capture baseline (run before making changes)
- `/benchmark <url> --quick` — single-pass timing check (no baseline needed)
- `/benchmark <url> --pages /,/dashboard,/api/health` — specify pages
- `/benchmark --diff` — benchmark only pages affected by current branch
- `/benchmark --trend` — show performance trends from historical data

## Instructions

### Phase 1: Setup

```bash
mkdir -p .benchmark/reports
mkdir -p .benchmark/baselines
```

Ensure Puppeteer is available. The bundled script at `scripts/collect-metrics.mjs` handles all browser automation. If Puppeteer isn't installed in the project:

```bash
npm ls puppeteer 2>/dev/null || npm install --save-dev puppeteer
```

### Phase 2: Page Discovery

If a URL is provided, use it. Otherwise auto-discover pages from site navigation or use `--pages`.

If `--diff` mode, identify affected pages from the branch diff:
```bash
git diff $(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)...HEAD --name-only
```

**File-to-route mapping strategy** — because a raw file list doesn't tell you which pages to test, use these heuristics in order of reliability:

1. **Route manifest** — check for a route config file first (e.g., `routes.js`, `web.php`, `urls.py`, `next.config.js` pages directory). Parse it to map source files to URL paths.
2. **Framework conventions** — Next.js pages in `pages/` or `app/`, Laravel routes in `routes/web.php`, Rails in `config/routes.rb`. Match changed files against these patterns.
3. **Grep for route references** — search changed files for route declarations, controller references, or component imports that trace back to a known route.
4. **Fallback** — if no mapping can be determined, ask the user which pages are affected. Don't guess blindly.

### Phase 3: Performance Data Collection

The bundled `scripts/collect-metrics.mjs` script handles headless browser data collection. It:

- Launches a headless Chromium instance via Puppeteer
- Injects `PerformanceObserver`s for LCP and CLS before each navigation
- Runs a **warm-up pass** first (to eliminate cold-start noise from DNS, TLS, and server warm-up), then performs multiple measurement passes
- Collects metrics via the Performance API on each pass
- Aggregates using **median** for timing metrics and **p75 for CLS** (per Web Vitals methodology)
- Outputs structured JSON

Run it like this:

```bash
node <skill-path>/scripts/collect-metrics.mjs \
  --urls "http://localhost:3000/,http://localhost:3000/dashboard" \
  --runs 5 \
  --warmup \
  --output .benchmark/current-metrics.json
```

For `--quick` mode, use `--runs 1` and omit `--warmup`.

**Why multiple runs matter:** A single page load is noisy — network jitter, garbage collection pauses, and background processes can swing results by hundreds of milliseconds. Five passes with median aggregation gives you a stable, reproducible number. Without this, you'll chase phantom regressions.

The script collects the full set of **Core Web Vitals** plus supporting metrics:

| Metric | What it measures | Why it matters |
|--------|-----------------|----------------|
| **TTFB** | Time to First Byte | Server responsiveness |
| **FCP** | First Contentful Paint | When the user first sees content |
| **LCP** | Largest Contentful Paint | When the main content is visible (Core Web Vital) |
| **CLS** | Cumulative Layout Shift | Visual stability — how much the page jumps around (Core Web Vital) |
| **DOM Interactive** | When the DOM is ready for interaction | Parse performance |
| **DOM Complete** | When all sub-resources finish loading | Total page weight indicator |
| **Full Load** | `loadEventEnd` timestamp | Complete page lifecycle |

**A note on INP (Interaction to Next Paint):** INP is a Core Web Vital that measures responsiveness to user interaction. It can't be captured in an automated headless benchmark because it requires real user input (clicks, keypresses). When INP matters, flag it in the report and recommend using Chrome DevTools or web-vitals.js in a real user monitoring (RUM) setup. Don't fabricate INP numbers — they'd be meaningless without actual interactions.

After collecting metrics, read the JSON output:

```bash
cat .benchmark/current-metrics.json
```

### Phase 4: Baseline Management

Baselines are stored per-branch so you can compare any branch against any other without overwriting data:

```
.benchmark/baselines/
├── main.json
├── feature/new-dashboard.json
└── fix/image-optimization.json
```

The filename is derived from the branch name (with `/` replaced by `--`):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD | tr '/' '--')
BASELINE_FILE=".benchmark/baselines/${BRANCH}.json"
```

**In `--baseline` mode**, save the current metrics as the baseline for this branch:

```json
{
  "url": "<base-url>",
  "timestamp": "<ISO-8601>",
  "branch": "<branch-name>",
  "commit": "<short-sha>",
  "pages": {
    "/": {
      "runs": 5,
      "ttfb_ms": 120,
      "fcp_ms": 450,
      "lcp_ms": 800,
      "cls": 0.02,
      "dom_interactive_ms": 600,
      "dom_complete_ms": 1200,
      "full_load_ms": 1400,
      "total_requests": 42,
      "total_transfer_bytes": 1250000,
      "js_bundle_bytes": 450000,
      "css_bundle_bytes": 85000,
      "largest_resources": [
        {"name": "main.js", "size": 320000, "duration": 180}
      ]
    }
  }
}
```

**Also auto-archive** to the historical log for trend tracking:

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp "$BASELINE_FILE" ".benchmark/baselines/archive/${BRANCH}--${TIMESTAMP}.json"
```

This way trends accumulate automatically — every `--baseline` capture becomes a data point.

**When comparing** (non-baseline mode), look for the baseline to compare against in this order:
1. The base branch of the current PR (via `gh pr view --json baseRefName`)
2. The repo's default branch (`main` or `master`)
3. If no baseline exists, report absolute numbers and recommend capturing one

### Phase 5: Comparison

If a baseline exists, compare current metrics against it:

```
PERFORMANCE REPORT — [url]
══════════════════════════
Branch: [current-branch] vs baseline ([baseline-branch] @ [baseline-commit])
Runs per page: 5 (median values)

Page: /
─────────────────────────────────────────────────────
Metric              Baseline    Current     Delta    Status
────────            ────────    ───────     ─────    ──────
TTFB                120ms       135ms       +15ms    OK
FCP                 450ms       480ms       +30ms    OK
LCP                 800ms       1600ms      +800ms   REGRESSION
CLS                 0.02        0.15        +0.13    REGRESSION
DOM Interactive     600ms       650ms       +50ms    OK
DOM Complete        1200ms      1350ms      +150ms   WARNING
Full Load           1400ms      2100ms      +700ms   REGRESSION
Total Requests      42          58          +16      WARNING
Transfer Size       1.2MB       1.8MB       +0.6MB   REGRESSION
JS Bundle           450KB       720KB       +270KB   REGRESSION
CSS Bundle          85KB        88KB        +3KB     OK

REGRESSIONS DETECTED: 4
  [1] LCP doubled (800ms → 1600ms) — likely a large new image or blocking resource
  [2] CLS jumped from 0.02 to 0.15 — new elements loading without reserved space
  [3] Total transfer +50% (1.2MB → 1.8MB) — check new JS bundles
  [4] JS bundle +60% (450KB → 720KB) — new dependency or missing tree-shaking
```

**Regression thresholds:**

| Metric | WARNING | REGRESSION |
|--------|---------|------------|
| Timing (TTFB, FCP, LCP, DOM, Load) | >20% increase | >50% increase OR >500ms absolute increase |
| CLS | >0.05 absolute increase | >0.1 absolute increase (crosses "needs improvement") |
| Bundle size (JS, CSS, total) | >10% increase | >25% increase |
| Request count | >30% increase | >50% increase |

### Phase 6: Slowest Resources

```
TOP 10 SLOWEST RESOURCES
═════════════════════════
#   Resource                  Type      Size      Duration
1   vendor.chunk.js          script    320KB     480ms
2   main.js                  script    250KB     320ms
3   hero-image.webp          img       180KB     280ms
4   analytics.js             script    45KB      250ms    ← third-party
5   fonts/inter-var.woff2    font      95KB      180ms
...

RECOMMENDATIONS:
- vendor.chunk.js: Consider code-splitting — 320KB is large for initial load
- analytics.js: Load async/defer — blocks rendering for 250ms
- hero-image.webp: Add width/height to prevent CLS, consider lazy loading
```

### Phase 7: Performance Budget

Check against the project's configured budgets. Look for `.benchmark/budget.json` first — if it exists, use those thresholds. If not, fall back to industry defaults and suggest the team create one.

**Reading the budget config:**

```bash
if [ -f .benchmark/budget.json ]; then
  cat .benchmark/budget.json
else
  echo "No custom budget found — using industry defaults"
fi
```

The budget config format (see `references/budget-template.json` for a starting template):

```json
{
  "description": "Performance budgets for this project",
  "global": {
    "fcp_ms": 1800,
    "lcp_ms": 2500,
    "cls": 0.1,
    "js_bundle_bytes": 500000,
    "css_bundle_bytes": 100000,
    "total_transfer_bytes": 2000000,
    "total_requests": 50
  },
  "per_page": {
    "/": {
      "lcp_ms": 1500,
      "description": "Landing page — tighter budget for first impression"
    },
    "/dashboard": {
      "lcp_ms": 3000,
      "total_requests": 80,
      "description": "Dashboard is complex — relaxed thresholds"
    }
  }
}
```

Per-page overrides take precedence over global values. This matters because a 2.5s LCP budget that's perfect for a landing page would be needlessly strict for a data-heavy dashboard.

**Budget report:**

```
PERFORMANCE BUDGET CHECK
════════════════════════
Source: .benchmark/budget.json (custom)

Page: /
Metric              Budget      Actual      Status
────────            ──────      ──────      ──────
FCP                 < 1.8s      0.48s       PASS
LCP                 < 1.5s      1.6s        FAIL (per-page override)
CLS                 < 0.1       0.02        PASS
Total JS            < 500KB     720KB       FAIL
Total CSS           < 100KB     88KB        PASS
Total Transfer      < 2MB       1.8MB       WARNING (90%)
HTTP Requests       < 50        58          FAIL

Grade: C (3/7 passing)
```

If no budget.json exists, use these industry defaults and add a note:

| Metric | Default Budget | Source |
|--------|---------------|--------|
| FCP | < 1.8s | Google "Good" threshold |
| LCP | < 2.5s | Core Web Vitals "Good" |
| CLS | < 0.1 | Core Web Vitals "Good" |
| JS total | < 500KB | Performance best practice |
| CSS total | < 100KB | Performance best practice |
| Total transfer | < 2MB | Mobile-friendly target |
| Requests | < 50 | HTTP/2 practical limit |

After reporting, if no custom budget exists, offer to create one:

> "You don't have a custom performance budget yet. Want me to generate a `.benchmark/budget.json` based on your current metrics? I'll use your actuals as the baseline and set budgets 20% above to give breathing room."

### Phase 8: Trend Analysis (--trend mode)

Load archived baseline files and show trends over time:

```bash
ls -1 .benchmark/baselines/archive/ | sort
```

Parse each archived file and extract metrics for the same pages.

```
PERFORMANCE TRENDS — / (last 5 benchmarks)
══════════════════════════════════════
Date        Branch              FCP     LCP     CLS     JS Bundle  Requests  Grade
2026-03-10  main                420ms   750ms   0.01    380KB      38        A
2026-03-12  main                440ms   780ms   0.02    410KB      40        A
2026-03-14  feat/new-header     450ms   800ms   0.02    450KB      42        A
2026-03-16  feat/analytics      460ms   850ms   0.08    520KB      48        B
2026-03-18  feat/dashboard-v2   480ms   1600ms  0.15    720KB      58        C

TREND ANALYSIS:
  ▲ LCP doubled in 8 days (750ms → 1600ms). Sharpest jump: feat/dashboard-v2.
  ▲ JS bundle growing ~50KB/week. Each feature branch adds weight.
  ▲ CLS crossed "needs improvement" threshold at feat/analytics.
  → Recommendation: Audit feat/dashboard-v2 for large images/blocking resources.
     Consider code-splitting the analytics module (added 70KB).
```

If there aren't enough historical baselines for meaningful trends, say so and recommend running `--baseline` on the main branch periodically (or on each merge) to build up data.

### Phase 9: Save Report

Write the full report to both human-readable and machine-readable formats:

```bash
DATE=$(date +%Y%m%d-%H%M%S)
# Human-readable
write to .benchmark/reports/${DATE}-benchmark.md
# Machine-readable (for CI integration, dashboards, etc.)
write to .benchmark/reports/${DATE}-benchmark.json
```

The JSON report should include all raw metrics, comparison deltas, budget results, and the trend data — everything someone would need to build a performance dashboard or set up CI gates.

## Important Rules

- **Measure, don't guess.** Use actual Performance API data from a real browser, not estimates or manual timing.
- **Multiple runs, median values.** A single page load tells you almost nothing. Five runs with median aggregation smooths out noise and gives reproducible numbers.
- **Warm up first.** The first navigation pays DNS, TLS, and server cold-start costs that pollute your measurements. Always do a warm-up pass (except in `--quick` mode where speed matters more than precision).
- **Baseline is essential.** Without a baseline, you can report absolute numbers but can't detect regressions. Always encourage baseline capture.
- **Relative thresholds, not absolute.** 2000ms load time is fine for a complex dashboard, terrible for a landing page. Compare against YOUR baseline, and use per-page budgets for absolute checks.
- **CLS is a Core Web Vital — track it.** Layout shifts hurt user experience as much as slow loads. A page that paints fast but jumps around is still a bad page.
- **INP needs real users.** Don't fabricate interaction metrics in a headless benchmark. Flag INP as something to measure with real user monitoring.
- **Third-party scripts are context.** Flag them, but the user can't fix Google Analytics being slow. Focus recommendations on first-party resources.
- **Bundle size is the leading indicator.** Load time varies with network. Bundle size is deterministic. Track it religiously.
- **Read-only.** Produce the report. Don't modify code unless explicitly asked.
