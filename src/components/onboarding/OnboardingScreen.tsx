import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
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
  ArtworkRhythmPicker,
  ArtworkSensorySettings,
} from './Artwork3D';
import { OnboardingSlide3D } from './OnboardingSlide3D';
import type { AppColors, FocusPreferences } from './types';
import { requestNotificationPermission } from '../../notifications/notifications';
import { playFocusStartSound, playTickSound } from '../../audio/soundEngine';
import { translations, Language } from '../../i18n/translations';

type Props = {
  colors: AppColors;
  initialLanguage?: Language;
  onComplete: (preferences: FocusPreferences) => void;
};

export const OnboardingScreen: React.FC<Props> = React.memo(({
  colors,
  initialLanguage = 'tr',
  onComplete,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [step, setStep] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const totalSteps = 3;
  const t = translations[language];

  const triggerHaptic = useCallback((style = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsEnabled) {
      try {
        void Haptics.impactAsync(style);
      } catch {
        // fallback
      }
    }
  }, [hapticsEnabled]);

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) {
      void playTickSound();
    }
  }, [language, soundEnabled, triggerHaptic]);

  const finish = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (soundEnabled) {
      void playFocusStartSound();
    }
    onComplete({
      sessionMinutes,
      sessionSeconds: 30,
      durationUnit: 'minutes',
      theme: 'dark',
      language,
      notificationsEnabled,
      hapticsEnabled,
      soundEnabled,
      onboardingCompleted: true,
      completedSessions: 0,
      totalFocusMinutes: 0,
    });
  }, [hapticsEnabled, language, notificationsEnabled, onComplete, sessionMinutes, soundEnabled, triggerHaptic]);

  const handleStepChange = useCallback((newStep: number) => {
    setStep((prev) => {
      if (prev === newStep) return prev;
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      if (soundEnabled) {
        void playTickSound();
      }
      return newStep;
    });
  }, [soundEnabled, triggerHaptic]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const current = Math.round(event.contentOffset.x / width);
      runOnJS(handleStepChange)(current);
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
      if (soundEnabled) {
        void playTickSound();
      }
    },
    [finish, notificationsEnabled, reducedMotion, soundEnabled, totalSteps, triggerHaptic, width]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Subtle Ambient Aura */}
      <AmbientGlow colors={colors} scrollX={scrollX} width={width} />

      {/* Minimal Top Header */}
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/focal-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="Focal Logo"
          />
          <Text style={[styles.brandTitle, { color: colors.primary }]}>{t.common.appName}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Language Switcher Pill */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.drawer.aria.languageSwitch}
            hitSlop={8}
            onPress={toggleLanguage}
            style={({ pressed }) => [
              styles.langPill,
              { borderColor: colors.hairline, backgroundColor: `${colors.panel}` },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.langPillText, { color: colors.accent }]}>
              {language.toUpperCase()}
            </Text>
          </Pressable>

          <Text style={[styles.stepCounter, { color: colors.muted }]}>
            {`${String(step + 1).padStart(2, '0')} // ${String(totalSteps).padStart(2, '0')}`}
          </Text>
          {step < totalSteps - 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.skip}
              hitSlop={12}
              onPress={finish}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>{t.common.skip}</Text>
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
            language={language}
            scrollX={scrollX}
            width={width}
            reducedMotion={Boolean(reducedMotion)}
          />
          <Text style={[styles.slideTitle, { color: colors.primary }]}>
            {t.onboarding.slide1.title}
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            {t.onboarding.slide1.body}
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
            {t.onboarding.slide2.title}
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            {t.onboarding.slide2.body}
          </Text>
          <ArtworkRhythmPicker
            colors={colors}
            language={language}
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
            {t.onboarding.slide3.title}
          </Text>
          <Text style={[styles.slideBody, { color: colors.secondary }]}>
            {t.onboarding.slide3.body}
          </Text>
          <ArtworkSensorySettings
            colors={colors}
            language={language}
            notificationsEnabled={notificationsEnabled}
            hapticsEnabled={hapticsEnabled}
            soundEnabled={soundEnabled}
            onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
            onToggleHaptics={() => setHapticsEnabled((prev) => !prev)}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
          />
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

        {/* Primary Action Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === totalSteps - 1 ? t.common.start : t.common.continue}
          onPress={() => void moveToStep(step + 1)}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary },
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <Text style={[styles.ctaButtonText, { color: colors.background }]}>
            {step === totalSteps - 1 ? t.common.start : t.common.continue}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

// Minimalist Segment Indicator
const ProgressPill: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  colors: AppColors;
}> = React.memo(({ index, scrollX, width, colors }) => {
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
});

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
    gap: 8,
  },
  brandLogo: {
    width: 20,
    height: 20,
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
    gap: 12,
  },
  langPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  langPillText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
