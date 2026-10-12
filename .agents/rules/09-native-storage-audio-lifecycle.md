# Native Storage, Audio and Cold Start Lifecycle Standard

## Core Principle

Mobile applications run in resource-constrained, asynchronous runtime environments. Asynchronous disk I/O, native audio decoders, and operating system lifecycle events must be architected with deterministic synchronization.

Never assume that disk storage is synchronous, native media handles are infinite, or that manifest entitlements are automatically granted.

---

## 1. Storage Cold-Start Synchronization

### The Anti-Pattern
- Reading storage synchronously on first render while background `AsyncStorage` or SQLite promises are still unresolved in memory.
- Hardcoding `isLoaded = true` before disk data is fully deserialized.
- Overwriting persistent user preferences with fallback defaults due to race conditions.

### The Standard
1. **Deterministic Loading Gate:** Storage hooks and contexts must expose an explicit `isLoaded` / `isReady` state initialized to `false`.
2. **App Boot Gate:** Splash screen, loading skeleton, or fallback boundary must remain active until persistent storage has resolved and populated the in-memory cache.
3. **Safe Parsing:** Deserialization parsers must strictly validate every field against typed schema definitions and union types (e.g. all sound tones, languages, themes), never discarding newly added valid values into legacy fallbacks.

---

## 2. Atomic Preference Mutation (Write Race Prevention)

### The Anti-Pattern
- "Read-Modify-Write" pattern: reading storage asynchronously or synchronously from disk/cache and spreading `...current, ...patch` directly.
- Rapid successive UI toggles (e.g. toggling haptics, then sound within 50ms) causing stale snapshots to overwrite subsequent mutations.

### The Standard
1. **Single Source of Truth:** Maintain an active in-memory reference (`useRef` or state reducer) representing the latest mutated state.
2. **Sequential Write Queue:** Storage writes must be serialized through an asynchronous execution queue or atomic updater to guarantee that mutations are committed strictly in chronological order without snapshot tearing.

---

## 3. Native Audio and Media Resource Lifecycle

### The Anti-Pattern
- Eagerly allocating dozens of `AudioPlayer` or media instances at application launch.
- Creating native decoder leaks, exhausting OS file descriptors, or causing audio session lock contention on low-tier mobile devices.

### The Standard
1. **Core Eager Initialization:** Preload only the minimal critical-path audio assets required for immediate user feedback (e.g. interaction tick, timer start, active session tone).
2. **Lazy On-Demand Allocation:** Preview tones, secondary audio options, and heavy media assets must be allocated on-demand upon first user interaction (e.g. opening settings drawer or previewing tone) and cached subsequently.
3. **Audio Session Parity:** If `shouldPlayInBackground: true` is configured, verify that the corresponding native capability (e.g. `UIBackgroundModes: ["audio"]` in iOS `Info.plist`) is explicitly declared in the application manifest.

---

## 4. Manifest, Store Identity and Documentation Parity

### The Anti-Pattern
- Using generic test identifiers (e.g. `com.example.app`, `com.focal.app`) destined for collision during App Store / Google Play submission.
- Marketing libraries in README (e.g. MMKV badges) that are not present in `package.json`.
- Retaining duplicate media assets (e.g. identical WAV files with different names) that artificially inflate application bundle size.

### The Standard
1. **Unique Reverse-Domain Namespace:** Always assign organization-scoped identifiers (e.g. `com.<organization>.<app>`).
2. **Bundle Hygiene:** Eliminate duplicate audio or graphic assets; point internal registry keys to single source files.
3. **Documentation Accuracy:** Ensure all badges, architecture diagrams, and setup instructions match the real dependencies installed in `package.json`.
