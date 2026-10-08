# Production Release Checklist

Every release must pass all verification gates before deployment or store submission.

## GATE 1: Code & Architecture Quality
- [ ] TypeScript strict mode passes with 0 errors (`npx tsc --noEmit`)
- [ ] Linter passes with 0 critical warnings (`npm run lint` or `npx expo lint`)
- [ ] No debug code, mock hardcoded IDs, or console noise left in release files
- [ ] No unhandled Promise rejections or empty catch blocks
- [ ] No hardcoded secrets, API keys, or private tokens committed
- [ ] Dependencies audited for known vulnerabilities (`npm audit`)

## GATE 2: Behavioral Testing & Edge Cases
- [ ] Unit tests pass across utility and calculation logic
- [ ] Integration tests pass across storage, API, and auth boundaries
- [ ] Critical user journeys (onboarding, session, settings) verified
- [ ] Edge cases tested: empty states, invalid inputs, network loss, backgrounding
- [ ] Regression tests pass for recently resolved issues

## GATE 3: User Experience & Hardware Quality
- [ ] 60 FPS / 120 FPS fluidity verified on target mobile hardware
- [ ] Memory footprint stable (no memory leaks across repetitive actions)
- [ ] Fluid exit and enter animations verified (no sudden unmount popping)
- [ ] Minimum 44x44pt touch targets verified across interactive controls
- [ ] VoiceOver / screen reader navigation and accessibility labels verified
- [ ] Reduced motion preference respected
- [ ] Dark mode surface hierarchy and contrast compliance verified

## GATE 4: Production Environment & Release Artifacts
- [ ] Production build succeeds cleanly (`npm run build` or `eas build`)
- [ ] Environment variables and production API endpoints validated
- [ ] Crash reporting and telemetry initialized (Sentry, APM)
- [ ] Production smoke test passes on real device or production URL
- [ ] Rollback strategy and backup points documented
