import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useReducedMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LineSidebar } from './src/components/LineSidebar';
import { OnboardingScreen } from './src/components/onboarding';
import { MainFocus3D } from './src/components/MainFocus3D';
import { ModernSwitch } from './src/components/ui/ModernSwitch';
import {
  playFocusCompleteSound,
  playFocusStartSound,
  playResetSound,
  playTickSound,
  setSoundEnabled as setSoundEngineEnabled,
} from './src/audio/soundEngine';
import {
  cancelFocusCompletion,
  requestNotificationPermission,
  scheduleFocusCompletion,
} from './src/notifications/notifications';
import {
  FocusPreferences,
  Language,
  loadPreferences,
  savePreferences,
  ThemeMode,
} from './src/storage/preferencesStorage';
import { loadTimerState, saveTimerState } from './src/storage/timerStorage';
import { translations } from './src/i18n/translations';

const COLORS = {
  dark: {
    background: '#000000',
    panel: '#0B0B0D',
    primary: '#F5F5F7',
    secondary: '#B5B6BF',
    muted: '#747681',
    hairline: '#2A2C33',
    accent: '#0A84FF',
    scrim: 'rgba(0, 0, 0, 0.68)',
  },
  light: {
    background: '#F5F5F7',
    panel: '#FFFFFF',
    primary: '#1D1D1F',
    secondary: '#6E6E73',
    muted: '#8E8E93',
    hairline: '#D2D2D7',
    accent: '#007AFF',
    scrim: 'rgba(0, 0, 0, 0.18)',
  },
};

type AppColors = (typeof COLORS)[ThemeMode];

const RESET_THRESHOLD = 112;
const FLICK_THRESHOLD = -56;
const FLICK_VELOCITY = -650;
const SESSION_OPTIONS = [25, 50, 90];
const MENU_ITEMS = ['Odak', 'Süre', 'Tema', 'Bildirim', 'Haptik', 'Ses'];

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
}

function rubberBand(value: number, dimension: number, constant = 0.55) {
  'worklet';
  return (value * dimension * constant) / (dimension + constant * Math.abs(value));
}

type FocusDrawerProps = {
  drawerWidth: number;
  visible: boolean;
  activeIndex: number;
  sessionMinutes: number;
  durationDraft: string;
  theme: ThemeMode;
  language: Language;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  completedSessions: number;
  totalFocusMinutes: number;
  colors: AppColors;
  onClose: () => void;
  onSelect: (index: number) => void;
  onDurationDraftChange: (value: string) => void;
  onCommitDuration: () => void;
  onSelectPreset: (minutes: number) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onToggleLanguage: () => void;
  onToggleHaptics: () => void;
  onToggleNotifications: () => void;
  onToggleSound: () => void;
};

