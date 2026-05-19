---
name: skills-audit
description: Audit a plugin's skills across three axes — visibility (disable-model-invocation, user-invocable), deterministic vs. AI (steps that should be scripts), and composability (logic duplicated across skills). Applies low-risk frontmatter fixes, proposes higher-risk script/reference extractions, and writes SKILL-AUDIT.md with a changelog. Use when asked to "audit my skills", "skills audit", "audit the plugin", or run periodically after adding new skills.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# /skills-audit — three-axis skill audit

You are running the `/skills-audit` command. The job is to audit a plugin's skills across three axes and produce a `SKILL-AUDIT.md` snapshot at the plugin root.

1. **Visibility** — `disable-model-invocation` for high-side-effect skills, `user-invocable: false` for background-only skills.
2. **Deterministic vs. AI** — Find fixed, repeatable steps described in prose; recommend extracting to `scripts/`.
3. **Composability** — Find duplicated logic across skills; recommend shared scripts or `references/`.

Pass 1 is **applied directly** (frontmatter additions are reversible). Passes 2 and 3 are **proposed** — they're structural and want human review before extraction.

---

## Arguments

`$ARGUMENTS` — optional. One of:

- A skill name (e.g. `qa`) — focus the audit on that skill, cross-referenced against the others.
- A directory (e.g. `skills/core`) — audit only that subtree.
- Empty — audit every skill listed in `plugin.json`.

---

## Step 0: Locate the plugin root

Find the plugin root. Prefer `$CLAUDE_PLUGIN_ROOT` if set; otherwise walk up from `pwd` looking for `.claude-plugin/plugin.json`. Read `plugin.json` and treat its `skills` array as the canonical scope — skills present in the directory but not listed are out of scope and shouldn't be touched.

If no plugin root is found, stop and tell the user the command must run inside a Claude Code plugin repository.

If a prior `SKILL-AUDIT.md` exists, read it so the new audit can credit already-applied changes and call out unwired follow-ups instead of repeating them.

---

## Step 1: Inventory

For each in-scope SKILL.md, capture:

- Path, name, current frontmatter (`name`, `description`, `allowed-tools`, `disable-model-invocation`, `user-invocable`).
- Section headings and step list.
- `Bash` commands and fixed algorithms named in prose (file paths, regex patterns, lookup tables, scoring formulas).
- `$CLAUDE_PLUGIN_ROOT/scripts/*` calls already wired in.

Hold the inventory in working memory — passes 2 and 3 reuse it.

---

## Pass 1 — Visibility

For each skill, classify:

**`disable-model-invocation: true` candidates** — high-risk side effects a subagent should never auto-fire:

- Creates git commits (`git commit`, invokes `writing-commits`)
- Pushes to remote (`git push`, `gh pr create`, `gh pr edit`)
- Edits source code as part of its loop (auto-fix loops in QA, design review)
- Sends messages, deploys, modifies shared infrastructure

**`user-invocable: false` candidates** — pure background knowledge with no standalone workflow:

- Style/format rules layered on top of other skills (the `writing-sql`, `writing-plans` pattern)
- Reference content that other skills include
- Anything where the user would never type `/<skill>` on its own

**Borderline (call out explicitly)** — skills with side effects you're deliberately *not* hiding, and why. Usually because their proactive auto-fire *is* the primary invocation pattern (e.g. `review`, `investigate`), and disabling model invocation would block their main use case.

**Apply directly.** Edit each SKILL.md in place, adding the field on the line after `description:`. Don't reorder existing keys.

---

## Pass 2 — Deterministic vs. non-deterministic

Scan each skill's prose for blocks that:

- Describe a fixed shell pipeline or regex (`git diff … | grep -E '\.(tsx|jsx|…)'`)
- Define a lookup table (`feat: → ### Added`, file-type → page-route mapping)
- Walk through a multi-step deterministic algorithm (base-branch detection, file globbing, JSON parsing)
- Compute a number from inputs using a fixed formula (scoring rubrics, weighted averages, percentage thresholds)

For each candidate, judge:

- **Token cost** — rough size of the prose block.
- **Reuse count** — same algorithm appears in N skills. High N = high priority.
- **Single-skill mechanical step** — still worth extracting if the prose is long or error-prone.
- **Light judgment wrapping mechanics** — keep as prose; the mechanics aren't the whole step.

**Keep AI for:**

- Diff reading and hypothesis forming
- AUTO-FIX vs ASK classification
- AskUserQuestion calls
- Subagent dispatch decisions
- Scope/drift detection, critique, voice polish

