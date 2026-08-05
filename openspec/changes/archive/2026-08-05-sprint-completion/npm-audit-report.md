# npm Audit Report

**Date:** 2026-07-09
**Scope:** Production dependencies
**Audit Level:** Moderate

## Result: PASS

```
npm audit --audit-level=moderate
found 0 vulnerabilities
```

No high or critical vulnerabilities found in the dependency tree.

## Depcheck Summary

- **Unused dependencies:** None
- **Missing (test-only):** `jsdom` (referenced by legacy audit test files), `playwright` (referenced by audit scripts). These are available at runtime via the project's devDependencies.
- **No action required** for production dependencies.

## Recommendation

Continue with current dependency pinning. Run `npm audit` regularly as part of CI.
