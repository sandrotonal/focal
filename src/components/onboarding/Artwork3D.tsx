import React, { useEffect } from 'react';
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

// ==========================================
// 1. SLIDE 1: 3D PRECISION KINETIC GYROSCOPE
// ==========================================
export const ArtworkFocusCore3D: React.FC<{
  colors: AppColors;
  scrollX: SharedValue<number>;
  width: number;
  reducedMotion: boolean;
}> = ({ colors, scrollX, width, reducedMotion }) => {
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
        <Text style={[styles.telemetryTag, { color: colors.muted }]}>CALIBRATED // 0MS</Text>
      </Animated.View>
    </View>
  );
};

// ==========================================
// 2. SLIDE 2: MINIMALIST PRECISION RHYTHM SELECTOR
// ==========================================
export const RHYTHM_OPTIONS: RhythmOption[] = [
  { minutes: 25, label: 'Pomodoro', tag: '01', subtitle: 'Kısa sprint & yüksek momentum' },
  { minutes: 45, label: 'Deep Work', tag: '02', subtitle: 'Yoğun zihinsel odak' },
  { minutes: 60, label: 'Flow State', tag: '03', subtitle: 'Kesintisiz tek blok' },
  { minutes: 90, label: 'Ultra Sprint', tag: '04', subtitle: 'Maksimum dayanıklılık seansı' },
];

export const ArtworkRhythmPicker: React.FC<{
  colors: AppColors;
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  hapticsEnabled: boolean;
}> = ({ colors, selectedMinutes, onSelect, hapticsEnabled }) => {
  return (
    <View style={styles.rhythmList}>
      {RHYTHM_OPTIONS.map((item) => {
        const isSelected = selectedMinutes === item.minutes;
        return (
          <Pressable
            key={item.minutes}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${item.label} ${item.minutes} dakika`}
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
                DK
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
};

// ==========================================
// 3. SLIDE 3: SWISS MINIMALIST SENSORY SETTINGS
// ==========================================
export const ArtworkSensorySettings: React.FC<{
  colors: AppColors;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  onToggleNotifications: () => void;
  onToggleHaptics: () => void;
}> = ({
  colors,
  notificationsEnabled,
  hapticsEnabled,
  onToggleNotifications,
  onToggleHaptics,
}) => {
    return (
      <View style={styles.sensoryList}>
        {/* Notification Row */}
        <Pressable
          accessible
          accessibilityRole="switch"
          accessibilityState={{ checked: notificationsEnabled }}
          accessibilityLabel="Bitiş bildirimi anahtarı"
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
              Bitiş Bildirimi
            </Text>
            <Text style={[styles.sensoryCaption, { color: colors.muted }]}>
              Zaman dolduğunda sessiz ve odak bozmayan sesli tetikleyici
            </Text>
          </View>

          <View pointerEvents="none">
            <ModernSwitch
              value={notificationsEnabled}
              onValueChange={() => { }}
              checkedBg={colors.accent}
              uncheckedBg={`${colors.hairline}90`}
              accessibilityLabel="Bitiş bildirimi anahtarı"
            />
          </View>
        </Pressable>

        {/* Haptics Row */}
        <Pressable
          accessible
          accessibilityRole="switch"
          accessibilityState={{ checked: hapticsEnabled }}
          accessibilityLabel="Dokunsal haptik anahtarı"
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
              Haptik Dokunuş
            </Text>
            <Text style={[styles.sensoryCaption, { color: colors.muted }]}>
              Başlangıç, dokunuş ve bitişlerde Apple Taptic titreşimi
            </Text>
          </View>

          <View pointerEvents="none">
            <ModernSwitch
              value={hapticsEnabled}
              onValueChange={() => { }}
              checkedBg={colors.accent}
              uncheckedBg={`${colors.hairline}90`}
              accessibilityLabel="Dokunsal haptik anahtarı"
            />
          </View>
        </Pressable>
      </View>
    );
  };

// ==========================================
// 4. SLIDE 4: THE LAUNCHPAD MONOLITH (ZERO EMOJI, ARCHITECTURAL)
// ==========================================
export const ArtworkLaunchpad: React.FC<{
  colors: AppColors;
  sessionMinutes: number;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
}> = ({ colors, sessionMinutes, notificationsEnabled, hapticsEnabled }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const radarStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.96, 1.04]);
    const opacity = interpolate(pulse.value, [0, 1], [0.3, 0.7]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.launchpadStage}>
      <Animated.View
        style={[
          styles.radarRing,
          { borderColor: colors.accent },
          radarStyle,
        ]}
      />

      <View style={styles.readoutGroup}>
        <View style={styles.readoutHeader}>
          <Text style={[styles.readoutSystem, { color: colors.accent }]}>
            SYSTEM // FOCUS ENGINE
          </Text>
          <Text style={[styles.readoutStatus, { color: colors.muted }]}>READY</Text>
        </View>

        <View style={[styles.readoutDivider, { backgroundColor: `${colors.hairline}60` }]} />

        <View style={styles.telemetryRow}>
          <Text style={[styles.telemetryKey, { color: colors.muted }]}>SEANS SÜRESİ</Text>
          <Text style={[styles.telemetryValue, { color: colors.primary }]}>
            {sessionMinutes} DAKİKA
          </Text>
        </View>

        <View style={styles.telemetryRow}>
          <Text style={[styles.telemetryKey, { color: colors.muted }]}>BİLDİRİM</Text>
          <Text style={[styles.telemetryValue, { color: colors.primary }]}>
            {notificationsEnabled ? 'DEVREDE' : 'SESSİZ'}
          </Text>
        </View>

        <View style={styles.telemetryRow}>
          <Text style={[styles.telemetryKey, { color: colors.muted }]}>HAPTİK GERİ BİLDİRİM</Text>
          <Text style={[styles.telemetryValue, { color: colors.primary }]}>
            {hapticsEnabled ? 'AKTİF' : 'KAPALI'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Slide 1
  gyroStage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  wireRingLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
  },
  wireRingMedium: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
  },
  wireRingSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
  },
  centerMonolith: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 4,
  },
  digitalNumeral: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
  },
  telemetryTag: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 6,
  },

  // Slide 2: Rhythm List (Swiss Minimalist, No Card Boxes)
  rhythmList: {
    width: '100%',
    marginVertical: 12,
  },
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
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
    fontSize: 16,
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
    marginVertical: 16,
  },
  sensoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  sensoryTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  sensoryHeader: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sensoryCaption: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  iosSwitchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  iosSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  // Slide 4: Launchpad
  launchpadStage: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 14,
  },
  radarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    position: 'absolute',
    top: -20,
  },
  readoutGroup: {
    width: '100%',
    paddingTop: 40,
  },
  readoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readoutSystem: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  readoutStatus: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  readoutDivider: {
    height: 1,
    marginVertical: 14,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  telemetryKey: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
