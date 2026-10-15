import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  DurationUnit,
  FocusPreferences,
  Language,
  SoundAlertTone,
  ThemeMode,
  initPreferences,
  loadPreferences,
  savePreferences,
} from '../storage/preferencesStorage';
import {
  playTickSound,
  previewToneSound,
  setSoundEnabled as setSoundEngineEnabled,
} from '../audio/soundEngine';
import { requestNotificationPermission } from '../notifications/notifications';

function getInitialPreferences(): FocusPreferences {
  try {
    return loadPreferences();
  } catch {
    return {
      durationUnit: 'minutes',
      sessionMinutes: 25,
      sessionSeconds: 30,
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
  }
}

export function usePreferences() {
  const [initial] = useState(getInitialPreferences);
  const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(Platform.OS === 'web');
  const [onboardingCompleted, setOnboardingCompleted] = useState(initial.onboardingCompleted);
  const [sessionMinutes, setSessionMinutes] = useState(initial.sessionMinutes ?? 25);
  const [sessionSeconds, setSessionSeconds] = useState(initial.sessionSeconds ?? 30);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(initial.durationUnit ?? 'minutes');
  const [durationDraft, setDurationDraft] = useState(
    (initial.durationUnit ?? 'minutes') === 'seconds'
      ? String(initial.sessionSeconds ?? 30)
      : String(initial.sessionMinutes ?? 25)
  );
  const [theme, setTheme] = useState<ThemeMode>(initial.theme ?? 'dark');
  const [language, setLanguage] = useState<Language>(initial.language ?? 'tr');
  const [hapticsEnabled, setHapticsEnabled] = useState(initial.hapticsEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initial.notificationsEnabled ?? false);
  const [soundEnabled, setSoundEnabled] = useState(initial.soundEnabled ?? true);
  const [completedSessions, setCompletedSessions] = useState(initial.completedSessions ?? 0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(initial.totalFocusMinutes ?? 0);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(initial.pomodoroEnabled ?? false);
  const [pomodoroCycle, setPomodoroCycle] = useState(initial.pomodoroCycle ?? 1);
  const [pomodoroFocusMinutes, setPomodoroFocusMinutesState] = useState(
    initial.pomodoroFocusMinutes ?? 25
  );
  const [pomodoroShortBreakMinutes, setPomodoroShortBreakMinutesState] = useState(
    initial.pomodoroShortBreakMinutes ?? 5
  );
  const [pomodoroLongBreakMinutes, setPomodoroLongBreakMinutesState] = useState(
    initial.pomodoroLongBreakMinutes ?? 15
  );
  const [soundAlertTone, setSoundAlertTone] = useState<SoundAlertTone>(initial.soundAlertTone ?? 'crystal');
  const [weeklyHistory, setWeeklyHistory] = useState<number[]>(
    initial.weeklyHistory ?? [0, 0, 0, 0, 0, 0, 0]
  );

  const latestPreferencesRef = useRef<FocusPreferences>({
    ...initial,
    sessionMinutes,
    sessionSeconds,
    durationUnit,
    theme,
    language,
    notificationsEnabled,
    hapticsEnabled,
    soundEnabled,
    onboardingCompleted,
    completedSessions,
    totalFocusMinutes,
    pomodoroEnabled,
    pomodoroCycle,
    pomodoroFocusMinutes,
    pomodoroShortBreakMinutes,
    pomodoroLongBreakMinutes,
    soundAlertTone,
    weeklyHistory,
  });

  // Ensure persistent storage is hydrated on app launch
  useEffect(() => {
    let isMounted = true;
    void initPreferences()
      .then((loaded) => {
        if (!isMounted) return;
        setOnboardingCompleted(loaded.onboardingCompleted);
        setSessionMinutes(loaded.sessionMinutes);
        setSessionSeconds(loaded.sessionSeconds);
        setDurationUnit(loaded.durationUnit);
        setDurationDraft(
          loaded.durationUnit === 'seconds'
            ? String(loaded.sessionSeconds)
            : String(loaded.sessionMinutes)
        );
        setTheme(loaded.theme);
        setLanguage(loaded.language);
        setHapticsEnabled(loaded.hapticsEnabled);
        setNotificationsEnabled(loaded.notificationsEnabled);
        setSoundEnabled(loaded.soundEnabled);
        setCompletedSessions(loaded.completedSessions);
        setTotalFocusMinutes(loaded.totalFocusMinutes);
        setPomodoroEnabled(loaded.pomodoroEnabled);
        setPomodoroCycle(loaded.pomodoroCycle);
        setPomodoroFocusMinutesState(loaded.pomodoroFocusMinutes ?? 25);
        setPomodoroShortBreakMinutesState(loaded.pomodoroShortBreakMinutes);
        setPomodoroLongBreakMinutesState(loaded.pomodoroLongBreakMinutes);
        setSoundAlertTone(loaded.soundAlertTone);
        setWeeklyHistory(loaded.weeklyHistory ?? [0, 0, 0, 0, 0, 0, 0]);
        latestPreferencesRef.current = loaded;
        setIsPreferencesLoaded(true);
      })
      .catch(() => {
        if (isMounted) {
          setIsPreferencesLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveCurrentPreferences = useCallback((patch: Partial<FocusPreferences>) => {
    try {
      const updated: FocusPreferences = {
        ...latestPreferencesRef.current,
        ...patch,
      };
      latestPreferencesRef.current = updated;
      savePreferences(updated);
    } catch {
      // Graceful local storage fallback
    }
  }, []);

  useEffect(() => {
    setSoundEngineEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleChangeDurationUnit = useCallback((unit: DurationUnit) => {
    setDurationUnit(unit);
    setDurationDraft(unit === 'seconds' ? String(sessionSeconds) : String(sessionMinutes));
    saveCurrentPreferences({ durationUnit: unit });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences, sessionMinutes, sessionSeconds]);

  const handleThemeChange = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    saveCurrentPreferences({ theme: nextTheme });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  const handleToggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
    saveCurrentPreferences({ language: nextLang });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, language, saveCurrentPreferences]);

  const handleToggleHaptics = useCallback(() => {
    const nextHapticsEnabled = !hapticsEnabled;
    setHapticsEnabled(nextHapticsEnabled);
    saveCurrentPreferences({ hapticsEnabled: nextHapticsEnabled });
    if (nextHapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  const handleToggleSound = useCallback(() => {
    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);
    setSoundEngineEnabled(nextSoundEnabled);
    saveCurrentPreferences({ soundEnabled: nextSoundEnabled });
    if (nextSoundEnabled) {
      void playTickSound();
    }
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [hapticsEnabled, saveCurrentPreferences, soundEnabled]);

  const handleNotificationsToggle = useCallback(async (
    onPermissionGranted?: () => Promise<void>
  ) => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      saveCurrentPreferences({ notificationsEnabled: false });
      if (hapticsEnabled) {
        void Haptics.selectionAsync();
      }
      void playTickSound();
      return false;
    }

    setNotificationsEnabled(true);
    saveCurrentPreferences({ notificationsEnabled: true });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();

    try {
      const granted = await requestNotificationPermission();
      if (granted && onPermissionGranted) {
        await onPermissionGranted();
      }
      return granted;
    } catch {
      return false;
    }
  }, [hapticsEnabled, notificationsEnabled, saveCurrentPreferences]);

  const selectPreset = useCallback((value: number) => {
    if (durationUnit === 'seconds') {
      setSessionSeconds(value);
      setDurationDraft(String(value));
      saveCurrentPreferences({ sessionSeconds: value });
    } else {
      setSessionMinutes(value);
      setDurationDraft(String(value));
      saveCurrentPreferences({ sessionMinutes: value });
    }
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [durationUnit, hapticsEnabled, saveCurrentPreferences]);

  const commitDuration = useCallback(() => {
    const parsed = Number.parseInt(durationDraft, 10);
    if (!Number.isFinite(parsed)) {
      setDurationDraft(durationUnit === 'seconds' ? String(sessionSeconds) : String(sessionMinutes));
      return;
    }

    if (durationUnit === 'seconds') {
      const clamped = Math.min(3600, Math.max(1, parsed));
      setSessionSeconds(clamped);
      setDurationDraft(String(clamped));
      saveCurrentPreferences({ sessionSeconds: clamped });
    } else {
      const clamped = Math.min(180, Math.max(1, parsed));
      setSessionMinutes(clamped);
      setDurationDraft(String(clamped));
      saveCurrentPreferences({ sessionMinutes: clamped });
    }
  }, [durationDraft, durationUnit, saveCurrentPreferences, sessionMinutes, sessionSeconds]);

  const handleDurationDraftChange = useCallback((value: string) => {
    setDurationDraft(value.replace(/[^0-9]/g, ''));
  }, []);

  const completeOnboarding = useCallback((prefs?: Partial<FocusPreferences>) => {
    setOnboardingCompleted(true);
    if (prefs) {
      saveCurrentPreferences({ ...prefs, onboardingCompleted: true });
    } else {
      saveCurrentPreferences({ onboardingCompleted: true });
    }
  }, [saveCurrentPreferences]);

  const recordCompletedSession = useCallback((addedMinutes: number) => {
    const nextCompleted = completedSessions + 1;
    const nextMinutes = totalFocusMinutes + addedMinutes;

    const day = new Date().getDay();
    const todayIndex = day === 0 ? 6 : day - 1; // Mon = 0, Sun = 6
    const currentHistory = latestPreferencesRef.current.weeklyHistory ?? [0, 0, 0, 0, 0, 0, 0];
    const nextWeeklyHistory = [...currentHistory];
    nextWeeklyHistory[todayIndex] = (nextWeeklyHistory[todayIndex] ?? 0) + addedMinutes;

    setCompletedSessions(nextCompleted);
    setTotalFocusMinutes(nextMinutes);
    setWeeklyHistory(nextWeeklyHistory);
    saveCurrentPreferences({
      completedSessions: nextCompleted,
      totalFocusMinutes: nextMinutes,
      weeklyHistory: nextWeeklyHistory,
    });
  }, [completedSessions, saveCurrentPreferences, totalFocusMinutes]);

  const handleTogglePomodoro = useCallback(() => {
    const nextPomodoro = !pomodoroEnabled;
    setPomodoroEnabled(nextPomodoro);
    saveCurrentPreferences({ pomodoroEnabled: nextPomodoro });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, pomodoroEnabled, saveCurrentPreferences]);

  const handleSelectSoundTone = useCallback((tone: SoundAlertTone) => {
    setSoundAlertTone(tone);
    saveCurrentPreferences({ soundAlertTone: tone });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    previewToneSound(tone);
  }, [hapticsEnabled, saveCurrentPreferences]);

  const handleSetPomodoroCycle = useCallback((cycle: number) => {
    const clamped = Math.min(4, Math.max(1, Math.round(cycle)));
    setPomodoroCycle(clamped);
    saveCurrentPreferences({ pomodoroCycle: clamped });
  }, [saveCurrentPreferences]);

  const setPomodoroFocusMinutes = useCallback((m: number) => {
    const clamped = Math.max(1, Math.min(180, Math.round(m)));
    setPomodoroFocusMinutesState(clamped);
    saveCurrentPreferences({ pomodoroFocusMinutes: clamped });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  const setPomodoroShortBreakMinutes = useCallback((m: number) => {
    const clamped = Math.max(1, Math.min(60, Math.round(m)));
    setPomodoroShortBreakMinutesState(clamped);
    saveCurrentPreferences({ pomodoroShortBreakMinutes: clamped });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  const setPomodoroLongBreakMinutes = useCallback((m: number) => {
    const clamped = Math.max(1, Math.min(60, Math.round(m)));
    setPomodoroLongBreakMinutesState(clamped);
    saveCurrentPreferences({ pomodoroLongBreakMinutes: clamped });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  const setPomodoroPreset = useCallback((focusM: number, shortM: number, longM: number) => {
    setPomodoroFocusMinutesState(focusM);
    setPomodoroShortBreakMinutesState(shortM);
    setPomodoroLongBreakMinutesState(longM);
    saveCurrentPreferences({
      pomodoroFocusMinutes: focusM,
      pomodoroShortBreakMinutes: shortM,
      pomodoroLongBreakMinutes: longM,
    });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

  return {
    isPreferencesLoaded,
    onboardingCompleted,
    sessionMinutes,
    sessionSeconds,
    durationUnit,
    durationDraft,
    theme,
    language,
    hapticsEnabled,
    notificationsEnabled,
    soundEnabled,
    completedSessions,
    totalFocusMinutes,
    pomodoroEnabled,
    pomodoroCycle,
    pomodoroFocusMinutes,
    pomodoroShortBreakMinutes,
    pomodoroLongBreakMinutes,
    soundAlertTone,
    weeklyHistory,
    saveCurrentPreferences,
    handleChangeDurationUnit,
    handleThemeChange,
    handleToggleLanguage,
    handleToggleHaptics,
    handleToggleSound,
    handleNotificationsToggle,
    handleTogglePomodoro,
    handleSelectSoundTone,
    setPomodoroCycle: handleSetPomodoroCycle,
    setPomodoroFocusMinutes,
    setPomodoroShortBreakMinutes,
    setPomodoroLongBreakMinutes,
    setPomodoroPreset,
    selectPreset,
    commitDuration,
    handleDurationDraftChange,
    completeOnboarding,
    recordCompletedSession,
    setLanguage,
  };
}
