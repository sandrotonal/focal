import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type Props = {
  currentStep: number;
  totalSteps: number;
  scrollX?: SharedValue<number>;
  width?: number;
};

export const DynamicPillIndicator: React.FC<Props> = React.memo(
  function DynamicPillIndicator({ currentStep, totalSteps, scrollX, width = 375 }) {
    const dots = Array.from({ length: totalSteps }, (_, i) => i);

    return (
      <View style={styles.container}>
        {dots.map((index) => (
          <IndicatorDot
            key={index}
            index={index}
            isActive={index === currentStep}
            scrollX={scrollX}
            width={width}
          />
        ))}
      </View>
    );
  }
);

type DotProps = {
  index: number;
  isActive: boolean;
  scrollX?: SharedValue<number>;
  width: number;
};

const IndicatorDot: React.FC<DotProps> = React.memo(function IndicatorDot({
  index,
  isActive,
  scrollX,
  width,
}) {
  const dotAnimStyle = useAnimatedStyle(() => {
    if (!scrollX || width <= 0) {
      return {
        width: isActive ? 22 : 6,
        backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
      };
    }

    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [6, 22, 6],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.25, 1, 0.25],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      backgroundColor: '#FFFFFF',
      opacity,
    };
  }, [index, isActive, scrollX, width]);

  return <Animated.View style={[styles.dot, dotAnimStyle]} />;
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
