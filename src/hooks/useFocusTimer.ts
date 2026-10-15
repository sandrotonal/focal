import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  playBreakCompleteSound,
  playFocusCompleteSound,
  playFocusStartSound,
  playResetSound,
  playTickSound,
} from '../audio/soundEngine';
import {
  cancelFocusCompletion,
  scheduleFocusCompletion,
} from '../notifications/notifications';
import { loadTimerState, saveTimerState } from '../storage/timerStorage';
import type { DurationUnit, PomodoroStage, SoundAlertTone } from '../storage/preferencesStorage';

export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
}

export type UseFocusTimerOptions = {
  targetDurationSeconds: number;
  sessionMinutes: number;
  sessionSeconds: number;
  durationUnit: DurationUnit;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundAlertTone?: SoundAlertTone;
  pomodoroEnabled?: boolean;
  pomodoroCycle?: number;
  pomodoroShortBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  notificationTitle: string;
  notificationBody: string;
  breakNotificationTitle?: string;
  breakNotificationBody?: string;
  onPomodoroCycleChange?: (cycle: number) => void;
  onSessionComplete: (addedMinutes: number) => void;
};

function getInitialTimerState(initialCycle = 1) {
  try {
    const persisted = loadTimerState();
    const now = Date.now();
    const restoredElapsed = persisted.isRunning && persisted.startedAt
      ? persisted.elapsed + Math.floor((now - persisted.startedAt) / 1000)
      : persisted.elapsed;

    return {
      elapsed: restoredElapsed,
      isRunning: persisted.isRunning,
      startedAt: persisted.startedAt,
      scheduledNotificationId: persisted.scheduledNotificationId,
      timerMode:
        persisted.timerMode === 'shortBreak' || persisted.timerMode === 'longBreak'
          ? (persisted.timerMode as PomodoroStage)
          : ('focus' as PomodoroStage),
      pomodoroCycle:
        typeof persisted.pomodoroCycle === 'number'
          ? Math.min(4, Math.max(1, Math.round(persisted.pomodoroCycle)))
          : initialCycle,
    };
  } catch {
    return {
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
      timerMode: 'focus' as PomodoroStage,
      pomodoroCycle: initialCycle,
    };
  }
}

