# Commit Message Reference

## Conventional Commits Specification

- **Format**: `<type>(<scope>): <description>`
- **Spec version**: v1.0.0 (conventionalcommits.org)
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Optional body and footer separated by blank lines
- Breaking changes marked with `BREAKING CHANGE:` footer or `!` after type/scope

## Subject Line Rules

- **Length**: 50 characters ideal, 72 hard limit
- **Mood**: Imperative ("Add feature" not "Added feature")
- **Formatting**: Capitalize first letter, no trailing period
- **Separation**: Blank line between subject and body
- **Focus**: Explain what and why, not how (the diff shows how)
- **No AI attribution**: Never include Co-Authored-By or similar

## Scope Conventions

Scopes represent the area of the codebase affected:

**Good scopes**: `auth`, `database`, `api`, `ui`, `payments`, `notifications`, `search`, `core`

**Avoid**: `code`, `files`, `app` (too generic), `UserController.ts` (too specific), `bugfix`, `update` (those are types, not scopes)

## Footer Formats

```
Closes #123              # issue references
Fixes #456
Refs #100, #200

BREAKING CHANGE: Changed API response format.

Co-authored-by: Name <email@example.com>
Signed-off-by: Name <email@example.com>
```

## Semantic Versioning Connection

In automated release systems, commits drive version bumps:
- `fix` → patch (0.0.x)
- `feat` → minor (0.x.0)
- `BREAKING CHANGE` → major (x.0.0)

## Common Anti-Patterns

| Anti-pattern | Bad | Good |
|---|---|---|
| Vague messages | "Fix bug" | `fix(auth): resolve token expiration race condition` |
| Multiple concerns | "Add feature X, fix bug Y, update docs" | Split into separate commits |
| Implementation in subject | "Changed variable name from x to userId" | `refactor(user): improve variable naming clarity` |
| Missing context | "Update config" | `build(webpack): enable tree shaking for production builds` |
| Personal notes | "Finally got this working!" | `fix(parser): handle edge case with nested brackets` |

## Emoji Commits (only if repo already uses them)

- ✨ New feature
- 🐛 Bug fix
- 📝 Documentation
- ♻️ Refactoring
- ⚡️ Performance
- ✅ Tests
- 🔧 Configuration

## Decision Tree

```
New feature for users?           → feat
Fixing a bug?                    → fix
Only documentation?              → docs
Restructuring, no behavior change? → refactor
Performance improvement?         → perf
Only test changes?               → test
Build system or tooling?         → build or ci
Dependency update / maintenance? → chore
Reverting a commit?              → revert
```
