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
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

export const ModernResetButton: React.FC<ModernResetButtonProps> = ({
  onPress,
  label = 'SIFIRLA',
  accessibilityLabel = 'Sayacı sıfırla',
  theme = 'dark',
  disabled = false,
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const active = isHovered || isPressed;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, {
      damping: 17,
      stiffness: 260,
      mass: 0.75,
    });
  }, [active, progress]);

  const idleBg = theme === 'dark' ? '#141414' : '#222224';
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

    return {
      transform: [{ translateY }, { scale }],
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

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, style]}
    >
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
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

          {/* Trash can SVG icon */}
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            <Svg width={13} height={15} viewBox="0 0 448 512">
              <Path
                fill="#FFFFFF"
                d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

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
