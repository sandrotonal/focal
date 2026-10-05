import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { AppColors, RhythmOption } from './types';
import { playTickSound } from '../../audio/soundEngine';
import { ModernSwitch } from '../ui/ModernSwitch';
import { translations, Language } from '../../i18n/translations';

// ==========================================
// 1. SLIDE 1: 3D PRECISION KINETIC GYROSCOPE
// ==========================================
export const ArtworkFocusCore3D: React.FC<{
  colors: AppColors;
  language: Language;
  scrollX: SharedValue<number>;
  width: number;
  reducedMotion: boolean;
}> = React.memo(function ArtworkFocusCore3D({ colors, language, scrollX, width, reducedMotion }) {
  const t = translations[language];
  const rotationZ = useSharedValue(0);
  const rotationY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    rotationZ.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false
    );
    rotationY.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion, rotationY, rotationZ]);

  const ring1Style = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateZ: `${rotationZ.value}deg` },
        { rotateX: '65deg' },
      ],
    };
  });

  const ring2Style = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotationY.value}deg` },
        { rotateZ: '30deg' },
      ],
    };
  });

  const ring3Style = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${-rotationZ.value * 0.8}deg` },
        { rotateY: '45deg' },
      ],
    };
  });

  const centerParallax = useAnimatedStyle(() => {
    const translateX = interpolate(scrollX.value, [-width, 0, width], [-30, 0, 30]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.gyroStage}>
      {/* 3D Concentric Precision Wire Rings */}
      <Animated.View
        style={[
          styles.wireRingLarge,
          { borderColor: `${colors.primary}20`, borderTopColor: colors.accent },
          ring1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.wireRingMedium,
          { borderColor: `${colors.primary}18`, borderRightColor: colors.accent },
          ring2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.wireRingSmall,
          { borderColor: `${colors.primary}25`, borderBottomColor: `${colors.accent}80` },
          ring3Style,
        ]}
      />

      {/* Center Monolith Reading */}
      <Animated.View style={[styles.centerMonolith, centerParallax]}>
        <Text style={[styles.crosshair, { color: colors.accent }]}>+</Text>
        <Text style={[styles.digitalNumeral, { color: colors.primary }]}>25:00</Text>
        <Text style={[styles.telemetryTag, { color: colors.muted }]}>
          {t.onboarding.slide1.tag}
        </Text>
      </Animated.View>
    </View>
  );
});

