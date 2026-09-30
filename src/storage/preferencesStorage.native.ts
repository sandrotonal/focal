import { createMMKV } from 'react-native-mmkv';

export type ThemeMode = 'dark' | 'light';

export type FocusPreferences = {
  sessionMinutes: number;
  theme: ThemeMode;
  notificationsEnabled: boolean;
};

const STORAGE_KEY = 'focus-engine.preferences';
const defaults: FocusPreferences = {
  sessionMinutes: 25,
  theme: 'dark',
  notificationsEnabled: false,
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
      notificationsEnabled: parsed.notificationsEnabled === true,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(preferences: FocusPreferences) {
  storage?.set(STORAGE_KEY, JSON.stringify(preferences));
}
