import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

type Props = {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  children: React.ReactNode;
  reducedMotion: boolean;
};

export const OnboardingSlide3D: React.FC<Props> = React.memo(function OnboardingSlide3D({
  index,
  width,
  scrollX,
  children,
  reducedMotion,
}) {
  const containerStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );
    const scale = reducedMotion
      ? 1
      : interpolate(
          scrollX.value,
          inputRange,
          [0.96, 1, 0.96],
          Extrapolation.CLAMP
        );
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-16, 0, 16],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateX },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.slide, { width }, containerStyle]}>
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    overflow: 'hidden',
  },
});

OnboardingSlide3D.displayName = 'OnboardingSlide3D';
