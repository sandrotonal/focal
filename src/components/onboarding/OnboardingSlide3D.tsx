import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
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

    const opacity = interpolate(scrollX.value, inputRange, [0.2, 1, 0.2]);
    const scale = reducedMotion ? 1 : interpolate(scrollX.value, inputRange, [0.88, 1, 0.88]);
    const translateX = interpolate(scrollX.value, inputRange, [-36, 0, 36]);
    const rotateY = reducedMotion
      ? '0deg'
      : `${interpolate(scrollX.value, inputRange, [24, 0, -24])}deg`;
    const rotateZ = reducedMotion
      ? '0deg'
      : `${interpolate(scrollX.value, inputRange, [-3, 0, 3])}deg`;

    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { translateX },
        { scale },
        { rotateY },
        { rotateZ },
      ],
    };
  });

  return (
    <Animated.View style={[styles.slide, { width }, containerStyle]}>
      <View style={styles.contentWrapper}>{children}</View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
});

OnboardingSlide3D.displayName = 'OnboardingSlide3D';

