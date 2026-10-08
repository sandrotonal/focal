# Performance Rules

Performance must be evaluated using realistic production conditions and target hardware.

## Web Applications
Check and audit:
- initial page load and Time to Interactive (TTI)
- JavaScript bundle size and tree shaking
- image dimensions, WebP/AVIF formats, and optimization
- web font loading strategies and FOUT/FOIT
- cumulative layout shifts (CLS)
- unnecessary component re-renders and memoization
- long tasks blocking the main thread (> 50ms)
- network waterfalls and asset preloading
- HTTP cache headers and Service Worker caching
- code splitting and dynamic imports (lazy loading)

Measure Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- INP (Interaction to Next Paint) < 200ms
- CLS (Cumulative Layout Shift) < 0.1
- TTFB (Time to First Byte) < 800ms

---

## Mobile Applications
Check and audit:
- steady 60 FPS / 120 FPS on actual mid-range hardware
- frame drops and stutter during gestures or scrolling
- peak and steady-state RAM memory usage (leak detection)
- cold startup time to usable interaction (< 2s)
- stack and tab navigation transition fluidity
- animation performance (worklets, driver offloading)
- battery consumption and background wake lock impact
- background task and lifecycle behavior
- large asset memory footprints (bitmaps, textures)
- virtualized list rendering (FlatList, FlashList)

Animations must use the platform's appropriate performant system:
- React Native: `react-native-reanimated` worklets on the native UI thread.
- Web: GPU-accelerated CSS transforms and composited properties (`transform`, `opacity`).
- Avoid running state calculations or layout measurements on the JavaScript bridge during active gestures.

---

## General Rules
Do not optimize blindly based on intuition.

First identify:
1. bottleneck via profiling tools (Flamegraph, Systrace, Lighthouse)
2. specific root cause
3. measurable benchmark metric
4. isolated optimization
5. regression and UX verification check

Never sacrifice UX, accessibility, or visual hierarchy for meaningless micro-optimizations.
