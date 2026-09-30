import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

type LineSidebarProps = {
  items: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  colors?: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
};

const ITEM_HEIGHT = 48;

export function LineSidebar({ items, activeIndex, onSelect, colors }: LineSidebarProps) {
  const activePosition = useSharedValue(activeIndex);

  useEffect(() => {
    activePosition.value = withSpring(activeIndex, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
  }, [activeIndex, activePosition]);

  const activeMarkerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: activePosition.value * ITEM_HEIGHT }],
  }));

  return (
    <View style={styles.container} accessibilityRole="menu">
      <Animated.View
        pointerEvents="none"
        style={[styles.activeMarker, { backgroundColor: colors?.accent ?? '#8B8AF7' }, activeMarkerStyle]}
      />
      {items.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            key={item}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={styles.markerTrack}>
              <View style={[styles.marker, { backgroundColor: colors?.muted ?? '#4B4D57' }]} />
            </View>
            <Text style={[styles.index, { color: colors?.muted ?? '#747681' }, isActive && { color: colors?.primary ?? '#F5F5F7' }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text style={[styles.label, { color: colors?.secondary ?? '#B5B6BF' }, isActive && { color: colors?.primary ?? '#F5F5F7' }]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: 8,
  },
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24,
  },
  itemPressed: {
    opacity: 0.58,
  },
  markerTrack: {
    width: 48,
    marginRight: 16,
    alignItems: 'flex-start',
  },
  marker: {
    width: 24,
    height: 2,
    backgroundColor: '#4B4D57',
  },
  activeMarker: {
    position: 'absolute',
    left: 0,
    top: 31,
    width: 48,
    height: 2,
    backgroundColor: '#8B8AF7',
  },
  index: {
    width: 24,
    color: '#747681',
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
  },
  label: {
    color: '#B5B6BF',
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0,
  },
  activeText: {
    color: '#F5F5F7',
  },
});
