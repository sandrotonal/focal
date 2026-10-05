import { loadTimerState, saveTimerState, TimerState } from '../src/storage/timerStorage.web';

describe('timerStorage (web)', () => {
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

  it('returns default initial state when storage is empty', () => {
    const state = loadTimerState();
    expect(state).toEqual({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
    });
  });

  it('persists and reloads active timer state accurately', () => {
    const sampleState: TimerState = {
      elapsed: 120,
      isRunning: true,
      startedAt: 1700000000000,
      scheduledNotificationId: 'notif-123',
    };

    saveTimerState(sampleState);
    const loaded = loadTimerState();

    expect(loaded).toEqual(sampleState);
  });

  it('clamps negative elapsed seconds to 0', () => {
    mockStorage['focal.timer'] = JSON.stringify({
      elapsed: -45,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
    });

    const loaded = loadTimerState();
    expect(loaded.elapsed).toBe(0);
  });

  it('recovers gracefully from corrupted JSON in storage', () => {
    mockStorage['focal.timer'] = '{ invalid json ...';

    const loaded = loadTimerState();
    expect(loaded).toEqual({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
    });
  });

  it('migrates legacy focus-engine storage key if focal key is absent', () => {
    mockStorage['focus-engine.timer'] = JSON.stringify({
      elapsed: 300,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
    });

    const loaded = loadTimerState();
    expect(loaded.elapsed).toBe(300);
  });
});
