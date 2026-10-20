import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export const AppleCtaButton: React.FC<Props> = React.memo(
  function AppleCtaButton({ label, onPress, accessibilityLabel }) {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.97, { damping: 14, stiffness: 350 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 14, stiffness: 300 });
    }, [scale]);

    const handlePress = useCallback(() => {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // safe fallback
      }
      onPress();
    }, [onPress]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || label}
          style={styles.button}
        >
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
  },
  button: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#000000',
  },
});
