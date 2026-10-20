import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { playTickSound } from '../../audio/soundEngine';

type Props = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
  isLast?: boolean;
};

export const MinimalToggleRow: React.FC<Props> = React.memo(
  function MinimalToggleRow({
    title,
    subtitle,
    value,
    onValueChange,
    hapticsEnabled = true,
    soundEnabled = true,
    isLast = false,
  }) {
    const handleToggle = useCallback(() => {
      const next = !value;
      if (hapticsEnabled) {
        try {
          void Haptics.selectionAsync();
        } catch {
          // safe fallback
        }
      }
      if (soundEnabled) {
        void playTickSound();
      }
      onValueChange(next);
    }, [hapticsEnabled, onValueChange, soundEnabled, value]);

    const trackAnimStyle = useAnimatedStyle(() => ({
      backgroundColor: withSpring(value ? '#0A84FF' : '#27272A', {
        damping: 18,
        stiffness: 240,
      }),
    }), [value]);

    const thumbAnimStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: withSpring(value ? 20 : 0, {
            damping: 18,
            stiffness: 280,
          }),
        },
      ],
    }), [value]);

    return (
      <Pressable
        onPress={handleToggle}
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{ checked: value }}
        style={[styles.row, !isLast && styles.rowBorder]}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Custom Apple-Pro Tactile Switch Track */}
        <Animated.View style={[styles.switchTrack, trackAnimStyle]}>
          <Animated.View style={[styles.switchThumb, thumbAnimStyle]} />
        </Animated.View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    width: '100%',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
    lineHeight: 16,
  },
  switchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
});
