# Commit Message Examples

## Feature Commits

### Adding New Functionality

```
feat(payments): add Stripe webhook signature verification

## Summary

Implements cryptographic verification of incoming Stripe webhooks to prevent spoofed payment events from being processed.

Fixes #312

## Why

* Production logs showed requests to webhook endpoint from non-Stripe IPs
* Without signature verification, attackers could forge payment success events
* PCI compliance requires webhook authenticity validation

## How

* Extract signature from `Stripe-Signature` header
* Compute expected signature using webhook secret and raw body
* Compare using timing-safe equality to prevent timing attacks
* Reject requests with missing, expired (>5 min tolerance), or invalid signatures
* Log rejected attempts with IP for security monitoring

## Testing

1. Run the test suite: `./vendor/bin/pest tests/Unit/StripeWebhookTest.php`
2. To test manually, use Stripe CLI: `stripe listen --forward-to localhost:8000/webhooks/stripe`
3. Trigger a test event: `stripe trigger payment_intent.succeeded`
```

```
feat(admin): OpenCode Admin UI Enhancement and usage tracking

## Summary

Enhance the `/admin` agent interface with real-time usage cost tracking, token statistics display, and improved visual feedback. Also fixes Docker workspace permissions for bind-mounted directories.

Fixes #234

## Why

* Users need visibility into API costs and token usage during agent sessions
* Tool execution status was unclear during streaming responses
* Docker containers couldn't write to bind-mounted workspace directories due to permission issues
* Navigation was broken when pressing back button

## How

* Parse usage_cost events from OpenCode stream (both message.updated and step-finish parts)
* Accumulate and display cost/tokens in the UI header
* Add tool status cards with visual states (pending → running → completed)
* Replace "streaming" pulse animation with "Thinking..." indicator
* Set 0777 permissions on workspace directories and 0666 on files for Docker compatibility
* Fix back button URL from `/admin` to `./` for relative navigation
```

```
## Summary

This PR replaces the XPath-based JSON patching system with a simpler path-based approach and adds error feedback to the retry loop.

## Why

The current system uses XPath expressions to target files for updates:
<example code>

This causes frequent failures because:
1. LLMs struggle with XPath syntax, particularly quote escaping in attribute predicates
2. Multiple escaping levels (JSON + XPath) create confusion
3. The two-step file addition pattern (add structure, then update content) is error-prone
4. When patches fail, the LLM gets no specific error details on retry attempts
5. LLMs often wrap JSON in markdown code fences, which breaks parsing

## How

### 1. Path-Based Patching
Replace XPath with simple file paths:
<example code>

Changes:
- New `applyPathBasedPatch()` method with dedicated helpers for add/update/delete
- Single-step file addition (no more two-step pattern)
- Remove ~100 lines of XPath helper code
- Detailed error messages ("File not found: src/edit.js" instead of "XPath error")

### 2. Error Feedback Loop
When a patch fails, the LLM now receives the specific error on retry:
<example code>

Changes:
- Capture error details in retry loop (`AssistantController.php`)
- Pass error through `Orchestrator` and `PromptBuilder`
- Include error in retry disclaimer prompt

### 3. Markdown Code Fence Handling
The validator now:
- Strips markdown code fences (` ```json ... ``` `) before parsing
- Provides detailed JSON error messages using `json_last_error_msg()`
- Explicitly instructs LLM not to use code fences

## Hypothesis

We expect these changes to:
- Reduce patch validation failures by eliminating XPath complexity
- Enable LLM to self-correct when it receives specific error feedback
- Handle the common case where LLMs wrap JSON in markdown

## Breaking Changes

This is a clean break from XPath patching with no backward compatibility. Existing in-progress chats may fail if they generate XPath patches. Users will need to start new chats for edits.

## Testing

The immediate issue from logs (3 failed attempts with "Invalid patch JSON") was caused by markdown code fence wrapping. The LLM was generating valid path-based patches, but the validator couldn't parse them. This should now work.
```

## Bug Fixes

### Critical Bugs

```
fix(queue): prevent job loss during worker restart

## Summary

Jobs are now checkpointed to Redis before processing, ensuring recovery after unexpected worker termination.

Fixes #891

## Why

* Production monitoring showed ~2% job loss during deployments
* Workers receiving SIGTERM would drop in-flight jobs
* Lost jobs included payment confirmations and email sends

## How

* Store job payload in Redis with `processing:{job_id}` key before execution
* Delete key only after successful completion
* Add recovery sweep on worker startup that re-queues orphaned jobs
* Set 1-hour TTL on processing keys to handle edge cases

## Testing

1. Run `php artisan test --filter=JobRecoveryTest`
2. To test recovery manually:
   - Start a worker: `php artisan queue:work`
   - Dispatch a slow job: `php artisan tinker` then `SlowJob::dispatch()`
   - Kill the worker mid-job: `kill -9 <pid>`
   - Restart worker and verify job completes
```

