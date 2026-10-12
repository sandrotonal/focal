import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';

import {
  DurationUnit,
  FocusPreferences,
  Language,
  ThemeMode,
  loadPreferences,
  savePreferences,
} from '../storage/preferencesStorage';
import {
  playTickSound,
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
    };
  }
}

export function usePreferences() {
  const [initial] = useState(getInitialPreferences);
  const isPreferencesLoaded = true;
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

  const saveCurrentPreferences = useCallback((patch: Partial<FocusPreferences>) => {
    try {
      const current = loadPreferences();
      savePreferences({ ...current, ...patch });
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
    setCompletedSessions(nextCompleted);
    setTotalFocusMinutes(nextMinutes);
    saveCurrentPreferences({
      completedSessions: nextCompleted,
      totalFocusMinutes: nextMinutes,
    });
  }, [completedSessions, saveCurrentPreferences, totalFocusMinutes]);

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
    saveCurrentPreferences,
    handleChangeDurationUnit,
    handleThemeChange,
    handleToggleLanguage,
    handleToggleHaptics,
    handleToggleSound,
    handleNotificationsToggle,
    selectPreset,
    commitDuration,
    handleDurationDraftChange,
    completeOnboarding,
    recordCompletedSession,
    setLanguage,
  };
}
