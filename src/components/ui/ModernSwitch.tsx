import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export interface ModernSwitchProps {
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  checkedBg?: string;
  uncheckedBg?: string;
  crossColor?: string;
  checkmarkColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

const SWITCH_WIDTH = 46;
const SWITCH_HEIGHT = 24;
const CIRCLE_DIAMETER = 18;
const OFFSET = (SWITCH_HEIGHT - CIRCLE_DIAMETER) / 2; // 3px
const TRAVEL_DISTANCE = SWITCH_WIDTH - CIRCLE_DIAMETER - OFFSET * 2; // 22px
const EFFECT_WIDTH = CIRCLE_DIAMETER / 2; // 9px
const EFFECT_HEIGHT = EFFECT_WIDTH / 2 - 1; // 3.5px

export const ModernSwitch: React.FC<ModernSwitchProps> = React.memo(({
  value,
  onValueChange,
  checkedBg = '#00DA50',
  uncheckedBg = '#838383',
  crossColor,
  checkmarkColor,
  accessibilityLabel = 'Seçenek anahtarı',
  disabled = false,
}) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 16,
      stiffness: 260,
      mass: 0.65,
    });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [uncheckedBg, checkedBg]
    );
    return {
      backgroundColor,
    };
  });

  const thumbTranslateStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, TRAVEL_DISTANCE]);
    return {
      transform: [{ translateX }],
    };
  });

  const crossStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.4, 1], [1, 0, 0]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [1, 0, 0]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Pressable
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={styles.touchArea}
    >
      <Animated.View style={[styles.slider, trackStyle]}>
        {/* Subtle effect pill line */}
        <Animated.View style={[styles.effectLine, thumbTranslateStyle]} />

        {/* Moving circle thumb */}
        <Animated.View style={[styles.circle, thumbTranslateStyle]}>
          {/* OFF state: Cross SVG */}
          <Animated.View style={[styles.iconContainer, crossStyle]}>
            <Svg height={7} width={7} viewBox="0 0 365.696 365.696">
              <Path
                fill={crossColor ?? uncheckedBg}
                d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0"
              />
            </Svg>
          </Animated.View>

          {/* ON state: Checkmark SVG */}
          <Animated.View style={[styles.iconContainer, checkmarkStyle]}>
            <Svg height={10} width={10} viewBox="0 0 24 24">
              <Path
                fill={checkmarkColor ?? checkedBg}
                d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  touchArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    position: 'relative',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: OFFSET,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2.2,
    elevation: 3,
  },
  effectLine: {
    position: 'absolute',
    width: EFFECT_WIDTH,
    height: EFFECT_HEIGHT,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    left: OFFSET + EFFECT_WIDTH / 2,
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
