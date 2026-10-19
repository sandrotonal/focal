import React, { useCallback } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ApplePressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  activeOpacity?: number;
  hapticFeedback?: Haptics.ImpactFeedbackStyle | 'selection' | null;
  children?: React.ReactNode;
}

export const ApplePressable: React.FC<ApplePressableProps> = React.memo(
  function ApplePressable({
    style,
    activeScale = 0.96,
    activeOpacity = 0.88,
    hapticFeedback = Haptics.ImpactFeedbackStyle.Light,
    onPressIn,
    onPressOut,
    disabled = false,
    children,
    ...rest
  }) {
    const reducedMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = useCallback(
      (event: GestureResponderEvent) => {
        if (disabled) return;

        if (hapticFeedback && Platform.OS !== 'web') {
          try {
            if (hapticFeedback === 'selection') {
              void Haptics.selectionAsync();
            } else {
              void Haptics.impactAsync(hapticFeedback);
            }
          } catch {
            // safe fallback
          }
        }

        if (!reducedMotion) {
          scale.value = withSpring(activeScale, {
            damping: 18,
            stiffness: 420,
            mass: 0.5,
          });
          opacity.value = withSpring(activeOpacity, {
            damping: 20,
            stiffness: 400,
          });
        }

        onPressIn?.(event);
      },
      [activeOpacity, activeScale, disabled, hapticFeedback, onPressIn, opacity, reducedMotion, scale]
    );

    const handlePressOut = useCallback(
      (event: GestureResponderEvent) => {
        if (!reducedMotion) {
          scale.value = withSpring(1, {
            damping: 18,
            stiffness: 380,
            mass: 0.55,
          });
          opacity.value = withSpring(1, {
            damping: 20,
            stiffness: 380,
          });
        }
        onPressOut?.(event);
      },
      [onPressOut, opacity, reducedMotion, scale]
    );

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    return (
      <AnimatedPressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, style, animatedStyle]}
        {...rest}
      >
        {children}
      </AnimatedPressable>
    );
  }
);

ApplePressable.displayName = 'ApplePressable';

const styles = StyleSheet.create({
  base: {
    // Ensures clean layout preservation
  },
});
