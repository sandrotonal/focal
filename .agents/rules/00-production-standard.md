# Production Quality Standard

## Core Principle

A feature is not considered complete merely because it works in localhost.

Every feature must be validated across:
- functionality
- edge cases
- error handling
- performance
- security
- accessibility
- responsive behavior
- real production environment
- release build
- monitoring

Never declare a feature production-ready based only on local development testing.

---

## Definition of Done

A task is COMPLETE only when:
1. The intended functionality works as specified.
2. Invalid inputs are handled safely.
3. Loading states are handled.
4. Empty states are handled.
5. Error states are handled.
6. Network failures are handled gracefully.
7. Slow network conditions are considered.
8. Authentication and authorization are validated where applicable.
9. No sensitive data or secrets are exposed.
10. Performance is acceptable on realistic production hardware.
11. UI works across all supported screen sizes and orientations.
12. Accessibility requirements (labels, contrast, touch targets, reduced motion) are satisfied.
13. Production build succeeds with 0 errors.
14. Production/staging environment has been tested.
15. No known critical or high-severity issue remains.

---

## Never Assume

Never assume that:
- localhost behavior equals production behavior
- development mode performance equals release performance
- one browser or device represents all users
- a successful API request means the integration is reliable
- a successful database query means the data layer is safe
- a UI that looks correct is accessible
- a feature that works once is stable
- absence of an error means absence of a bug

---

## Preserve Existing UX

When fixing technical problems or optimizing code:
- Do not unnecessarily change the existing UI.
- Do not change spacing, typography, colors, animations, or interaction patterns unless required.
- Prefer internal improvements over visual redesign.
- Preserve established product behavior unless it is demonstrably incorrect.

---

## No Fake Completion

Never claim:
- "fully bug-free"
- "100% secure"
- "perfect performance"

unless the claim is objectively provable.

Use objective metrics instead:
- "no known critical issues"
- "production validation completed"
- "tested on supported environments"
- "performance target achieved"

---

## Before Release

The project must pass:
- build validation
- lint
- type checking (0 errors)
- unit tests
- integration tests
- end-to-end tests where applicable
- security checks
- performance checks
- accessibility checks
- production smoke tests

Only then may the release be considered production-ready.
