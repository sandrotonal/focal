import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { AppColors } from './types';

type Props = {
  colors: AppColors;
  scrollX: SharedValue<number>;
  width: number;
};

export const AmbientGlow: React.FC<Props> = ({ colors, scrollX, width }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const orb1Style = useAnimatedStyle(() => {
    const page = scrollX.value / width;
    const translateY = interpolate(page, [0, 1, 2, 3], [-30, 15, -15, 0]);
    const translateX = interpolate(page, [0, 1, 2, 3], [0, 25, -25, 5]);
    const scale = interpolate(pulse.value, [0, 1], [0.95, 1.05]);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Primary Subtle Ambient Aura */}
      <Animated.View
        style={[
          styles.ambientCore,
          {
            top: '12%',
            alignSelf: 'center',
            backgroundColor: colors.accent,
            opacity: 0.08,
          },
          orb1Style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ambientCore: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});
