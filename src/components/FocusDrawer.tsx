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
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineSidebar } from './LineSidebar';
import { ModernSwitch } from './ui/ModernSwitch';
import { RhythmOptionWheel, type RhythmPreset } from './ui/RhythmOptionWheel';
import Svg, { Path } from 'react-native-svg';
import { translations, Language } from '../i18n/translations';
import type { DurationUnit, SoundAlertTone, ThemeMode } from '../storage/preferencesStorage';
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
            </View>
          )}

          {activeIndex !== 0 && <View style={[styles.drawerRule, { backgroundColor: colors.hairline }]} />}

          {activeIndex === 1 && (
            <View style={styles.drawerSection}>
              {/* Unit Selector: Dakika / Saniye */}
              <View style={[styles.unitSelectorRow, { borderColor: colors.hairline, backgroundColor: colors.background }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.drawer.sections.unitMinutes}
                  onPress={() => onChangeDurationUnit('minutes')}
                  style={[
                    styles.unitTab,
                    durationUnit === 'minutes' && { backgroundColor: colors.panel, borderColor: colors.accent, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: durationUnit === 'minutes' ? colors.primary : colors.muted },
                    ]}
                  >
                    {t.drawer.sections.unitMinutes.toUpperCase()}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.drawer.sections.unitSeconds}
                  onPress={() => onChangeDurationUnit('seconds')}
                  style={[
                    styles.unitTab,
                    durationUnit === 'seconds' && { backgroundColor: colors.panel, borderColor: colors.accent, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitTabText,
                      { color: durationUnit === 'seconds' ? colors.primary : colors.muted },
                    ]}
                  >
                    {t.drawer.sections.unitSeconds.toUpperCase()}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.durationEditor}>
                <TextInput
                  accessibilityLabel={t.drawer.sections.focusDuration}
                  keyboardType="number-pad"
                  maxLength={4}
                  onBlur={onCommitDuration}
                  onChangeText={onDurationDraftChange}
                  onSubmitEditing={onCommitDuration}
                  returnKeyType="done"
                  selectTextOnFocus
                  style={[styles.durationInput, { color: colors.primary, borderBottomColor: colors.hairline }]}
                  value={durationDraft}
                />
                <Text style={[styles.durationUnit, { color: colors.secondary }]}>
                  {durationUnit === 'seconds' ? t.common.secondShort : t.common.minuteShort}
                </Text>
              </View>

              <View style={styles.presetRow}>
                {(durationUnit === 'seconds' ? SESSION_OPTIONS_SECONDS : SESSION_OPTIONS_MINUTES).map((option) => {
                  const isSelected = durationUnit === 'seconds' ? option === sessionSeconds : option === sessionMinutes;
                  const unitLabel = durationUnit === 'seconds' ? t.common.secondShort : t.common.minuteShort;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`${option} ${unitLabel}`}
                      onPress={() => onSelectPreset(option)}
                      style={({ pressed }) => [
                        styles.preset,
                        { borderBottomColor: isSelected ? colors.accent : colors.hairline },
                        pressed && styles.itemPressed,
                      ]}
                    >
                      <Text style={[styles.presetText, { color: isSelected ? colors.primary : colors.secondary }]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
                              {mins}m
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
                              {mins}m
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

              {/* Sound Palette Selector (Apple iOS Settings Clean List) */}
              {soundEnabled && (
                <View style={styles.toneSectionContainer}>
                  <View style={styles.toneSectionHeaderRow}>
                    <Text style={[styles.toneSectionHeader, { color: colors.muted }]}>
                      {t.drawer.sections.soundAlertTone.toUpperCase()}
                    </Text>
                    <Text style={[styles.toneSectionSubheader, { color: colors.muted }]}>
                      {t.drawer.sections.soundAlertToneSubtitle}
                    </Text>
                  </View>

                  {(['crystal', 'aurora', 'clarity', 'tibetan', 'mechanical'] as const).map((toneKey) => {
                    const isSelected = soundAlertTone === toneKey;
                    const label = t.drawer.sections.soundTones[toneKey];
                    const subtitle = t.drawer.sections.soundToneSubtitles[toneKey];
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
                            {label}
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
  unitSelectorRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginBottom: 8,
    gap: 4,
  },
  unitTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitTabText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
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
  framelessRhythmRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  framelessRhythmCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  framelessRhythmRatio: {
    fontFamily: 'System',
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  framelessRhythmName: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  framelessRhythmIndicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
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
});
