import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { playTickSound } from '../../audio/soundEngine';

export type CadenceOption = {
  minutes: number;
  label: string;
};

type Props = {
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  options: CadenceOption[];
  unitLabel?: string;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
};

export const CadenceSelector: React.FC<Props> = React.memo(function CadenceSelector({
  selectedMinutes,
  onSelect,
  options,
  unitLabel = 'dk',
  hapticsEnabled = true,
  soundEnabled = true,
}) {
  const handleSelect = useCallback(
    (minutes: number) => {
      if (minutes === selectedMinutes) return;
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
      onSelect(minutes);
    },
    [hapticsEnabled, onSelect, selectedMinutes, soundEnabled]
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {options.map((item) => {
          const isSelected = item.minutes === selectedMinutes;
          return (
            <Pressable
              key={item.minutes}
              onPress={() => handleSelect(item.minutes)}
              accessibilityRole="button"
              accessibilityLabel={`${item.minutes} ${unitLabel}, ${item.label}`}
              accessibilityState={{ selected: isSelected }}
              style={styles.itemTouch}
            >
              <CadenceItem
                minutes={item.minutes}
                label={item.label}
                unitLabel={unitLabel}
                isSelected={isSelected}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

type ItemProps = {
  minutes: number;
  label: string;
  unitLabel: string;
  isSelected: boolean;
};

const CadenceItem: React.FC<ItemProps> = React.memo(function CadenceItem({
  minutes,
  label,
  unitLabel,
  isSelected,
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isSelected ? 1.08 : 0.94, {
            damping: 15,
            stiffness: 280,
          }),
        },
      ],
      opacity: withSpring(isSelected ? 1 : 0.35, {
        damping: 18,
        stiffness: 220,
      }),
    };
  }, [isSelected]);

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <Text style={[styles.numberText, isSelected && styles.numberTextActive]}>
        {minutes}
      </Text>
      <Text style={[styles.unitText, isSelected && styles.unitTextActive]}>
        {unitLabel}
      </Text>
      <Text style={[styles.labelText, isSelected && styles.labelTextActive]}>
        {label}
      </Text>
      {isSelected ? (
        <View style={styles.activeDot} />
      ) : (
        <View style={styles.inactiveDotPlaceholder} />
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  itemTouch: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemContainer: {
    alignItems: 'center',
  },
  numberText: {
    fontFamily: 'System',
    fontSize: 46,
    fontWeight: '300',
    letterSpacing: -1.2,
    color: '#71717A',
    lineHeight: 50,
  },
  numberTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unitText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#71717A',
    marginTop: -2,
  },
  unitTextActive: {
    color: '#A1A1AA',
  },
  labelText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    color: '#52525B',
    marginTop: 4,
  },
  labelTextActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0A84FF',
    marginTop: 6,
  },
  inactiveDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 6,
  },
});
