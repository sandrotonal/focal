import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
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
import type { DurationUnit } from '../storage/preferencesStorage';

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
  notificationTitle: string;
  notificationBody: string;
  onSessionComplete: (addedMinutes: number) => void;
};

function getInitialTimerState() {
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
    };
  } catch {
    return {
      elapsed: 0,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
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
  notificationTitle,
  notificationBody,
  onSessionComplete,
}: UseFocusTimerOptions) {
  const [initialState] = useState(getInitialTimerState);
  const [elapsed, setElapsed] = useState(initialState.elapsed);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [showCompletion, setShowCompletion] = useState(false);

  const elapsedRef = useRef(initialState.elapsed);
  const runningRef = useRef(initialState.isRunning);
  const startedAtRef = useRef<number | null>(initialState.startedAt);
  const scheduledNotificationIdRef = useRef<string | null>(initialState.scheduledNotificationId);

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

    const remainingSeconds = Math.max(targetDurationSeconds - elapsedRef.current, 1);
    try {
      const identifier = await scheduleFocusCompletion(
        remainingSeconds,
        notificationTitle,
        notificationBody,
      );
      if (identifier && runningRef.current && enabled) {
        scheduledNotificationIdRef.current = identifier;
        saveTimerState({
          elapsed: elapsedRef.current,
          isRunning: true,
          startedAt: startedAtRef.current ?? Date.now() - elapsedRef.current * 1000,
          scheduledNotificationId: identifier,
        });
      } else if (identifier) {
        await cancelFocusCompletion(identifier);
      }
    } catch {
      // Graceful notification fallback
    }
  }, [clearScheduledCompletion, notificationBody, notificationTitle, notificationsEnabled, targetDurationSeconds]);

  // Completion trigger handler
  const handleComplete = useCallback(() => {
    elapsedRef.current = targetDurationSeconds;
    runningRef.current = false;
    startedAtRef.current = null;
    setElapsed(targetDurationSeconds);
    setIsRunning(false);
    setShowCompletion(true);

    const minutesToAdd = durationUnit === 'seconds'
      ? Math.max(1, Math.round(sessionSeconds / 60))
      : sessionMinutes;

    onSessionComplete(minutesToAdd);

    scheduledNotificationIdRef.current = null;
    saveTimerState({
      elapsed: targetDurationSeconds,
      isRunning: false,
      startedAt: null,
      scheduledNotificationId: null,
    });

    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    void playFocusCompleteSound();
  }, [durationUnit, hapticsEnabled, onSessionComplete, sessionMinutes, sessionSeconds, targetDurationSeconds]);

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

      if (nextElapsed >= targetDurationSeconds) {
        clearInterval(interval);
        handleComplete();
        return;
      }

      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [handleComplete, isRunning, targetDurationSeconds]);

  // AppState background/foreground lifecycle reconciliation (Zero battery drain in background)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (!runningRef.current) return;

      if (nextState === 'background' || nextState === 'inactive') {
        // App backgrounded: persist state
        saveTimerState({
          elapsed: elapsedRef.current,
          isRunning: true,
          startedAt: startedAtRef.current,
          scheduledNotificationId: scheduledNotificationIdRef.current,
        });
      } else if (nextState === 'active' && startedAtRef.current) {
        // App returned to foreground: reconcile against wall clock
        const now = Date.now();
        const wallClockElapsed = Math.floor((now - startedAtRef.current) / 1000);

        if (wallClockElapsed >= targetDurationSeconds) {
          handleComplete();
        } else {
          elapsedRef.current = wallClockElapsed;
          setElapsed(wallClockElapsed);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleComplete, targetDurationSeconds]);

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
    saveTimerState({ elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null });

    void playResetSound();
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearScheduledCompletion, hapticsEnabled]);

  const dismissCompletion = useCallback(() => {
    setShowCompletion(false);
  }, []);

  const progress = useMemo(
    () => Math.min(1, Math.max(0, elapsed / Math.max(1, targetDurationSeconds))),
    [elapsed, targetDurationSeconds]
  );

  const elapsedText = useMemo(() => formatElapsed(elapsed), [elapsed]);

  return {
    elapsed,
    isRunning,
    showCompletion,
    progress,
    elapsedText,
    toggleTimer,
    resetTimer,
    dismissCompletion,
    scheduleCompletion,
    clearScheduledCompletion,
    triggerImpact,
    runningRef,
  };
}