**Don't apply.** Script extraction is structural — *propose*, don't auto-write the script. For each proposal, list:

- Path (e.g. `scripts/detect-base-branch.sh`)
- Signature (args in → stdout out)
- Which skills would call it and what they currently inline
- Estimated token savings (rough — `~50 tokens × N skills`)

If the prior `SKILL-AUDIT.md` already created a script that hasn't been wired into every caller, list the unwired skills as a low-risk follow-up (mechanical edit).

---

## Pass 3 — Composability

Cross-reference prose blocks across skills:

- Identical or near-identical paragraphs (cognitive patterns, AI-slop checklists, critical-question rules)
- Same workflow phase described 3+ times
- Duplicate Bash invocations not already covered by a script

For each duplication, decide the fix:

- **Already deterministic** → covered by Pass 2 (cite the proposed script).
- **Prose/reference content** → propose a `references/<name>.md` under the canonical owner, link from the others. Use `skills/gstack/review/checklist.md` and `skills/core/review-security/patterns/*` as the pattern to copy.
- **Workflow phase shared by 2 skills where one is a thin wrapper around the other** (e.g. `qa-only` ≈ `qa` minus the fix loop) → propose a `references/<name>-base.md` shared by both.

**Don't apply.** Moving prose between files changes how skills load — propose only.

**Leave alone:**

- Skill-specific "Important Rules" footers — most rules are unique to the workflow.
- Sprinkled one-liner conventions ("never force push") — extracting them obscures more than it saves.

Cite existing composition wins explicitly (the `review/checklist.md` pattern, `review-security/patterns/*` routing) so future audits see the model.

---

## Step 4 — Output

Write the audit to `SKILL-AUDIT.md` at the plugin root, overwriting any prior copy. Use today's date in the header. The previous version stays in git history.

Use this structure exactly — it matches prior audits so diffs stay readable:

```
# Skill audit — YYYY-MM-DD

Audit of `skills/<bucket>/*` across three axes: visibility, deterministic vs. AI, and composability. Changes applied this pass are marked **APPLIED**; lower-confidence proposals are marked **PROPOSED**.

---

## 1. Visibility

### Applied — `disable-model-invocation: true`
<table: Skill | Side effect | Why hide from model>

Already had it: <list>.

### Applied — `user-invocable: false`
<table: Skill | Why hide from menu>

### Borderline (left alone)
<bullets — skill name + one-line reason>

---

## 2. Deterministic vs. non-deterministic

### Applied — `scripts/<name>`         (only if any new script was actually created)
### Created (not yet wired) — `scripts/<name>`   (script exists from prior audit, callers not yet updated)
### Proposed — <pattern>               (one section per proposal; list signature + callers + savings)
### Kept AI
<bullets — judgment-heavy steps that stay prose>

---

## 3. Composability — duplicated logic across skills

### Confirmed duplications, ranked by token weight
<table: Pattern | Skills that duplicate it | Fix>

### Existing composition wins (leave alone)
<bullets>

### Don't duplicate — but isn't worth fixing
<bullets — with reason>

---

## Files changed in this pass

\`\`\`
A  scripts/<name>          # only if a script was actually created
M  skills/<bucket>/<name>/SKILL.md   # +<field> or "call <script>"
M  SKILL-AUDIT.md
\`\`\`

## Suggested next pass
<numbered list of mechanical wire-ups + structural proposals from this run>
```

Then print a short summary to chat: how many SKILL.md files were modified, how many proposals were raised, and the relative path to `SKILL-AUDIT.md`.

---

## Important rules

- **Apply Pass 1 only.** Frontmatter additions are reversible and don't change behavior. Passes 2 and 3 are structural — propose, don't auto-extract scripts or move prose.
- **`plugin.json` is the source of truth** for scope. A SKILL.md present on disk but absent from `plugin.json` isn't part of the plugin — don't touch it.
- **One `SKILL-AUDIT.md`.** Overwrite the prior file — the audit is a snapshot, not a log. History lives in git.
- **Credit prior work.** If `SKILL-AUDIT.md` already exists, note which proposals from it shipped (now visible in the SKILL.md files) and which are still pending. Don't restate the entire prior audit.
- **Honest about "nothing to apply."** If every skill is already correctly tagged and no new duplications surfaced, say so. Don't manufacture changes to justify the run.
- **No `git commit`.** The audit changes the working tree; let the user review and commit.
- **If `superpowers:writing-skills` is installed**, suggest the user run it after applying any structural changes that ship from this audit's proposals.
