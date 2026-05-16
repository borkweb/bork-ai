# Pre-Landing Review Checklist

## Instructions

Review the `git diff origin/<base>` output for the issues listed below. Be specific — cite `file:line` and suggest fixes. Skip anything that's fine. Only flag real problems.

**Two-pass review:**
- **Pass 1 (CRITICAL):** Run SQL & Data Safety, Migration & Schema Safety, Race Conditions & Concurrency, Auth & Permission Gaps, LLM Output Trust Boundary, Enum & Value Completeness, and API Contract Breaking Changes first. Highest severity.
- **Pass 2 (INFORMATIONAL):** Run all remaining categories. Lower severity but still actioned.

All findings get action via Fix-First Review: obvious mechanical fixes are applied automatically,
genuinely ambiguous issues are batched into a single user question.

**Output format:**

```
Pre-Landing Review: N issues (X critical, Y informational)

**AUTO-FIXED:**
- [file:line] Problem → fix applied

**NEEDS INPUT:**
- [file:line] Problem description
  Recommended fix: suggested fix
```

If no issues found: `Pre-Landing Review: No issues found.`

Be terse. For each issue: one line describing the problem, one line with the fix. No preamble, no summaries, no "looks good overall."

---

## Review Categories

### Pass 1 — CRITICAL

#### SQL & Data Safety
- String interpolation in SQL (even if values are `.to_i`/`.to_f` — use parameterized queries)
- TOCTOU races: check-then-set patterns that should be atomic `WHERE` + `update_all`
- Bypassing model validations for direct DB writes
- N+1 queries: Missing eager loading for associations used in loops/views

#### Race Conditions & Concurrency
- Read-check-write without uniqueness constraint or catch duplicate key error and retry
- find-or-create without unique DB index — concurrent calls can create duplicates
- Status transitions that don't use atomic `WHERE old_status = ? UPDATE SET new_status` — concurrent updates can skip or double-apply transitions
- Unsafe HTML rendering on user-controlled data (XSS)

#### LLM Output Trust Boundary
- LLM-generated values (emails, URLs, names) written to DB or passed to mailers without format validation
- Structured tool output (arrays, hashes) accepted without type/shape checks before database writes

