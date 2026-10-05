---
name: accessibility-audit
description: Auditing and implementing accessibility standards including screen readers, keyboard navigation, touch targets, contrast ratios, and reduced motion.
---

# Accessibility Audit Skill

## Goal
Ensure the user interface is fully accessible, compliant with WCAG 2.1 AA standards, and optimized for assistive technologies (VoiceOver, TalkBack, screen readers, keyboard-only navigation).

---

## Audit Checklist

### 1. Semantic Elements & Roles
- Interactive elements must declare proper roles:
  - React Native: `accessibilityRole="button" | "header" | "link" | "alert" | "switch"`
  - Web: Semantic HTML tags (`<button>`, `<header>`, `<main>`, `<nav>`) or ARIA roles.
- Decorative icons and background illustrations must be hidden from screen readers:
  - React Native: `accessible={false}` or `importantForAccessibility="no"`
  - Web: `aria-hidden="true"`

### 2. Meaningful Accessible Labels
- Every interactive icon, button, or switch must have a descriptive label:
  - `accessibilityLabel="Close settings drawer"`
  - `accessibilityHint="Navigates back to the timer screen"`
- Labels must not redundantly include the role (e.g. use "Settings", not "Settings button").

### 3. Touch Target Sizing
- Verify all interactive targets meet minimum dimensional requirements:
  - iOS / Apple HIG: minimum **44 x 44 pt**
  - Android / Material: minimum **48 x 48 dp**
- Use `hitSlop` when visual element size is deliberately smaller for aesthetic precision.

### 4. Color Contrast (WCAG 2.1 AA)
- Normal text (< 18pt or < 14pt bold): minimum **4.5:1** contrast ratio against its direct background.
- Large text (≥ 18pt or ≥ 14pt bold): minimum **3.0:1** contrast ratio.
- UI components and graphical objects: minimum **3.0:1** contrast ratio.
- Never rely on color alone to indicate active, selected, or error states.

### 5. Reduced Motion
- Respect user system preference for reduced motion:
  - React Native: `useReducedMotion()` from `react-native-reanimated`
  - Web: `@media (prefers-reduced-motion: reduce)`
- When enabled, replace 3D perspective rotations or large translations with instant updates or subtle opacity transitions.
