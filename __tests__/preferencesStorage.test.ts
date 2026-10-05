import {
  FocusPreferences,
  loadPreferences,
  savePreferences,
} from '../src/storage/preferencesStorage.web';

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
    };

    savePreferences(updated);
    const loaded = loadPreferences();

    expect(loaded).toEqual(updated);
  });

  it('safely handles non-JSON data and falls back to defaults', () => {
    mockStorage['focal.preferences'] = 'CORRUPT_NOT_JSON';
    const loaded = loadPreferences();
    expect(loaded.sessionMinutes).toBe(25);
    expect(loaded.theme).toBe('dark');
  });
});