#### Enum & Value Completeness
When the diff introduces a new enum value, status string, tier name, or type constant:
- **Trace it through every consumer.** Read (don't just grep — READ) each file that switches on, filters by, or displays that value. If any consumer doesn't handle the new value, flag it.
- **Check allowlists/filter arrays.** Search for arrays containing sibling values and verify the new value is included where needed.
- **Check `case`/`if-elsif` chains.** If existing code branches on the enum, does the new value fall through to a wrong default?
To do this: use Grep to find all references to the sibling values. Read each match. This step requires reading code OUTSIDE the diff.

#### Migration & Schema Safety
- New DB migration adding a column with a NOT NULL constraint and no default — will fail on existing rows
- Migration that locks a large table (adding an index without CONCURRENTLY, renaming columns, changing column types)
- Migration that is not backward-compatible — old code running during deploy will break (e.g., removing a column that old code still reads)
- Migration adding a foreign key constraint to a large table without validation separation (`ADD CONSTRAINT ... NOT VALID` + separate `VALIDATE CONSTRAINT`)
- Irreversible migration without a documented rollback strategy
- Data backfill in the same migration as a schema change — should be separate (schema first, backfill second)

#### Auth & Permission Gaps
- New endpoint or controller action without authorization check — any authenticated user can access
- New data query not scoped to current user/org/tenant — user A can access user B's data by guessing IDs (IDOR)
- Privilege escalation: action checks a lower permission than it should (e.g., viewer permission for a write action)
- New admin/internal endpoint exposed without role check or IP restriction
- Authorization check on the wrong model (e.g., checking permission on a parent but accessing a child without verifying relationship)
- Mass assignment: new params permitted without whitelisting (e.g., `params.permit!` or accepting user-supplied role/admin fields)

#### API Contract Breaking Changes
- Removed or renamed field in API response that existing consumers may depend on
- Changed field type in API response (e.g., string → integer, object → array)
- New required parameter in API request without a default or version bump
- Changed HTTP status code for an existing endpoint (e.g., 200 → 201)
- Removed or renamed API endpoint without deprecation period
- Changed authentication/authorization requirements on an existing endpoint
- Response pagination or ordering change that could break client assumptions

### Pass 2 — INFORMATIONAL

#### Error Handling Anti-Patterns
- Catch-all exception handler (`rescue StandardError`, `catch (Exception e)`, `except Exception`) that swallows specific errors — name the specific exceptions
- Error caught and only logged with a generic message — missing context (what was attempted, with what args, for what user/request)
- Error handler that returns a success response — caller thinks operation succeeded when it didn't
- Error messages exposed to users that leak internal details (stack traces, SQL, file paths, internal IDs)
- Missing error handling on external service calls (HTTP requests, third-party APIs) — no timeout, no retry, no graceful degradation
- `try/catch` or `begin/rescue` with an empty catch block — silent failure

#### Conditional Side Effects
- Code paths that branch on a condition but forget to apply a side effect on one branch
- Log messages that claim an action happened but the action was conditionally skipped

#### Magic Numbers & String Coupling
- Bare numeric literals used in multiple files — should be named constants
- Error message strings used as query filters elsewhere

#### Dead Code & Consistency
- Variables assigned but never read
- Version mismatch between PR title and VERSION/CHANGELOG files
- CHANGELOG entries that describe changes inaccurately
- Comments/docstrings that describe old behavior after the code changed

#### LLM Prompt Issues
- 0-indexed lists in prompts (LLMs reliably return 1-indexed)
- Prompt text listing available tools/capabilities that don't match what's actually wired up
- Word/token limits stated in multiple places that could drift

#### Test Gaps
- Negative-path tests that assert type/status but not the side effects
- Assertions on string content without checking format
- Security enforcement features without integration tests verifying the enforcement path

#### Crypto & Entropy
- Truncation of data instead of hashing — less entropy, easier collisions
- `rand()` / `Random.rand` for security-sensitive values — use `SecureRandom` instead
- Non-constant-time comparisons (`==`) on secrets or tokens — vulnerable to timing attacks

#### Time Window Safety
- Date-key lookups that assume "today" covers 24h
- Mismatched time windows between related features

#### Type Coercion at Boundaries
- Values crossing language/serialization boundaries where type could change
- Hash/digest inputs that don't normalize types before serialization

#### View/Frontend
- Inline `<style>` blocks in partials (re-parsed every render)
- O(n*m) lookups in views (array find in a loop instead of indexed hash)
- Server-side filtering on DB results that could be a `WHERE` clause

#### Performance & Bundle Impact
- New dependencies that are known-heavy (moment.js → date-fns, lodash full → lodash-es or per-function imports)
- Significant lockfile growth from a single addition
- Images added without `loading="lazy"` or explicit width/height attributes
- Large static assets committed to repo (>500KB per file)
- Synchronous `<script>` tags without async/defer
- CSS `@import` in stylesheets (blocks parallel loading)
- `useEffect` with fetch that depends on another fetch result (request waterfall)
- Named → default import switches on tree-shakeable libraries (breaks tree-shaking)

**DO NOT flag:**
- devDependencies additions (don't affect production bundle)
- Dynamic `import()` calls (code splitting — these are good)
- Small utility additions (<5KB gzipped)
- Server-side-only dependencies

---

## Severity Classification

```
CRITICAL (highest severity):      INFORMATIONAL (lower severity):
├─ SQL & Data Safety              ├─ Error Handling Anti-Patterns
├─ Migration & Schema Safety      ├─ Conditional Side Effects
├─ Race Conditions & Concurrency  ├─ Magic Numbers & String Coupling
├─ Auth & Permission Gaps         ├─ Dead Code & Consistency
├─ LLM Output Trust Boundary      ├─ LLM Prompt Issues
├─ Enum & Value Completeness      ├─ Test Gaps
└─ API Contract Breaking Changes  ├─ Crypto & Entropy
                                   ├─ Time Window Safety
                                   ├─ Type Coercion at Boundaries
                                   ├─ View/Frontend
                                   └─ Performance & Bundle Impact

All findings are actioned via Fix-First Review. Severity determines
presentation order and classification of AUTO-FIX vs ASK — critical
findings lean toward ASK (they're riskier), informational findings
lean toward AUTO-FIX (they're more mechanical).
```

---

## Fix-First Heuristic

```
AUTO-FIX (agent fixes without asking):     ASK (needs human judgment):
├─ Dead code / unused variables            ├─ Security (auth, XSS, injection)
├─ N+1 queries (missing eager loading)      ├─ Race conditions
├─ Stale comments contradicting code       ├─ Design decisions
├─ Magic numbers → named constants         ├─ Large fixes (>20 lines)
├─ Missing LLM output validation           ├─ Enum completeness
├─ Version/path mismatches                 ├─ Removing functionality
├─ Variables assigned but never read       ├─ Migration safety
├─ Inline styles, O(n*m) view lookups      ├─ Auth/permission gaps
├─ Empty catch blocks → add logging        ├─ API contract changes
├─ Error messages leaking internals        └─ Anything changing user-visible
└─ Generic error handlers → specific           behavior
```

**Rule of thumb:** If the fix is mechanical and a senior engineer would apply it
without discussion, it's AUTO-FIX. If reasonable engineers could disagree about
the fix, it's ASK.

**Critical findings default toward ASK** (they're inherently riskier).
**Informational findings default toward AUTO-FIX** (they're more mechanical).

---

## Suppressions — DO NOT flag these

- "X is redundant with Y" when the redundancy is harmless and aids readability
- "Add a comment explaining why this threshold/constant was chosen" — thresholds change during tuning, comments rot
- "This assertion could be tighter" when the assertion already covers the behavior
- Suggesting consistency-only changes
- "Regex doesn't handle edge case X" when the input is constrained and X never occurs in practice
- "Test exercises multiple guards simultaneously" — that's fine
- Eval threshold changes — these are tuned empirically and change constantly
- Harmless no-ops
- ANYTHING already addressed in the diff you're reviewing — read the FULL diff before commenting
