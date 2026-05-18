#!/usr/bin/env python3
"""
Compute the QA health score from a JSON payload of findings + console/network counts.

Same rubric used by both `qa` and `qa-only` skills. Pure math — no AI needed.

Input (stdin, JSON):
  {
    "console_errors": int,
    "failed_requests": int,
    "broken_links": int,
    "findings": [
      {"category": "Functional|Visual|UX|Content|Performance|Accessibility",
       "severity": "critical|high|medium|low"},
      ...
    ]
  }

Output (stdout): JSON with per-category scores and the weighted final score.
Exits non-zero if input is malformed.
"""

import json
import sys

CATEGORY_WEIGHTS = {
    "console": 0.10,
    "network": 0.05,
    "links": 0.10,
    "visual": 0.10,
    "functional": 0.20,
    "ux": 0.15,
    "performance": 0.10,
    "content": 0.05,
    "accessibility": 0.15,
}

SEVERITY_DEDUCTION = {
    "critical": 25,
    "high": 15,
    "medium": 8,
    "low": 3,
}

PER_CATEGORY_FINDING_CATEGORIES = (
    "visual",
    "functional",
    "ux",
    "content",
    "performance",
    "accessibility",
)


def score_console(errors: int) -> int:
    if errors == 0:
        return 100
    if errors <= 3:
        return 70
    if errors <= 10:
        return 40
    if errors <= 20:
        return 20
    if errors <= 50:
        return 10
    return 0


def score_network(failed: int) -> int:
    if failed == 0:
        return 100
    if failed <= 2:
        return 60
    if failed <= 5:
        return 30
    return 10


def score_links(broken: int) -> int:
    return max(0, 100 - (broken * 15))


def score_finding_category(findings: list[dict], category: str) -> int:
    total = 100
    for f in findings:
        if (f.get("category") or "").lower() != category:
            continue
        sev = (f.get("severity") or "").lower()
        total -= SEVERITY_DEDUCTION.get(sev, 0)
    return max(0, total)


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"invalid JSON: {e}", file=sys.stderr)
        return 2

    findings = data.get("findings", []) or []

    scores = {
        "console": score_console(int(data.get("console_errors", 0))),
        "network": score_network(int(data.get("failed_requests", 0))),
        "links": score_links(int(data.get("broken_links", 0))),
    }
    for cat in PER_CATEGORY_FINDING_CATEGORIES:
        scores[cat] = score_finding_category(findings, cat)

    final = sum(scores[cat] * weight for cat, weight in CATEGORY_WEIGHTS.items())
    out = {"per_category": scores, "final_score": round(final, 1)}
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
