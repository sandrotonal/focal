import { createMMKV } from 'react-native-mmkv';

export type TimerState = {
  elapsed: number;
  isRunning: boolean;
  startedAt: number | null;
  scheduledNotificationId: string | null;
};

const STORAGE_KEY = 'focal.timer';
const LEGACY_STORAGE_KEY = 'focus-engine.timer';
const fallbackStorage = new Map<string, string>();

let storage: ReturnType<typeof createMMKV> | null = null;

try {
  storage = createMMKV({ id: 'focal' });
} catch {
  // Expo Go does not load custom native modules. A development build uses MMKV.
}

export function loadTimerState(): TimerState {
  const serialized =
    storage?.getString(STORAGE_KEY) ??
    storage?.getString(LEGACY_STORAGE_KEY) ??
    fallbackStorage.get(STORAGE_KEY) ??
    fallbackStorage.get(LEGACY_STORAGE_KEY);

  if (!serialized) {
    return { elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null };
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<TimerState>;
    return {
      elapsed: typeof parsed.elapsed === 'number' ? Math.max(0, parsed.elapsed) : 0,
      isRunning: parsed.isRunning === true,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      scheduledNotificationId: typeof parsed.scheduledNotificationId === 'string'
        ? parsed.scheduledNotificationId
        : null,
    };
  } catch {
    return { elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null };
  }
}

export function saveTimerState(state: TimerState) {
  const serialized = JSON.stringify(state);
  storage?.set(STORAGE_KEY, serialized);

  if (!storage) {
    fallbackStorage.set(STORAGE_KEY, serialized);
  }
}
