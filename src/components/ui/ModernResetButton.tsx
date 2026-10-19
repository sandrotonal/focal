import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export interface ModernResetButtonProps {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  theme?: 'dark' | 'light';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BUTTON_HEIGHT = 50;
const BUTTON_COLLAPSED_WIDTH = 50;
const BUTTON_EXPANDED_WIDTH = 136;

export const ModernResetButton: React.FC<ModernResetButtonProps> = React.memo(function ModernResetButton({
  onPress,
  label = 'SIFIRLA',
  accessibilityLabel = 'Sayacı sıfırla',
  theme = 'dark',
  disabled = false,
  style,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const active = (isHovered || isPressed) && !isClosing;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isClosing) {
      progress.value = withSpring(active ? 1 : 0, {
        damping: 17,
        stiffness: 260,
        mass: 0.75,
      });
    }
  }, [active, isClosing, progress]);

  const idleBg = theme === 'dark' ? '#181A1F' : '#222224';
  const activeBg = 'rgb(255, 69, 69)';

  const animatedButtonStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [0, 1],
      [BUTTON_COLLAPSED_WIDTH, BUTTON_EXPANDED_WIDTH]
    );

    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [idleBg, activeBg]
    );

    return {
      width,
      backgroundColor,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, 10]);
    const scale = interpolate(progress.value, [0, 1], [1, 1.05]);
    const rotate = `${interpolate(progress.value, [0, 1], [0, 360])}deg`;

    return {
      transform: [{ translateY }, { scale }, { rotate }],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.4, 1], [0, 0.2, 1]);
    const translateY = interpolate(progress.value, [0, 1], [-22, 6]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleHoverIn = useCallback(() => {
    if (Platform.OS === 'web' && !disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || isClosing) {
      return;
    }
    setIsClosing(true);

    if (progress.value > 0.35) {
      // Already expanded: smoothly collapse back to 50px circle
      progress.value = withTiming(
        0,
        { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        (finished) => {
          if (finished) {
            runOnJS(onPress)();
            runOnJS(setIsClosing)(false);
          }
        }
      );
    } else {
      // Tap without hover: briefly expand and then smoothly collapse
      progress.value = withTiming(
        1,
        { duration: 160, easing: Easing.out(Easing.quad) },
        (expanded) => {
          if (expanded) {
            progress.value = withTiming(
              0,
              { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
              (finished) => {
                if (finished) {
                  runOnJS(onPress)();
                  runOnJS(setIsClosing)(false);
                }
              }
            );
          }
        }
      );
    }
  }, [disabled, isClosing, onPress, progress]);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(220)}
      style={[styles.container, style]}
    >
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled || isClosing}
        hitSlop={8}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={styles.touchTarget}
      >
        <Animated.View style={[styles.button, animatedButtonStyle]}>
          {/* Label that slides in from top */}
          <Animated.View
            pointerEvents="none"
            style={[styles.labelWrapper, animatedLabelStyle]}
          >
            <Text style={styles.labelText} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>

          {/* Elegant Apple SF Symbol counter-clockwise rewind icon */}
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M3 3v5h5"
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  labelWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});

ModernResetButton.displayName = 'ModernResetButton';

