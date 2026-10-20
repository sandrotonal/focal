import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { playTickSound } from '../../audio/soundEngine';

type Props = {
  width: number;
  height: number;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
};

export const InteractiveFocusCore: React.FC<Props> = React.memo(function InteractiveFocusCore({
  width,
  height,
  hapticsEnabled = true,
  soundEnabled = true,
}) {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);

  // Subtle continuous breathing for life & presence
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale]);

  const handlePress = useCallback(() => {
    // Tactile tap feedback
    if (hapticsEnabled) {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // safe fallback
      }
    }
    if (soundEnabled) {
      void playTickSound();
    }

    // Ripple pulse animation
    rippleScale.value = 1;
    rippleOpacity.value = 0.6;
    rippleScale.value = withTiming(1.35, { duration: 650, easing: Easing.out(Easing.quad) });
    rippleOpacity.value = withTiming(0, { duration: 650, easing: Easing.out(Easing.quad) });

    // Core bounce
    scale.value = withSequence(
      withSpring(0.96, { damping: 14, stiffness: 360 }),
      withSpring(1, { damping: 14, stiffness: 280 })
    );
  }, [hapticsEnabled, rippleOpacity, rippleScale, scale, soundEnabled]);

  const coreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const coreSize = Math.min(width * 0.72, 280);

  return (
    <View style={[styles.container, { width, height }]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Odak Çekirdeği Enstrümanı"
        accessibilityHint="Dokunarak mikro odak tepkisi alın"
        style={styles.touchArea}
      >
        {/* Expanding Ripple Ring */}
        <Animated.View
          style={[
            styles.ripple,
            { width: coreSize, height: coreSize, borderRadius: coreSize / 2 },
            rippleAnimStyle,
          ]}
        />

        {/* Central Kinetic Chronometer Core */}
        <Animated.View style={coreAnimStyle}>
          <Svg width={coreSize} height={coreSize} viewBox="0 0 280 280">
            <Defs>
              <RadialGradient id="coreAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#0A84FF" stopOpacity="0.12" />
                <Stop offset="70%" stopColor="#0A84FF" stopOpacity="0.02" />
                <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Ambient Background Aura */}
            <Circle cx="140" cy="140" r="130" fill="url(#coreAura)" />

            {/* Outer Reference Rim */}
            <Circle
              cx="140"
              cy="140"
              r="115"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />

            {/* Inner Precision Ring */}
            <Circle
              cx="140"
              cy="140"
              r="85"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.2"
              fill="none"
            />

            {/* Precision Tick Marks */}
            <Line x1="140" y1="20" x2="140" y2="30" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="140" y1="250" x2="140" y2="260" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="20" y1="140" x2="30" y2="140" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="250" y1="140" x2="260" y2="140" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" strokeLinecap="round" />

            {/* Kinetic Diagonal Orbit Arc */}
            <Circle
              cx="140"
              cy="140"
              r="100"
              stroke="#0A84FF"
              strokeWidth="1.6"
              strokeDasharray="40 160"
              strokeLinecap="round"
              fill="none"
              transform="rotate(-35 140 140)"
            />

            {/* Center Luminous Pupil */}
            <Circle cx="140" cy="140" r="5" fill="#FFFFFF" />
            <Circle cx="140" cy="140" r="12" stroke="#0A84FF" strokeWidth="1.2" fill="none" opacity={0.6} />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
  },
  touchArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#0A84FF',
  },
});
