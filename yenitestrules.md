Aynen kanka. Asıl yapmak istediğin şey bu. Bir uygulama localhost'ta çalışıyor diye ürün hazır değildir. Local testten production-grade ürüne geçiş için standart bir kalite sistemi kurmamız lazım.
Ben bunu AI coding agent'ın kullanabileceği şekilde hazırlardım: .agents/rules + .agents/skills.
1. Temel mantık
Bir uygulama şu aşamalardan geçmeden "production ready" kabul edilmeyecek:
LOCAL DEVELOPMENT
       ↓
CODE QUALITY
       ↓
FUNCTIONAL TESTING
       ↓
EDGE CASE TESTING
       ↓
SECURITY AUDIT
       ↓
PERFORMANCE AUDIT
       ↓
ACCESSIBILITY
       ↓
REAL ENVIRONMENT TEST
       ↓
RELEASE BUILD
       ↓
STAGING
       ↓
PRODUCTION SMOKE TEST
       ↓
MONITORING
       ↓
PRODUCTION READY

Ve en önemli kural:
"Çalışıyor" ≠ "ürün hazır."

2. .agents/rules/00-production-standard.md
Bunu ana anayasa yapardım:
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

1. The intended functionality works.
2. Invalid inputs are handled safely.
3. Loading states are handled.
4. Empty states are handled.
5. Error states are handled.
6. Network failures are handled.
7. Slow network conditions are considered.
8. Authentication/authorization is validated where applicable.
9. No sensitive data is exposed.
10. Performance is acceptable on realistic hardware.
11. UI works across supported screen sizes.
12. Accessibility requirements are satisfied.
13. Production build succeeds.
14. Production environment has been tested.
15. No known critical or high-severity issue remains.

---

## Never Assume

Never assume that:

- localhost behavior equals production behavior
- development mode performance equals release performance
- one browser/device represents all users
- a successful API request means the integration is reliable
- a successful database query means the data layer is safe
- a UI that looks correct is accessible
- a feature that works once is stable
- absence of an error means absence of a bug

---

## Preserve Existing UX

When fixing technical problems:

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

Use:

- no known critical issues
- production validation completed
- tested on supported environments
- performance target achieved

---

## Before Release

The project must pass:

- build validation
- lint
- type checking
- unit tests
- integration tests
- end-to-end tests where applicable
- security checks
- performance checks
- accessibility checks
- production smoke tests

Only then may the release be considered production-ready.

3. 01-testing.md
# Testing Rules

## Testing Layers

Use multiple testing layers.

### Unit Tests

Test isolated logic:

- utilities
- calculations
- state transitions
- validation
- formatters
- business rules

### Integration Tests

Test:

- API + application
- database + application
- authentication
- storage
- notifications
- external integrations

### End-to-End Tests

Test complete user journeys.

Examples:

- onboarding
- registration
- login
- primary product flow
- payment
- logout
- settings
- error recovery

---

## Edge Cases

Every important feature must consider:

- empty input
- invalid input
- missing data
- null values
- duplicate actions
- rapid repeated clicks
- slow network
- network disconnect
- timeout
- server error
- expired authentication
- unauthorized access
- application restart
- refresh
- back navigation
- unexpected API response

---

## Regression Protection

When fixing a bug:

1. Reproduce the bug.
2. Identify the root cause.
3. Fix the root cause.
4. Add a regression test.
5. Re-run relevant tests.
6. Verify the original user flow.

Do not only patch the visible symptom.

4. 02-performance.md
Burası çok önemli.
# Performance Rules

Performance must be evaluated using realistic production conditions.

## Web

Check:

- initial load
- JavaScript bundle size
- image size
- font loading
- layout shifts
- unnecessary renders
- long tasks
- network waterfalls
- caching
- lazy loading

Measure:

- LCP
- INP
- CLS
- TTFB

---

## Mobile

Check:

- FPS
- frame drops
- memory usage
- startup time
- navigation performance
- animation performance
- battery impact
- background behavior
- large assets
- list rendering

