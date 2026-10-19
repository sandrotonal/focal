import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  playBreakCompleteSound,
  playFocusCompleteSound,
  playFocusStartSound,
  playResetSound,
  playTickSound,
  startAmbientSound,
  stopAmbientSound,
} from '../audio/soundEngine';
import {
  cancelFocusCompletion,
  scheduleFocusCompletion,
} from '../notifications/notifications';
import { initTimerStorage, loadTimerState, saveTimerState } from '../storage/timerStorage';
import type {
  AmbientSoundType,
  DurationUnit,
  PomodoroStage,
  SoundAlertTone,
} from '../storage/preferencesStorage';

export function formatElapsed(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
}

export function getNextPomodoroStage(
  currentMode: PomodoroStage,
  currentCycle: number
): { nextMode: PomodoroStage; nextCycle: number } {
  const safeCycle = Math.min(4, Math.max(1, Math.round(Number.isFinite(currentCycle) ? currentCycle : 1)));

  if (currentMode === 'focus') {
    return {
      nextMode: safeCycle >= 4 ? 'longBreak' : 'shortBreak',
      nextCycle: safeCycle,
    };
  }

  if (currentMode === 'shortBreak') {
    return {
      nextMode: 'focus',
      nextCycle: Math.min(4, safeCycle + 1),
    };
  }

  return {
    nextMode: 'focus',
    nextCycle: 1,
  };
}

export function calculateTargetSeconds(
  mode: PomodoroStage,
  pomodoroEnabled: boolean,
  targetDurationSeconds: number,
  focusMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number
): number {
  if (!pomodoroEnabled) {
    return Math.max(1, Math.round(Number.isFinite(targetDurationSeconds) ? targetDurationSeconds : 1500));
  }
  if (mode === 'shortBreak') {
    return Math.max(1, Math.round(shortBreakMinutes * 60));
  }
  if (mode === 'longBreak') {
    return Math.max(1, Math.round(longBreakMinutes * 60));
  }
  return Math.max(1, Math.round(focusMinutes * 60));
}

export function getResetPomodoroState(
  pomodoroEnabled: boolean,
  currentCycle: number
): { nextMode: PomodoroStage; nextCycle: number } {
  return {
    nextMode: 'focus',
    nextCycle: pomodoroEnabled ? 1 : Math.max(1, Math.round(Number.isFinite(currentCycle) ? currentCycle : 1)),
  };
}

