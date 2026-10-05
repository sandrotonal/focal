import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';
export type Language = 'tr' | 'en';
export type DurationUnit = 'minutes' | 'seconds';

export type FocusPreferences = {
  sessionMinutes: number;
  sessionSeconds: number;
  durationUnit: DurationUnit;
  theme: ThemeMode;
  language: Language;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  completedSessions: number;
  totalFocusMinutes: number;
};

const STORAGE_KEY = 'focal.preferences';
const LEGACY_STORAGE_KEY = 'focus-engine.preferences';

const defaults: FocusPreferences = {
  sessionMinutes: 25,
  sessionSeconds: 30,
  durationUnit: 'minutes',
  theme: 'dark',
  language: 'tr',
  notificationsEnabled: false,
  hapticsEnabled: true,
  soundEnabled: true,
  onboardingCompleted: false,
  completedSessions: 0,
  totalFocusMinutes: 0,
};

const memoryCache = new Map<string, string>();

// Pre-populate memory cache from AsyncStorage on app launch
void AsyncStorage.multiGet([STORAGE_KEY, LEGACY_STORAGE_KEY])
  .then((stores) => {
    stores.forEach(([key, value]) => {
      if (value) {
        memoryCache.set(key, value);
      }
    });
  })
  .catch(() => {});

export function loadPreferences(): FocusPreferences {
  const serialized = memoryCache.get(STORAGE_KEY) ?? memoryCache.get(LEGACY_STORAGE_KEY);

  if (!serialized) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<FocusPreferences>;
    return {
      sessionMinutes:
        typeof parsed.sessionMinutes === 'number'
          ? Math.min(720, Math.max(1, Math.round(parsed.sessionMinutes)))
          : defaults.sessionMinutes,
      sessionSeconds:
        typeof parsed.sessionSeconds === 'number'
          ? Math.min(3600, Math.max(5, Math.round(parsed.sessionSeconds)))
          : defaults.sessionSeconds,
      durationUnit: parsed.durationUnit === 'seconds' ? 'seconds' : 'minutes',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      language: parsed.language === 'en' ? 'en' : 'tr',
      notificationsEnabled: parsed.notificationsEnabled === true,
      hapticsEnabled: parsed.hapticsEnabled !== false,
      soundEnabled: parsed.soundEnabled !== false,
      onboardingCompleted: parsed.onboardingCompleted === true,
      completedSessions:
        typeof parsed.completedSessions === 'number'
          ? Math.max(0, Math.round(parsed.completedSessions))
          : 0,
      totalFocusMinutes:
        typeof parsed.totalFocusMinutes === 'number'
          ? Math.max(0, Math.round(parsed.totalFocusMinutes))
          : 0,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(preferences: FocusPreferences): void {
  const serialized = JSON.stringify(preferences);
  memoryCache.set(STORAGE_KEY, serialized);

  // Asynchronously persist to persistent storage
  void AsyncStorage.setItem(STORAGE_KEY, serialized).catch(() => {});
}
