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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { RootErrorBoundary } from './src/components/common/RootErrorBoundary';
import { TimerDisplay } from './src/components/timer/TimerDisplay';
import { AppleNotificationBanner } from './src/components/ui/AppleNotificationBanner';
import { ApplePressable } from './src/components/ui/ApplePressable';
import { OnboardingScreen } from './src/components/onboarding/OnboardingScreen';
import { FocusDrawer } from './src/components/FocusDrawer';
import { COLORS } from './src/theme/colors';
import { usePreferences } from './src/hooks/usePreferences';
import { useFocusTimer } from './src/hooks/useFocusTimer';
import { useFlipToFocus } from './src/hooks/useFlipToFocus';
import { playFocusStartSound, playTickSound } from './src/audio/soundEngine';
import { checkAndPromptStoreReview } from './src/services/storeReview';
import { recordMindfulMinutes } from './src/services/healthKitService';
import { translations } from './src/i18n/translations';
import type { AmbientSoundType, DurationUnit } from './src/storage/preferencesStorage';

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
    ambientSound,
    flipToFocus,
    weeklyHistory,
    handleChangeDurationUnit,
    handleThemeChange,
    handleToggleLanguage,
    handleToggleHaptics,
    handleToggleSound,
    handleNotificationsToggle,
    handleTogglePomodoro,
    handleSelectSoundTone,
    handleSelectAmbientSound,
    handleToggleFlipToFocus,
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

  const handleSessionComplete = useCallback(
    (addedMinutes: number) => {
      recordCompletedSession(addedMinutes);
      void checkAndPromptStoreReview(completedSessions + 1);
      void recordMindfulMinutes({
        startDate: new Date(Date.now() - addedMinutes * 60 * 1000),
        endDate: new Date(),
        minutes: addedMinutes,
      });
    },
    [completedSessions, recordCompletedSession]
  );

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
    ambientSound,
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
    onSessionComplete: handleSessionComplete,
  });

  useFlipToFocus({
    enabled: flipToFocus,
    isRunning,
    onTriggerStart: () => {
      if (!isRunning) {
        toggleTimer();
      }
    },
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
        return t.notifications.pomodoroLongBreakBodyDynamic(pomodoroLongBreakMinutes);
      }
      return t.notifications.pomodoroShortBreakBodyDynamic(pomodoroShortBreakMinutes);
    }
    return t.notifications.breakBody;
  }, [
    completedCycle,
    lastCompletedStage,
    pomodoroEnabled,
    pomodoroLongBreakMinutes,
    pomodoroShortBreakMinutes,
    t,
  ]);

  const bannerActionText = useMemo(() => {
    if (lastCompletedStage === 'focus' && pomodoroEnabled) {
      return t.mainTimer.startBreak;
    }
    return t.mainTimer.newSession;
  }, [lastCompletedStage, pomodoroEnabled, t]);

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
        ? t.mainTimer.tapToPauseBreak
        : t.mainTimer.tapToStartBreak;
    }
    return t.mainTimer.tapToToggle;
  }, [isBreak, isRunning, t]);

  const drawerWidth = Math.min(326, width * 0.84);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [triggerImpact]);

  const closeDrawer = useCallback(() => {
    if (activeMenuIndex === 1) {
      commitDuration();
    }
    setIsDrawerOpen(false);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [activeMenuIndex, commitDuration, triggerImpact]);

  const edgePanGesture = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop({ left: 0, width: 36 })
        .activeOffsetX([15, 60])
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX > 25 && !isDrawerOpen) {
            runOnJS(openDrawer)();
          }
        }),
    [isDrawerOpen, openDrawer]
  );

  const handleSelectPresetSafe = useCallback((value: number) => {
    if (isRunning || pomodoroEnabled) {
      resetTimer();
    }
    selectPreset(value);
  }, [isRunning, pomodoroEnabled, resetTimer, selectPreset]);

  const handleCommitDurationSafe = useCallback(() => {
    if (isRunning || pomodoroEnabled) {
      resetTimer();
    }
    commitDuration();
  }, [commitDuration, isRunning, pomodoroEnabled, resetTimer]);

  const handleChangeDurationUnitSafe = useCallback((unit: DurationUnit) => {
    if (isRunning || pomodoroEnabled) {
      resetTimer();
    }
    handleChangeDurationUnit(unit);
  }, [handleChangeDurationUnit, isRunning, pomodoroEnabled, resetTimer]);

  const handleTogglePomodoroSafe = useCallback(() => {
    if (isRunning) {
      resetTimer();
    }
    handleTogglePomodoro();
  }, [handleTogglePomodoro, isRunning, resetTimer]);

  const handleSelectPomodoroPresetSafe = useCallback((focus: number, shortM: number, longM: number) => {
    if (isRunning) {
      resetTimer();
    }
    setPomodoroPreset(focus, shortM, longM);
  }, [isRunning, resetTimer, setPomodoroPreset]);

  const handleMenuSelect = useCallback((index: number) => {
    setActiveMenuIndex(index);
    if (hapticsEnabled && Platform.OS !== 'web') {
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

  const handleSelectAmbientSoundWithState = useCallback(
    (ambient: AmbientSoundType) => {
      handleSelectAmbientSound(ambient, isRunning);
    },
    [handleSelectAmbientSound, isRunning]
  );

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
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

        <GestureDetector gesture={edgePanGesture}>
          <View style={styles.edgePanStrip} pointerEvents="box-only" />
        </GestureDetector>

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
          <ApplePressable
            accessibilityRole="button"
            accessibilityLabel={t.mainTimer.ariaMenuOpen}
            accessibilityHint={t.mainTimer.ariaHint}
            hitSlop={12}
            onPress={openDrawer}
            activeScale={0.88}
            style={styles.menuButton}
          >
            <View style={[styles.menuLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.menuLine, styles.menuLineShort, { backgroundColor: colors.primary }]} />
          </ApplePressable>
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

        <TimerDisplay
          isRunning={isRunning}
          elapsedText={elapsedText}
          progress={progress}
          colors={colors}
          stageLabel={stageLabel}
          isBreak={isBreak}
          footerHint={footerHint}
          showResetButton={elapsed > 0 || isBreak || showCompletion}
          resetLabel={t.mainTimer.resetBadge}
          skipBreakLabel={t.mainTimer.skipBreak}
          ariaSkipBreak={t.mainTimer.ariaSkipBreak}
          ariaReset={t.mainTimer.ariaReset}
          ariaStart={t.mainTimer.ariaStart}
          ariaPause={t.mainTimer.ariaPause}
          ariaHint={t.mainTimer.ariaHint}
          theme={theme}
          insetsBottom={insets.bottom}
          insetsTop={insets.top}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          onSkipStage={skipStage}
        />

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
          onTogglePomodoro={handleTogglePomodoroSafe}
          onSelectPomodoroPreset={handleSelectPomodoroPresetSafe}
          onSelectShortBreak={setPomodoroShortBreakMinutes}
          ambientSound={ambientSound}
          flipToFocus={flipToFocus}
          onSelectLongBreak={setPomodoroLongBreakMinutes}
          onSelectSoundTone={handleSelectSoundTone}
          onSelectAmbientSound={handleSelectAmbientSoundWithState}
          onToggleFlipToFocus={handleToggleFlipToFocus}
        />
      </View>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <FocusEngineScreen />
      </SafeAreaProvider>
    </RootErrorBoundary>
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
  edgePanStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 1,
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
});
