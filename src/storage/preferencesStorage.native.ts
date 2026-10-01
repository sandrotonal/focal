import { createMMKV } from 'react-native-mmkv';

export type ThemeMode = 'dark' | 'light';
export type Language = 'tr' | 'en';

export type FocusPreferences = {
  sessionMinutes: number;
  theme: ThemeMode;
  language: Language;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  completedSessions: number;
  totalFocusMinutes: number;
};

const STORAGE_KEY = 'focus-engine.preferences';
const defaults: FocusPreferences = {
  sessionMinutes: 25,
  theme: 'dark',
  language: 'tr',
  notificationsEnabled: false,
  hapticsEnabled: true,
  soundEnabled: true,
  onboardingCompleted: false,
  completedSessions: 0,
  totalFocusMinutes: 0,
};

let storage: ReturnType<typeof createMMKV> | null = null;

try {
  storage = createMMKV({ id: 'focus-engine' });
} catch {
  // Expo Go does not load custom native modules. A development build uses MMKV.
}

export function loadPreferences(): FocusPreferences {
  const serialized = storage?.getString(STORAGE_KEY);

  if (!serialized) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<FocusPreferences>;
    return {
      sessionMinutes: typeof parsed.sessionMinutes === 'number'
        ? Math.min(720, Math.max(1, Math.round(parsed.sessionMinutes)))
        : defaults.sessionMinutes,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      language: parsed.language === 'en' ? 'en' : 'tr',
      notificationsEnabled: parsed.notificationsEnabled === true,
      hapticsEnabled: parsed.hapticsEnabled !== false,
      soundEnabled: parsed.soundEnabled !== false,
      onboardingCompleted: parsed.onboardingCompleted === true,
      completedSessions: typeof parsed.completedSessions === 'number' ? Math.max(0, Math.round(parsed.completedSessions)) : 0,
      totalFocusMinutes: typeof parsed.totalFocusMinutes === 'number' ? Math.max(0, Math.round(parsed.totalFocusMinutes)) : 0,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(preferences: FocusPreferences) {
  storage?.set(STORAGE_KEY, JSON.stringify(preferences));
}
