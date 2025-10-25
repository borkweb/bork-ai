# Commit Message Reference

## Standards and Specifications

### Conventional Commits
- **Website**: https://www.conventionalcommits.org/
- **Specification**: v1.0.0
- **Key Points**:
  - Structured format: `<type>(<scope>): <description>`
  - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
  - Optional body and footer
  - Breaking changes marked with `BREAKING CHANGE:` footer

### Git Commit Messages Best Practices
- **Subject line**: 50 characters (hard limit 72)
- **Body**: Wrap at 72 characters
- **Imperative mood**: "Add feature" not "Added feature"
- **Separate subject from body**: With blank line
- **Explain what and why**: Not how (code shows how)

## Commit Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature for the user | Adding OAuth login |
| `fix` | Bug fix | Fixing null pointer exception |
| `docs` | Documentation changes only | Update README |
| `style` | Code style/formatting changes | Run Prettier |
| `refactor` | Code restructuring, no behavior change | Extract method |
| `perf` | Performance improvements | Add database index |
| `test` | Adding or updating tests | Add unit tests |
| `build` | Build system or dependencies | Update webpack config |
| `ci` | CI/CD changes | Update GitHub Actions |
| `chore` | Maintenance tasks | Update dependencies |
| `revert` | Revert previous commit | Revert "Add feature" |

## Scope Guidelines

Scopes represent the area of the codebase affected:

### Good Scopes
- **Component/Module**: `auth`, `database`, `api`, `ui`
- **Feature Area**: `payments`, `notifications`, `search`
- **Package Name**: `@company/utils`, `core`
- **Subsystem**: `parser`, `compiler`, `renderer`

### Avoid
- **Too Generic**: `code`, `files`, `app`
- **Too Specific**: `UserController.ts`, `line-42`
- **Redundant**: `bugfix`, `update` (these are types, not scopes)

## Footer References

### Issue/PR References
```
Closes #123
Fixes #456
Resolves #789
Refs #100, #200
See also: #150
```

### Breaking Changes
```
BREAKING CHANGE: Changed API response format.
Clients must update to new schema.
```

### Co-authors
```
Co-authored-by: Name <email@example.com>
```

### Sign-offs
```
Signed-off-by: Developer Name <dev@example.com>
```

## Repository-Specific Conventions

### Emoji Commits (if repo uses them)
Some projects use emojis as visual commit type indicators:
- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 📝 `:memo:` - Documentation
- ♻️ `:recycle:` - Refactoring
- ⚡️ `:zap:` - Performance
- ✅ `:white_check_mark:` - Tests
- 🔧 `:wrench:` - Configuration

**Important**: Only use if the repository already uses this convention.

### Angular Commit Convention
Some projects follow Angular's strict convention:
- Subject must be lowercase
- No period at end
- Specific type list
- Mandatory scope for certain types

**Check repo's CONTRIBUTING.md for specific conventions.**

## Semantic Versioning Connection

Commits drive semantic versioning in automated release systems:
- `fix`: Patch version (0.0.x)
- `feat`: Minor version (0.x.0)
- `BREAKING CHANGE`: Major version (x.0.0)

## Common Anti-Patterns

### 1. Vague Messages
❌ "Fix bug"
✅ "fix(auth): resolve token expiration race condition"

### 2. Too Much in One Commit
❌ "Add feature X, fix bug Y, update docs, refactor Z"
✅ Split into 4 separate commits

### 3. Implementation Details in Subject
❌ "Changed variable name from x to userId"
✅ "refactor(user): improve variable naming clarity"

### 4. Missing Context
❌ "Update config"
✅ "build(webpack): enable tree shaking for production builds"

### 5. Personal Notes
❌ "Finally got this working!"
✅ "fix(parser): handle edge case with nested brackets"

## Tools and Automation

### Commitlint
Validates commit messages against rules:
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Conventional Changelog
Generates changelogs from commits:
```bash
npm install --save-dev conventional-changelog-cli
```

### Husky + Commitlint
Enforces conventions with git hooks:
```json
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

## Reading List

1. **"How to Write a Git Commit Message"** by Chris Beams
   - The seven rules of great commit messages
   - https://chris.beams.io/posts/git-commit/

2. **Conventional Commits Specification**
   - Official spec with detailed examples
   - https://www.conventionalcommits.org/

3. **Angular Commit Guidelines**
   - Comprehensive enterprise-level conventions
   - https://github.com/angular/angular/blob/main/CONTRIBUTING.md

4. **Linux Kernel Git Commit Standards**
   - High-quality examples from large project
   - https://www.kernel.org/doc/html/latest/process/submitting-patches.html

## Quick Decision Tree

```
Is this a new feature? → feat
Is this fixing a bug? → fix
Is this only docs? → docs
Is this refactoring with no behavior change? → refactor
Is this a performance improvement? → perf
Is this only test changes? → test
Is this build/tooling? → build or ci
Is this dependency update or maintenance? → chore
```

## Context Questions to Ask

When analyzing changes, consider:
1. **What** changed? (files, functionality)
2. **Why** did it change? (motivation, issue reference)
3. **How** does it impact users? (breaking change?)
4. **What** should reviewers focus on? (body content)
5. **What** testing was done? (confidence level)

Remember: A commit message is a letter to your future self and teammates.