Animations should use the platform's appropriate performant animation system.

Avoid unnecessary work on the main/UI thread.

---

## General Rules

Do not optimize blindly.

First identify:

1. bottleneck
2. cause
3. measurable impact
4. optimization
5. regression check

Never sacrifice UX for meaningless micro-optimizations.

5. 03-security.md
# Security Rules

Security is required for production.

## Never

Never expose:

- API secrets
- private keys
- database credentials
- service credentials
- private tokens

Never commit secrets to Git.

---

## Authentication

Verify:

- password handling
- session expiration
- token expiration
- logout
- refresh tokens
- unauthorized access
- account enumeration risks

---

## Authorization

Never rely only on frontend protection.

Every sensitive backend operation must verify authorization server-side.

---

## Input Validation

Validate untrusted input on the server.

Consider:

- injection
- XSS
- SQL injection
- command injection
- path traversal
- malicious file uploads
- oversized requests

---

## Dependencies

Regularly check:

- vulnerable dependencies
- outdated packages
- unnecessary packages
- abandoned packages

Do not add a dependency when native/platform functionality is sufficient.

6. 04-production-environment.md
Localhost ile production arasındaki en büyük farklardan biri burada.
# Production Environment Rules

Never assume localhost configuration represents production.

Validate:

- environment variables
- API URLs
- database URLs
- authentication configuration
- CORS
- cookies
- HTTPS
- redirects
- storage
- CDN
- caching
- rate limits
- logging
- error reporting

---

## Environment Separation

Use separate environments when appropriate:

- development
- staging
- production

Never use production credentials for local development unless explicitly required and secured.

---

## Production Build

Always test the actual production build.

Do not consider development server behavior sufficient.

Examples:

Web:
- production build
- deployed staging environment

Mobile:
- release build
- real device

Desktop:
- packaged release build

7. 05-network-and-failure.md
Bunu özellikle koyardım çünkü localhost'ta en çok unutulan şeylerden biri.
# Failure Handling Rules

Assume external systems can fail.

The application must gracefully handle:

- no internet
- slow internet
- timeout
- HTTP 400
- HTTP 401
- HTTP 403
- HTTP 404
- HTTP 409
- HTTP 429
- HTTP 500
- malformed response
- unavailable service

---

## UI States

Important asynchronous operations should have:

- idle
- loading
- success
- empty
- error
- retry

Do not leave users with infinite loading states.

---

## Retry

Retries must be intentional.

Avoid uncontrolled retry loops.

Use:

- bounded retries
- exponential backoff where appropriate
- user-visible retry actions when useful

8. 06-accessibility.md
# Accessibility Rules

Every production interface should be usable by people with accessibility needs.

Check:

- keyboard navigation
- focus management
- screen readers
- semantic elements
- accessible labels
- accessible names
- color contrast
- touch target size
- reduced motion
- error announcements
- form labels
- focus visibility

Do not rely only on color to communicate state.

Interactive elements must have meaningful accessible names.

Test with actual accessibility tools when possible.

9. 07-ui-ux-quality.md
Senin projelerinde özellikle bunu koyardım.
# UI/UX Quality Rules

Never consider UI complete after only checking the happy path.

Every important screen must consider:

- loading
- empty
- error
- success
- disabled
- offline
- first-time user
- returning user
- long content
- small screen
- large screen

---

## Interaction Quality

Check:

- touch feedback
- hover where applicable
- focus
- disabled states
- transitions
- animation timing
- accidental double actions
- navigation behavior
- back behavior

---

## Visual Consistency

Preserve:

- spacing system
- typography
- colors
- border radius
- shadows
- icon style
- animation language

Do not introduce inconsistent UI patterns.

---

## Responsive

Test realistic dimensions rather than only resizing the browser manually.

Check:

- smallest supported screen
- normal screen
- large screen
- landscape where applicable

10. 08-release-checklist.md
Burayı release gate yapardım.
# Production Release Checklist

## Code

