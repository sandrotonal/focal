export type ThemeMode = 'dark' | 'light';
export type Language = 'tr' | 'en';
export type DurationUnit = 'minutes' | 'seconds';
export type SoundAlertTone = 'crystal' | 'aurora' | 'clarity' | 'tibetan' | 'mechanical';
export type PomodoroStage = 'focus' | 'shortBreak' | 'longBreak';

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
  pomodoroEnabled: boolean;
  pomodoroCycle: number;
  pomodoroFocusMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  soundAlertTone: SoundAlertTone;
  weeklyHistory: number[];
  weeklyHistoryStartDate?: string;
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
  pomodoroEnabled: false,
  pomodoroCycle: 1,
  pomodoroFocusMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  soundAlertTone: 'crystal',
  weeklyHistory: [0, 0, 0, 0, 0, 0, 0],
};

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPreferences(): FocusPreferences {
  const storage = getLocalStorage();
  const serialized = storage?.getItem(STORAGE_KEY) ?? storage?.getItem(LEGACY_STORAGE_KEY);

  if (!serialized) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<FocusPreferences>;
    return {
      sessionMinutes: typeof parsed.sessionMinutes === 'number'
        ? Math.min(720, Math.max(1, Math.round(parsed.sessionMinutes)))
        : defaults.sessionMinutes,
      sessionSeconds: typeof parsed.sessionSeconds === 'number'
        ? Math.min(3600, Math.max(5, Math.round(parsed.sessionSeconds)))
        : defaults.sessionSeconds,
      durationUnit: parsed.durationUnit === 'seconds' ? 'seconds' : 'minutes',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      language: parsed.language === 'en' ? 'en' : 'tr',
      notificationsEnabled: parsed.notificationsEnabled === true,
      hapticsEnabled: parsed.hapticsEnabled !== false,
      soundEnabled: parsed.soundEnabled !== false,
      onboardingCompleted: parsed.onboardingCompleted === true,
      completedSessions: typeof parsed.completedSessions === 'number' ? Math.max(0, Math.round(parsed.completedSessions)) : 0,
      totalFocusMinutes: typeof parsed.totalFocusMinutes === 'number' ? Math.max(0, Math.round(parsed.totalFocusMinutes)) : 0,
      pomodoroEnabled: parsed.pomodoroEnabled === true,
      pomodoroCycle: typeof parsed.pomodoroCycle === 'number'
        ? Math.min(4, Math.max(1, Math.round(parsed.pomodoroCycle)))
        : 1,
      pomodoroFocusMinutes: typeof parsed.pomodoroFocusMinutes === 'number'
        ? Math.min(180, Math.max(1, Math.round(parsed.pomodoroFocusMinutes)))
        : (typeof parsed.sessionMinutes === 'number' ? Math.min(180, Math.max(1, Math.round(parsed.sessionMinutes))) : 25),
      pomodoroShortBreakMinutes: typeof parsed.pomodoroShortBreakMinutes === 'number'
        ? Math.min(60, Math.max(1, Math.round(parsed.pomodoroShortBreakMinutes)))
        : 5,
      pomodoroLongBreakMinutes: typeof parsed.pomodoroLongBreakMinutes === 'number'
        ? Math.min(120, Math.max(1, Math.round(parsed.pomodoroLongBreakMinutes)))
        : 15,
      soundAlertTone:
        parsed.soundAlertTone === 'crystal' ||
        parsed.soundAlertTone === 'aurora' ||
        parsed.soundAlertTone === 'clarity' ||
        parsed.soundAlertTone === 'tibetan' ||
        parsed.soundAlertTone === 'mechanical'
          ? parsed.soundAlertTone
          : defaults.soundAlertTone,
      weeklyHistory:
        Array.isArray(parsed.weeklyHistory) && parsed.weeklyHistory.length === 7
          ? parsed.weeklyHistory.map((val) =>
              typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.round(val)) : 0
            )
          : [0, 0, 0, 0, 0, 0, 0],
      weeklyHistoryStartDate:
        typeof parsed.weeklyHistoryStartDate === 'string'
          ? parsed.weeklyHistoryStartDate
          : undefined,
    };
  } catch {
    return defaults;
  }
}

export function initPreferences(): Promise<FocusPreferences> {
  return Promise.resolve(loadPreferences());
}

export function savePreferences(preferences: FocusPreferences) {
  getLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
