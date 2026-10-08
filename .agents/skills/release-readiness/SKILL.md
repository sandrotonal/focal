---
name: release-readiness
description: Gate verification and checklist audit to ensure an application satisfies all requirements before production release or deployment.
---

# Release Readiness Skill

## Goal
Verify that all 4 production gates, compliance criteria, security policies, and environment configurations are satisfied before tagging a release, deploying to production, or submitting to app stores.

---

## Pre-Release Gate Validation

### 1. Static Verification
```bash
# Typecheck
npx tsc --noEmit

# Lint
npm run lint # or npx expo lint
```
- Confirm 0 type errors.
- Confirm 0 critical lint errors.
- Check git working tree for uncommitted debug logs or temporary test flags.

### 2. Security Check
- Scan for secrets or exposed private credentials in code:
  - Check `.env` files vs `.gitignore`
  - Verify client builds do not contain database private keys or service account credentials.
- Audit dependencies:
  ```bash
  npm audit
  ```

### 3. Build & Artifact Verification
- Execute production build:
  - Web: `npm run build`
  - Expo / Mobile: `npx expo-doctor` and `eas build --dry-run` or local release build.
- Confirm bundle size within acceptable budgets.

### 4. Smoke Test Matrix
Execute smoke test across core flows:
1. Fresh install / cold launch.
2. Complete primary user flow (e.g. focus session start, run, complete).
3. Network cut simulation (airplane mode) -> verify graceful recovery.
4. Settings update and persistence test across app restart.
5. Notification delivery test.

---

## Release Decision
- **GO:** All 4 gates passed, 0 Critical issues, 0 High issues, production build verified.
- **NO-GO:** Any Gate failure or unaddressed Critical/High issue.
