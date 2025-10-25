# Commit Message Examples

## Feature Commits

### Adding New Functionality

```
feat(payments): integrate Stripe payment processing

Add complete Stripe integration including:
- Payment intent creation and confirmation
- Webhook handling for payment events
- Customer portal for subscription management
- Proper error handling and retry logic

Includes comprehensive tests and documentation.

Refs: #156
```

```
feat(search): implement full-text search with Elasticsearch

Users can now search across all content types with:
- Fuzzy matching for typo tolerance
- Faceted filtering by category and date
- Highlighting of matched terms
- Pagination of results

Performance tested with 1M+ documents.
```

## Bug Fixes

### Critical Bugs

```
fix(auth): resolve session hijacking vulnerability

Previous implementation stored session tokens in localStorage,
making them accessible to XSS attacks. Moved to httpOnly
cookies with SameSite=Strict.

SECURITY: All users should rotate tokens after deployment.
```

### Standard Bugs

```
fix(ui): correct date picker timezone handling

Dates were being converted to UTC incorrectly, causing
off-by-one-day errors for users in certain timezones.
Now preserves local timezone throughout the selection flow.

Fixes #423, #467
```

## Refactoring

```
refactor(api): migrate from Express to Fastify

Improves request throughput by ~40% in benchmarks.
All endpoints maintain backward compatibility.
Updated tests and documentation to reflect new framework.

Migration guide: docs/fastify-migration.md
```

```
refactor(models): extract validation logic to JSON Schema

Removes ~500 lines of manual validation code.
Validation is now declarative and generates API docs automatically.
No changes to validation behavior.
```

## Documentation

```
docs(api): add OpenAPI 3.0 specification

Complete API documentation in OpenAPI format with:
- All endpoints documented
- Request/response schemas
- Authentication flows
- Example requests

Available at /api/docs
```

## Performance

```
perf(database): add indexes for common query patterns

Analysis of slow query log revealed missing indexes on:
- users.email
- orders.created_at
- products.category_id

Reduces average query time from 250ms to 12ms.
```

## Chores and Maintenance

```
chore(deps): upgrade React from 17 to 18

Update React and React DOM to version 18.2.0.
All components tested with new concurrent rendering.
No breaking changes required in application code.
```

```
chore(ci): add automated dependency security scanning

Configure Dependabot to check for vulnerabilities weekly
and create PRs for security updates automatically.
```

## Test Commits

```
test(auth): add integration tests for OAuth flow

Covers complete OAuth authentication flow:
- Authorization code exchange
- Token refresh
- Revocation
- Error scenarios

Achieves 100% coverage of auth service.
```

## Build and CI

```
build(docker): optimize production image size

Reduces image from 1.2GB to 180MB:
- Use multi-stage build
- Switch to Alpine base
- Remove dev dependencies
- Optimize layer caching

Faster deployments with no functionality changes.
```

```
ci(github): add pull request preview deployments

PRs now automatically deploy to temporary environments.
Preview URL added as comment on each PR.
Environments auto-deleted after PR close/merge.
```

## Breaking Changes

```
feat(api): standardize error response format

BREAKING CHANGE: All API errors now return consistent format:
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}

Previous format used top-level "message" and "status" fields.
Clients must update error handling logic.

Migration guide: docs/error-format-migration.md
```

## Multi-Scope Commits

```
feat(api,ui): add user profile customization

Backend:
- New /users/:id/profile endpoint
- Avatar upload with image processing
- Bio and social links fields

Frontend:
- Profile editor component
- Image cropping interface
- Real-time preview

Closes #234
```

## Style/Formatting

```
style: apply Prettier formatting to entire codebase

No functional changes. Configures Prettier with:
- 2 space indentation
- Single quotes
- Trailing commas
- 80 character line width

Pre-commit hook added to enforce formatting.
```

## Dependency Updates

```
chore(deps): update dependencies to latest stable versions

Major updates:
- typescript: 4.9 → 5.3
- vite: 4.5 → 5.0
- vitest: 0.34 → 1.0

All tests passing. No breaking changes in usage.
```

## Reverts

```
revert: "feat(search): implement full-text search"

This reverts commit a1b2c3d4e5f6.

Elasticsearch integration causing memory issues in production.
Reverting to investigate and optimize before re-deploying.

Refs: #789
```

## Tips for Choosing Examples

- Use these examples as templates, but always adapt to the actual changes
- Match the level of detail to the complexity of the change
- Include issue/PR references when available
- Explain WHY, not just WHAT
- Think about what future developers need to know
