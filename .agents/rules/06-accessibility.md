# Accessibility Rules

Every production user interface must be inclusive and accessible across assistive technologies.

## Core Accessibility Checks
- Keyboard Navigation: logical tab order, no keyboard traps, visible focus rings.
- Screen Readers: VoiceOver (iOS/macOS), TalkBack (Android), NVDA/JAWS (Windows).
- Semantic Tree: use semantic landmarks (`header`, `main`, `nav`, `footer`) or React Native roles (`accessibilityRole="button" | "header" | "alert"`).
- Accessible Names: interactive components must have meaningful `accessibilityLabel` or `aria-label`.
- Accessible State: communicate dynamic status changes via `accessibilityState` (`selected`, `disabled`, `expanded`).
- Color Contrast: minimum WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text and UI components).
- Color Invariance: never convey status (error, success, active) solely through color; always pair with text, icons, or patterns.
- Touch Target Sizes: minimum 44x44pt on iOS / 48x48dp on Android for all interactive touch targets.
- Reduced Motion: honor user system preference (`useReducedMotion` or `@media (prefers-reduced-motion)`). Never force disorienting parallax or looping rotations.
- Form Accessibility: form inputs must have associated labels and distinct error announcements.
