# Skill audit — 2026-05-16

Audit of `skills/core/*` and `skills/gstack/*` across three axes: visibility, deterministic vs. AI, and composability. Changes that were applied in this pass are marked **APPLIED**; lower-confidence proposals are marked **PROPOSED**.

---

## 1. Visibility

### Applied — `disable-model-invocation: true`

Added to skills with high-risk side effects so subagents can't auto-fire them. Users can still invoke via slash command.

| Skill | Side effect | Why hide from model |
|---|---|---|
| `gstack/ship` | commits, pushes, creates PR | Never want an autonomous PR |
| `gstack/document-release` | commits, pushes, edits PR body | Pushes to remote |
| `gstack/qa` | commits bug fixes | Touches source code with atomic commits |
| `gstack/design-review` | commits design fixes | Touches CSS/components with atomic commits |
| `core/writing-commits` | creates git commits | Should be triggered explicitly, not inferred |

Already had it: `gstack/plan-deep-review`, `gstack/plan-session`.

**Not added** to `gstack/investigate` and `gstack/review` even though they edit files — they're invoked specifically for that purpose, and `disable-model-invocation` would block the most common (proactive) invocation pattern described in their own descriptions. Revisit if accidental auto-fires happen in practice.

### Applied — `user-invocable: false`

Background-knowledge skills that should auto-trigger inside other skills but never appear as `/commands`.

| Skill | Why hide from menu |
|---|---|
| `core/writing-plans` | Pure prose-style rules for plan documents. No standalone workflow. Layered on top of `superpowers:writing-plans`. |
| `core/writing-sql` | Pure SQL formatting rules. Auto-applies when SQL is detected. Users would never run "/writing-sql". |

### Borderline (left alone)

- `core/council`, `core/red-pen`, `core/humanize` — analysis only, but legitimately user-invocable.
- `core/agents-md-lint` — spawns blind subagent, but only modifies a single doc file the user is intentionally pointing at.
- `core/handoff` — writes a temp `.md`; harmless.
- `core/prototype` — writes throwaway code; intentionally user-driven.

---

## 2. Deterministic vs. non-deterministic

Pulled the duplicated, fully-deterministic steps out into `scripts/`. Skills now call the scripts instead of describing the algorithm in prose. Same output every time, zero token cost.

### Applied — `scripts/detect-base-branch.sh`

The same 3-step `gh pr view` → `gh repo view` → `main` fallback appears in **11 skills**. Every one of them spent ~50 tokens describing the algorithm. Now they call the script.

Updated to use it: `ship`, `review`, `design-review`.

Still inline (proposed follow-up): `qa`, `qa-only`, `review-security`, `document-release`, `autoplan`, `plan-deep-review`, `plan-eng-review`, `plan-design-review`, `plan-devex-review`.

### Applied — `scripts/detect-frontend-files.sh`

Used by `review`, `ship`, `design-review`. Previously each had its own `git diff … | grep -E …` regex, with inconsistent extension lists (`design-review` missed `.astro`, `.mdx`, etc.). The script standardizes the list and the limit.

Updated to use it: `review`, `ship`. `design-review` already had no inline grep — only the base-branch detection.

### Applied — `scripts/clean-tree-check.sh`

Used by `qa`, `design-review`, `document-release`. Exits non-zero on dirty tree.

Updated: `qa`, `design-review`. Proposed follow-up: `document-release`.

### Created (not yet wired) — `scripts/pre-review-audit.sh`

`plan-deep-review`, `plan-design-review`, `plan-devex-review` all have a "PRE-REVIEW SYSTEM AUDIT" block that runs the same four `git` commands. This script prints them in one block.

Wiring it requires touching all four plan-* skills; left as the next pass.

### Created (not yet wired) — `scripts/qa-health-score.py`

`qa` and `qa-only` both define the same scoring rubric in prose: 9-tier console step function, 4-tier network step function, broken-link linear deduction, 6 per-category point deductions, 9-key weight table, weighted average. This is pure math. The script takes a JSON payload and returns the scores.

This is the highest-value extraction in this audit. The current skills devote ~70 lines each to explaining a formula. The script is ~80 lines including comments and works for both.

Wiring requires teaching both skills to emit JSON and parse the result. Left as the next pass.

### Proposed — conventional-commit-type → CHANGELOG-section mapping

`ship` Step 6 has:

```
feat: → ### Added
fix:  → ### Fixed
refactor:/chore: → ### Changed
```

Pure lookup. Could be a 10-line shell function or a tiny Python script.

### Proposed — restore-point creation (`autoplan` Phase 0)

