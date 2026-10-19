import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { MainFocus3D } from '../MainFocus3D';
import { ModernResetButton } from '../ui/ModernResetButton';
import type { AppColors } from '../../theme/colors';
import type { ThemeMode } from '../../storage/preferencesStorage';

const RESET_THRESHOLD = 112;
const FLICK_THRESHOLD = -56;
const FLICK_VELOCITY = -650;

function rubberBand(value: number, dimension: number, constant = 0.55) {
  'worklet';
  return (value * dimension * constant) / (dimension + constant * Math.abs(value));
}

export interface TimerDisplayProps {
  isRunning: boolean;
  elapsedText: string;
  progress: number;
  colors: AppColors;
  stageLabel?: string;
  isBreak: boolean;
  footerHint: string;
  showResetButton: boolean;
  resetLabel: string;
  skipBreakLabel: string;
  ariaSkipBreak: string;
  ariaReset: string;
  ariaStart: string;
  ariaPause: string;
  ariaHint: string;
  theme: ThemeMode;
  insetsBottom: number;
  insetsTop: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipStage: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(function TimerDisplay({
  isRunning,
  elapsedText,
  progress,
  colors,
  stageLabel,
  isBreak,
  footerHint,
  showResetButton,
  resetLabel,
  skipBreakLabel,
  ariaSkipBreak,
  ariaReset,
  ariaStart,
  ariaPause,
  ariaHint,
  theme,
  insetsBottom,
  insetsTop,
  onToggleTimer,
  onResetTimer,
  onSkipStage,
}) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const translateY = useSharedValue(0);
  const gestureStartY = useSharedValue(0);
  const runningScale = useSharedValue(1);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(350)
        .maxDistance(18)
        .onBegin(() => {
          runningScale.value = withSpring(0.975, {
            damping: 20,
            stiffness: 450,
            mass: 0.5,
          });
        })
        .onFinalize(() => {
          runningScale.value = withSpring(isRunning ? 1.012 : 1, {
            damping: 20,
            stiffness: 300,
            mass: 0.7,
          });
        })
        .onEnd(() => {
          runOnJS(onToggleTimer)();
        }),
    [isRunning, onToggleTimer, runningScale]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(12)
        .onStart(() => {
          gestureStartY.value = translateY.value;
          runningScale.value = withSpring(0.982, {
            damping: 18,
            stiffness: 420,
            mass: 0.55,
          });
        })
        .onUpdate((event) => {
          translateY.value = gestureStartY.value + rubberBand(event.translationY, height);
        })
        .onEnd((event) => {
          const shouldReset = event.translationY > RESET_THRESHOLD;
          const shouldToggle = event.translationY < FLICK_THRESHOLD || event.velocityY < FLICK_VELOCITY;
          const isShortDrag = Math.abs(event.translationY) < 30;

          translateY.value = withSpring(0, {
            damping: shouldToggle || shouldReset ? 20 : 24,
            stiffness: shouldToggle || shouldReset ? 220 : 250,
            velocity: event.velocityY,
          });
          runningScale.value = withSpring(isRunning ? 1.012 : 1, {
            damping: 22,
            stiffness: 300,
            mass: 0.7,
          });

          if (shouldReset) {
            runOnJS(onResetTimer)();
          } else if (shouldToggle || isShortDrag) {
            runOnJS(onToggleTimer)();
          }
        }),
    [gestureStartY, height, isRunning, onResetTimer, onToggleTimer, runningScale, translateY]
  );

  const gesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture]
  );

  const dialScale = useMemo(() => {
    const availableHeight = height - (insetsTop + insetsBottom + 170);
    const availableWidth = width - 40;
    const target = Math.min(320, availableHeight, availableWidth);
    return Math.max(0.78, Math.min(1, target / 320));
  }, [height, insetsBottom, insetsTop, width]);

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: runningScale.value * dialScale }],
  }));

  const activeAriaLabel = isRunning ? ariaPause : ariaStart;

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.focusSurface, animatedCounterStyle]}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${activeAriaLabel}. ${elapsedText}`}
          accessibilityValue={{ text: elapsedText }}
          accessibilityHint={ariaHint}
          onAccessibilityTap={onToggleTimer}
        >
          <MainFocus3D
            isRunning={isRunning}
            elapsedText={elapsedText}
            progress={progress}
            accentColor={colors.accent}
            primaryColor={colors.primary}
            mutedColor={colors.muted}
            hairlineColor={colors.hairline}
            translateY={translateY}
            reducedMotion={Boolean(reduceMotion)}
            stageLabel={stageLabel}
            isBreak={isBreak}
          />
        </Animated.View>
      </GestureDetector>

      <View style={[styles.footer, { bottom: Math.max(insetsBottom + 26, 26) }]}>
        <Text style={[styles.hint, { color: colors.muted }]}>{footerHint}</Text>

        {isBreak && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ariaSkipBreak}
            onPress={onSkipStage}
            hitSlop={12}
            style={({ pressed }) => [
              styles.skipBreakButton,
              { borderColor: colors.hairline, backgroundColor: colors.panel },
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={[styles.skipBreakText, { color: colors.secondary }]}>
              {skipBreakLabel}
            </Text>
          </Pressable>
        )}

        {showResetButton && (
          <ModernResetButton
            onPress={onResetTimer}
            label={resetLabel}
            accessibilityLabel={ariaReset}
            theme={theme}
            style={styles.modernResetWrapper}
          />
        )}
      </View>
    </>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

const styles = StyleSheet.create({
  focusSurface: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  skipBreakButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  skipBreakText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  itemPressed: {
    opacity: 0.6,
  },
  modernResetWrapper: {
    marginTop: 14,
  },
});
