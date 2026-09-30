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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LineSidebar } from './src/components/LineSidebar';
import {
  cancelFocusCompletion,
  requestNotificationPermission,
  scheduleFocusCompletion,
} from './src/notifications/notifications';
import {
  loadPreferences,
  savePreferences,
  ThemeMode,
} from './src/storage/preferencesStorage';
import { loadTimerState, saveTimerState } from './src/storage/timerStorage';

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
const MENU_ITEMS = ['Odak', 'Süre', 'Tema', 'Bildirim', 'Haptik'];

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
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  colors: AppColors;
  onClose: () => void;
  onSelect: (index: number) => void;
  onDurationDraftChange: (value: string) => void;
  onCommitDuration: () => void;
  onSelectPreset: (minutes: number) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onToggleHaptics: () => void;
  onToggleNotifications: () => void;
};

function FocusDrawer({
  drawerWidth,
  visible,
  activeIndex,
  sessionMinutes,
  durationDraft,
  theme,
  hapticsEnabled,
  notificationsEnabled,
  colors,
  onClose,
  onSelect,
  onDurationDraftChange,
  onCommitDuration,
  onSelectPreset,
  onThemeChange,
  onToggleHaptics,
  onToggleNotifications,
}: FocusDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-drawerWidth);

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
          accessibilityLabel="Menüyü kapat"
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
              <View>
                <Text style={[styles.drawerKicker, { color: colors.secondary }]}>Focus Engine</Text>
                <Text style={[styles.drawerTitle, { color: colors.primary }]}>Kontrol</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Menüyü kapat"
                hitSlop={12}
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.itemPressed]}
              >
                <View style={[styles.closeLine, styles.closeLineFirst, { backgroundColor: colors.secondary }]} />
                <View style={[styles.closeLine, styles.closeLineSecond, { backgroundColor: colors.secondary }]} />
              </Pressable>
            </View>

            <LineSidebar
              items={MENU_ITEMS}
              activeIndex={activeIndex}
              onSelect={onSelect}
              colors={colors}
            />

            {activeIndex !== 0 && <View style={[styles.drawerRule, { backgroundColor: colors.hairline }]} />}
            {activeIndex === 1 && (
              <View style={styles.drawerSection}>
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Oturum süresi</Text>
                <View style={styles.durationEditor}>
                  <TextInput
                    accessibilityLabel="Oturum süresi dakika"
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
                  <Text style={[styles.durationUnit, { color: colors.secondary }]}>dakika</Text>
                </View>
                <View style={styles.presetRow}>
                  {SESSION_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`${option} dakika seç`}
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
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Tema</Text>
                <View style={styles.themeRow}>
                  {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected: theme === mode }}
                      accessibilityLabel={mode === 'dark' ? 'Karanlık tema' : 'Aydınlık tema'}
                      onPress={() => onThemeChange(mode)}
                      style={({ pressed }) => [
                        styles.themeOption,
                        { borderBottomColor: theme === mode ? colors.accent : colors.hairline },
                        pressed && styles.itemPressed,
                      ]}
                    >
                      <Text style={[styles.themeOptionText, { color: theme === mode ? colors.primary : colors.secondary }]}>
                        {mode === 'dark' ? 'Karanlık' : 'Aydınlık'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {activeIndex === 3 && (
              <View style={styles.drawerSection}>
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Oturum bitişi</Text>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: notificationsEnabled }}
                  accessibilityLabel="Oturum bitiş bildirimleri"
                  onPress={onToggleNotifications}
                  style={({ pressed }) => [styles.settingRow, { borderBottomColor: colors.hairline }, pressed && styles.itemPressed]}
                >
                  <Text style={[styles.settingValue, { color: colors.primary }]}>Bildirimler</Text>
                  <Text style={[styles.settingAction, { color: colors.accent }]}>{notificationsEnabled ? 'Açık' : 'Kapalı'}</Text>
                </Pressable>
              </View>
            )}

            {activeIndex === 4 && (
              <View style={styles.drawerSection}>
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Dokunsal geri bildirim</Text>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                  accessibilityLabel="Dokunsal geri bildirim"
                  onPress={onToggleHaptics}
                  style={({ pressed }) => [styles.settingRow, { borderBottomColor: colors.hairline }, pressed && styles.itemPressed]}
                >
                  <Text style={[styles.settingValue, { color: colors.primary }]}>Haptik</Text>
                  <Text style={[styles.settingAction, { color: colors.accent }]}>{hapticsEnabled ? 'Açık' : 'Kapalı'}</Text>
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
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [durationDraft, setDurationDraft] = useState('25');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const translateY = useSharedValue(0);
  const gestureStartY = useSharedValue(0);
  const runningScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const elapsedRef = useRef(0);
  const runningRef = useRef(false);
  const scheduledNotificationIdRef = useRef<string | null>(null);
  const drawerWidth = Math.min(326, width * 0.84);
  const colors = COLORS[theme];

  useEffect(() => {
    const preferences = loadPreferences();
    setSessionMinutes(preferences.sessionMinutes);
    setDurationDraft(String(preferences.sessionMinutes));
    setTheme(preferences.theme);
    setNotificationsEnabled(preferences.notificationsEnabled);

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
      const identifier = await scheduleFocusCompletion(remainingSeconds);
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
  }, [clearScheduledCompletion, notificationsEnabled, sessionMinutes]);

  useEffect(() => {
    if (isRunning && notificationsEnabled && !scheduledNotificationIdRef.current) {
      void scheduleCompletion();
    }
  }, [isRunning, notificationsEnabled, scheduleCompletion]);

  const toggleTimer = useCallback(() => {
    const nextRunning = !runningRef.current;
    const now = Date.now();

    runningRef.current = nextRunning;
    setIsRunning(nextRunning);
    if (nextRunning) {
      void scheduleCompletion();
    } else {
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

          if (shouldReset) {
            runOnJS(resetTimer)();
          } else if (isTap || shouldToggle) {
            runOnJS(toggleTimer)();
          }
        }),
    [gestureStartY, height, resetTimer, toggleTimer, translateY],
  );

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: runningScale.value }],
  }));

  const progress = Math.min(elapsed / (sessionMinutes * 60), 1);
  const saveCurrentPreferences = useCallback((next: Partial<{ sessionMinutes: number; theme: ThemeMode; notificationsEnabled: boolean }>) => {
    savePreferences({
      sessionMinutes,
      theme,
      notificationsEnabled,
      ...next,
    });
  }, [notificationsEnabled, sessionMinutes, theme]);

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
  }, [hapticsEnabled, saveCurrentPreferences]);

  const handleThemeChange = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    saveCurrentPreferences({ theme: nextTheme });
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [hapticsEnabled, saveCurrentPreferences]);

  const handleNotificationsToggle = useCallback(async () => {
    if (notificationsEnabled) {
      clearScheduledCompletion();
      setNotificationsEnabled(false);
      saveCurrentPreferences({ notificationsEnabled: false });
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) {
      return;
    }

    setNotificationsEnabled(true);
    saveCurrentPreferences({ notificationsEnabled: true });
    if (runningRef.current) {
      await scheduleCompletion(true);
    }
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [clearScheduledCompletion, hapticsEnabled, notificationsEnabled, saveCurrentPreferences, scheduleCompletion]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
  }, [triggerImpact]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleMenuSelect = useCallback((index: number) => {
    setActiveMenuIndex(index);
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }, [hapticsEnabled]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar hidden style={theme === 'dark' ? 'light' : 'dark'} />

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel="Menüyü aç"
            accessibilityHint="Oturum ve geri bildirim ayarlarını açar"
            hitSlop={10}
            onPress={openDrawer}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <View style={[styles.menuLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.menuLine, styles.menuLineShort, { backgroundColor: colors.primary }]} />
          </Pressable>
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.focusSurface, animatedCounterStyle]}>
            <View
              style={styles.focusContent}
              accessible
              accessibilityRole="button"
              accessibilityLabel={isRunning ? 'Odaklanma sayacını duraklat' : 'Odaklanma sayacını başlat'}
              accessibilityHint="Başlatmak veya duraklatmak için dokunun. Aşağı çekerek sıfırlayabilirsiniz."
              onAccessibilityTap={toggleTimer}
            >
              <Text style={[styles.counter, { color: colors.primary }]} maxFontSizeMultiplier={1.25}>
                {formatElapsed(elapsed)}
              </Text>
              <View style={[styles.progressRail, { backgroundColor: colors.hairline }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.state, { color: isRunning ? colors.accent : colors.secondary }]}>
                {isRunning ? 'Çalışıyor' : 'Hazır'}
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>

        <View pointerEvents="none" style={[styles.footer, { bottom: insets.bottom + 26 }]}> 
          <Text style={[styles.hint, { color: colors.muted }]}>Dokun · yukarı fırlat · aşağı çek sıfırla</Text>
        </View>

        <FocusDrawer
          drawerWidth={drawerWidth}
          visible={isDrawerOpen}
          activeIndex={activeMenuIndex}
          sessionMinutes={sessionMinutes}
          durationDraft={durationDraft}
          theme={theme}
          hapticsEnabled={hapticsEnabled}
          notificationsEnabled={notificationsEnabled}
          colors={colors}
          onClose={closeDrawer}
          onSelect={handleMenuSelect}
          onDurationDraftChange={(value) => setDurationDraft(value.replace(/[^0-9]/g, ''))}
          onCommitDuration={commitDuration}
          onSelectPreset={selectPreset}
          onThemeChange={handleThemeChange}
          onToggleHaptics={() => {
            if (hapticsEnabled) {
              void Haptics.selectionAsync();
            }
            setHapticsEnabled((current) => !current);
          }}
          onToggleNotifications={() => {
            void handleNotificationsToggle();
          }}
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 24,
    zIndex: 2,
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
  focusSurface: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
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
    marginTop: 16,
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
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
  sectionLabel: {
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  settingRow: {
    minHeight: 52,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2C33',
  },
  settingValue: {
    color: '#F5F5F7',
    fontFamily: 'System',
    fontSize: 16,
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
});
