export type TimerState = {
  elapsed: number;
  isRunning: boolean;
  startedAt: number | null;
  scheduledNotificationId: string | null;
};

const STORAGE_KEY = 'focal.timer';
const LEGACY_STORAGE_KEY = 'focus-engine.timer';

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

export function loadTimerState(): TimerState {
  const storage = getLocalStorage();
  const serialized = storage?.getItem(STORAGE_KEY) ?? storage?.getItem(LEGACY_STORAGE_KEY);

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
  getLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(state));
}
