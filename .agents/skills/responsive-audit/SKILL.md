---
name: responsive-audit
description: Auditing and testing responsive layouts, viewport boundaries, safe area insets, dynamic type, and orientation adaptability.
---

# Responsive Audit Skill

## Goal
Verify that the application interface adapts fluidly across all supported device form factors, screen resolutions, notch/island insets, and orientations without clipping, overflow, or broken typography.

---

## Viewport Test Matrix

Audit and verify the interface across:
1. **Compact Mobile (iPhone SE / Small Android):** 320px – 375px width.
   - Verify text does not clip or wrap awkwardly.
   - Verify modals and drawers fit vertically without pushing action buttons off-screen.
2. **Standard Mobile (iPhone 15/16, Pixel):** 390px – 430px width.
   - Verify baseline visual rhythm, spacing tokens, and vertical balance.
3. **Large Mobile / Phablet:** 430px – 480px width.
   - Ensure content does not stretch disproportionately.
4. **Tablet / Foldable:** 600px – 1024px width.
   - Verify content max-width constraints (avoid excessively wide text lines).
5. **Desktop / Web:** 1024px+ width.
   - Verify responsive centering, backdrop scaling, and mouse/touch dual input.

---

## Safe Area Insets & Dynamic Type

- Insets:
  - Top safe inset (dynamic island, notch, status bar).
  - Bottom safe inset (home indicator bar).
  - Never place interactive elements or critical text under hardware obstructions.
- Dynamic Type & Font Scaling:
  - Verify that large user font preferences do not cause text to overlap adjacent containers.
  - Apply `numberOfLines` and `ellipsizeMode="tail"` on bounded header labels where appropriate.
