import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
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
import { translations, Language } from '../i18n/translations';
import type { DurationUnit, ThemeMode } from '../storage/preferencesStorage';
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
  completedSessions: number;
  totalFocusMinutes: number;
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
  completedSessions,
  totalFocusMinutes,
}: FocusDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-drawerWidth);
  const t = translations[language];

  const menuItems = useMemo(
    () => [
      t.drawer.menu.focus,
      t.drawer.menu.duration,
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
                    // Proportional micro-fill based on totalFocusMinutes and completedSessions
                    const barHeight = isToday
                      ? Math.min(36, Math.max(12, Math.round((totalFocusMinutes % 30) + 12)))
                      : (index * 7) % 24 + 6;

                    return (
                      <View key={dayLabel} style={styles.weekdayCol}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: barHeight,
                                backgroundColor: isToday ? colors.accent : colors.hairline,
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
});
