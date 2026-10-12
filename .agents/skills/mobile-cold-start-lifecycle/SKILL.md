---
name: mobile-cold-start-lifecycle
description: Patterns and verification checklists for mobile cold start synchronization, atomic persistent storage writes, lazy native audio player loading, and app store manifest/entitlement parity.
---

# Mobile Cold Start & Resource Lifecycle Skill

This skill provides architectural patterns and verification procedures for mobile React Native and Expo applications to eliminate storage race conditions, memory leaks, and store rejection risks.

---

## 1. Asynchronous Storage Initialization Pattern

When using asynchronous storage engines (`AsyncStorage`, SQLite, or filesystem-backed caches):

### Implementation Pattern

```typescript
// Dedicated initialization promise
let storageInitPromise: Promise<AppPreferences> | null = null;

export function initStorage(): Promise<AppPreferences> {
  if (storageInitPromise) {
    return storageInitPromise;
  }

  storageInitPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = validateSchema(parsed);
        memoryCache.set(STORAGE_KEY, validated);
        return validated;
      }
    } catch {
      // Fallback on error
    }
    return defaultPreferences;
  })();

  return storageInitPromise;
}
```

### React Hook Integration

```typescript
export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    initStorage()
      .then((loaded) => {
        if (isMounted) {
          setPreferences(loaded);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { preferences, isReady };
}
```

---

## 2. Atomic Write Queue Pattern

To prevent read-modify-write data loss caused by fast, overlapping user interactions:

```typescript
let writeQueue: Promise<void> = Promise.resolve();
let currentMemoryState: AppPreferences = defaultPreferences;

export function updatePreferencesAtomically(patch: Partial<AppPreferences>): Promise<AppPreferences> {
  // Synchronously update in-memory snapshot immediately
  currentMemoryState = { ...currentMemoryState, ...patch };
  const updatedSnapshot = currentMemoryState;

  // Enqueue persistence asynchronously
  writeQueue = writeQueue
    .then(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnapshot));
    })
    .catch((error) => {
      // Handle write failure
    });

  return Promise.resolve(updatedSnapshot);
}
```

---

## 3. Native Audio Player Resource Allocation

### Rules for Audio Pools

1. **Limit Active AudioPlayers:** On mobile operating systems (iOS `AVPlayer`, Android `ExoPlayer`), keep active native players under 4 to avoid decoder exhaustion.
2. **Eager Preload (Critical Path):**
   - Micro-haptic ticks / clock pulses.
   - Timer start / stop triggers.
   - The user's currently selected alert tone.
3. **Lazy Preload (Secondary / Preview):**
   - Optional sound library tones must only instantiate an `AudioPlayer` when explicitly selected or previewed in the settings sheet.

---

## 4. App Store Manifest & Entitlement Verification

Before submitting or building with EAS / Xcode / Gradle:

1. **Background Modes:** If `setAudioModeAsync({ shouldPlayInBackground: true })` is used, verify that `app.json` contains:
   ```json
   "ios": {
     "infoPlist": {
       "UIBackgroundModes": ["audio"]
     }
   }
   ```
2. **Unique Package Namespace:** Ensure `bundleIdentifier` and `android.package` reflect an organization-owned domain (e.g. `com.yourcompany.appname`), avoiding generic placeholders like `com.example.app`.
3. **Asset Deduplication:** Verify `assets/` contains zero byte-duplicate files under alias filenames.
