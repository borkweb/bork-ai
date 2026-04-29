---
name: council
description: "Use when assessing an idea, plan, strategy, product direction, public decision, creative concept, or proposal from multiple perspectives. Triggers: council, debate this, assess this idea, challenge my plan, stress-test, devil's advocate, ethical review, pragmatic next step, visionary take, creative reframing, pre-mortem, trade-offs, values alignment, long-term implications."
---

# Council

Use Council to run a structured adversarial assessment of an idea. The value is not generic "balanced perspective"; it is independent analysis, direct disagreement, and a verdict that preserves unresolved tension.

## Platform Compatibility

This skill is platform-neutral. It must work in Claude, Codex, Gemini, or any agent runner that can load `SKILL.md`.

- Do not depend on Claude-only Agent Teams, Codex-only subagents, Gemini-specific activation, or direct peer messaging.
- Default to an internal council: the assistant simulates each seat distinctly, then synthesizes as moderator.
- If the active platform has subagents and the user explicitly asks for parallel agents, delegate seats as read-only analysis tasks. Otherwise keep the council in one response.
- Treat references as optional local files. If a platform cannot load them, use the summaries in this file.
- Never modify project files while running a council unless the user separately asks for implementation.

Optional Claude setup: for Claude Code users who want true Agent Teams delegation, add this to Claude Code settings:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Do not require this setting. If it is absent, run the council internally.

## References

- Read `references/roles.md` when a seat needs deeper behavioral guidance, confidence scales, or domain expert focus areas.
- Read `references/debate-protocol.md` for rigorous multi-round councils, cross-examination enforcement, risk matrix rules, or verdict synthesis.

## First Move

Parse lightweight options if present:

| Option | Default | Meaning |
|--------|---------|---------|
| `-r N` | `2` | Debate rounds, clamped to 1-4 |
| `-f X` | none | Focus lens such as technical, product, business, UX, security, ethics, writing, or custom |
| `-q` | false | Quick mode: opening positions plus verdict only |

Restate the idea in one sentence. If the user's goal, audience, constraints, or values are missing and materially change the assessment, ask for that missing context before convening the council.

If enough context exists, select the useful seats. Do not run all five by default when the request only needs one or two lenses.

Default roster:

- 3 seats: Visionary, Devil's Advocate, Pragmatist
- Add Ethicist when values, public impact, consent, harm, trust, or power asymmetry matter
- Add Jester when framing feels rigid, over-serious, derivative, or creatively blocked
- Add a temporary Domain Expert when `-f` names a domain that none of the five seats covers

## Seats

| Seat | Use for | Output focus |
|------|---------|--------------|
| **Visionary** | Long-horizon strategy, market/category shifts, second-order effects | Trajectory, signals, inflection point, leverage |
| **Devil's Advocate** | Pre-mortems, weak assumptions, failure modes | Core vulnerability, falsifying evidence, key question |
| **Ethicist** | Public impact, consent, power asymmetry, values alignment | Principle at stake, impact map, guardrail |
| **Pragmatist** | Feasibility, sequencing, resourcing, execution | Minimum viable step, constraint, sacrifice |
| **Jester** | Creative blocks, rigid framing, over-serious premises | Provocation, exposed assumption, reframed question |
| **Domain Expert** | A requested focus domain not covered by another seat | Domain-specific constraint, test, or failure mode |

## Persona Rules

For deeper role prompts and confidence scales, use `references/roles.md`.

### Visionary
- Map the 5-10 year path if the premise scales, succeeds, or becomes normalized.
- Separate observable signals from speculation.
- Name the strategic inflection point where category, audience, economics, or power changes.
- Include a plausible counterforce. Avoid vague "future of X" language.

Format: `Visionary | Trajectory | Observable Signals | Strategic Inflection Point | Leverage Point`

### Devil's Advocate
- Hunt for the weakest structural link in logic, data, or execution.
- Name specific evidence that would invalidate the premise.
- Map concrete failure scenarios, not generic risks.
- If no flaw exists, say: `No structural vulnerability detected under current framing.`

Format: `Devil's Advocate | Core Vulnerability | Falsifying Evidence | Key Question to Answer`

### Ethicist
- Map who benefits, who bears cost, and who is excluded.
- Identify consent gaps, power asymmetries, and normalization risks.
- Evaluate against stated values. If values are unstated and important, ask for them.
- Name mitigation pathways; do not dismiss harm as merely unintended.

Format: `Ethicist | Principle at Stake | Impact Mapping | Guardrail Recommendation`

### Pragmatist
- Define the smallest executable step that proves core value.
- Name the primary bottleneck: time, capital, skill, access, policy, attention, or trust.
- Identify the first decision that changes the trajectory.
- Always name what must be sacrificed to proceed.

Format: `Pragmatist | Minimum Viable Step | Key Constraint | Trade-off to Acknowledge`

### Jester
- Invert the premise or exaggerate it to expose hidden assumptions.
- Use irony, metaphor, or absurd framing only when it produces insight.
- Do not give literal implementation advice.
- If the idea already contains its own subversion, say so and reframe from there.

Format: `Jester | Provocation/Inversion | What This Exposes | Reframed Question`

### Domain Expert
- Use only when `-f` provides a domain or the user explicitly requests specialist review.
- Ground the critique in domain mechanisms, not generic expertise theater.
- Name one specialized constraint, one validation test, and one likely blind spot.

Format: `Domain Expert | Domain Constraint | Validation Test | Likely Blind Spot`

## Council Flow

For strict debate mechanics, use `references/debate-protocol.md`.

1. **Frame**: One sentence describing the idea and the decision being assessed.
2. **Seat Selection**: State which seats are speaking and why.
3. **Opening Positions**: Each selected seat gives an independent assessment in its format. Do not let one seat pre-answer another.
4. **Cross-Examination**: For each round, each seat challenges at least one specific claim from another seat. Use `-r N`; skip this phase in `-q`.
5. **Position Movement**: Note which seats changed, narrowed, or hardened their view after challenge.
6. **Tension Map**: Name the 1-3 real disagreements that remain.
7. **Risk Matrix**: List the top risks with likelihood, impact, and mitigation.
8. **Steelman**: Present the strongest counterargument to the final recommendation.
9. **Verdict**: End with one of: `PROCEED`, `PROCEED WITH CONDITIONS`, `RECONSIDER`, `DO NOT PROCEED`. Include confidence and the next decision, test, or question.

## Output Shape

Use this structure unless the user asks for a shorter response:

```text
Frame: ...
Seats: ...

Opening Positions
- Visionary | ...
- Devil's Advocate | ...

Cross-Examination
- Round 1: ...
- Round 2: ...

Position Movement
- ...

Tension Map
- ...

Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

Steelman
...

Verdict: PROCEED WITH CONDITIONS
Confidence: Medium
Next Move: ...
```

## Guardrails

- Keep each seat concise: one dense paragraph or compact bullet.
- Do not blend voices into a generic balanced answer.
- Prefer mechanisms, evidence, and trade-offs over vibe checks.
- Do not force consensus. The useful output is often the unresolved tension.
- If the user asks for a specific seat, use only that seat unless another is necessary to answer.
- Steelman opposing views before dismissing them.
- If seats converge too quickly, inject an anti-groupthink question: "What would need to be true for the opposite verdict to be right?"
- Council is for evaluation and decision pressure, not open-ended brainstorming. If the user only wants ideas, ask whether they want ideation instead.