The inline `cp "$PLAN_FILE" "${PLAN_FILE%.md}-autoplan-restore-…"` is already deterministic; just hadn't been factored. Trivial.

### Kept AI

The judgment-heavy steps stay AI:

- Reading diffs and forming hypotheses (`investigate`, `review`, `review-security`)
- Classifying findings as AUTO-FIX vs ASK (`review`, `ship`, `qa`, `design-review`)
- Choosing commit splits (`writing-commits`, `ship` Step 4)
- Anything calling `AskUserQuestion`
- Subagent dispatch (`autoplan` outside voices)
- Scope/drift detection, design critique, voice polish, etc.

---

## 3. Composability — duplicated logic across skills

### Confirmed duplications, ranked by token weight

| Pattern | Skills that duplicate it | Fix |
|---|---|---|
| Base branch detection | 11 | **Applied (script).** Wire remaining 8. |
| Health score rubric | 2 (qa, qa-only) | **Script created.** Wire both. |
| Pre-review system audit | 4 (plan-*) | **Script created.** Wire all four. |
| Clean tree check + offer commit/stash/abort | 3 (qa, design-review, document-release) | Script for the check (applied). Offer pattern is AI; leave inline. |
| Frontend file detection | 3 (review, ship, design-review) | **Applied.** |
| Diff-aware mode (file → page mapping) | 3 (qa, qa-only, design-review) | Extract to `qa-only`'s SKILL.md as `references/diff-aware.md`, have `qa` and `design-review` link to it. |
| Adversarial subagent prompt | 2+ (review Step 8, ship Step 3.7) | Move to `skills/gstack/review/references/adversarial-prompt.md`; both link to it. |
| Cognitive-patterns prose | 2 (design-review, plan-design-review) | Move to `skills/gstack/plan-design-review/references/cognitive-patterns.md`; `design-review` links. |
| AI slop 10-pattern blacklist | 2 (design-review, plan-design-review) | Move to a shared `design-checklist.md` reference. |
| "CRITICAL RULE — How to ask questions" block | 4 (plan-*, design-review) | One-line rule with link to shared reference. |

### Existing composition wins (leave alone)

- `ship` Step 3.5 already explicitly reads `review/checklist.md` instead of duplicating critical/informational categories. Model the rest of the fixes after this.
- `review` Step 6 already calls into `core/review-security/patterns/*` via a routing table. Same model.

### Don't duplicate — but isn't worth fixing

- The "**Important Rules**" footer in every gstack skill is mostly skill-specific (each rule is unique to the workflow); the few shared rules ("never force push", "no completion claims without verification") are sprinkled lightly enough that pulling them out would obscure them. Leave it.

---

## Files changed in this pass

```
A  scripts/detect-base-branch.sh
A  scripts/detect-frontend-files.sh
A  scripts/clean-tree-check.sh
A  scripts/pre-review-audit.sh        # not yet wired
A  scripts/qa-health-score.py         # not yet wired
A  SKILL-AUDIT.md

M  skills/core/writing-commits/SKILL.md    # +disable-model-invocation
M  skills/core/writing-plans/SKILL.md      # +user-invocable: false
M  skills/core/writing-sql/SKILL.md        # +user-invocable: false
M  skills/gstack/design-review/SKILL.md    # +disable-model-invocation; call base-branch + clean-tree scripts
M  skills/gstack/document-release/SKILL.md # +disable-model-invocation
M  skills/gstack/qa/SKILL.md               # +disable-model-invocation; call clean-tree script
M  skills/gstack/review/SKILL.md           # call base-branch + frontend-files scripts
M  skills/gstack/ship/SKILL.md             # +disable-model-invocation; call base-branch + frontend-files scripts
```

## Suggested next pass

1. Wire `detect-base-branch.sh` into the remaining 8 skills (mechanical edit).
2. Wire `pre-review-audit.sh` into the four `plan-*` skills.
3. Wire `qa-health-score.py` into `qa` and `qa-only`, then dedupe their shared workflow into a `references/qa-base.md` that both `SKILL.md` files link to (largest remaining composability win — `qa-only` is ~80% identical to `qa` minus the fix loop).
4. Extract the adversarial-reviewer prompt to `review/references/adversarial-prompt.md`; `ship` Step 3.7 links to it.
5. Move the AI-slop blacklist + cognitive-patterns blocks into shared references under `plan-design-review/references/`.

`$CLAUDE_PLUGIN_ROOT` is the standard env var the runtime sets when a plugin's skill executes; the scripts work the same when called by absolute path during development.