- [ ] Type checking passes
- [ ] Lint passes
- [ ] No debug code
- [ ] No console noise
- [ ] No temporary TODO blocking release
- [ ] No hardcoded secrets
- [ ] Dependencies reviewed

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass where applicable
- [ ] Regression tests pass
- [ ] Critical user flows tested

## Error Handling

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Retry behavior
- [ ] Offline behavior
- [ ] Authentication expiration

## Performance

- [ ] Production build tested
- [ ] Startup performance acceptable
- [ ] Navigation performance acceptable
- [ ] Animations smooth
- [ ] Large assets optimized
- [ ] Memory usage reviewed

## Security

- [ ] Secrets protected
- [ ] Authorization verified
- [ ] Input validation verified
- [ ] Dependencies checked
- [ ] HTTPS enabled

## Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader
- [ ] Focus
- [ ] Contrast
- [ ] Touch targets
- [ ] Reduced motion

## Production

- [ ] Staging tested
- [ ] Production environment tested
- [ ] Database migrations verified
- [ ] Backups verified where applicable
- [ ] Monitoring enabled
- [ ] Error reporting enabled
- [ ] Rollback plan exists

## Final

- [ ] No known critical issues
- [ ] No known high-severity unresolved issues
- [ ] Release build verified
- [ ] Smoke test completed

11. Asıl güçlü taraf: AI Skill sistemi
Bence sadece rules yapmayalım.
.agents/skills/ altında uzmanlık skill'leri oluşturalım:
.agents/
├── rules/
│   ├── 00-production-standard.md
│   ├── 01-testing.md
│   ├── 02-performance.md
│   ├── 03-security.md
│   ├── 04-production-environment.md
│   ├── 05-network-failure.md
│   ├── 06-accessibility.md
│   ├── 07-ui-ux-quality.md
│   └── 08-release-checklist.md
│
└── skills/
    ├── production-audit/
    │   └── SKILL.md
    ├── performance-audit/
    │   └── SKILL.md
    ├── security-audit/
    │   └── SKILL.md
    ├── testing/
    │   └── SKILL.md
    ├── accessibility-audit/
    │   └── SKILL.md
    ├── release-readiness/
    │   └── SKILL.md
    ├── error-handling/
    │   └── SKILL.md
    └── responsive-audit/
        └── SKILL.md

Ve production-audit/SKILL.md örneğin şöyle çalışır:
# Production Audit Skill

## Goal

Determine whether the application is ready for real users.

## Procedure

1. Inspect project architecture.
2. Identify application type and runtime.
3. Identify critical user flows.
4. Inspect state management.
5. Inspect API/network boundaries.
6. Inspect persistence.
7. Inspect authentication.
8. Inspect error handling.
9. Inspect loading/empty/error states.
10. Inspect performance-sensitive code.
11. Inspect dependencies.
12. Inspect security-sensitive code.
13. Inspect accessibility.
14. Inspect responsive behavior.
15. Inspect production configuration.
16. Inspect build configuration.
17. Inspect tests.
18. Run available validation commands.
19. Identify missing validation.
20. Produce a prioritized audit.

## Severity

CRITICAL
HIGH
MEDIUM
LOW
INFO

## Output

Always report:

### Critical Issues
### High Priority
### Medium Priority
### Low Priority
### Missing Tests
### Performance Risks
### Security Risks
### Production Risks
### Recommended Fix Order
### Production Readiness Score

Never claim the application is bug-free.

12. Ve en önemlisi: "Production Gate"
Kanka ben bunu 4 kapılı sistem yapardım:
GATE 1 — Code
TypeScript
Lint
Architecture
Dependencies
Secrets
Code quality

↓
GATE 2 — Behavior
Unit
Integration
E2E
Edge cases
Error handling
Offline
Auth
Persistence

↓
GATE 3 — Experience
Performance
FPS
Memory
Startup
Responsive
Accessibility
UI consistency
Animations

↓
GATE 4 — Production
Production build
Staging
Real device
Real network
Monitoring
Crash reporting
Rollback
Smoke test

Dört kapının tamamı geçilmeden:
❌ PRODUCTION READY

denmeyecek.