```
fix(auth): resolve session hijacking vulnerability

Previous implementation stored session tokens in localStorage,
making them accessible to XSS attacks. Moved to httpOnly
cookies with SameSite=Strict.

## Security
All users should rotate tokens after deployment.
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
refactor(auth): consolidate duplicate permission checks

## Summary

Extracts permission logic from 12 controllers into a single `PermissionGate` service, reducing code duplication and ensuring consistent authorization behavior.

## Why

* Permission checks were copy-pasted across controllers with slight variations
* Bug fix in one location wasn't applied to others, causing inconsistent access control
* Adding new permission types required changes in multiple files

## How

* Create `PermissionGate` service with `can()`, `canAny()`, and `canAll()` methods
* Replace inline checks with service calls: `$this->gate->can('edit', $resource)`
* Add `@throws UnauthorizedException` for consistent error handling
* Remove ~400 lines of duplicated permission logic

## Testing

1. Run permission tests: `./vendor/bin/pest tests/Feature/PermissionTest.php`
2. Verify all endpoints still enforce permissions: `./vendor/bin/pest --group=authorization`
```

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
perf(api): implement response caching for product listings

## Summary

Adds Redis-backed response caching for product listing endpoints, reducing database load and improving p95 response times from 800ms to 45ms.

Fixes #567

## Why

* Product listing pages account for 60% of API traffic
* Database showing high CPU during peak hours
* Users reported slow page loads on category pages

## How

* Cache full JSON response with key `products:category:{id}:page:{n}`
* Set 5-minute TTL with stale-while-revalidate pattern
* Invalidate cache on product create/update/delete via model observers
* Add `X-Cache: HIT/MISS` header for debugging

## Testing

1. Run cache tests: `php artisan test --filter=ProductCacheTest`
2. Verify caching manually:
   - Clear cache: `php artisan cache:clear`
   - Hit endpoint: `curl -I /api/products?category=1`
   - Check for `X-Cache: MISS`
   - Hit again, verify `X-Cache: HIT`
3. Verify invalidation: update a product in that category, confirm next request is MISS
```

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
test(api): add contract tests for external payment gateway

## Summary

Adds Pact contract tests to verify our integration with the payment gateway API matches their published schema.

## Why

* Payment gateway updated their API without notice, breaking production
* Unit tests with mocked responses didn't catch the schema change
* Need automated verification that our expectations match reality

## How

* Define consumer contracts for all payment endpoints we use
* Run contract verification against gateway's test environment in CI
* Fail build if contract expectations don't match actual responses
* Store contract files in `tests/contracts/` for provider verification

## Testing

1. Run contract tests: `npm run test:contracts`
2. Verify against live sandbox: `PACT_VERIFY=true npm run test:contracts`
3. View contract UI: `npx pact-broker` (requires Docker)
```

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

```
ci(github): add database migration safety checks

## Summary

CI now validates migrations before merge to prevent destructive operations from reaching production without explicit approval.

## Why

* Developer accidentally dropped a column in migration, causing 2-hour outage
* No automated check for destructive operations (DROP, TRUNCATE, DELETE without WHERE)
* Migrations that pass locally can fail on production data volumes

## How

* Add `migration-lint` job that parses SQL for destructive keywords
* Destructive migrations require `--force` flag in migration class and CODEOWNER approval
* Add `migration-dry-run` against anonymized production snapshot
* Block merge if migration takes >30 seconds on snapshot

## Testing

1. Create a test migration with `DROP COLUMN` to verify lint catches it
2. Check workflow runs: `.github/workflows/migration-check.yml`
3. Test locally: `./scripts/lint-migrations.sh`
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
feat(api,cli): add bulk export command for user data

## Summary

Adds a new CLI command and supporting API endpoint to export user data in GDPR-compliant format.

Fixes #445

## Why

* GDPR requires ability to export all user data within 30 days of request
* Manual exports were taking support team 4+ hours per request
* No existing tooling for bulk data extraction across services

## How

**API changes:**
* New `GET /api/users/{id}/export` endpoint with admin auth
* Returns signed URL to encrypted ZIP file in S3
* Aggregates data from users, orders, and activity_log tables

**CLI changes:**
* New `php artisan users:export {id} --format=json|csv` command
* Progress bar for large exports
* Outputs to stdout or file with `--output` flag

## Testing

1. Test API: `php artisan test --filter=UserExportApiTest`
2. Test CLI: `php artisan test --filter=UserExportCommandTest`
3. Manual test: `php artisan users:export 1 --format=json --output=/tmp/export.zip`
```

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