export type UseFocusTimerOptions = {
  targetDurationSeconds: number;
  sessionMinutes: number;
  sessionSeconds: number;
  durationUnit: DurationUnit;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundAlertTone?: SoundAlertTone;
  ambientSound?: AmbientSoundType;
  pomodoroEnabled?: boolean;
  pomodoroCycle?: number;
  pomodoroFocusMinutes?: number;
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
    const isRunning = persisted.isRunning === true;

    // If timer was saved while not running, always start clean at focus stage
    if (!isRunning) {
      return {
        elapsed: 0,
        isRunning: false,
        startedAt: null,
        scheduledNotificationId: null,
        timerMode: 'focus' as PomodoroStage,
        pomodoroCycle:
          typeof persisted.pomodoroCycle === 'number'
            ? Math.min(4, Math.max(1, Math.round(persisted.pomodoroCycle)))
            : initialCycle,
      };
    }

    const restoredElapsed = persisted.startedAt
      ? persisted.elapsed + Math.floor((now - persisted.startedAt) / 1000)
      : persisted.elapsed;

    return {
      elapsed: restoredElapsed,
      isRunning: true,
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
  ambientSound = 'none',
  pomodoroEnabled = false,
  pomodoroCycle: externalPomodoroCycle = 1,
  pomodoroFocusMinutes = 25,
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
  const [lastCompletedStage, setLastCompletedStage] = useState<PomodoroStage | null>(null);
  const [completedCycle, setCompletedCycle] = useState(externalPomodoroCycle);
  const [timerMode, setTimerMode] = useState<PomodoroStage>(initialState.timerMode);
  const [pomodoroCycle, setPomodoroCycle] = useState(initialState.pomodoroCycle);

  const elapsedRef = useRef(initialState.elapsed);
  const runningRef = useRef(initialState.isRunning);
  const startedAtRef = useRef<number | null>(initialState.startedAt);
  const scheduledNotificationIdRef = useRef<string | null>(initialState.scheduledNotificationId);
  const timerModeRef = useRef<PomodoroStage>(initialState.timerMode);
  const cycleRef = useRef(initialState.pomodoroCycle);
  const prevPomodoroEnabledRef = useRef(pomodoroEnabled);

  // Target duration dynamically based on current interval stage
  const effectiveTargetSeconds = useMemo(() => {
    return calculateTargetSeconds(
      timerMode,
      pomodoroEnabled,
      targetDurationSeconds,
      pomodoroFocusMinutes,
      pomodoroShortBreakMinutes,
      pomodoroLongBreakMinutes
    );
  }, [
    pomodoroEnabled,
    pomodoroFocusMinutes,
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

  // Sync external cycle changes if timer is idle
  useEffect(() => {
    if (!runningRef.current && externalPomodoroCycle !== cycleRef.current) {
      cycleRef.current = externalPomodoroCycle;
      setPomodoroCycle(externalPomodoroCycle);
    }
  }, [externalPomodoroCycle]);

  // Clean reset when toggling Pomodoro mode on or off
  useEffect(() => {
    if (prevPomodoroEnabledRef.current !== pomodoroEnabled) {
      prevPomodoroEnabledRef.current = pomodoroEnabled;

      clearScheduledCompletion();
      elapsedRef.current = 0;
      runningRef.current = false;
      startedAtRef.current = null;
      timerModeRef.current = 'focus';
      setElapsed(0);
      setIsRunning(false);
      setTimerMode('focus');
      setShowCompletion(false);
      setLastCompletedStage(null);

      saveTimerState({
        elapsed: 0,
        isRunning: false,
        startedAt: null,
        scheduledNotificationId: null,
        timerMode: 'focus',
        pomodoroCycle: cycleRef.current,
      });
    }
  }, [clearScheduledCompletion, pomodoroEnabled]);

  // Hydrate timer state on native cold start if asynchronous storage was still resolving during initial mount
  useEffect(() => {
    let isMounted = true;
    void initTimerStorage().then((persisted) => {
      if (!isMounted) return;
      if (!runningRef.current && elapsedRef.current === 0 && persisted.isRunning && persisted.startedAt) {
        const now = Date.now();
        const restoredElapsed = persisted.elapsed + Math.floor((now - persisted.startedAt) / 1000);
        elapsedRef.current = restoredElapsed;
        runningRef.current = true;
        startedAtRef.current = persisted.startedAt;
        scheduledNotificationIdRef.current = persisted.scheduledNotificationId;
        timerModeRef.current = persisted.timerMode ?? 'focus';
        cycleRef.current = persisted.pomodoroCycle ?? 1;

        setElapsed(restoredElapsed);
        setIsRunning(true);
        setTimerMode(persisted.timerMode ?? 'focus');
        setPomodoroCycle(persisted.pomodoroCycle ?? 1);
      }
    });

    return () => {
      isMounted = false;
      stopAmbientSound();
    };
  }, []);

  // Reset elapsed if idle and external duration was reduced below current elapsed
  useEffect(() => {
    if (!runningRef.current && elapsedRef.current >= effectiveTargetSeconds) {
      elapsedRef.current = 0;
      setElapsed(0);
    }
  }, [effectiveTargetSeconds]);

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
    stopAmbientSound();
    const currentMode = timerModeRef.current;
    const currentCycle = cycleRef.current;

    elapsedRef.current = 0;
    runningRef.current = false;
    startedAtRef.current = null;
    setElapsed(0);
    setIsRunning(false);
    setLastCompletedStage(currentMode);
    setCompletedCycle(currentCycle);
    setShowCompletion(true);

    let nextMode: PomodoroStage = 'focus';
    let nextCycle = currentCycle;

    if (pomodoroEnabled) {
      const stageTransition = getNextPomodoroStage(currentMode, currentCycle);
      nextMode = stageTransition.nextMode;
      nextCycle = stageTransition.nextCycle;
      if (currentMode !== 'focus') {
        onPomodoroCycleChange?.(nextCycle);
      }
    }

    if (currentMode === 'focus') {
      const minutesToAdd = pomodoroEnabled
        ? pomodoroFocusMinutes
        : durationUnit === 'seconds'
          ? Math.max(1, Math.round(sessionSeconds / 60))
          : sessionMinutes;
      onSessionComplete(minutesToAdd);
      void playFocusCompleteSound(soundAlertTone);
    } else {
      void playBreakCompleteSound();
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
    pomodoroFocusMinutes,
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

  // Dynamically cross-fade ambient soundscape if changed while timer is actively running
  useEffect(() => {
    if (isRunning) {
      if (ambientSound !== 'none') {
        startAmbientSound(ambientSound);
      } else {
        stopAmbientSound();
      }
    }
  }, [ambientSound, isRunning]);


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
      startAmbientSound(ambientSound);
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
      stopAmbientSound();
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
  }, [ambientSound, clearScheduledCompletion, scheduleCompletion, triggerImpact]);

  const resetTimer = useCallback(() => {
    stopAmbientSound();
    clearScheduledCompletion();
    elapsedRef.current = 0;
    runningRef.current = false;
    startedAtRef.current = null;

    const resetState = getResetPomodoroState(pomodoroEnabled, cycleRef.current);
    timerModeRef.current = resetState.nextMode;
    setElapsed(0);
    setIsRunning(false);
    setTimerMode(resetState.nextMode);
    setShowCompletion(false);
    setLastCompletedStage(null);

    cycleRef.current = resetState.nextCycle;
    setPomodoroCycle(resetState.nextCycle);
    onPomodoroCycleChange?.(resetState.nextCycle);

    saveTimerState({
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
      timerMode: resetState.nextMode,
      pomodoroCycle: resetState.nextCycle,
    });

    void playResetSound();
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearScheduledCompletion, hapticsEnabled, onPomodoroCycleChange, pomodoroEnabled]);

  const skipStage = useCallback(() => {
    stopAmbientSound();
    clearScheduledCompletion();
    const currentMode = timerModeRef.current;
    const currentCycle = cycleRef.current;

    const { nextMode, nextCycle } = getNextPomodoroStage(currentMode, currentCycle);
    if (currentMode !== 'focus') {
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
    setShowCompletion(false);
    setLastCompletedStage(null);

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
    lastCompletedStage,
    completedCycle,
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
