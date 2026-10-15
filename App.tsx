import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import { MainFocus3D } from './src/components/MainFocus3D';
import { ModernResetButton } from './src/components/ui/ModernResetButton';
import { AppleNotificationBanner } from './src/components/ui/AppleNotificationBanner';
import { OnboardingScreen } from './src/components/onboarding/OnboardingScreen';
import { FocusDrawer } from './src/components/FocusDrawer';
import { COLORS } from './src/theme/colors';
import { usePreferences } from './src/hooks/usePreferences';
import { useFocusTimer } from './src/hooks/useFocusTimer';
import { playFocusStartSound, playTickSound } from './src/audio/soundEngine';
import { translations } from './src/i18n/translations';
import type { DurationUnit } from './src/storage/preferencesStorage';

const RESET_THRESHOLD = 112;
const FLICK_THRESHOLD = -56;
const FLICK_VELOCITY = -650;

function rubberBand(value: number, dimension: number, constant = 0.55) {
  'worklet';
  return (value * dimension * constant) / (dimension + constant * Math.abs(value));
}

function FocusEngineScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);

  const {
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
    handleChangeDurationUnit,
    handleThemeChange,
    handleToggleLanguage,
    handleToggleHaptics,
    handleToggleSound,
    handleNotificationsToggle,
    handleTogglePomodoro,
    handleSelectSoundTone,
    setPomodoroCycle,
    setPomodoroFocusMinutes,
    setPomodoroShortBreakMinutes,
    setPomodoroLongBreakMinutes,
    setPomodoroPreset,
    selectPreset,
    commitDuration,
    handleDurationDraftChange,
    completeOnboarding,
    recordCompletedSession,
  } = usePreferences();

  const colors = useMemo(() => COLORS[theme], [theme]);
  const t = useMemo(() => translations[language], [language]);

  const targetDurationSeconds = durationUnit === 'seconds' ? sessionSeconds : sessionMinutes * 60;

  const {
    elapsed,
    isRunning,
    showCompletion,
    lastCompletedStage,
    completedCycle,
    progress,
    elapsedText,
    timerMode,
    pomodoroCycle: currentTimerCycle,
    toggleTimer,
    resetTimer,
    skipStage,
    dismissCompletion,
    scheduleCompletion,
    triggerImpact,
  } = useFocusTimer({
    targetDurationSeconds,
    sessionMinutes,
    sessionSeconds,
    durationUnit,
    notificationsEnabled,
    hapticsEnabled,
    soundAlertTone,
    pomodoroEnabled,
    pomodoroCycle,
    pomodoroFocusMinutes,
    pomodoroShortBreakMinutes,
    pomodoroLongBreakMinutes,
    notificationTitle: t.notifications.title,
    notificationBody: t.notifications.body,
    breakNotificationTitle: t.notifications.breakTitle,
    breakNotificationBody: t.notifications.breakBody,
    onPomodoroCycleChange: setPomodoroCycle,
    onSessionComplete: recordCompletedSession,
  });

  const isBreak = timerMode === 'shortBreak' || timerMode === 'longBreak';

  const topMetaTitle = useMemo(() => {
    if (pomodoroEnabled && timerMode === 'shortBreak') {
      return t.mainTimer.stageShortBreak;
    }
    if (pomodoroEnabled && timerMode === 'longBreak') {
      return t.mainTimer.stageLongBreak;
    }
    return t.mainTimer.focus;
  }, [pomodoroEnabled, t, timerMode]);

  const stageLabel = useMemo(() => {
    if (!pomodoroEnabled) return undefined;
    if (timerMode === 'shortBreak') {
      return `${t.mainTimer.stageShortBreak} // ${pomodoroShortBreakMinutes} ${t.common.minuteShort}`;
    }
    if (timerMode === 'longBreak') {
      return `${t.mainTimer.stageLongBreak} // ${pomodoroLongBreakMinutes} ${t.common.minuteShort}`;
    }
    return `${t.mainTimer.stageFocus} // ${t.mainTimer.cycleBadge(currentTimerCycle, 4)}`;
  }, [
    currentTimerCycle,
    pomodoroEnabled,
    pomodoroLongBreakMinutes,
    pomodoroShortBreakMinutes,
    t,
    timerMode,
  ]);

  const activeSubtitle = useMemo(() => {
    if (pomodoroEnabled && timerMode === 'shortBreak') {
      return `${pomodoroShortBreakMinutes} ${t.common.minuteShort}`;
    }
    if (pomodoroEnabled && timerMode === 'longBreak') {
      return `${pomodoroLongBreakMinutes} ${t.common.minuteShort}`;
    }
    if (pomodoroEnabled) {
      return `${pomodoroFocusMinutes} ${t.common.minuteShort} // ${t.mainTimer.cycleBadge(currentTimerCycle, 4)}`;
    }
    return durationUnit === 'seconds'
      ? `${sessionSeconds} ${t.common.secondShort}`
      : `${sessionMinutes} ${t.common.minuteShort}`;
  }, [
    currentTimerCycle,
    durationUnit,
    pomodoroEnabled,
    pomodoroFocusMinutes,
    pomodoroLongBreakMinutes,
    pomodoroShortBreakMinutes,
    sessionMinutes,
    sessionSeconds,
    t,
    timerMode,
  ]);

  const completionTitle = useMemo(() => {
    if (!lastCompletedStage) {
      return t.mainTimer.sessionCompleted;
    }
    if (lastCompletedStage === 'focus') {
      if (!pomodoroEnabled) {
        return t.mainTimer.sessionCompleted;
      }
      return completedCycle >= 4
        ? t.notifications.pomodoroLongBreakTitle
        : t.notifications.pomodoroShortBreakTitle;
    }
    return t.notifications.breakTitle;
  }, [completedCycle, lastCompletedStage, pomodoroEnabled, t]);

  const completionBody = useMemo(() => {
    if (!lastCompletedStage) {
      return t.mainTimer.sessionCompletedDesc;
    }
    if (lastCompletedStage === 'focus') {
      if (!pomodoroEnabled) {
        return t.mainTimer.sessionCompletedDesc;
      }
      if (completedCycle >= 4) {
        return language === 'tr'
          ? `Mükemmel disiplin! ${pomodoroLongBreakMinutes} dakikalık uzun mola zamanı.`
          : `Outstanding discipline! Time for a ${pomodoroLongBreakMinutes}-minute long break.`;
      }
      return language === 'tr'
        ? `Tebrikler! ${pomodoroShortBreakMinutes} dakikalık kısa dinlenme zamanı.`
        : `Well done! Time for a ${pomodoroShortBreakMinutes}-minute short rest.`;
    }
    return t.notifications.breakBody;
  }, [
    completedCycle,
    language,
    lastCompletedStage,
    pomodoroEnabled,
    pomodoroLongBreakMinutes,
    pomodoroShortBreakMinutes,
    t,
  ]);

  const bannerActionText = useMemo(() => {
    if (lastCompletedStage === 'focus' && pomodoroEnabled) {
      return language === 'tr' ? 'Molayı Başlat' : 'Start Break';
    }
    return t.mainTimer.newSession;
  }, [language, lastCompletedStage, pomodoroEnabled, t]);

  const handleBannerAction = useCallback(() => {
    dismissCompletion();
    if (lastCompletedStage === 'focus' && pomodoroEnabled) {
      toggleTimer();
    } else {
      resetTimer();
    }
  }, [dismissCompletion, lastCompletedStage, pomodoroEnabled, resetTimer, toggleTimer]);

  const footerHint = useMemo(() => {
    if (isBreak) {
      return isRunning
        ? (language === 'tr' ? 'Molayı duraklatmak için dokun' : 'Tap to pause break')
        : (language === 'tr' ? 'Molayı başlatmak için dokun' : 'Tap to start break');
    }
    return t.mainTimer.tapToToggle;
  }, [isBreak, isRunning, language, t]);

  const translateY = useSharedValue(0);
  const gestureStartY = useSharedValue(0);
  const runningScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const drawerWidth = Math.min(326, width * 0.84);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [triggerImpact]);

  const closeDrawer = useCallback(() => {
    commitDuration();
    setIsDrawerOpen(false);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [commitDuration, triggerImpact]);

  const handleSelectPresetSafe = useCallback((value: number) => {
    if (isRunning) {
      resetTimer();
    }
    selectPreset(value);
  }, [isRunning, resetTimer, selectPreset]);

  const handleCommitDurationSafe = useCallback(() => {
    if (isRunning) {
      resetTimer();
    }
    commitDuration();
  }, [commitDuration, isRunning, resetTimer]);

  const handleChangeDurationUnitSafe = useCallback((unit: DurationUnit) => {
    if (isRunning) {
      resetTimer();
    }
    handleChangeDurationUnit(unit);
  }, [handleChangeDurationUnit, isRunning, resetTimer]);

  const handleSelectPomodoroPresetSafe = useCallback((focus: number, shortM: number, longM: number) => {
    if (isRunning) {
      resetTimer();
    }
    setPomodoroPreset(focus, shortM, longM);
  }, [isRunning, resetTimer, setPomodoroPreset]);

  const handleMenuSelect = useCallback((index: number) => {
    setActiveMenuIndex(index);
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    void playTickSound();
  }, [hapticsEnabled]);

  const handleNotificationsToggleWrapper = useCallback(() => {
    void handleNotificationsToggle(async () => {
      if (isRunning) {
        await scheduleCompletion(true);
      }
    });
  }, [handleNotificationsToggle, isRunning, scheduleCompletion]);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(350)
        .maxDistance(18)
        .onBegin(() => {
          runningScale.value = withSpring(0.975, {
            damping: 20,
            stiffness: 450,
            mass: 0.5,
          });
        })
        .onFinalize(() => {
          runningScale.value = withSpring(isRunning ? 1.012 : 1, {
            damping: 20,
            stiffness: 300,
            mass: 0.7,
          });
        })
        .onEnd(() => {
          runOnJS(toggleTimer)();
        }),
    [isRunning, runningScale, toggleTimer],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(12)
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
          const shouldReset = event.translationY > RESET_THRESHOLD;
          const shouldToggle = event.translationY < FLICK_THRESHOLD || event.velocityY < FLICK_VELOCITY;
          const isShortDrag = Math.abs(event.translationY) < 30;

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
          } else if (shouldToggle || isShortDrag) {
            runOnJS(toggleTimer)();
          }
        }),
    [gestureStartY, height, isRunning, resetTimer, runningScale, toggleTimer, translateY],
  );

  const gesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  const dialScale = useMemo(() => {
    const availableHeight = height - (insets.top + insets.bottom + 170);
    const availableWidth = width - 40;
    const target = Math.min(320, availableHeight, availableWidth);
    return Math.max(0.78, Math.min(1, target / 320));
  }, [height, insets.bottom, insets.top, width]);

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: runningScale.value * dialScale }],
  }));

  if (!isPreferencesLoaded) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]} />;
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingScreen
        colors={colors}
        initialLanguage={language}
        onComplete={(p) => {
          completeOnboarding(p);
          void playFocusStartSound();
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar hidden style={theme === 'dark' ? 'light' : 'dark'} />

        <View
          style={[
            styles.topBar,
            {
              top: Math.max(insets.top + 8, Platform.OS === 'android' ? 24 : 16),
              opacity: showCompletion ? 0 : 1,
            },
          ]}
          pointerEvents={showCompletion ? 'none' : 'auto'}
        >
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
            <View style={styles.topMetaBrandRow}>
              <Image
                source={require('./assets/focal-logo.png')}
                style={styles.topMetaLogo}
                resizeMode="contain"
                accessible
                accessibilityLabel="Focal Logo"
              />
              <Text style={[styles.topMetaTitle, { color: isBreak ? colors.accent : colors.primary }]}>{topMetaTitle}</Text>
            </View>
            <Text style={[styles.topMetaSubtitle, { color: colors.muted }]}>
              {activeSubtitle}
            </Text>
          </View>
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.focusSurface, animatedCounterStyle]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              isBreak
                ? (isRunning ? (language === 'tr' ? 'Molayı duraklat' : 'Pause break') : (language === 'tr' ? 'Molayı başlat' : 'Start break'))
                : (isRunning ? t.mainTimer.ariaPause : t.mainTimer.ariaStart)
            }
            accessibilityHint={t.mainTimer.ariaHint}
            onAccessibilityTap={toggleTimer}
          >
            <MainFocus3D
              isRunning={isRunning}
              elapsedText={elapsedText}
              progress={progress}
              sessionMinutes={sessionMinutes}
              accentColor={colors.accent}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
              mutedColor={colors.muted}
              hairlineColor={colors.hairline}
              translateY={translateY}
              reducedMotion={Boolean(reduceMotion)}
              stageLabel={stageLabel}
              isBreak={isBreak}
            />
          </Animated.View>
        </GestureDetector>

        <View style={[styles.footer, { bottom: Math.max(insets.bottom + 26, 26) }]}>
          <Text style={[styles.hint, { color: colors.muted }]}>{footerHint}</Text>
          {isBreak && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.mainTimer.ariaSkipBreak}
              onPress={skipStage}
              style={({ pressed }) => [
                styles.skipBreakButton,
                { borderColor: colors.hairline, backgroundColor: colors.panel },
                pressed && styles.itemPressed,
              ]}
            >
              <Text style={[styles.skipBreakText, { color: colors.secondary }]}>
                {t.mainTimer.skipBreak}
              </Text>
            </Pressable>
          )}
          {(elapsed > 0 || isBreak || showCompletion) && (
            <ModernResetButton
              onPress={resetTimer}
              label={t.mainTimer.resetBadge}
              accessibilityLabel={t.mainTimer.ariaReset}
              theme={theme}
              style={styles.modernResetWrapper}
            />
          )}
        </View>

        <AppleNotificationBanner
          visible={showCompletion}
          title={completionTitle}
          body={completionBody}
          appName={t.common.appName || 'FOCAL'}
          timeText={t.mainTimer.now}
          actionText={bannerActionText}
          dismissText={t.mainTimer.dismiss}
          theme={theme}
          colors={colors}
          topInset={insets.top}
          hapticsEnabled={hapticsEnabled}
          onAction={handleBannerAction}
          onDismiss={dismissCompletion}
        />

        <FocusDrawer
          drawerWidth={drawerWidth}
          visible={isDrawerOpen}
          activeIndex={activeMenuIndex}
          sessionMinutes={sessionMinutes}
          sessionSeconds={sessionSeconds}
          durationUnit={durationUnit}
          durationDraft={durationDraft}
          theme={theme}
          language={language}
          hapticsEnabled={hapticsEnabled}
          notificationsEnabled={notificationsEnabled}
          soundEnabled={soundEnabled}
          pomodoroEnabled={pomodoroEnabled}
          pomodoroFocusMinutes={pomodoroFocusMinutes}
          soundAlertTone={soundAlertTone}
          completedSessions={completedSessions}
          totalFocusMinutes={totalFocusMinutes}
          weeklyHistory={weeklyHistory}
          pomodoroShortBreakMinutes={pomodoroShortBreakMinutes}
          pomodoroLongBreakMinutes={pomodoroLongBreakMinutes}
          colors={colors}
          onClose={closeDrawer}
          onSelect={handleMenuSelect}
          onChangeDurationUnit={handleChangeDurationUnitSafe}
          onDurationDraftChange={handleDurationDraftChange}
          onCommitDuration={handleCommitDurationSafe}
          onSelectPreset={handleSelectPresetSafe}
          onThemeChange={handleThemeChange}
          onToggleLanguage={handleToggleLanguage}
          onToggleHaptics={handleToggleHaptics}
          onToggleNotifications={handleNotificationsToggleWrapper}
          onToggleSound={handleToggleSound}
          onTogglePomodoro={handleTogglePomodoro}
          onSelectPomodoroPreset={handleSelectPomodoroPresetSafe}
          onSelectShortBreak={setPomodoroShortBreakMinutes}
          onSelectLongBreak={setPomodoroLongBreakMinutes}
          onSelectSoundTone={handleSelectSoundTone}
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
  screen: {
    flex: 1,
    backgroundColor: '#111215',
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
  topMetaBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  topMetaLogo: {
    width: 15,
    height: 15,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: '#747681',
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  skipBreakButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  skipBreakText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  itemPressed: {
    opacity: 0.6,
  },
  modernResetWrapper: {
    marginTop: 14,
  },
});
