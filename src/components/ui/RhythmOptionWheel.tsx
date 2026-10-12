import React, { useCallback, useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { playTickSound } from '../../audio/soundEngine';
import type { AppColors } from '../../theme/colors';

export type RhythmPreset = {
  id: string;
  name: string;
  focus: number;
  shortM: number;
  longM: number;
  ratio: string;
};

export type RhythmOptionWheelProps = {
  presets: RhythmPreset[];
  selectedPresetId: string;
  onSelect: (preset: RhythmPreset) => void;
  colors: AppColors;
};

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const RhythmOptionWheel: React.FC<RhythmOptionWheelProps> = React.memo(
  function RhythmOptionWheel({ presets, selectedPresetId, onSelect, colors }) {
    const scrollViewRef = useRef<ScrollView>(null);
    const lastSelectedIndexRef = useRef<number>(-1);
    const isUserScrollingRef = useRef<boolean>(false);

    const selectedIndex = Math.max(
      0,
      presets.findIndex((p) => p.id === selectedPresetId)
    );

    // Initial scroll positioning
    useEffect(() => {
      if (selectedIndex >= 0 && !isUserScrollingRef.current) {
        lastSelectedIndexRef.current = selectedIndex;
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }, [selectedIndex]);

    const handleMomentumScrollEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(presets.length - 1, index));

        if (clampedIndex !== lastSelectedIndexRef.current) {
          lastSelectedIndexRef.current = clampedIndex;
          const target = presets[clampedIndex];
          if (target) {
            void Haptics.selectionAsync().catch(() => {});
            void playTickSound();
            onSelect(target);
          }
        }
        isUserScrollingRef.current = false;
      },
      [presets, onSelect]
    );

    const handleScrollEndDrag = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.1) {
          const offsetY = e.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / ITEM_HEIGHT);
          const clampedIndex = Math.max(0, Math.min(presets.length - 1, index));
          scrollViewRef.current?.scrollTo({
            y: clampedIndex * ITEM_HEIGHT,
            animated: true,
          });
          if (clampedIndex !== lastSelectedIndexRef.current) {
            lastSelectedIndexRef.current = clampedIndex;
            const target = presets[clampedIndex];
            if (target) {
              void Haptics.selectionAsync().catch(() => {});
              void playTickSound();
              onSelect(target);
            }
          }
          isUserScrollingRef.current = false;
        }
      },
      [presets, onSelect]
    );

    const handleScrollBegin = useCallback(() => {
      isUserScrollingRef.current = true;
    }, []);

    const handleItemPress = useCallback(
      (index: number) => {
        lastSelectedIndexRef.current = index;
        const target = presets[index];
        if (target) {
          void Haptics.selectionAsync().catch(() => {});
          void playTickSound();
          onSelect(target);
        }
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      },
      [presets, onSelect]
    );

    return (
      <View style={styles.wheelContainer}>
        {/* Apple / Swiss Aperture Guide Lines */}
        <View
          pointerEvents="none"
          style={[
            styles.apertureGuideTop,
            { backgroundColor: colors.hairline },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.apertureGuideBottom,
            { backgroundColor: colors.hairline },
          ]}
        />

        {/* Active Slot Left Aperture Accent Notch */}
        <View
          pointerEvents="none"
          style={[
            styles.apertureActiveNotch,
            { backgroundColor: colors.accent },
          ]}
        />

        {/* Active Slot Aperture Backdrop */}
        <View
          pointerEvents="none"
          style={[
            styles.apertureBackdrop,
            { backgroundColor: colors.accent, opacity: 0.04 },
          ]}
        />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={true}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top spacer */}
          <View style={{ height: ITEM_HEIGHT }} />

          {presets.map((preset, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityLabel={`${preset.name} ${preset.ratio}`}
                onPress={() => handleItemPress(index)}
                style={styles.itemRow}
              >
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemRatio,
                      {
                        color: isSelected ? colors.primary : colors.muted,
                        fontSize: isSelected ? 21 : 16,
                        fontWeight: isSelected ? '700' : '400',
                        opacity: isSelected ? 1 : 0.45,
                      },
                    ]}
                  >
                    {preset.ratio}
                  </Text>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: isSelected ? colors.accent : colors.muted,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: isSelected ? 12 : 11,
                        opacity: isSelected ? 1 : 0.4,
                      },
                    ]}
                  >
                    {preset.name.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* Bottom spacer */}
          <View style={{ height: ITEM_HEIGHT }} />
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wheelContainer: {
    height: WHEEL_HEIGHT,
    position: 'relative',
    marginVertical: 8,
    overflow: 'hidden',
  },
  apertureGuideTop: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: StyleSheet.hairlineWidth,
    zIndex: 2,
    opacity: 0.8,
  },
  apertureGuideBottom: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: StyleSheet.hairlineWidth,
    zIndex: 2,
    opacity: 0.8,
  },
  apertureActiveNotch: {
    position: 'absolute',
    top: ITEM_HEIGHT + 14,
    left: 0,
    width: 2.5,
    height: 22,
    borderRadius: 1.5,
    zIndex: 3,
  },
  apertureBackdrop: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    zIndex: 1,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  itemRow: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  itemRatio: {
    letterSpacing: -0.3,
  },
  itemName: {
    letterSpacing: 1.2,
  },
});
