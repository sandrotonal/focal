import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimerState = {
  elapsed: number;
  isRunning: boolean;
  startedAt: number | null;
  scheduledNotificationId: string | null;
};

const STORAGE_KEY = 'focal.timer';
const LEGACY_STORAGE_KEY = 'focus-engine.timer';

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

export function loadTimerState(): TimerState {
  const serialized = memoryCache.get(STORAGE_KEY) ?? memoryCache.get(LEGACY_STORAGE_KEY);

  if (!serialized) {
    return { elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null };
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<TimerState>;
    return {
      elapsed: typeof parsed.elapsed === 'number' ? Math.max(0, parsed.elapsed) : 0,
      isRunning: parsed.isRunning === true,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      scheduledNotificationId:
        typeof parsed.scheduledNotificationId === 'string'
          ? parsed.scheduledNotificationId
          : null,
    };
  } catch {
    return { elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null };
  }
}

export function saveTimerState(state: TimerState): void {
  const serialized = JSON.stringify(state);
  memoryCache.set(STORAGE_KEY, serialized);

  // Asynchronously persist to persistent storage
  void AsyncStorage.setItem(STORAGE_KEY, serialized).catch(() => {});
}