function FocusDrawer({
  drawerWidth,
  visible,
  activeIndex,
  sessionMinutes,
  durationDraft,
  theme,
  language,
  hapticsEnabled,
  notificationsEnabled,
  soundEnabled,
  colors,
  onClose,
  onSelect,
  onDurationDraftChange,
  onCommitDuration,
  onSelectPreset,
  onThemeChange,
  onToggleLanguage,
  onToggleHaptics,
  onToggleNotifications,
  onToggleSound,
  completedSessions,
  totalFocusMinutes,
}: FocusDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-drawerWidth);
  const t = translations[language];

  const menuItems = [
    t.drawer.menu.focus,
    t.drawer.menu.duration,
    t.drawer.menu.theme,
    t.drawer.menu.notifications,
    t.drawer.menu.haptics,
    t.drawer.menu.sound,
    t.drawer.menu.language,
  ];

  useEffect(() => {
    translateX.value = withSpring(visible ? 0 : -drawerWidth, {
      damping: 25,
      stiffness: 250,
      mass: 0.9,
    });
  }, [drawerWidth, translateX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 1]),
  }));

  return (
    <>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.scrim, { backgroundColor: colors.scrim }, scrimStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.mainTimer.ariaMenuClose}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal={visible}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
        aria-hidden={!visible}
        style={[styles.drawer, { width: drawerWidth, backgroundColor: colors.panel }, drawerStyle]}
      >
          <View style={[styles.drawerContent, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}>
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.primary }]}>{t.drawer.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.mainTimer.ariaMenuClose}
                hitSlop={12}
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.itemPressed]}
              >
                <View style={[styles.closeLine, styles.closeLineFirst, { backgroundColor: colors.secondary }]} />
                <View style={[styles.closeLine, styles.closeLineSecond, { backgroundColor: colors.secondary }]} />
              </Pressable>
            </View>

            <LineSidebar
              items={menuItems}
              activeIndex={activeIndex}
              onSelect={onSelect}
              colors={colors}
            />

            {activeIndex === 0 && (
              <View style={styles.drawerSummary}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryBlock}>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>{completedSessions}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t.drawer.stats.sessions}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.hairline }]} />
                  <View style={styles.summaryBlock}>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalFocusMinutes}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t.drawer.stats.minutes}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeIndex !== 0 && <View style={[styles.drawerRule, { backgroundColor: colors.hairline }]} />}
            {activeIndex === 1 && (
              <View style={styles.drawerSection}>
                <View style={styles.durationEditor}>
                  <TextInput
                    accessibilityLabel={t.drawer.sections.focusDuration}
                    keyboardType="number-pad"
                    maxLength={3}
                    onBlur={onCommitDuration}
                    onChangeText={onDurationDraftChange}
                    onSubmitEditing={onCommitDuration}
                    returnKeyType="done"
                    selectTextOnFocus
                    style={[styles.durationInput, { color: colors.primary, borderBottomColor: colors.hairline }]}
                    value={durationDraft}
                  />
                  <Text style={[styles.durationUnit, { color: colors.secondary }]}>{t.common.minuteShort}</Text>
                </View>
                <View style={styles.presetRow}>
                  {SESSION_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`${option} ${t.common.minuteShort}`}
                      onPress={() => onSelectPreset(option)}
                      style={({ pressed }) => [
                        styles.preset,
                        { borderBottomColor: option === sessionMinutes ? colors.accent : colors.hairline },
                        pressed && styles.itemPressed,
                      ]}
                    >
                      <Text style={[styles.presetText, { color: option === sessionMinutes ? colors.primary : colors.secondary }]}>
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {activeIndex === 2 && (
              <View style={styles.drawerSection}>
                <Pressable
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: theme === 'dark' }}
                  accessibilityLabel={t.drawer.aria.themeSwitch}
                  onPress={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  style={({ pressed }) => [
                    styles.settingRow,
                    { borderBottomColor: colors.hairline },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>
                      {theme === 'dark' ? t.drawer.sections.darkMode : t.drawer.sections.lightMode}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                      {theme === 'dark' ? t.drawer.sections.darkSubtitle : t.drawer.sections.lightSubtitle}
                    </Text>
                  </View>
                  <View pointerEvents="none">
                    <ModernSwitch
                      value={theme === 'dark'}
                      onValueChange={() => {}}
                      checkedBg={colors.accent}
                      uncheckedBg={colors.hairline}
                      crossColor={colors.muted}
                      checkmarkColor="#FFFFFF"
                      accessibilityLabel={t.drawer.aria.themeSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            )}

            {activeIndex === 3 && (
              <View style={styles.drawerSection}>
                <Pressable
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: notificationsEnabled }}
                  accessibilityLabel={t.drawer.aria.notificationsSwitch}
                  onPress={onToggleNotifications}
                  style={({ pressed }) => [
                    styles.settingRow,
                    { borderBottomColor: colors.hairline },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>{t.drawer.sections.notificationsTitle}</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{t.drawer.sections.notificationsSubtitle}</Text>
                  </View>
                  <View pointerEvents="none">
                    <ModernSwitch
                      value={notificationsEnabled}
                      onValueChange={() => {}}
                      checkedBg={colors.accent}
                      uncheckedBg={colors.hairline}
                      crossColor={colors.muted}
                      checkmarkColor="#FFFFFF"
                      accessibilityLabel={t.drawer.aria.notificationsSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            )}

            {activeIndex === 4 && (
              <View style={styles.drawerSection}>
                <Pressable
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                  accessibilityLabel={t.drawer.aria.hapticsSwitch}
                  onPress={onToggleHaptics}
                  style={({ pressed }) => [
                    styles.settingRow,
                    { borderBottomColor: colors.hairline },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>{t.drawer.sections.hapticsTitle}</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{t.drawer.sections.hapticsSubtitle}</Text>
                  </View>
                  <View pointerEvents="none">
                    <ModernSwitch
                      value={hapticsEnabled}
                      onValueChange={() => {}}
                      checkedBg={colors.accent}
                      uncheckedBg={colors.hairline}
                      crossColor={colors.muted}
                      checkmarkColor="#FFFFFF"
                      accessibilityLabel={t.drawer.aria.hapticsSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            )}

            {activeIndex === 5 && (
              <View style={styles.drawerSection}>
                <Pressable
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: soundEnabled }}
                  accessibilityLabel={t.drawer.aria.soundSwitch}
                  onPress={onToggleSound}
                  style={({ pressed }) => [
                    styles.settingRow,
                    { borderBottomColor: colors.hairline },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>{t.drawer.sections.soundTitle}</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{t.drawer.sections.soundSubtitle}</Text>
                  </View>
                  <View pointerEvents="none">
                    <ModernSwitch
                      value={soundEnabled}
                      onValueChange={() => {}}
                      checkedBg={colors.accent}
                      uncheckedBg={colors.hairline}
                      crossColor={colors.muted}
                      checkmarkColor="#FFFFFF"
                      accessibilityLabel={t.drawer.aria.soundSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            )}

            {activeIndex === 6 && (
              <View style={styles.drawerSection}>
                <Pressable
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: language === 'en' }}
                  accessibilityLabel={t.drawer.aria.languageSwitch}
                  onPress={onToggleLanguage}
                  style={({ pressed }) => [
                    styles.settingRow,
                    { borderBottomColor: colors.hairline },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>
                      {language === 'tr' ? 'Türkçe (TR)' : 'English (EN)'}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                      {t.drawer.sections.languageSubtitle}
                    </Text>
                  </View>
                  <View pointerEvents="none">
                    <ModernSwitch
                      value={language === 'en'}
                      onValueChange={() => {}}
                      checkedBg={colors.accent}
                      uncheckedBg={colors.hairline}
                      crossColor={colors.muted}
                      checkmarkColor="#FFFFFF"
                      accessibilityLabel={t.drawer.aria.languageSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            )}

          </View>
      </Animated.View>
    </>
  );
}

function FocusEngineScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [durationDraft, setDurationDraft] = useState('25');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<Language>('tr');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const translateY = useSharedValue(0);
  const gestureStartY = useSharedValue(0);
  const runningScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const elapsedRef = useRef(0);
  const runningRef = useRef(false);
  const scheduledNotificationIdRef = useRef<string | null>(null);
  const drawerWidth = Math.min(326, width * 0.84);
  const colors = COLORS[theme];
  const t = translations[language];

  useEffect(() => {
    const preferences = loadPreferences();
    setSessionMinutes(preferences.sessionMinutes);
    setDurationDraft(String(preferences.sessionMinutes));
    setTheme(preferences.theme);
    setLanguage(preferences.language ?? 'tr');
    setNotificationsEnabled(preferences.notificationsEnabled);
    setHapticsEnabled(preferences.hapticsEnabled);
    setSoundEnabled(preferences.soundEnabled);
    setSoundEngineEnabled(preferences.soundEnabled);
    setOnboardingCompleted(preferences.onboardingCompleted);
    setCompletedSessions(preferences.completedSessions);
    setTotalFocusMinutes(preferences.totalFocusMinutes);
    setIsPreferencesLoaded(true);

    const persisted = loadTimerState();
    const restoredElapsed = persisted.isRunning && persisted.startedAt
      ? persisted.elapsed + Math.floor((Date.now() - persisted.startedAt) / 1000)
      : persisted.elapsed;

    elapsedRef.current = restoredElapsed;
    runningRef.current = persisted.isRunning;
    scheduledNotificationIdRef.current = persisted.scheduledNotificationId;
    setElapsed(restoredElapsed);
    setIsRunning(persisted.isRunning);
  }, []);

  useEffect(() => {
    runningScale.value = withSpring(reduceMotion || !isRunning ? 1 : 1.012, {
      duration: 220,
      dampingRatio: 1,
    });
  }, [isRunning, reduceMotion, runningScale]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      const nextElapsed = elapsedRef.current + 1;
      const sessionSeconds = sessionMinutes * 60;

      if (nextElapsed >= sessionSeconds) {
        elapsedRef.current = sessionSeconds;
        runningRef.current = false;
        setElapsed(sessionSeconds);
        setIsRunning(false);
        setShowCompletion(true);
        const preferences = loadPreferences();
        const nextCompletedSessions = preferences.completedSessions + 1;
        const nextTotalFocusMinutes = preferences.totalFocusMinutes + sessionMinutes;
        setCompletedSessions(nextCompletedSessions);
        setTotalFocusMinutes(nextTotalFocusMinutes);
        savePreferences({
          ...preferences,
          completedSessions: nextCompletedSessions,
          totalFocusMinutes: nextTotalFocusMinutes,
        });
        scheduledNotificationIdRef.current = null;
        saveTimerState({
          elapsed: sessionSeconds,
          isRunning: false,
          startedAt: null,
          scheduledNotificationId: null,
        });
        if (hapticsEnabled) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        void playFocusCompleteSound();
        return;
      }

      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [hapticsEnabled, isRunning, sessionMinutes]);

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

    const remainingSeconds = Math.max(sessionMinutes * 60 - elapsedRef.current, 1);
    try {
      const identifier = await scheduleFocusCompletion(
        remainingSeconds,
        t.notifications.title,
        t.notifications.body,
      );
      if (identifier && runningRef.current && enabled) {
        scheduledNotificationIdRef.current = identifier;
        saveTimerState({
          elapsed: elapsedRef.current,
          isRunning: true,
          startedAt: Date.now() - elapsedRef.current * 1000,
          scheduledNotificationId: identifier,
        });
      } else if (identifier) {
        await cancelFocusCompletion(identifier);
      }
    } catch {
      // Notifications are optional; the in-app timer remains usable if permission is unavailable.
    }
  }, [clearScheduledCompletion, notificationsEnabled, sessionMinutes, t.notifications.body, t.notifications.title]);

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
      void playFocusStartSound();
      void scheduleCompletion();
    } else {
      void playTickSound();
      clearScheduledCompletion();
    }
    saveTimerState({
      elapsed: elapsedRef.current,
      isRunning: nextRunning,
      startedAt: nextRunning ? now : null,
      scheduledNotificationId: nextRunning ? scheduledNotificationIdRef.current : null,
    });
    triggerImpact(nextRunning ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  }, [clearScheduledCompletion, scheduleCompletion, triggerImpact]);

  const resetTimer = useCallback(() => {
    clearScheduledCompletion();
    elapsedRef.current = 0;
    runningRef.current = false;
    setElapsed(0);
    setIsRunning(false);
    saveTimerState({ elapsed: 0, isRunning: false, startedAt: null, scheduledNotificationId: null });

    void playResetSound();
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearScheduledCompletion, hapticsEnabled]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart(() => {
          gestureStartY.value = translateY.value;
          runningScale.value = withSpring(0.982, {
            damping: 18,
            stiffness: 420,
            mass: 0.55,
          });
        })
        .onUpdate((event) => {
          translateY.value = gestureStartY.value + rubberBand(event.translationY, height);
        })
        .onEnd((event) => {
          const isTap = Math.abs(event.translationY) < 12 && Math.abs(event.velocityY) < 80;
          const shouldReset = event.translationY > RESET_THRESHOLD;
          const shouldToggle = event.translationY < FLICK_THRESHOLD || event.velocityY < FLICK_VELOCITY;

          translateY.value = withSpring(0, {
            damping: shouldToggle || shouldReset ? 20 : 24,
            stiffness: shouldToggle || shouldReset ? 220 : 250,
            velocity: event.velocityY,
          });
          runningScale.value = withSpring(isRunning ? 1.012 : 1, {
            damping: 22,
            stiffness: 300,
            mass: 0.7,
          });

          if (shouldReset) {
            runOnJS(resetTimer)();
          } else if (isTap || shouldToggle) {
            runOnJS(toggleTimer)();
          }
        }),
    [gestureStartY, height, isRunning, resetTimer, toggleTimer, translateY],
  );

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: runningScale.value }],
  }));

  const progress = Math.min(elapsed / (sessionMinutes * 60), 1);
  const saveCurrentPreferences = useCallback((next: Partial<FocusPreferences>) => {
    savePreferences({
      sessionMinutes,
      theme,
      language,
      notificationsEnabled,
      hapticsEnabled,
      soundEnabled,
      onboardingCompleted,
      completedSessions,
      totalFocusMinutes,
      ...next,
    });
  }, [completedSessions, hapticsEnabled, language, notificationsEnabled, onboardingCompleted, sessionMinutes, soundEnabled, theme, totalFocusMinutes]);

  const commitDuration = useCallback(() => {
    const parsed = Number.parseInt(durationDraft, 10);
    const next = Number.isFinite(parsed) ? Math.min(720, Math.max(1, parsed)) : sessionMinutes;
    setSessionMinutes(next);
    setDurationDraft(String(next));
    saveCurrentPreferences({ sessionMinutes: next });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [durationDraft, hapticsEnabled, saveCurrentPreferences, sessionMinutes]);

  const selectPreset = useCallback((minutes: number) => {
    setSessionMinutes(minutes);
    setDurationDraft(String(minutes));
    saveCurrentPreferences({ sessionMinutes: minutes });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled, saveCurrentPreferences]);

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

  const handleNotificationsToggle = useCallback(async () => {
    if (notificationsEnabled) {
      clearScheduledCompletion();
      setNotificationsEnabled(false);
      saveCurrentPreferences({ notificationsEnabled: false });
      if (hapticsEnabled) {
        void Haptics.selectionAsync();
      }
      void playTickSound();
      return;
    }

    setNotificationsEnabled(true);
    saveCurrentPreferences({ notificationsEnabled: true });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();

    try {
      const granted = await requestNotificationPermission();
      if (granted && runningRef.current) {
        await scheduleCompletion(true);
      }
    } catch {
      // safe fallback
    }
  }, [clearScheduledCompletion, hapticsEnabled, notificationsEnabled, saveCurrentPreferences, scheduleCompletion]);

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

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [triggerImpact]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleMenuSelect = useCallback((index: number) => {
    setActiveMenuIndex(index);
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled]);

  const completeOnboarding = useCallback((preferences: FocusPreferences) => {
    savePreferences(preferences);
    setLanguage(preferences.language ?? 'tr');
    setSessionMinutes(preferences.sessionMinutes);
    setDurationDraft(String(preferences.sessionMinutes));
    setNotificationsEnabled(preferences.notificationsEnabled);
    setHapticsEnabled(preferences.hapticsEnabled);
    setSoundEnabled(preferences.soundEnabled);
    setSoundEngineEnabled(preferences.soundEnabled);
    setOnboardingCompleted(true);
    setCompletedSessions(preferences.completedSessions);
    setTotalFocusMinutes(preferences.totalFocusMinutes);
    void playFocusStartSound();
  }, []);

  if (!isPreferencesLoaded) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]} />;
  }

  if (!onboardingCompleted) {
    return <OnboardingScreen colors={colors} initialLanguage={language} onComplete={completeOnboarding} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar hidden style={theme === 'dark' ? 'light' : 'dark'} />

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel={t.mainTimer.ariaMenuOpen}
            accessibilityHint={t.mainTimer.ariaHint}
            hitSlop={10}
            onPress={openDrawer}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <View style={[styles.menuLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.menuLine, styles.menuLineShort, { backgroundColor: colors.primary }]} />
          </Pressable>
          <View pointerEvents="none" style={styles.topMeta}>
            <Text style={[styles.topMetaTitle, { color: colors.primary }]}>{t.mainTimer.focus}</Text>
            <Text style={[styles.topMetaSubtitle, { color: colors.muted }]}>
              {sessionMinutes} {t.common.minuteShort}
            </Text>
          </View>
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.focusSurface, animatedCounterStyle]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isRunning ? t.mainTimer.ariaPause : t.mainTimer.ariaStart}
            accessibilityHint={t.mainTimer.ariaHint}
            onAccessibilityTap={toggleTimer}
          >
            <MainFocus3D
              isRunning={isRunning}
              elapsedText={formatElapsed(elapsed)}
              progress={progress}
              sessionMinutes={sessionMinutes}
              accentColor={colors.accent}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
              mutedColor={colors.muted}
              hairlineColor={colors.hairline}
              translateY={translateY}
              reducedMotion={Boolean(reduceMotion)}
            />
          </Animated.View>
        </GestureDetector>

        <View style={[styles.footer, { bottom: insets.bottom + 26 }]}>
          <Text style={[styles.hint, { color: colors.muted }]}>{t.mainTimer.tapToToggle}</Text>
          {(elapsed > 0 || showCompletion) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.mainTimer.ariaReset}
              hitSlop={12}
              onPress={resetTimer}
              style={({ pressed }) => [styles.resetButton, pressed && styles.itemPressed]}
            >
              <Text style={[styles.resetButtonText, { color: colors.accent }]}>[ {t.mainTimer.resetBadge} ]</Text>
            </Pressable>
          )}
        </View>

        {showCompletion && (
          <View style={[styles.completionBanner, { borderBottomColor: colors.hairline }]}>
            <View style={styles.completionCopy}>
              <Text style={[styles.completionTitle, { color: colors.primary }]}>{t.mainTimer.sessionCompleted.toUpperCase()}</Text>
              <Text style={[styles.completionSubtitle, { color: colors.secondary }]}>{t.mainTimer.sessionCompletedDesc}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.mainTimer.ariaNewSession}
              onPress={resetTimer}
              style={({ pressed }) => [styles.completionAction, pressed && styles.itemPressed]}
            >
              <Text style={[styles.completionActionText, { color: colors.accent }]}>{t.mainTimer.newSession}</Text>
            </Pressable>
          </View>
        )}

        <FocusDrawer
          drawerWidth={drawerWidth}
          visible={isDrawerOpen}
          activeIndex={activeMenuIndex}
          sessionMinutes={sessionMinutes}
          durationDraft={durationDraft}
          theme={theme}
          language={language}
          hapticsEnabled={hapticsEnabled}
          notificationsEnabled={notificationsEnabled}
          soundEnabled={soundEnabled}
          completedSessions={completedSessions}
          totalFocusMinutes={totalFocusMinutes}
          colors={colors}
          onClose={closeDrawer}
          onSelect={handleMenuSelect}
          onDurationDraftChange={(value) => setDurationDraft(value.replace(/[^0-9]/g, ''))}
          onCommitDuration={commitDuration}
          onSelectPreset={selectPreset}
          onThemeChange={handleThemeChange}
          onToggleLanguage={handleToggleLanguage}
          onToggleHaptics={handleToggleHaptics}
          onToggleNotifications={() => {
            void handleNotificationsToggle();
          }}
          onToggleSound={handleToggleSound}
        />
      </View>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FocusEngineScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  onboardingSlide: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  onboardingBrand: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  onboardingStep: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  onboardingPager: {
    flex: 1,
    marginHorizontal: -24,
  },
  artworkStage: {
    width: '100%',
    height: 300,
    marginBottom: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkOrbit: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  artworkOrbitSmall: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1,
    transform: [{ rotate: '24deg' }],
  },
  artworkCore: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 18px 34px rgba(0, 0, 0, 0.3)',
  },
  artworkCoreTime: {
    fontFamily: 'System',
    fontSize: 44,
    fontWeight: '300',
    letterSpacing: -1.4,
  },
  artworkCoreLabel: {
    marginTop: 3,
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  artworkSatellite: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    transform: [{ translateX: 128 }, { translateY: -54 }],
  },
  artworkDial: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkTick: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  artworkDialValue: {
    fontFamily: 'System',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1.5,
  },
  artworkDialLabel: {
    marginTop: 4,
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
  },
  artworkFinishRing: {
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkFinishMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.22)',
  },
  artworkFinishText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  onboardingSettings: {
    width: '100%',
    marginTop: 20,
  },
  onboardingFooter: {
    paddingTop: 18,
  },
  onboarding: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  onboardingVisual: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingOrbOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
  },
  onboardingOrbMiddle: {
    position: 'absolute',
    width: 218,
    height: 218,
    borderRadius: 109,
    borderWidth: 1,
  },
  onboardingOrbInner: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    boxShadow: '0px 14px 24px rgba(0, 0, 0, 0.22)',
  },
  onboardingOrbTime: {
    fontFamily: 'System',
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1,
  },
  onboardingOrbUnit: {
    marginTop: 2,
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
  },
  onboardingContent: {
    minHeight: 248,
  },
  onboardingProgress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  onboardingProgressItem: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  onboardingTitle: {
    maxWidth: 320,
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  onboardingBody: {
    maxWidth: 320,
    marginTop: 12,
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  onboardingChoices: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  onboardingChoice: {
    width: 92,
    height: 82,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingChoiceValue: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '600',
  },
  onboardingChoiceLabel: {
    marginTop: 3,
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
  },
  onboardingSetting: {
    minHeight: 58,
    marginTop: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  onboardingSettingText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
  },
  switchTrack: {
    width: 42,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.16)',
  },
  onboardingButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  onboardingButtonText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topOnboardingButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  topOnboardingText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    gap: 6,
  },
  menuButtonPressed: {
    opacity: 0.55,
  },
  menuLine: {
    width: 24,
    height: 1,
    backgroundColor: '#F5F5F7',
  },
  menuLineShort: {
    width: 16,
  },
  topMeta: {
    marginLeft: 16,
  },
  topMetaTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  topMetaSubtitle: {
    marginTop: 2,
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  focusSurface: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  focusAura: {
    position: 'absolute',
    width: 292,
    height: 292,
    borderRadius: 146,
    borderWidth: 1,
  },
  focusRing: {
    position: 'absolute',
    width: 248,
    height: 248,
    borderRadius: 124,
    borderWidth: 1,
  },
  focusContent: {
    zIndex: 1,
    alignItems: 'center',
  },
  counter: {
    color: '#F5F5F7',
    fontFamily: 'System',
    fontSize: 70,
    fontWeight: '300',
    letterSpacing: -2.6,
    lineHeight: 82,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  progressRail: {
    width: 154,
    height: 2,
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#2A2C33',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#0A84FF',
  },
  state: {
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  stateRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    alignItems: 'center',
  },
  hint: {
    color: '#747681',
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  resetButton: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  completionBanner: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 96,
    minHeight: 56,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  completionMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionMarkText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
  },
  completionCopy: {
    flex: 1,
    marginLeft: 12,
  },
  completionTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  completionSubtitle: {
    marginTop: 3,
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
  },
  completionAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionActionText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  scrim: {
    zIndex: 4,
    backgroundColor: '#000000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    backgroundColor: '#0B0B0D',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  drawerKicker: {
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  drawerTitle: {
    marginTop: 6,
    color: '#F5F5F7',
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 20,
    height: 1,
    backgroundColor: '#B5B6BF',
    transform: [{ rotate: '45deg' }],
  },
  closeLineFirst: {
    transform: [{ rotate: '-45deg' }],
  },
  closeLineSecond: {
    transform: [{ rotate: '45deg' }],
  },
  drawerRule: {
    height: 1,
    marginTop: 28,
    backgroundColor: '#2A2C33',
  },
  drawerSection: {
    marginTop: 28,
  },
  drawerSummary: {
    marginTop: 28,
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  summaryValue: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '600',
  },
  summaryLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },
  sectionLabel: {
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  settingRow: {
    minHeight: 56,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2C33',
    paddingBottom: 14,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  settingValue: {
    color: '#F5F5F7',
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    marginTop: 3,
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
  },
  settingAction: {
    color: '#0A84FF',
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  itemPressed: {
    opacity: 0.55,
  },
  durationEditor: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  durationInput: {
    width: 88,
    paddingVertical: 8,
    borderBottomWidth: 1,
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.6,
  },
  durationUnit: {
    marginLeft: 10,
    marginBottom: 10,
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
  },
  presetRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 24,
  },
  preset: {
    minWidth: 36,
    paddingBottom: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
  },
  themeRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 24,
  },
  themeOption: {
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  themeOptionText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
  },
  summaryBlock: {
    alignItems: 'baseline',
    gap: 6,
    flexDirection: 'row',
  },
  drawerBottomActions: {
    marginTop: 40,
    paddingTop: 16,
  },
  drawerOnboardingBtn: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2C33',
  },
  drawerOnboardingBtnText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});





