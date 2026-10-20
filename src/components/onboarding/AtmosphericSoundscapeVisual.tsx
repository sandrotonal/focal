import React, { useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { AmbientSoundType } from '../../storage/preferencesStorage';

const SOUNDSCAPE_IMAGES: Record<AmbientSoundType, number> = {
  none: require('../../../assets/onboarding/soundscape_zen.png'),
  brown: require('../../../assets/onboarding/soundscape_zen.png'),
  rain: require('../../../assets/onboarding/soundscape_rain.png'),
  storm: require('../../../assets/onboarding/soundscape_storm.png'),
  ocean: require('../../../assets/onboarding/soundscape_ocean.png'),
};

type Props = {
  ambientSound: AmbientSoundType;
  width: number;
  height: number;
};

export const AtmosphericSoundscapeVisual: React.FC<Props> = React.memo(
  function AtmosphericSoundscapeVisual({ ambientSound, width, height }) {
    const scale = useSharedValue(1);
    const breathe = useSharedValue(1);

    // Continuous subtle organic breathing for presence
    useEffect(() => {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.025, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, [breathe]);

    // Tactile pop on soundscape change
    useEffect(() => {
      scale.value = withSequence(
        withSpring(0.96, { damping: 14, stiffness: 320 }),
        withSpring(1, { damping: 16, stiffness: 260 })
      );
    }, [ambientSound, scale]);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value * breathe.value }],
    }));

    const visualSize = Math.min(width * 0.76, 280);
    const source = SOUNDSCAPE_IMAGES[ambientSound] ?? SOUNDSCAPE_IMAGES.none;

    return (
      <View style={[styles.container, { width, height }]}>
        <Animated.View
          style={[
            styles.imageWrapper,
            { width: visualSize, height: visualSize },
            animStyle,
          ]}
        >
          <Image
            source={source}
            style={styles.image}
            resizeMode="contain"
            accessible
            accessibilityLabel={`Akustik Alan: ${ambientSound}`}
          />
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
