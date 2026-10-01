import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientGlow } from './AmbientGlow';
import {
  ArtworkFocusCore3D,
  ArtworkLaunchpad,
  ArtworkRhythmPicker,
  ArtworkSensorySettings,
} from './Artwork3D';
import { OnboardingSlide3D } from './OnboardingSlide3D';
import type { AppColors, FocusPreferences } from './types';
import { requestNotificationPermission } from '../../notifications/notifications';
import { playFocusStartSound, playTickSound } from '../../audio/soundEngine';

type Props = {
  colors: AppColors;
  onComplete: (preferences: FocusPreferences) => void;
};

export const OnboardingScreen: React.FC<Props> = ({ colors, onComplete }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const [step, setStep] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const totalSteps = 4;

  const triggerHaptic = useCallback((style = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsEnabled) {
      try {
        void Haptics.impactAsync(style);
      } catch {
        // fallback
      }
    }
  }, [hapticsEnabled]);

  const finish = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    void playFocusStartSound();
    onComplete({
      sessionMinutes,
      theme: 'dark',
      notificationsEnabled,
      hapticsEnabled,
      soundEnabled: true,
      onboardingCompleted: true,
      completedSessions: 0,
      totalFocusMinutes: 0,
    });
  }, [hapticsEnabled, notificationsEnabled, onComplete, sessionMinutes, triggerHaptic]);

  const handleStepChange = useCallback((newStep: number) => {
    setStep(newStep);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    void playTickSound();
  }, [triggerHaptic]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const current = Math.round(event.contentOffset.x / width);
      if (current !== step) {
        runOnJS(handleStepChange)(current);
      }
    },
  });

  const moveToStep = useCallback(
    async (nextStep: number) => {
      if (nextStep >= totalSteps) {
        if (notificationsEnabled) {
          try {
            const granted = await requestNotificationPermission();
            if (!granted) {
              setNotificationsEnabled(false);
            }
          } catch {
            // notification error fallback
          }
        }
        finish();
        return;
      }

      scrollRef.current?.scrollTo({
        x: nextStep * width,
        animated: !reducedMotion,
      });
      setStep(nextStep);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      void playTickSound();
    },
    [finish, notificationsEnabled, reducedMotion, totalSteps, triggerHaptic, width]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Subtle Ambient Aura */}
      <AmbientGlow colors={colors} scrollX={scrollX} width={width} />

      {/* Minimal Top Header */}
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>FOCUS ENGINE</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.stepCounter, { color: colors.muted }]}>
            {`${String(step + 1).padStart(2, '0')} // ${String(totalSteps).padStart(2, '0')}`}
          </Text>
          {step < totalSteps - 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atla"
              hitSlop={12}
              onPress={finish}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>ATLA</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 3D Animated Horizontal Carousel */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        style={styles.pager}
      >
        {/* SLIDE 1 */}
        <OnboardingSlide3D
          index={0}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <ArtworkFocusCore3D
            colors={colors}
            scrollX={scrollX}
            width={width}
            reducedMotion={Boolean(reducedMotion)}
          />
          <Text style={[styles.slideTitle, { color: colors.primary }]}>
            Zihnini topla.
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            Bölünmelerden arınmış minimalist alan. Zamanı başlat ve sadece önündeki tek bir göreve odaklan.
          </Text>
        </OnboardingSlide3D>

        {/* SLIDE 2 */}
        <OnboardingSlide3D
          index={1}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <Text style={[styles.slideTitle, { color: colors.primary }]}>
            Kişisel ritmini seç.
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            Kısa sprint mi, yoksa kesintisiz derin bir çalışma bloğu mu?
          </Text>
          <ArtworkRhythmPicker
            colors={colors}
            selectedMinutes={sessionMinutes}
            onSelect={setSessionMinutes}
            hapticsEnabled={hapticsEnabled}
          />
        </OnboardingSlide3D>

        {/* SLIDE 3 */}
        <OnboardingSlide3D
          index={2}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <Text style={[styles.slideTitle, { color: colors.primary }]}>
            Duyusal uyarılar.
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            Seans bitişini kaçırmaman için taptic motor ve bildirimleri yapılandır.
          </Text>
          <ArtworkSensorySettings
            colors={colors}
            notificationsEnabled={notificationsEnabled}
            hapticsEnabled={hapticsEnabled}
            onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
            onToggleHaptics={() => setHapticsEnabled((prev) => !prev)}
          />
        </OnboardingSlide3D>

        {/* SLIDE 4 */}
        <OnboardingSlide3D
          index={3}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <ArtworkLaunchpad
            colors={colors}
            sessionMinutes={sessionMinutes}
            notificationsEnabled={notificationsEnabled}
            hapticsEnabled={hapticsEnabled}
          />
          <Text style={[styles.slideTitle, { color: colors.primary }]}>
            Odak ritüeli hazır.
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            Seçimlerin kaydedildi. İstediğin zaman sol menüden hızlıca güncelleyebilirsin.
          </Text>
        </OnboardingSlide3D>
      </Animated.ScrollView>

      {/* Bottom Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        {/* Minimal Linear Progress Segments */}
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <ProgressPill
              key={idx}
              index={idx}
              scrollX={scrollX}
              width={width}
              colors={colors}
            />
          ))}
        </View>

        {/* Primary Action Button (Architectural, No bubbly borders) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === totalSteps - 1 ? 'Focus Engine başlat' : 'Devam et'}
          onPress={() => void moveToStep(step + 1)}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary },
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <Text style={[styles.ctaButtonText, { color: colors.background }]}>
            {step === totalSteps - 1 ? 'RİTÜELİ BAŞLAT' : 'DEVAM ET'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// Minimalist Segment Indicator
const ProgressPill: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  colors: AppColors;
}> = ({ index, scrollX, width, colors }) => {
  const pillStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0.2, 1, 0.2], 'clamp');
    const scaleX = interpolate(scrollX.value, inputRange, [0.8, 1.2, 0.8], 'clamp');

    return {
      opacity,
      transform: [{ scaleX }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.progressPill,
        { backgroundColor: colors.primary },
        pillStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepCounter: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  pager: {
    flex: 1,
  },
  slideTitle: {
    fontFamily: 'System',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  slideBody: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 8,
  },
  progressPill: {
    width: 24,
    height: 2,
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaButtonText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  pressed: {
    opacity: 0.6,
  },
});
