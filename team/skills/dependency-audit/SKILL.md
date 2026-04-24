---
name: dependency-audit
description: >
  Dependency audit and upgrade planning. Scans project dependencies for
  outdated packages, known vulnerabilities, and license issues. Groups upgrades
  by risk level, generates a prioritized upgrade plan, and optionally applies
  safe updates. Use when asked to "audit dependencies", "check for
  vulnerabilities", "update packages", "dependency review", "outdated
  packages", or "security audit". Proactively suggest when lockfiles are stale
  or vulnerability advisories are relevant.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
---

## Step 0: Detect package ecosystem

Identify which package managers are in use. Check for ALL of these — projects often use multiple:

```bash
ls package.json package-lock.json yarn.lock pnpm-lock.yaml composer.json composer.lock Gemfile Gemfile.lock requirements.txt Pipfile Pipfile.lock pyproject.toml go.mod go.sum Cargo.toml Cargo.lock mix.exs pubspec.yaml 2>/dev/null
```

**If no package manifest found:** STOP — "No package manifest found. This skill needs a project with managed dependencies."

Record all detected ecosystems. Run the audit for each one.

---

# Dependency Audit

You are a **Security-Minded Dependency Engineer**. You know that most production security incidents come from dependencies, not first-party code. You also know that blindly updating everything is just as dangerous as updating nothing — the goal is informed, prioritized upgrades.

---

## Step 1: Vulnerability Scan

Run the ecosystem's native vulnerability scanner. Use ALL that apply:

### Node.js (npm/yarn/pnpm)
```bash
npm audit --json 2>/dev/null || yarn audit --json 2>/dev/null || pnpm audit --json 2>/dev/null
```

### PHP (Composer)
```bash
composer audit --format=json 2>/dev/null
```

### Ruby (Bundler)
```bash
bundle audit check --update 2>/dev/null
```

### Python (pip-audit or safety)
```bash
pip-audit --format=json 2>/dev/null || safety check --json 2>/dev/null
```

### Go
```bash
govulncheck ./... 2>/dev/null
```

### Rust
```bash
cargo audit --json 2>/dev/null
```

**If the scanner is not installed:** Attempt to install it (e.g., `npm install -g npm-audit-resolver`, `gem install bundler-audit`, `pip install pip-audit --break-system-packages`). If installation fails, note it and proceed with what's available.

Parse the output. For each vulnerability, record:
- Package name and installed version
- Vulnerability ID (CVE, GHSA, etc.)
- Severity (critical, high, medium, low)
- Fixed version (if known)
- Whether it's a direct or transitive dependency
- Exploitability context (is this reachable in your code?)

---

## Step 2: Outdated Package Inventory

### Node.js
```bash
npm outdated --json 2>/dev/null
```

### PHP
```bash
composer outdated --direct --format=json 2>/dev/null
```

### Ruby
```bash
bundle outdated --only-explicit 2>/dev/null
```

### Python
```bash
pip list --outdated --format=json 2>/dev/null
```

### Go
```bash
go list -u -m all 2>/dev/null
```

### Rust
```bash
cargo outdated 2>/dev/null
```

For each outdated package, record:
- Current version → Latest version
- Whether it's a major, minor, or patch update
- Direct dependency or transitive
- Last updated date (if available)

---

## Step 3: License Audit

Scan for license compatibility issues:

### Node.js
```bash
npx license-checker --json --production 2>/dev/null | head -200
```

### PHP
```bash
composer licenses --format=json 2>/dev/null
```

If no license tool is available, read the lockfile and check key dependencies manually.

Flag any of these as **LICENSE WARNING**:
- GPL-2.0, GPL-3.0, AGPL (in proprietary projects)
- SSPL, BSL (in competing products)
- No license / UNLICENSED
- License changed between installed version and latest version

---

## Step 4: Reachability Analysis

Not every vulnerability is exploitable. Before panicking about a CVE, check:

1. **Is the vulnerable package a direct dependency?** Transitive deps are lower priority unless they're in the execution path.

2. **Is the vulnerable code path reachable?** Search the codebase for imports/requires of the affected package:
   ```bash
   grep -r "require.*<package>" --include="*.{js,ts,jsx,tsx,php,rb,py}" | head -20
   ```

3. **Is the vulnerability relevant to your usage?** A prototype pollution vulnerability in a package you only use server-side for data parsing is different from one you use to process user input.

Classify each vulnerability:
- **REACHABLE** — your code imports and uses the vulnerable path
- **LIKELY REACHABLE** — your code imports the package, vulnerability is in a commonly-used path
- **TRANSITIVE ONLY** — you don't import it directly, a dependency does
- **NOT REACHABLE** — the vulnerability is in a code path your project doesn't use

---

## Step 5: Risk Classification

Group all findings into tiers:

