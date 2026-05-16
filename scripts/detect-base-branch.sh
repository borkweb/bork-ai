#!/usr/bin/env bash
# Detect the base branch for the current feature branch.
# Order: existing PR target -> repo default branch -> "main".
# Prints the branch name to stdout. Always exits 0 (always returns something usable).
#
# Used by: ship, review, review-security, design-review, document-release,
# qa, qa-only, plan-deep-review, plan-eng-review, plan-design-review,
# plan-devex-review, autoplan.

set -u

if base=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null); then
    if [ -n "$base" ]; then
        printf '%s\n' "$base"
        exit 0
    fi
fi

if base=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null); then
    if [ -n "$base" ]; then
        printf '%s\n' "$base"
        exit 0
    fi
fi

printf 'main\n'
