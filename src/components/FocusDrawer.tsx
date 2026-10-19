import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineSidebar } from './LineSidebar';
import { ApplePressable } from './ui/ApplePressable';
import { ModernSwitch } from './ui/ModernSwitch';
import { RhythmOptionWheel, type RhythmPreset } from './ui/RhythmOptionWheel';
import Svg, { Path } from 'react-native-svg';
import { translations, Language } from '../i18n/translations';
import type { AmbientSoundType, DurationUnit, SoundAlertTone, ThemeMode } from '../storage/preferencesStorage';
import type { AppColors } from '../theme/colors';

const SESSION_OPTIONS_MINUTES = [15, 25, 45, 60];
const SESSION_OPTIONS_SECONDS = [15, 30, 45, 60];

const WEEKDAY_LABELS: Record<Language, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

export type FocusDrawerProps = {
  drawerWidth: number;
  visible: boolean;
  activeIndex: number;
  sessionMinutes: number;
  sessionSeconds: number;
  durationUnit: DurationUnit;
  durationDraft: string;
  theme: ThemeMode;
  language: Language;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  pomodoroEnabled: boolean;
  pomodoroCycle?: number;
  pomodoroFocusMinutes?: number;
  pomodoroShortBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  soundAlertTone: SoundAlertTone;
  ambientSound?: AmbientSoundType;
  flipToFocus?: boolean;
  completedSessions: number;
  totalFocusMinutes: number;
  weeklyHistory?: number[];
  colors: AppColors;
  onClose: () => void;
  onSelect: (index: number) => void;
  onChangeDurationUnit: (unit: DurationUnit) => void;
  onDurationDraftChange: (value: string) => void;
  onCommitDuration: () => void;
  onSelectPreset: (value: number) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onToggleLanguage: () => void;
  onToggleHaptics: () => void;
  onToggleNotifications: () => void;
  onToggleSound: () => void;
  onTogglePomodoro: () => void;
  onSelectPomodoroPreset?: (focus: number, shortM: number, longM: number) => void;
  onSelectShortBreak?: (mins: number) => void;
  onSelectLongBreak?: (mins: number) => void;
  onSelectSoundTone: (tone: SoundAlertTone) => void;
  onSelectAmbientSound?: (sound: AmbientSoundType) => void;
  onToggleFlipToFocus?: () => void;
};