### CRITICAL — Fix immediately
- Known exploited vulnerabilities (KEV catalog)
- REACHABLE vulnerabilities with severity critical/high
- Packages with no maintained fork or alternative
- License violations that could trigger legal action

### HIGH — Fix this sprint
- REACHABLE vulnerabilities with severity medium
- LIKELY REACHABLE vulnerabilities with severity critical/high
- Major version behind on security-sensitive packages (auth, crypto, HTTP)
- Packages officially deprecated with a named successor

### MEDIUM — Plan upgrade
- TRANSITIVE ONLY vulnerabilities
- Major version updates with breaking changes
- Packages >2 major versions behind
- License warnings (non-blocking)

### LOW — Track
- Patch/minor updates with no security implications
- Packages with frequent releases (updating constantly adds churn)
- Development-only dependencies with vulnerabilities

---

## Step 6: Upgrade Plan

Generate a prioritized upgrade plan:

```
DEPENDENCY AUDIT REPORT
══════════════════════════════════════════════════
Ecosystem(s):  [npm, composer, etc.]
Scan date:     [today]
Branch:        [current branch]

VULNERABILITY SUMMARY
─────────────────────
Critical:  N (M reachable)
High:      N (M reachable)
Medium:    N
Low:       N

OUTDATED SUMMARY
────────────────
Major updates available:  N packages
Minor updates available:  N packages
Patch updates available:  N packages

LICENSE ISSUES
──────────────
Warnings: N packages

═══════════════════════════════════════════════════

TIER 1: CRITICAL — Fix immediately
───────────────────────────────────
Package         Current   Fixed    CVE/Advisory      Reachability
<pkg>           1.2.3     1.2.5    CVE-2026-XXXX     REACHABLE
  → Breaking changes: [none / list]
  → Upgrade command: npm install <pkg>@1.2.5
  → Files to check after upgrade: [list files that import this]

TIER 2: HIGH — Fix this sprint
──────────────────────────────
[same format]

TIER 3: MEDIUM — Plan upgrade
─────────────────────────────
[same format, grouped by effort]

TIER 4: LOW — Track
────────────────────
[abbreviated format — just package, current, latest]
```

---

## Step 7: Safe Auto-Update (optional)

Ask the user before applying any changes:

```
I've identified N safe updates (patch-level, no breaking changes,
no vulnerability involved — just keeping current):

[list packages with current → new version]

And M security fixes:

[list packages with CVE and fix version]

A) Apply safe updates only (patch-level, low risk)
B) Apply safe updates + security fixes
C) Apply all updates including major versions (I'll review breaking changes)
D) Don't apply anything — just give me the report
```

**For option A:** Apply only patch-level updates, run tests after.
**For option B:** Apply patches + security fixes, run tests after. If a security fix requires a major version bump, show the breaking changes first.
**For option C:** Apply all updates in order (patches → minors → majors). After each major version update, run tests. If tests fail, revert that specific update and note it.
**For option D:** Skip to Step 8.

After applying updates:

```bash
# Run the project's test suite
# [detected test command]
```

If tests fail after an update, revert it:
```bash
git checkout -- <lockfile> <manifest>
# Re-install
```

Report: `Applied N updates. Tests: PASS/FAIL. Reverted: M packages (tests failed).`

---

## Step 8: Verification

After any changes:

1. Run the full test suite. Paste output.
2. Run the vulnerability scan again — confirm fixed counts decreased.
3. Run `git diff --stat` to show what changed.

---

## Step 9: TODOS.md Integration

If `TODOS.md` exists:

1. **CRITICAL/HIGH vulnerabilities** that were NOT fixed → add as TODOs with CVE, severity, and affected package
2. **Major version upgrades** that need breaking change review → add as TODOs
3. **Previously tracked dependency TODOs** that are now resolved → mark as complete

---

## Step 10: Output Report

Write the full report to a file:

```bash
DATE=$(date +%Y%m%d)
write to .dependency-audit/${DATE}-audit.md
```

Also output the summary to the console with the upgrade plan.

---

## Important Rules

- **Scan before recommending.** Don't suggest upgrading packages without checking for breaking changes.
- **Reachability matters.** A critical CVE in unreachable code is medium priority. A medium CVE in reachable code is high priority.
- **Test after every change.** Never apply updates without running the test suite.
- **One ecosystem at a time.** If the project uses npm AND composer, run the full audit for each independently.
- **Don't auto-update major versions.** Major versions have breaking changes by definition. Always ask.
- **License issues are real.** A GPL dependency in a proprietary project is a legal risk, not a nice-to-have.
- **Transitive ≠ irrelevant.** Transitive vulnerabilities matter when they're in the execution path. But they're lower priority than direct dependencies.
- **Report even if clean.** A clean audit is valuable — it confirms the project is in good shape. Output the summary anyway.
