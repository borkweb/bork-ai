# team

Development workflow skills — planning, review, QA, shipping, and retrospectives. Ported from [gstack](https://github.com/garryslist/gstack) with gstack-specific infrastructure removed.

## Quick Start

1. Run `/plan-session` — describe what you're building. It will reframe the problem before you write a line of code.
2. Run `/plan-deep-review` on any feature idea
3. Run `/plan-eng-review` on any plan
4. Run `/review` on any branch with changes
5. Run `/qa` on your staging URL

## See it work

```
You:    I want to build a daily briefing app for my calendar.
You:    /plan-session
Claude: [asks about the pain — specific examples, not hypotheticals]

You:    Multiple Google calendars, events with stale info, wrong locations.
        Prep takes forever and the results aren't good enough...

Claude: I'm going to push back on the framing. You said "daily briefing
        app." But what you actually described is a personal chief of
        staff AI.
        [extracts 5 capabilities you didn't realize you were describing]
        [challenges 4 premises — you agree, disagree, or adjust]
        [generates 3 implementation approaches with effort estimates]
        RECOMMENDATION: Ship the narrowest wedge tomorrow, learn from
        real usage. The full vision is a 3-month project — start with
        the daily briefing that actually works.
        [writes design doc → feeds into downstream skills automatically]

You:    /plan-deep-review
        [reads the design doc, challenges scope, runs 10-section review]

You:    /plan-eng-review
        [ASCII diagrams for data flow, state machines, error paths]
        [test matrix, failure modes, security concerns]

You:    Approve plan. Exit plan mode.
        [writes 2,400 lines across 11 files. ~8 minutes.]

You:    /review
        [AUTO-FIXED] 2 issues. [ASK] Race condition → you approve fix.

You:    /qa https://staging.myapp.com
        [opens real browser, clicks through flows, finds and fixes a bug]

You:    /ship
        Tests: 42 → 51 (+9 new). PR: github.com/you/app/pull/42
```

You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Then it challenged your premises, generated three approaches, recommended the narrowest wedge, and wrote a design doc that fed into every downstream skill. Eight commands. That is not a copilot. That is a team.

## Skills

This is a process, not a collection of tools. The skills are ordered the way a sprint runs:

Think → Plan → Build → Review → Test → Ship → Reflect

Each skill feeds into the next. `/plan-session` writes a design doc that `/plan-deep-review` reads. `/plan-eng-review` writes a test plan that `/qa` picks up. `/review` catches bugs that `/ship` verifies are fixed. Nothing falls through the cracks because every step knows what came before it.

One sprint, one person, one feature — that takes about 30 minutes with this stack. But here's what changes everything: you can run 10-15 of these sprints in parallel. Different features, different branches, different agents — all at the same time.

| Skill | Specialist | Command | Description |
|-------|------------|---------|-------------|
| **plan-session** | Product Owner | `/plan-session` | Structured product design session — forces hard questions about demand, status quo, and narrowest wedge before proposing solutions. Produces a design doc, not code. |
| **plan-deep-review** | Product Owner | `/plan-deep-review` | Deep plan review with four modes (Scope Expansion, Selective Expansion, Hold Scope, Scope Reduction). Challenges premises, maps failure modes, reviews architecture/security/performance/deployment. |
| **plan-eng-review** | Eng Manager | `/plan-eng-review` | Eng manager-mode plan review. Locks in execution plan — architecture, data flow, diagrams, edge cases, test coverage, performance. Interactive with opinionated recommendations. |
| **plan-design-review** | Senior Designer | `/plan-design-review` | Designer's eye plan review. Rates 7 design dimensions 0-10, explains what would make each a 10, then fixes the plan to get there. Covers info architecture, interaction states, user journey, AI slop risk, responsive, and accessibility. |
| **design-consultation** | Design Partner | `/design-consultation` | Design system consultation — proposes aesthetic, typography, color, layout, spacing, and motion as a coherent package. Generates font+color preview pages and writes DESIGN.md. |
| **review** | Staff Engineer | `/review` | Pre-landing PR review. Two-pass analysis (critical + informational) for SQL safety, race conditions, LLM trust boundaries, enum completeness, and more. Fix-first: auto-fixes mechanical issues, asks about ambiguous ones. |
| **investigate** | Debugger | `/investigate` | Systematic debugging with root cause investigation. Five phases: collect symptoms, pattern analysis, hypothesis testing, implementation, verification. Iron Law: no fixes without root cause. |
| **design-review** | Designer Who Codes | `/design-review` | Designer's eye QA on live sites. 10-category audit (~80 items), letter grades, AI slop detection. Fixes issues in source code with atomic commits and before/after verification. |
| **qa** | QA Lead | `/qa` | Systematic QA testing with fix loop. Three tiers (Quick/Standard/Exhaustive), diff-aware mode, health scoring, framework-specific guidance. Fixes bugs atomically with before/after evidence. |
| **qa-only** | QA Reporter | `/qa-only` | Report-only QA testing — finds and documents bugs with screenshots and health scores but never fixes anything. Same modes and rubric as /qa. |
| **ship** | Release Engineer | `/ship` | Fully automated ship workflow: merge base, run tests, pre-landing review, version bump, CHANGELOG, bisectable commits, push, create PR. |
| **document-release** | Doc Editor | `/document-release` | Post-ship documentation sync. Reads all project docs, cross-references the diff, auto-updates factual content, polishes CHANGELOG voice, cleans up TODOS, and optionally bumps VERSION. |
| **retro** | Eng Manager | `/retro` | Weekly engineering retrospective. Analyzes commit history, work patterns, code quality metrics. Team-aware with per-person praise and growth areas. Persistent history with trend tracking. |
| **browse** | QA Engineer | `/browse` | Headless browser for QA testing and dogfooding. Navigate, interact, screenshot, assert. Uses Playwright MCP tools. |
| **benchmark** | Perf Engineer | `/benchmark` | Performance regression detection. Baselines page load times, Core Web Vitals, and bundle sizes. Compares before/after with regression thresholds. Tracks trends over time. |
| **setup-browser-cookies** | Session Manager | `/setup-browser-cookies` | Import cookies from your real browser into the headless session. Test authenticated pages without logging in every time. |
| **dependency-audit** | Security Engineer | `/dependency-audit` | Scans dependencies for vulnerabilities, outdated packages, and license issues. Groups by risk, checks reachability, generates prioritized upgrade plans. Optionally applies safe updates. |

## Commands

Compound workflows that chain multiple skills together.

| Command | Description |
|---------|-------------|
| `/full-review` | Chains `/review` → `/design-review` → `/qa` into one pipeline. Passes context forward between stages. Produces a combined ship-readiness verdict. |
| `/preflight` | Fast pre-merge safety check. Critical-only code review + smoke test + quick test run. Under 2 minutes. For small PRs where `/full-review` is overkill. |
| `/status` | Read-only branch status and workflow progress report. Shows what's been done, what's left, and suggests the next step. |

## Agents

Proactive agents that detect context and trigger automatically.

| Agent | Trigger | Description |
|-------|---------|-------------|
| **workflow-orchestrator** | Completing a skill, "what's next?", finishing code | Detects where you are in the pipeline and suggests the next skill. Understands the full Think → Plan → Build → Review → Test → Ship → Reflect flow. |
| **triage** | "production is broken", "urgent fix", "hotfix", "incident" | Emergency incident response. Triages severity, fast-tracks root cause investigation, creates minimal hotfix, ships via emergency PR. Streamlined for speed. |

## Hooks

Event-driven checks that run automatically.

| Hook | Event | Description |
|------|-------|-------------|
| **pre-push** | Before `git push` | Runs critical-only review (SQL injection, auth gaps, race conditions) before any push. Blocks on critical issues. Under 30 seconds. |
| **post-merge** | After `git merge` on default branch | Non-blocking reminders: nudges about `/document-release` when API/config/schema files changed, `/dependency-audit` when lockfiles changed. |

## Credits

This is a port of [garrytan/gstack](https://github.com/garrytan/gstack) with the YCombinator parts genercized and then iterated on by me after the port.