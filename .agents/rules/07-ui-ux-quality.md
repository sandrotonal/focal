# UI/UX Quality & Consistency Rules

Never consider a UI implementation complete by testing only the happy path under ideal conditions.

## State Completeness
Every production screen and widget must account for:
- loading state (skeletons or subtle non-blocking indicators)
- empty state (clear educational copy and call to action)
- error state (non-punitive messaging with recovery route)
- success state (feedback on completed action)
- disabled state (subtle opacity and interaction suppression)
- offline state (cached data presentation + offline banner)
- first-time user experience (onboarding or zero-data guides)
- returning power-user experience (rapid shortcuts, dense data)
- edge-case content lengths (extremely long titles, multi-byte unicode, ellipsis handling)
- screen boundaries (smallest supported mobile viewport to tablet/desktop)

---

## Interaction Quality & Polish
Verify:
- touch feedback (tactile haptics, spring compression, active state opacity)
- hover and active states on pointer devices
- keyboard focus visibility
- interruptible fluid animations (users should not wait for an animation to finish before interacting)
- dismissal mechanics (gesture pull-to-dismiss, backdrop click, Escape key)
- debounce / throttle protection against accidental rapid double taps
- predictive back navigation and history retention

---

## Visual Consistency & Design Systems
Preserve the application's established design language:
- strict adherence to spacing tokens (4px / 8px grid)
- typography hierarchy (font scales, weights, line heights)
- color tokens and surface elevation hierarchy
- border radius, 1px hairlines, and material elevation
- cohesive icon styles and stroke widths
- spring physics and motion language (Dieter Rams & Apple Hardware minimal standards)

Do not introduce ad-hoc styles, arbitrary padding, or conflicting UI conventions.
