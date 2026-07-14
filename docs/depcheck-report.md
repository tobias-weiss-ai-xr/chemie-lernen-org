# Dependency Check Report

> Generated: 2026-07-14
> Tool: `npx depcheck --json`

## api/

### Unused Dependencies

| Package       | Status          | Reason                                                                                           |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `pino-pretty` | expected unused | Dev-only; pretty-prints Pino logs in development. Not imported in production code. Safe to keep. |

### Missing Dependencies

None.

### Using (all expected)

All 14 production dependencies (`express`, `neo4j-driver`, `pino`, `@sentry/node`, `stripe`, etc.) are correctly imported and resolved.

---

## myhugoapp/

### Unused Dependencies

None — all listed packages are detected as used.

### Missing Dependencies

| Package | Status           | Reason                                                                                                                                                                                                                                                                                                           |
| ------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `three` | expected missing | Loaded as vendor ES module via `<script type="importmap">` for 3D visualizations (periodic table, molecule studio, orbital viewer). Not declared in `myhugoapp/package.json` because it resolves from the root `node_modules/` (transitive or hoisted). Jest config references it via `transformIgnorePatterns`. |

### Notes

The following packages are intentionally **not flagged as unused** by depcheck but serve test/dev purposes:

| Package                  | Directory              | Role                                                                                              |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `jest-environment-jsdom` | root `devDependencies` | JSDOM test environment for Jest unit tests. Not imported directly — Jest resolves it by name.     |
| `@playwright/test`       | root `dependencies`    | Playwright E2E test framework. Imported only in `tests/*.spec.js` files, not in application code. |

---

## Summary

| Directory    | Unused       | Missing      | Status   |
| ------------ | ------------ | ------------ | -------- |
| `api/`       | 1 (expected) | 0            | ✅ Clean |
| `myhugoapp/` | 0            | 1 (expected) | ✅ Clean |
