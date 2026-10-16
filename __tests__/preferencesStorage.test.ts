import {
  FocusPreferences,
  loadPreferences,
  savePreferences,
} from '../src/storage/preferencesStorage.web';
import { getMondayOfWeek } from '../src/utils/date';

describe('preferencesStorage (web)', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
      writable: true,
    });
  });

  it('loads sensible defaults when storage is unpopulated', () => {
    const prefs = loadPreferences();
    expect(prefs.sessionMinutes).toBe(25);
    expect(prefs.theme).toBe('dark');
    expect(prefs.language).toBe('tr');
    expect(prefs.hapticsEnabled).toBe(true);
    expect(prefs.onboardingCompleted).toBe(false);
  });

  it('clamps sessionMinutes between 1 and 720', () => {
    mockStorage['focal.preferences'] = JSON.stringify({
      sessionMinutes: 9999,
    });
    expect(loadPreferences().sessionMinutes).toBe(720);

    mockStorage['focal.preferences'] = JSON.stringify({
      sessionMinutes: -10,
    });
    expect(loadPreferences().sessionMinutes).toBe(1);
  });

  it('persists and round-trips updated preferences', () => {
    const updated: FocusPreferences = {
      sessionMinutes: 50,
      sessionSeconds: 30,
      durationUnit: 'minutes',
      theme: 'light',
      language: 'en',
      notificationsEnabled: true,
      hapticsEnabled: false,
      soundEnabled: false,
      onboardingCompleted: true,
      completedSessions: 8,
      totalFocusMinutes: 400,
      pomodoroEnabled: true,
      pomodoroCycle: 3,
      pomodoroFocusMinutes: 25,
      pomodoroShortBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      soundAlertTone: 'tibetan',
      weeklyHistory: [0, 0, 0, 0, 0, 0, 0],
    };

    savePreferences(updated);
    const loaded = loadPreferences();

    expect(loaded).toEqual(updated);
  });

  it('clamps sessionSeconds between 5 and 3600', () => {
    mockStorage['focal.preferences'] = JSON.stringify({
      sessionSeconds: 99999,
    });
    expect(loadPreferences().sessionSeconds).toBe(3600);

    mockStorage['focal.preferences'] = JSON.stringify({
      sessionSeconds: 2,
    });
    expect(loadPreferences().sessionSeconds).toBe(5);
  });

  it('validates durationUnit and falls back to minutes for invalid strings', () => {
    mockStorage['focal.preferences'] = JSON.stringify({
      durationUnit: 'seconds',
    });
    expect(loadPreferences().durationUnit).toBe('seconds');

    mockStorage['focal.preferences'] = JSON.stringify({
      durationUnit: 'invalid_unit',
    });
    expect(loadPreferences().durationUnit).toBe('minutes');
  });

  it('clamps pomodoro parameters to supported intervals', () => {
    mockStorage['focal.preferences'] = JSON.stringify({
      pomodoroCycle: 10,
      pomodoroFocusMinutes: 500,
      pomodoroShortBreakMinutes: 100,
      pomodoroLongBreakMinutes: 200,
    });
    const loaded = loadPreferences();
    expect(loaded.pomodoroCycle).toBe(4);
    expect(loaded.pomodoroFocusMinutes).toBe(180);
    expect(loaded.pomodoroShortBreakMinutes).toBe(60);
    expect(loaded.pomodoroLongBreakMinutes).toBe(120);
  });

  it('migrates from legacy focus-engine.preferences key if focal.preferences is missing', () => {
    mockStorage['focus-engine.preferences'] = JSON.stringify({
      sessionMinutes: 40,
      theme: 'light',
    });
    const loaded = loadPreferences();
    expect(loaded.sessionMinutes).toBe(40);
    expect(loaded.theme).toBe('light');
  });

  it('safely handles non-JSON data and falls back to defaults', () => {
    mockStorage['focal.preferences'] = 'CORRUPT_NOT_JSON';
    const loaded = loadPreferences();
    expect(loaded.sessionMinutes).toBe(25);
    expect(loaded.theme).toBe('dark');
  });

  it('correctly calculates the Monday of the week for any given date', () => {
    // 2026-10-12 is Monday
    expect(getMondayOfWeek(new Date('2026-10-12T10:00:00Z'))).toBe('2026-10-12');
    // 2026-10-14 is Wednesday
    expect(getMondayOfWeek(new Date('2026-10-14T10:00:00Z'))).toBe('2026-10-12');
    // 2026-10-18 is Sunday -> Monday of that week was 2026-10-12
    expect(getMondayOfWeek(new Date('2026-10-18T10:00:00Z'))).toBe('2026-10-12');
    // 2026-10-19 is next Monday
    expect(getMondayOfWeek(new Date('2026-10-19T02:00:00Z'))).toBe('2026-10-19');
  });

  it('persists and round-trips weeklyHistoryStartDate', () => {
    mockStorage['focal.preferences'] = JSON.stringify({
      weeklyHistory: [10, 20, 30, 0, 0, 0, 0],
      weeklyHistoryStartDate: '2026-10-12',
    });
    const loaded = loadPreferences();
    expect(loaded.weeklyHistoryStartDate).toBe('2026-10-12');
    expect(loaded.weeklyHistory).toEqual([10, 20, 30, 0, 0, 0, 0]);
  });
});