// ==========================================
// 2. SLIDE 2: MINIMALIST PRECISION RHYTHM SELECTOR
// ==========================================
export const ArtworkRhythmPicker: React.FC<{
  colors: AppColors;
  language: Language;
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  hapticsEnabled: boolean;
}> = React.memo(function ArtworkRhythmPicker({ colors, language, selectedMinutes, onSelect, hapticsEnabled }) {
  const t = translations[language];

  const rhythmOptions = useMemo<RhythmOption[]>(
    () => [
      {
        minutes: 25,
        label: t.onboarding.slide2.pomodoro.label,
        tag: '01',
        subtitle: t.onboarding.slide2.pomodoro.subtitle,
      },
      {
        minutes: 45,
        label: t.onboarding.slide2.deepWork.label,
        tag: '02',
        subtitle: t.onboarding.slide2.deepWork.subtitle,
      },
      {
        minutes: 60,
        label: t.onboarding.slide2.flowState.label,
        tag: '03',
        subtitle: t.onboarding.slide2.flowState.subtitle,
      },
      {
        minutes: 90,
        label: t.onboarding.slide2.ultraSprint.label,
        tag: '04',
        subtitle: t.onboarding.slide2.ultraSprint.subtitle,
      },
    ],
    [t]
  );

  return (
    <View style={styles.rhythmList}>
      {rhythmOptions.map((item) => {
        const isSelected = selectedMinutes === item.minutes;
        return (
          <Pressable
            key={item.minutes}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${item.label} ${item.minutes} ${t.common.minuteShort}`}
            onPress={() => {
              onSelect(item.minutes);
              void playTickSound();
              if (hapticsEnabled) {
                try {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // safe fallback
                }
              }
            }}
            style={({ pressed }) => [
              styles.rhythmRow,
              {
                borderBottomColor: `${colors.hairline}50`,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.rhythmMeta}>
              <Text
                style={[
                  styles.rhythmIndex,
                  { color: isSelected ? colors.accent : colors.muted },
                ]}
              >
                {item.tag}
              </Text>
              <View>
                <Text
                  style={[
                    styles.rhythmTitle,
                    { color: isSelected ? colors.primary : colors.secondary },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={[styles.rhythmSubtitle, { color: colors.muted }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.rhythmTimeDisplay}>
              <Text
                style={[
                  styles.rhythmTimeDigits,
                  { color: isSelected ? colors.primary : colors.muted },
                ]}
              >
                {item.minutes}
              </Text>
              <Text
                style={[
                  styles.rhythmTimeLabel,
                  { color: isSelected ? colors.accent : colors.muted },
                ]}
              >
                {t.common.minuteShort.toUpperCase()}
              </Text>
              {isSelected && (
                <View style={[styles.activeAccentBar, { backgroundColor: colors.accent }]} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

// ==========================================
// 3. SLIDE 3: SWISS MINIMALIST SENSORY SETTINGS
// ==========================================
export const ArtworkSensorySettings: React.FC<{
  colors: AppColors;
  language: Language;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  onToggleNotifications: () => void;
  onToggleHaptics: () => void;
  onToggleSound: () => void;
}> = React.memo(function ArtworkSensorySettings({
  colors,
  language,
  notificationsEnabled,
  hapticsEnabled,
  soundEnabled,
  onToggleNotifications,
  onToggleHaptics,
  onToggleSound,
}) {
  const t = translations[language];

  return (
    <View style={styles.sensoryList}>
      {/* Notification Row */}
      <Pressable
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: notificationsEnabled }}
        accessibilityLabel={t.onboarding.slide3.notifications}
        onPress={() => {
          onToggleNotifications();
          void playTickSound();
          if (hapticsEnabled) {
            try {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // safe fallback
            }
          }
        }}
        style={({ pressed }) => [
          styles.sensoryRow,
          { borderBottomColor: `${colors.hairline}50`, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={styles.sensoryTextGroup}>
          <Text style={[styles.sensoryHeader, { color: colors.primary }]}>
            {t.onboarding.slide3.notifications}
          </Text>
          <Text style={[styles.sensoryCaption, { color: colors.muted }]}>
            {t.onboarding.slide3.notificationsCaption}
          </Text>
        </View>

        <View pointerEvents="none">
          <ModernSwitch
            value={notificationsEnabled}
            onValueChange={() => {}}
            checkedBg={colors.accent}
            uncheckedBg={`${colors.hairline}90`}
            crossColor={colors.muted}
            checkmarkColor="#FFFFFF"
            accessibilityLabel={t.onboarding.slide3.notifications}
          />
        </View>
      </Pressable>

      {/* Haptics Row */}
      <Pressable
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: hapticsEnabled }}
        accessibilityLabel={t.onboarding.slide3.haptics}
        onPress={() => {
          onToggleHaptics();
          void playTickSound();
          if (!hapticsEnabled) {
            try {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // safe fallback
            }
          }
        }}
        style={({ pressed }) => [
          styles.sensoryRow,
          { borderBottomColor: `${colors.hairline}50`, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={styles.sensoryTextGroup}>
          <Text style={[styles.sensoryHeader, { color: colors.primary }]}>
            {t.onboarding.slide3.haptics}
          </Text>
          <Text style={[styles.sensoryCaption, { color: colors.muted }]}>
            {t.onboarding.slide3.hapticsCaption}
          </Text>
        </View>

        <View pointerEvents="none">
          <ModernSwitch
            value={hapticsEnabled}
            onValueChange={() => {}}
            checkedBg={colors.accent}
            uncheckedBg={`${colors.hairline}90`}
            crossColor={colors.muted}
            checkmarkColor="#FFFFFF"
            accessibilityLabel={t.onboarding.slide3.haptics}
          />
        </View>
      </Pressable>

      {/* Sound Row */}
      <Pressable
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: soundEnabled }}
        accessibilityLabel={t.onboarding.slide3.sound}
        onPress={() => {
          onToggleSound();
          void playTickSound();
          if (hapticsEnabled) {
            try {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // safe fallback
            }
          }
        }}
        style={({ pressed }) => [
          styles.sensoryRow,
          { borderBottomColor: `${colors.hairline}50`, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={styles.sensoryTextGroup}>
          <Text style={[styles.sensoryHeader, { color: colors.primary }]}>
            {t.onboarding.slide3.sound}
          </Text>
          <Text style={[styles.sensoryCaption, { color: colors.muted }]}>
            {t.onboarding.slide3.soundCaption}
          </Text>
        </View>

        <View pointerEvents="none">
          <ModernSwitch
            value={soundEnabled}
            onValueChange={() => {}}
            checkedBg={colors.accent}
            uncheckedBg={`${colors.hairline}90`}
            crossColor={colors.muted}
            checkmarkColor="#FFFFFF"
            accessibilityLabel={t.onboarding.slide3.sound}
          />
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  // Slide 1: Focus Core
  gyroStage: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wireRingLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
  },
  wireRingMedium: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
  },
  wireRingSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
  },
  centerMonolith: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 4,
  },
  digitalNumeral: {
    fontFamily: 'System',
    fontSize: 38,
    fontWeight: '200',
    letterSpacing: -1,
  },
  telemetryTag: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginTop: 6,
  },

  // Slide 2: Rhythm List
  rhythmList: {
    width: '100%',
    paddingTop: 8,
  },
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rhythmMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rhythmIndex: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rhythmTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rhythmSubtitle: {
    fontFamily: 'System',
    fontSize: 12,
    marginTop: 2,
  },
  rhythmTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    position: 'relative',
    paddingBottom: 4,
    gap: 3,
  },
  rhythmTimeDigits: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  rhythmTimeLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
  },
  activeAccentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },

  // Slide 3: Sensory Settings
  sensoryList: {
    width: '100%',
    paddingTop: 12,
  },
  sensoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  sensoryTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  sensoryHeader: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sensoryCaption: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});

ArtworkFocusCore3D.displayName = 'ArtworkFocusCore3D';
ArtworkRhythmPicker.displayName = 'ArtworkRhythmPicker';
ArtworkSensorySettings.displayName = 'ArtworkSensorySettings';

