---
name: production-audit
description: Comprehensive production readiness audit evaluating functionality, architecture, security, performance, accessibility, error resilience, and release gates.
---

# Production Audit Skill

## Goal
Determine whether an application is genuinely ready for real users and production release by executing an exhaustive 20-step evaluation across all layers.

---

## 4-Gate Production System

An application is NOT production-ready until it passes all four gates:

```
[GATE 1: Code & Architecture]
TypeScript Strict // Lint // Dependency Audit // Zero Secrets Leakage // Clean Error Boundaries
      ↓
[GATE 2: Behavioral Integrity]
Unit Logic // Integration Boundaries // Edge Cases // Offline Resilience // Session Revocation
      ↓
[GATE 3: User Experience & Fluidity]
60-120 FPS // Stable Memory // Touch Targets (44pt) // Contrast (WCAG AA) // Reduced Motion
      ↓
[GATE 4: Production Environment]
Release Build // Telemetry & Sentry // Staging Smoke Test // Rollback Plan // Zero Critical Issues
```

---

## 20-Step Audit Procedure

1. **Architecture & Project Topology:** Inspect project structure, design patterns, modularity, and separation of concerns.
2. **Runtime & Platform Target:** Determine web, native mobile (iOS/Android), desktop, or cross-platform constraints.
3. **Critical User Journeys:** Map out core user journeys (onboarding, authentication, main product loop, payment/settings).
4. **State Machine Completeness:** Verify all async flows implement `idle`, `loading`, `success`, `empty`, `error`, and `retry`.
5. **API & Network Boundaries:** Inspect network layers, timeouts, payload parsers, and status code handling.
6. **Persistence & Data Integrity:** Inspect local storage (MMKV, SQLite, LocalStorage) and migration mechanisms.
7. **Authentication & Token Lifecycle:** Inspect token storage, refresh intervals, session expiration, and sign-out cleanup.
8. **Error Handling & Graceful Degradation:** Check try-catch coverage, global error boundaries, and non-blocking failure states.
9. **Edge Case Coverage:** Audit null/undefined fields, rapid double taps, network cuts, and boundary conditions.
10. **Performance Profiling:** Check FPS, layout shifts, re-render cascades, memory leaks, and large assets.
11. **Security & Secrets Review:** Verify zero private tokens or connection strings are in client-facing bundles.
12. **Authorization Enforcement:** Confirm sensitive mutations are enforced server-side.
13. **Dependency Health:** Audit outdated, deprecated, or vulnerable packages (`npm audit`).
14. **Accessibility (a11y) Verification:** Verify VoiceOver/TalkBack labels, contrast ratios, and touch targets (44pt+).
15. **Responsive & Orientation Bounds:** Test smallest supported mobile screen (SE) to tablet/desktop layouts.
16. **Visual & Motion Consistency:** Verify adherence to design tokens, 1px hairlines, and physical exit animations.
17. **Production Configuration:** Check production environment variables, API endpoints, and SSL/CORS policies.
18. **Release Build Validation:** Verify clean standalone production bundle output (`npm run build` or `eas build`).
19. **Automated Test Coverage:** Run and audit unit, integration, and E2E suites.
20. **Monitoring & Observability:** Confirm crash reporting (Sentry) and health checks are configured.

---

## Severity Levels

- **CRITICAL:** Data loss, security breach, application crash, broken core conversion loop, blocked release.
- **HIGH:** Significant functionality degradation, major edge case failure, unhandled network outage.
- **MEDIUM:** Non-fatal UX inconsistency, missing empty/error state, minor performance stutter.
- **LOW:** Micro-alignment imperfection, minor code cleanup, missing auxiliary accessibility hint.
- **INFO:** Architectural recommendation, library modernization, proactive optimization note.

---

## Output Template

When running a production audit, output the report using this strict format:

```markdown
# Production Readiness Audit Report

## Executive Summary
[High-level readiness assessment and core findings]

## Gate Status
- [ ] Gate 1 (Code & Architecture): PASS / FAIL
- [ ] Gate 2 (Behavioral Integrity): PASS / FAIL
- [ ] Gate 3 (User Experience): PASS / FAIL
- [ ] Gate 4 (Production Environment): PASS / FAIL

## Critical Issues (Release Blockers)
- ...

## High Priority Issues
- ...

## Medium & Low Priority Improvements
- ...

## Missing Validation & Test Gaps
- ...

## Security & Privacy Risks
- ...

## Performance & Memory Audit
- ...

## Recommended Action Plan (Ordered by Impact)
1. ...
2. ...

## Production Readiness Score: [X / 100]
```

Never claim an application is "100% bug-free" or "perfect". Use objective verification claims.
