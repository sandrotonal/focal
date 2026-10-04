import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

type Props = {
  isRunning: boolean;
  elapsedText: string;
  progress: number;
  sessionMinutes: number;
  accentColor: string;
  primaryColor: string;
  secondaryColor: string;
  mutedColor: string;
  hairlineColor: string;
  translateY: SharedValue<number>;
  reducedMotion: boolean;
};

const TICK_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => ({
  id: i,
  isMajor: i % 3 === 0,
  transform: [{ rotate: `${i * 30}deg` }, { translateY: -130 }] as const,
}));

export const MainFocus3D: React.FC<Props> = React.memo(({
  isRunning,
  elapsedText,
  progress,
  sessionMinutes,
  accentColor,
  primaryColor,
  secondaryColor,
  mutedColor,
  hairlineColor,
  translateY,
  reducedMotion,
}) => {
  const rotationZ = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    if (isRunning) {
      rotationZ.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
      pulse.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      rotationZ.value = withTiming(0, { duration: 800 });
      pulse.value = withTiming(0, { duration: 800 });
    }
  }, [isRunning, pulse, reducedMotion, rotationZ]);

  // 3D Perspective Tilt responding to touch gesture pull
  const surface3DStyle = useAnimatedStyle(() => {
    const tiltX = interpolate(translateY.value, [-100, 0, 100], [14, 0, -14]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${tiltX}deg` },
      ],
    };
  });

  const gyroRing1Style = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateZ: `${rotationZ.value}deg` },
        { rotateX: '55deg' },
      ],
    };
  });

  const gyroRing2Style = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotationZ.value * 0.7}deg` },
        { rotateZ: '-35deg' },
      ],
    };
  });

  const pulseAuraStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.98, 1.04]);
    const opacity = interpolate(pulse.value, [0, 1], [0.15, 0.45]);
    return {
      transform: [{ scale }],
      opacity: isRunning ? opacity : 0.08,
    };
  });

  return (
    <Animated.View style={[styles.container, surface3DStyle]}>
      {/* Dynamic 3D Rings */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            borderColor: `${primaryColor}15`,
            borderTopColor: isRunning ? accentColor : `${primaryColor}30`,
          },
          gyroRing1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.innerRing,
          {
            borderColor: `${primaryColor}10`,
            borderRightColor: isRunning ? accentColor : `${primaryColor}20`,
          },
          gyroRing2Style,
        ]}
      />

      {/* Subtle Aura */}
      <Animated.View
        style={[
          styles.ambientCore,
          { borderColor: accentColor },
          pulseAuraStyle,
        ]}
      />

      {/* Precision Chronometer Ticks */}
      <View style={styles.ticksContainer} pointerEvents="none">
        {TICK_ITEMS.map((item) => (
          <View
            key={item.id}
            style={[
              styles.tick,
              {
                backgroundColor: item.isMajor ? primaryColor : hairlineColor,
                opacity: item.isMajor ? 0.6 : 0.25,
                transform: item.transform,
              },
            ]}
          />
        ))}
      </View>

      {/* Central Pure Numeral & Subtle Progress */}
      <View style={styles.content}>
        <Text
          style={[styles.timerNumeral, { color: primaryColor }]}
          maxFontSizeMultiplier={1.2}
        >
          {elapsedText}
        </Text>

        {/* Minimal Progress Rail */}
        <View style={[styles.rail, { backgroundColor: hairlineColor }]}>
          <View
            style={[
              styles.railFill,
              {
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1,
  },
  innerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },
  ambientCore: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  ticksContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    width: 1.5,
    height: 8,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  telemetryHeader: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerNumeral: {
    fontFamily: 'System',
    fontSize: 64,
    fontWeight: '300',
    letterSpacing: -2,
    lineHeight: 76,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  rail: {
    width: 140,
    height: 1.5,
    marginTop: 16,
    overflow: 'hidden',
  },
  railFill: {
    height: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  statusBeacon: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
});