export function useFocusTimer({
  targetDurationSeconds,
  sessionMinutes,
  sessionSeconds,
  durationUnit,
  notificationsEnabled,
  hapticsEnabled,
  soundAlertTone = 'crystal',
  pomodoroEnabled = false,
  pomodoroCycle: externalPomodoroCycle = 1,
  pomodoroShortBreakMinutes = 5,
  pomodoroLongBreakMinutes = 15,
  notificationTitle,
  notificationBody,
  breakNotificationTitle = 'Mola Tamamlandı',
  breakNotificationBody = 'Zihnini tazeledin. Yeni seansa hazırsın.',
  onPomodoroCycleChange,
  onSessionComplete,
}: UseFocusTimerOptions) {
  const [initialState] = useState(() => getInitialTimerState(externalPomodoroCycle));
  const [elapsed, setElapsed] = useState(initialState.elapsed);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timerMode, setTimerMode] = useState<PomodoroStage>(initialState.timerMode);
  const [pomodoroCycle, setPomodoroCycle] = useState(initialState.pomodoroCycle);

  const elapsedRef = useRef(initialState.elapsed);
  const runningRef = useRef(initialState.isRunning);
  const startedAtRef = useRef<number | null>(initialState.startedAt);
  const scheduledNotificationIdRef = useRef<string | null>(initialState.scheduledNotificationId);
  const timerModeRef = useRef<PomodoroStage>(initialState.timerMode);
  const cycleRef = useRef(initialState.pomodoroCycle);

  // Sync external cycle changes if timer is idle
  useEffect(() => {
    if (!runningRef.current && externalPomodoroCycle !== cycleRef.current) {
      cycleRef.current = externalPomodoroCycle;
      setPomodoroCycle(externalPomodoroCycle);
    }
  }, [externalPomodoroCycle]);

  // If Pomodoro is disabled, always return to focus stage
  useEffect(() => {
    if (!pomodoroEnabled && timerModeRef.current !== 'focus') {
      timerModeRef.current = 'focus';
      setTimerMode('focus');
      elapsedRef.current = 0;
      setElapsed(0);
      saveTimerState({
        elapsed: 0,
        isRunning: runningRef.current,
        startedAt: startedAtRef.current,
        scheduledNotificationId: scheduledNotificationIdRef.current,
        timerMode: 'focus',
        pomodoroCycle: cycleRef.current,
      });
    }
  }, [pomodoroEnabled]);

  // Target duration dynamically based on current interval stage
  const effectiveTargetSeconds = useMemo(() => {
    if (!pomodoroEnabled) {
      return targetDurationSeconds;
    }
    if (timerMode === 'shortBreak') {
      return durationUnit === 'seconds' ? pomodoroShortBreakMinutes : pomodoroShortBreakMinutes * 60;
    }
    if (timerMode === 'longBreak') {
      return durationUnit === 'seconds' ? pomodoroLongBreakMinutes : pomodoroLongBreakMinutes * 60;
    }
    return targetDurationSeconds;
  }, [
    durationUnit,
    pomodoroEnabled,
    pomodoroLongBreakMinutes,
    pomodoroShortBreakMinutes,
    targetDurationSeconds,
    timerMode,
  ]);

  const triggerImpact = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(style);
    }
  }, [hapticsEnabled]);

  const clearScheduledCompletion = useCallback(() => {
    const identifier = scheduledNotificationIdRef.current;
    scheduledNotificationIdRef.current = null;
    if (identifier) {
      void cancelFocusCompletion(identifier);
    }
  }, []);

  const scheduleCompletion = useCallback(async (enabled = notificationsEnabled) => {
    clearScheduledCompletion();
    if (!enabled) {
      return;
    }

    const remainingSeconds = Math.max(effectiveTargetSeconds - elapsedRef.current, 1);
    const title = timerModeRef.current === 'focus' ? notificationTitle : breakNotificationTitle;
    const body = timerModeRef.current === 'focus' ? notificationBody : breakNotificationBody;

    try {
      const identifier = await scheduleFocusCompletion(remainingSeconds, title, body);
      if (identifier && runningRef.current && enabled) {
        scheduledNotificationIdRef.current = identifier;
        saveTimerState({
          elapsed: elapsedRef.current,
          isRunning: true,
          startedAt: startedAtRef.current ?? Date.now() - elapsedRef.current * 1000,
          scheduledNotificationId: identifier,
          timerMode: timerModeRef.current,
          pomodoroCycle: cycleRef.current,
        });
      } else if (identifier) {
        await cancelFocusCompletion(identifier);
      }
    } catch {
      // Graceful notification fallback
    }
  }, [
    breakNotificationBody,
    breakNotificationTitle,
    clearScheduledCompletion,
    effectiveTargetSeconds,
    notificationBody,
    notificationTitle,
    notificationsEnabled,
  ]);

  // Completion trigger handler with automatic Pomodoro progression
  const handleComplete = useCallback(() => {
    const currentMode = timerModeRef.current;
    const currentCycle = cycleRef.current;

    elapsedRef.current = 0;
    runningRef.current = false;
    startedAtRef.current = null;
    setElapsed(0);
    setIsRunning(false);
    setShowCompletion(true);

    let nextMode: PomodoroStage = 'focus';
    let nextCycle = currentCycle;

    if (currentMode === 'focus') {
      const minutesToAdd =
        durationUnit === 'seconds'
          ? Math.max(1, Math.round(sessionSeconds / 60))
          : sessionMinutes;
      onSessionComplete(minutesToAdd);

      void playFocusCompleteSound(soundAlertTone);

      if (pomodoroEnabled) {
        nextMode = currentCycle >= 4 ? 'longBreak' : 'shortBreak';
      }
    } else if (currentMode === 'shortBreak') {
      void playBreakCompleteSound();
      nextMode = 'focus';
      nextCycle = Math.min(4, currentCycle + 1);
      onPomodoroCycleChange?.(nextCycle);
    } else {
      // longBreak completed
      void playBreakCompleteSound();
      nextMode = 'focus';
      nextCycle = 1;
      onPomodoroCycleChange?.(nextCycle);
    }

    timerModeRef.current = nextMode;
    setTimerMode(nextMode);
    cycleRef.current = nextCycle;
    setPomodoroCycle(nextCycle);

    scheduledNotificationIdRef.current = null;
    saveTimerState({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
      timerMode: nextMode,
      pomodoroCycle: nextCycle,
    });

    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [
    durationUnit,
    hapticsEnabled,
    onPomodoroCycleChange,
    onSessionComplete,
    pomodoroEnabled,
    sessionMinutes,
    sessionSeconds,
    soundAlertTone,
  ]);

  // Active interval loop with drift reconciliation
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let nextElapsed = elapsedRef.current + 1;

      // Reconcile with startedAt wall-clock to avoid timing drift
      if (startedAtRef.current) {
        const wallClockElapsed = Math.floor((now - startedAtRef.current) / 1000);
        if (Math.abs(wallClockElapsed - nextElapsed) > 1) {
          nextElapsed = wallClockElapsed;
        }
      }

      if (nextElapsed >= effectiveTargetSeconds) {
        clearInterval(interval);
        handleComplete();
        return;
      }

      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveTargetSeconds, handleComplete, isRunning]);

  // AppState background/foreground lifecycle reconciliation
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (!runningRef.current) return;

      if (nextState === 'background' || nextState === 'inactive') {
        saveTimerState({
          elapsed: elapsedRef.current,
          isRunning: true,
          startedAt: startedAtRef.current,
          scheduledNotificationId: scheduledNotificationIdRef.current,
          timerMode: timerModeRef.current,
          pomodoroCycle: cycleRef.current,
        });
      } else if (nextState === 'active' && startedAtRef.current) {
        const now = Date.now();
        const wallClockElapsed = Math.floor((now - startedAtRef.current) / 1000);

        if (wallClockElapsed >= effectiveTargetSeconds) {
          handleComplete();
        } else {
          elapsedRef.current = wallClockElapsed;
          setElapsed(wallClockElapsed);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [effectiveTargetSeconds, handleComplete]);

  // Reschedule notification when timer state changes
  useEffect(() => {
    if (isRunning && notificationsEnabled && !scheduledNotificationIdRef.current) {
      void scheduleCompletion();
    }
  }, [isRunning, notificationsEnabled, scheduleCompletion]);

  const toggleTimer = useCallback(() => {
    setShowCompletion(false);
    const nextRunning = !runningRef.current;
    const now = Date.now();

    runningRef.current = nextRunning;
    setIsRunning(nextRunning);

    if (nextRunning) {
      const baseStart = now - elapsedRef.current * 1000;
      startedAtRef.current = baseStart;
      void playFocusStartSound();
      void scheduleCompletion();
      saveTimerState({
        elapsed: elapsedRef.current,
        isRunning: true,
        startedAt: baseStart,
        scheduledNotificationId: scheduledNotificationIdRef.current,
        timerMode: timerModeRef.current,
        pomodoroCycle: cycleRef.current,
      });
    } else {
      startedAtRef.current = null;
      void playTickSound();
      clearScheduledCompletion();
      saveTimerState({
        elapsed: elapsedRef.current,
        isRunning: false,
        startedAt: null,
        scheduledNotificationId: null,
        timerMode: timerModeRef.current,
        pomodoroCycle: cycleRef.current,
      });
    }

    triggerImpact(nextRunning ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  }, [clearScheduledCompletion, scheduleCompletion, triggerImpact]);

  const resetTimer = useCallback(() => {
    clearScheduledCompletion();
    elapsedRef.current = 0;
    runningRef.current = false;
    startedAtRef.current = null;
    setElapsed(0);
    setIsRunning(false);
    setShowCompletion(false);
    saveTimerState({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
      timerMode: timerModeRef.current,
      pomodoroCycle: cycleRef.current,
    });

    void playResetSound();
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearScheduledCompletion, hapticsEnabled]);

  const skipStage = useCallback(() => {
    clearScheduledCompletion();
    const currentMode = timerModeRef.current;
    const currentCycle = cycleRef.current;

    let nextMode: PomodoroStage = 'focus';
    let nextCycle = currentCycle;

    if (currentMode === 'focus') {
      nextMode = currentCycle >= 4 ? 'longBreak' : 'shortBreak';
    } else if (currentMode === 'shortBreak') {
      nextMode = 'focus';
      nextCycle = Math.min(4, currentCycle + 1);
      onPomodoroCycleChange?.(nextCycle);
    } else {
      nextMode = 'focus';
      nextCycle = 1;
      onPomodoroCycleChange?.(nextCycle);
    }

    timerModeRef.current = nextMode;
    setTimerMode(nextMode);
    cycleRef.current = nextCycle;
    setPomodoroCycle(nextCycle);

    elapsedRef.current = 0;
    runningRef.current = false;
    startedAtRef.current = null;
    setElapsed(0);
    setIsRunning(false);

    saveTimerState({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
      timerMode: nextMode,
      pomodoroCycle: nextCycle,
    });

    void playTickSound();
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [clearScheduledCompletion, hapticsEnabled, onPomodoroCycleChange]);

  const dismissCompletion = useCallback(() => {
    setShowCompletion(false);
  }, []);

  const progress = useMemo(
    () => Math.min(1, Math.max(0, elapsed / Math.max(1, effectiveTargetSeconds))),
    [elapsed, effectiveTargetSeconds]
  );

  const elapsedText = useMemo(() => formatElapsed(elapsed), [elapsed]);

  return {
    elapsed,
    isRunning,
    showCompletion,
    progress,
    elapsedText,
    timerMode,
    pomodoroCycle,
    effectiveTargetSeconds,
    toggleTimer,
    resetTimer,
    skipStage,
    dismissCompletion,
    scheduleCompletion,
    clearScheduledCompletion,
    triggerImpact,
    runningRef,
  };
}