export const FocusDrawer = React.memo(function FocusDrawer({
  drawerWidth,
  visible,
  activeIndex,
  sessionMinutes,
  sessionSeconds,
  durationUnit,
  durationDraft,
  theme,
  language,
  hapticsEnabled,
  notificationsEnabled,
  soundEnabled,
  pomodoroEnabled,
  pomodoroFocusMinutes = 25,
  pomodoroShortBreakMinutes = 5,
  pomodoroLongBreakMinutes = 15,
  soundAlertTone,
  ambientSound = 'none',
  flipToFocus = false,
  colors,
  onClose,
  onSelect,
  onChangeDurationUnit,
  onDurationDraftChange,
  onCommitDuration,
  onSelectPreset,
  onThemeChange,
  onToggleLanguage,
  onToggleHaptics,
  onToggleNotifications,
  onToggleSound,
  onTogglePomodoro,
  onSelectPomodoroPreset,
  onSelectShortBreak,
  onSelectLongBreak,
  onSelectSoundTone,
  onSelectAmbientSound,
  onToggleFlipToFocus,
  completedSessions,
  totalFocusMinutes,
  weeklyHistory = [0, 0, 0, 0, 0, 0, 0],
}: FocusDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-drawerWidth);
  const t = translations[language];

  const menuItems = useMemo(
    () => [
      t.drawer.menu.focus,
      t.drawer.menu.duration,
      t.drawer.menu.pomodoro,
      t.drawer.menu.theme,
      t.drawer.menu.notifications,
      t.drawer.menu.haptics,
      t.drawer.menu.sound,
      t.drawer.menu.language,
    ],
    [t]
  );

  useEffect(() => {
    translateX.value = withSpring(
      visible ? 0 : -drawerWidth,
      visible
        ? { damping: 25, stiffness: 260, mass: 0.85 }
        : { damping: 28, stiffness: 320, mass: 0.7 }
    );
  }, [drawerWidth, translateX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 1]),
  }));

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-18, 18])
        .onUpdate((event) => {
          if (event.translationX <= 0) {
            translateX.value = Math.max(-drawerWidth, event.translationX);
          }
        })
        .onEnd((event) => {
          const shouldClose =
            event.translationX < -drawerWidth * 0.25 || event.velocityX < -400;
          if (shouldClose) {
            translateX.value = withSpring(
              -drawerWidth,
              { damping: 26, stiffness: 280, velocity: event.velocityX },
              () => {
                runOnJS(onClose)();
              }
            );
          } else {
            translateX.value = withSpring(0, {
              damping: 24,
              stiffness: 260,
              velocity: event.velocityX,
            });
          }
        }),
    [drawerWidth, onClose, translateX]
  );

  // Deterministic 7-day rhythm distribution (active today highlighted)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
  }, []);

  const weekDayLabels = WEEKDAY_LABELS[language] ?? WEEKDAY_LABELS.en;

  const rhythmPresets: RhythmPreset[] = useMemo(
    () => [
      {
        id: 'sprint',
        name: t.drawer.sections.pomodoroPlan.presetSprint,
        ratio: '15 / 3',
        focus: 15,
        shortM: 3,
        longM: 10,
      },
      {
        id: 'standard',
        name: t.drawer.sections.pomodoroPlan.presetStandard,
        ratio: '25 / 5',
        focus: 25,
        shortM: 5,
        longM: 15,
      },
      {
        id: 'expanded',
        name: language === 'tr' ? 'Geniş' : 'Expanded',
        ratio: '45 / 10',
        focus: 45,
        shortM: 10,
        longM: 20,
      },
      {
        id: 'deep',
        name: t.drawer.sections.pomodoroPlan.presetDeep,
        ratio: '50 / 10',
        focus: 50,
        shortM: 10,
        longM: 20,
      },
      {
        id: 'ultra',
        name: 'Ultra',
        ratio: '60 / 15',
        focus: 60,
        shortM: 15,
        longM: 25,
      },
    ],
    [t, language]
  );

  const activePresetId = useMemo(() => {
    const matched = rhythmPresets.find(
      (p) =>
        p.focus === pomodoroFocusMinutes &&
        p.shortM === pomodoroShortBreakMinutes &&
        p.longM === pomodoroLongBreakMinutes
    );
    return matched?.id ?? '';
  }, [rhythmPresets, pomodoroFocusMinutes, pomodoroShortBreakMinutes, pomodoroLongBreakMinutes]);

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

      <GestureDetector gesture={panGesture}>
        <Animated.View
          accessibilityViewIsModal={visible}
          accessibilityElementsHidden={!visible}
          importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
          aria-hidden={!visible}
          style={[styles.drawer, { width: drawerWidth, backgroundColor: colors.panel }, drawerStyle]}
        >
          <View style={[styles.drawerContent, { paddingTop: insets.top + 22 }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <Image
                  source={require('../../assets/focal-logo.png')}
                  style={styles.drawerLogo}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel="Focal Logo"
                />
                <Text style={[styles.drawerTitle, { color: colors.primary }]}>{t.drawer.title}</Text>
              </View>
              <ApplePressable
                accessibilityRole="button"
                accessibilityLabel={t.mainTimer.ariaMenuClose}
                hitSlop={12}
                onPress={onClose}
                activeScale={0.88}
                style={styles.closeButton}
              >
                <View style={[styles.closeLine, styles.closeLineFirst, { backgroundColor: colors.secondary }]} />
                <View style={[styles.closeLine, styles.closeLineSecond, { backgroundColor: colors.secondary }]} />
              </ApplePressable>
            </View>

            <ScrollView
              style={styles.drawerScrollView}
              contentContainerStyle={[
                styles.drawerScrollContent,
                { paddingBottom: insets.bottom + 48 },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
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

                {/* Minimalist 7-Day Weekly Rhythm (Apple / Dieter Rams 1px hairlines) */}
                <View style={styles.weeklyRhythmContainer}>
                  <View style={styles.weeklyBarsRow}>
                    {weekDayLabels.map((dayLabel, index) => {
                      const isToday = index === currentDayIndex;
                      const dayMinutes = weeklyHistory[index] ?? 0;
                      // Proportional micro-fill based on authentic weekly history (60m = 36px full bar, 0m = 3px baseline tick)
                      const barHeight = dayMinutes > 0
                        ? Math.min(36, Math.max(6, Math.round((dayMinutes / 60) * 36)))
                        : 3;

                      return (
                        <View key={dayLabel} style={styles.weekdayCol}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: barHeight,
                                  backgroundColor: isToday
                                    ? colors.accent
                                    : (dayMinutes > 0 ? colors.secondary : colors.hairline),
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.weekdayText,
                              {
                                color: isToday ? colors.primary : colors.muted,
                                fontWeight: isToday ? '600' : '400',
                              },
                            ]}
                          >
                            {dayLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {completedSessions === 0 && (
                  <View style={[styles.emptyStateBanner, { borderColor: colors.hairline }]}>
                    <Text style={[styles.emptyStateText, { color: colors.secondary }]}>
                      {language === 'tr'
                        ? 'İlk odak seansını tamamlayarak haftalık ritmini başlat.'
                        : 'Complete your first focus session to build your weekly rhythm.'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeIndex !== 0 && <View style={[styles.drawerRule, { backgroundColor: colors.hairline }]} />}

          {activeIndex === 1 && (
            <View style={styles.drawerSection}>
              {/* Pomodoro Active Status Banner */}
              {pomodoroEnabled && (
                <View style={[styles.pomodoroActiveBadgeRow, { borderBottomColor: colors.hairline }]}>
                  <View style={[styles.pomodoroActiveDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.pomodoroActiveText, { color: colors.secondary }]}>
                    {language === 'tr'
                      ? 'Pomodoro ritim modu devrede. Buradan bir süre seçtiğinde standart odak sayacına geçilir.'
                      : 'Pomodoro rhythm mode is active. Selecting a duration switches to standard focus timer.'}
                  </Text>
                </View>
              )}

              {/* Saniye Modu Switch - Unified with the rest of the drawer */}
              <Pressable
                accessible
                accessibilityRole="switch"
                accessibilityState={{ checked: durationUnit === 'seconds' }}
                accessibilityLabel={language === 'tr' ? 'Hassas Saniye Modu' : 'Precision Seconds Mode'}
                onPress={() => onChangeDurationUnit(durationUnit === 'seconds' ? 'minutes' : 'seconds')}
                style={({ pressed }) => [
                  styles.settingRow,
                  { borderBottomColor: colors.hairline, marginTop: 4 },
                  pressed && styles.itemPressed,
                ]}
              >
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingValue, { color: colors.primary }]}>
                    {language === 'tr' ? 'Hassas Saniye Modu' : 'Precision Seconds Mode'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                    {language === 'tr' ? 'Kısa sprintler ve hassas zamanlama' : 'Short sprints & precision intervals'}
                  </Text>
                </View>
                <View pointerEvents="none">
                  <ModernSwitch
                    value={durationUnit === 'seconds'}
                    onValueChange={() => {}}
                    checkedBg={colors.accent}
                    uncheckedBg={colors.hairline}
                    crossColor={colors.muted}
                    checkmarkColor="#FFFFFF"
                    accessibilityLabel={language === 'tr' ? 'Hassas Saniye Modu' : 'Precision Seconds Mode'}
                  />
                </View>
              </Pressable>

              {/* Section Header */}
              <View style={styles.durationListHeaderRow}>
                <Text style={[styles.durationListHeader, { color: colors.muted }]}>
                  {durationUnit === 'seconds'
                    ? (language === 'tr' ? 'SANİYE SPRINT SEÇENEKLERİ' : 'SPRINT INTERVAL OPTIONS')
                    : (language === 'tr' ? 'ODAK SÜRESİ SEÇENEKLERİ' : 'FOCUS DURATION OPTIONS')}
                </Text>
              </View>

              {/* Apple Settings Clean List of Durations with Checkmark */}
              {(durationUnit === 'seconds'
                ? [
                    { value: 15, subtitle: language === 'tr' ? 'Mikro test sprinti' : 'Micro sprint test' },
                    { value: 30, subtitle: language === 'tr' ? 'Hızlı kontrol döngüsü' : 'Fast check cycle' },
                    { value: 45, subtitle: language === 'tr' ? 'Genişletilmiş test periyodu' : 'Extended test period' },
                    { value: 60, subtitle: language === 'tr' ? '1 dakikalık tam sprint' : '1-minute full sprint' },
                  ]
                : [
                    { value: 15, subtitle: language === 'tr' ? 'Hızlı odak ve kısa sprint' : 'Quick focus & short sprint' },
                    { value: 25, subtitle: language === 'tr' ? 'Klasik Pomodoro standardı' : 'Classic Pomodoro standard' },
                    { value: 45, subtitle: language === 'tr' ? 'Derin çalışma ve akış bloğu' : 'Deep work & flow block' },
                    { value: 60, subtitle: language === 'tr' ? 'İleri seviye maraton odağı' : 'Extended focus marathon' },
                  ]
              ).map(({ value, subtitle }) => {
                const currentVal = durationUnit === 'seconds' ? sessionSeconds : sessionMinutes;
                const standardOptions = durationUnit === 'seconds' ? SESSION_OPTIONS_SECONDS : SESSION_OPTIONS_MINUTES;
                const isCustom = !standardOptions.includes(currentVal);
                const isSelected = !pomodoroEnabled && !isCustom && currentVal === value;
                const unitSuffix = durationUnit === 'seconds' ? t.common.secondShort : t.common.minuteShort;

                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} ${unitSuffix}`}
                    onPress={() => onSelectPreset(value)}
                    style={({ pressed }) => [
                      styles.settingRow,
                      { borderBottomColor: colors.hairline },
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <View style={styles.settingTextGroup}>
                      <Text
                        style={[
                          styles.settingValue,
                          {
                            color: isSelected ? colors.primary : colors.secondary,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {value} {unitSuffix}
                      </Text>
                      <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                        {subtitle}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.toneCheckmarkWrapper}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M5 13l4 4L19 7"
                            stroke={colors.accent}
                            strokeWidth={2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    ) : (
                      <View style={styles.toneCheckmarkPlaceholder} />
                    )}
                  </Pressable>
                );
              })}

              {/* Dedicated Custom Duration Setting Row */}
              {(() => {
                const currentVal = durationUnit === 'seconds' ? sessionSeconds : sessionMinutes;
                const standardOptions = durationUnit === 'seconds' ? SESSION_OPTIONS_SECONDS : SESSION_OPTIONS_MINUTES;
                const isCustom = !standardOptions.includes(currentVal);
                const isCustomSelected = !pomodoroEnabled && isCustom;
                const unitSuffix = durationUnit === 'seconds' ? t.common.secondShort : t.common.minuteShort;

                return (
                  <View
                    style={[
                      styles.settingRow,
                      { borderBottomColor: colors.hairline },
                    ]}
                  >
                    <View style={styles.settingTextGroup}>
                      <Text
                        style={[
                          styles.settingValue,
                          {
                            color: isCustomSelected ? colors.primary : colors.secondary,
                            fontWeight: isCustomSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {t.drawer.sections.customDuration}
                      </Text>
                      <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                        {durationUnit === 'seconds'
                          ? (language === 'tr' ? '5 ile 3600 sn arası serbest değer' : 'Free value between 5 and 3600s')
                          : (language === 'tr' ? '1 ile 180 dk arası serbest değer' : 'Free value between 1 and 180m')}
                      </Text>
                    </View>

                    <View style={styles.customInputRow}>
                      <TextInput
                        accessibilityLabel={t.drawer.sections.customDuration}
                        keyboardType="number-pad"
                        maxLength={4}
                        onBlur={onCommitDuration}
                        onChangeText={onDurationDraftChange}
                        onSubmitEditing={onCommitDuration}
                        returnKeyType="done"
                        selectTextOnFocus
                        style={[
                          styles.customInputBox,
                          {
                            color: colors.primary,
                            borderColor: isCustomSelected ? colors.accent : colors.hairline,
                            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        ]}
                        value={durationDraft}
                      />
                      <Text style={[styles.customInputUnitText, { color: colors.muted }]}>
                        {unitSuffix}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {activeIndex === 2 && (
            <View style={styles.drawerSection}>
              {/* Pomodoro Rhythm Mode Toggle */}
              <Pressable
                accessible
                accessibilityRole="switch"
                accessibilityState={{ checked: pomodoroEnabled }}
                accessibilityLabel={t.drawer.aria.pomodoroSwitch}
                onPress={onTogglePomodoro}
                style={({ pressed }) => [
                  styles.settingRow,
                  { borderBottomColor: colors.hairline, marginTop: 4 },
                  pressed && styles.itemPressed,
                ]}
              >
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingValue, { color: colors.primary }]}>
                    {t.drawer.sections.pomodoroTitle}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                    {t.drawer.sections.pomodoroSubtitle}
                  </Text>
                </View>
                <View pointerEvents="none">
                  <ModernSwitch
                    value={pomodoroEnabled}
                    onValueChange={() => {}}
                    checkedBg={colors.accent}
                    uncheckedBg={colors.hairline}
                    crossColor={colors.muted}
                    checkmarkColor="#FFFFFF"
                    accessibilityLabel={t.drawer.aria.pomodoroSwitch}
                  />
                </View>
              </Pressable>

              {/* Pomodoro Frameless Rhythm Configuration (Apple Pro Minimalist) */}
              {pomodoroEnabled && (
                <View style={styles.pomodoroFramelessContainer}>
                  {/* Rhythm Cadence Summary Block (Swiss Minimalist Metric Triad) */}
                  <View style={[styles.rhythmCadenceRow, { borderBottomColor: colors.hairline }]}>
                    <View style={styles.rhythmCadenceCol}>
                      <Text style={[styles.rhythmCadenceLabel, { color: colors.muted }]}>
                        {t.drawer.sections.pomodoroPlan.focusLabel}
                      </Text>
                      <View style={styles.rhythmValueInline}>
                        <Text style={[styles.rhythmCadenceNumber, { color: colors.primary }]}>
                          {pomodoroFocusMinutes}
                        </Text>
                        <Text style={[styles.rhythmCadenceUnit, { color: colors.secondary }]}>
                          {t.common.minuteShort}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.rhythmCadenceDivider, { backgroundColor: colors.hairline }]} />

                    <View style={styles.rhythmCadenceCol}>
                      <Text style={[styles.rhythmCadenceLabel, { color: colors.muted }]}>
                        {t.drawer.sections.pomodoroPlan.shortBreakLabel}
                      </Text>
                      <View style={styles.rhythmValueInline}>
                        <Text style={[styles.rhythmCadenceNumber, { color: colors.accent }]}>
                          {pomodoroShortBreakMinutes}
                        </Text>
                        <Text style={[styles.rhythmCadenceUnit, { color: colors.secondary }]}>
                          {t.common.minuteShort}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.rhythmCadenceDivider, { backgroundColor: colors.hairline }]} />

                    <View style={styles.rhythmCadenceCol}>
                      <Text style={[styles.rhythmCadenceLabel, { color: colors.muted }]}>
                        {t.drawer.sections.pomodoroPlan.longBreakLabel}
                      </Text>
                      <View style={styles.rhythmValueInline}>
                        <Text style={[styles.rhythmCadenceNumber, { color: colors.primary }]}>
                          {pomodoroLongBreakMinutes}
                        </Text>
                        <Text style={[styles.rhythmCadenceUnit, { color: colors.secondary }]}>
                          {t.common.minuteShort}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Interactive Rhythm Option Wheel (Apple Aperture Tuner) */}
                  <RhythmOptionWheel
                    presets={rhythmPresets}
                    selectedPresetId={activePresetId}
                    onSelect={(preset) =>
                      onSelectPomodoroPreset?.(preset.focus, preset.shortM, preset.longM)
                    }
                    colors={colors}
                  />

                  {/* Short Break Setting Row */}
                  <View style={[styles.settingRow, { borderBottomColor: colors.hairline }]}>
                    <View style={styles.settingTextGroup}>
                      <Text style={[styles.settingValue, { color: colors.primary }]}>
                        {t.drawer.sections.pomodoroPlan.shortBreakSelect}
                      </Text>
                      <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                        {language === 'tr' ? 'Seanslar arası dinlenme' : 'Interval rest'}
                      </Text>
                    </View>
                    <View style={styles.inlinePresetPillRow}>
                      {[3, 5, 10].map((mins) => {
                        const isSel = pomodoroShortBreakMinutes === mins;
                        return (
                          <Pressable
                            key={mins}
                            accessibilityRole="button"
                            accessibilityLabel={`${mins} ${t.common.minuteShort}`}
                            onPress={() => onSelectShortBreak?.(mins)}
                            style={({ pressed }) => [
                              styles.inlineUnderlinePreset,
                              { borderBottomColor: isSel ? colors.accent : colors.hairline },
                              pressed && styles.itemPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.inlineUnderlinePresetText,
                                { color: isSel ? colors.primary : colors.muted },
                              ]}
                            >
                              {mins} {t.common.minuteShort}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Long Break Setting Row */}
                  <View style={[styles.settingRow, { borderBottomColor: colors.hairline }]}>
                    <View style={styles.settingTextGroup}>
                      <Text style={[styles.settingValue, { color: colors.primary }]}>
                        {t.drawer.sections.pomodoroPlan.longBreakSelect}
                      </Text>
                      <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                        {language === 'tr' ? '4 seans sonrası uzun dinlenme' : 'Rest after 4 cycles'}
                      </Text>
                    </View>
                    <View style={styles.inlinePresetPillRow}>
                      {[10, 15, 20].map((mins) => {
                        const isSel = pomodoroLongBreakMinutes === mins;
                        return (
                          <Pressable
                            key={mins}
                            accessibilityRole="button"
                            accessibilityLabel={`${mins} ${t.common.minuteShort}`}
                            onPress={() => onSelectLongBreak?.(mins)}
                            style={({ pressed }) => [
                              styles.inlineUnderlinePreset,
                              { borderBottomColor: isSel ? colors.accent : colors.hairline },
                              pressed && styles.itemPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.inlineUnderlinePresetText,
                                { color: isSel ? colors.primary : colors.muted },
                              ]}
                            >
                              {mins} {t.common.minuteShort}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Rhythm Footnote */}
                  <Text style={[styles.rhythmFootnote, { color: colors.muted }]}>
                    {t.drawer.sections.pomodoroPlan.cycleExplanation(4, pomodoroLongBreakMinutes)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeIndex === 3 && (
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

          {activeIndex === 4 && (
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

          {activeIndex === 5 && (
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

              <Pressable
                accessible
                accessibilityRole="switch"
                accessibilityState={{ checked: flipToFocus }}
                accessibilityLabel={t.drawer.aria.flipToFocusSwitch}
                onPress={onToggleFlipToFocus}
                style={({ pressed }) => [
                  styles.settingRow,
                  { borderBottomColor: colors.hairline, marginTop: 12 },
                  pressed && styles.itemPressed,
                ]}
              >
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingValue, { color: colors.primary }]}>{t.drawer.sections.flipToFocusTitle}</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{t.drawer.sections.flipToFocusSubtitle}</Text>
                </View>
                <View pointerEvents="none">
                  <ModernSwitch
                    value={flipToFocus}
                    onValueChange={() => {}}
                    checkedBg={colors.accent}
                    uncheckedBg={colors.hairline}
                    crossColor={colors.muted}
                    checkmarkColor="#FFFFFF"
                    accessibilityLabel={t.drawer.aria.flipToFocusSwitch}
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

              {/* Sound Palette Selector (Apple iOS Settings Clean List) */}
              {soundEnabled && (
                <View style={styles.toneSectionContainer}>
                  <View style={styles.toneSectionHeaderRow}>
                    <Text style={[styles.toneSectionHeader, { color: colors.muted }]}>
                      {t.drawer.sections.soundAlertTone.toUpperCase()}
                    </Text>
                  </View>

                  {(['crystal', 'aurora', 'clarity', 'tibetan', 'mechanical'] as const).map((toneKey) => {
                    const isSelected = soundAlertTone === toneKey;
                    const label = t.drawer.sections.soundTones[toneKey];
                    return (
                      <Pressable
                        key={toneKey}
                        accessibilityRole="button"
                        accessibilityLabel={`${label} ${t.drawer.aria.soundToneSelect}`}
                        onPress={() => onSelectSoundTone(toneKey)}
                        style={({ pressed }) => [
                          styles.settingRow,
                          { borderBottomColor: colors.hairline },
                          pressed && styles.itemPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.settingValue,
                            {
                              color: isSelected ? colors.primary : colors.secondary,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {label}
                        </Text>

                        {isSelected ? (
                          <View style={styles.toneCheckmarkWrapper}>
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M5 13l4 4L19 7"
                                stroke={colors.accent}
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        ) : (
                          <View style={styles.toneCheckmarkPlaceholder} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Ambient Soundscapes Selector (Apple iOS Background Sounds style) */}
              {soundEnabled && (
                <View style={[styles.toneSectionContainer, { marginTop: 24 }]}>
                  <View style={styles.toneSectionHeaderRow}>
                    <Text style={[styles.toneSectionHeader, { color: colors.muted }]}>
                      {t.drawer.sections.ambientSoundTitle.toUpperCase()}
                    </Text>
                  </View>

                  {(['none', 'brown', 'rain', 'storm', 'ocean'] as const).map((soundKey) => {
                    const isSelected = ambientSound === soundKey;
                    const label = t.drawer.sections.ambientSounds[soundKey];

                    return (
                      <Pressable
                        key={soundKey}
                        accessibilityRole="button"
                        accessibilityLabel={`${label} ${t.drawer.aria.soundToneSelect}`}
                        onPress={() => onSelectAmbientSound?.(soundKey)}
                        style={({ pressed }) => [
                          styles.settingRow,
                          { borderBottomColor: colors.hairline },
                          pressed && styles.itemPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.settingValue,
                            {
                              color: isSelected ? colors.primary : colors.secondary,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {label}
                        </Text>

                        {isSelected ? (
                          <View style={styles.toneCheckmarkWrapper}>
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M5 13l4 4L19 7"
                                stroke={colors.accent}
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        ) : (
                          <View style={styles.toneCheckmarkPlaceholder} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {activeIndex === 7 && (
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
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
    </>
  );
});

FocusDrawer.displayName = 'FocusDrawer';

const styles = StyleSheet.create({
  scrim: {
    zIndex: 4,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerScrollContent: {
    flexGrow: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  drawerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerLogo: {
    width: 32,
    height: 32,
  },
  drawerTitle: {
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
  summaryBlock: {
    alignItems: 'baseline',
    gap: 6,
    flexDirection: 'row',
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
  weeklyRhythmContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 58,
  },
  weekdayCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    height: 38,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  weekdayText: {
    fontFamily: 'System',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  settingRow: {
    minHeight: 56,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  settingValue: {
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
  itemPressed: {
    opacity: 0.55,
  },
  pomodoroActiveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  pomodoroActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pomodoroActiveText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  durationListHeaderRow: {
    paddingTop: 20,
    paddingBottom: 6,
  },
  durationListHeader: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInputBox: {
    width: 58,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  customInputUnitText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
  },
  pomodoroFramelessContainer: {
    marginTop: 8,
  },
  rhythmCadenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  rhythmCadenceCol: {
    flex: 1,
    alignItems: 'center',
  },
  rhythmCadenceLabel: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  rhythmValueInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  rhythmCadenceNumber: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  rhythmCadenceUnit: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
  },
  rhythmCadenceDivider: {
    width: 1,
    height: 34,
  },
  inlinePresetPillRow: {
    flexDirection: 'row',
    gap: 14,
  },
  inlineUnderlinePreset: {
    minWidth: 32,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    alignItems: 'center',
  },
  inlineUnderlinePresetText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
  },
  rhythmFootnote: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginTop: 12,
    lineHeight: 16,
  },
  toneSectionContainer: {
    marginTop: 18,
  },
  toneSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toneSectionHeader: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  toneSectionSubheader: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
  },
  toneCheckmarkWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneCheckmarkPlaceholder: {
    width: 28,
    height: 28,
  },
  emptyStateBanner: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '400',
  },
});
