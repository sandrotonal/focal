# Testing Rules

## Testing Layers

Use multiple testing layers across the codebase.

### Unit Tests
Test isolated logic:
- utilities and helper algorithms
- calculations and converters
- state transitions and reducers
- input and schema validation
- formatters and internationalization strings
- business rules and timers

### Integration Tests
Test boundaries and communication:
- API endpoints + application consumption
- database queries + application data models
- authentication and session flows
- persistent storage (MMKV, SQLite, LocalStorage)
- background tasks and notifications
- third-party native modules and integrations

### End-to-End Tests
Test complete critical user journeys:
- onboarding flow
- registration and sign-in
- primary core product journey
- payment and subscription checkout
- settings and preference updates
- sign-out and session revocation
- error recovery and offline return

---

## Edge Cases

Every critical feature must consider:
- empty inputs
- invalid data types and formats
- missing data fields
- null and undefined values
- duplicate actions and requests
- rapid repeated taps and double clicks
- slow network and throttling
- complete network disconnect
- request timeouts
- server 5xx and malformed responses
- expired tokens and authentication revocation
- unauthorized access attempts
- application cold starts and restarts
- screen refresh and backgrounding
- back navigation and deep linking interruptions
- unexpected payload structures

---

## Regression Protection

When fixing a bug:
1. Reproduce the bug consistently in an isolated scenario.
2. Identify the root cause rather than patching symptoms.
3. Fix the underlying root cause.
4. Add an automated regression test covering the edge case.
5. Re-run all existing test suites to prevent collateral damage.
6. Verify the original user flow end-to-end.

Do not only patch the visible symptom.
