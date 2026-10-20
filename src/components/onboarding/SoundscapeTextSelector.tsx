import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { AmbientSoundType } from '../../storage/preferencesStorage';
import { previewAmbientSound, stopAmbientSound } from '../../audio/soundEngine';

export type SoundscapeOption = {
  type: AmbientSoundType;
  label: string;
};

type Props = {
  selectedSound: AmbientSoundType;
  onSelect: (sound: AmbientSoundType) => void;
  options: SoundscapeOption[];
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
};

export const SoundscapeTextSelector: React.FC<Props> = React.memo(
  function SoundscapeTextSelector({
    selectedSound,
    onSelect,
    options,
    hapticsEnabled = true,
    soundEnabled = true,
  }) {
    const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (previewTimer.current) clearTimeout(previewTimer.current);
        stopAmbientSound();
      };
    }, []);

    const handleSelect = useCallback(
      (sound: AmbientSoundType) => {
        if (sound === selectedSound) return;
        onSelect(sound);

        if (hapticsEnabled) {
          try {
            void Haptics.selectionAsync();
          } catch {
            // safe fallback
          }
        }

        if (previewTimer.current) {
          clearTimeout(previewTimer.current);
        }

        if (soundEnabled && sound !== 'none') {
          previewAmbientSound(sound);
          previewTimer.current = setTimeout(() => {
            stopAmbientSound();
          }, 1800);
        } else {
          stopAmbientSound();
        }
      },
      [hapticsEnabled, onSelect, selectedSound, soundEnabled]
    );

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          {options.map((item) => {
            const isSelected = item.type === selectedSound;
            return (
              <Pressable
                key={item.type}
                onPress={() => handleSelect(item.type)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isSelected }}
                style={styles.touchArea}
              >
                <SoundTextItem label={item.label} isSelected={isSelected} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
);

type ItemProps = {
  label: string;
  isSelected: boolean;
};

const SoundTextItem: React.FC<ItemProps> = React.memo(function SoundTextItem({
  label,
  isSelected,
}) {
  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isSelected ? 1.06 : 0.94, {
            damping: 16,
            stiffness: 280,
          }),
        },
      ],
      opacity: withSpring(isSelected ? 1 : 0.4, {
        damping: 18,
        stiffness: 240,
      }),
    };
  }, [isSelected]);

  return (
    <Animated.View style={[styles.itemWrapper, animStyle]}>
      <Text style={[styles.label, isSelected && styles.labelActive]}>
        {label}
      </Text>
      {isSelected ? (
        <View style={styles.activeDot} />
      ) : (
        <View style={styles.inactivePlaceholder} />
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
    maxWidth: 340,
  },
  touchArea: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  itemWrapper: {
    alignItems: 'center',
  },
  label: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    color: '#71717A',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0A84FF',
    marginTop: 6,
  },
  inactivePlaceholder: {
    width: 4,
    height: 4,
    marginTop: 6,
  },
});
