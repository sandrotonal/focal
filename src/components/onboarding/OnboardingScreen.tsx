import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  runOnJS,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingSlide3D } from './OnboardingSlide3D';
import { InteractiveFocusCore } from './InteractiveFocusCore';
import { AtmosphericSoundscapeVisual } from './AtmosphericSoundscapeVisual';
import { SoundscapeTextSelector, SoundscapeOption } from './SoundscapeTextSelector';
import { CadenceSelector, CadenceOption } from './CadenceSelector';
import { MinimalToggleRow } from './MinimalToggleRow';
import { DynamicPillIndicator } from './DynamicPillIndicator';
import { AppleCtaButton } from './AppleCtaButton';
import type { AppColors, FocusPreferences } from './types';
import type { AmbientSoundType } from '../../storage/preferencesStorage';
import { requestNotificationPermission } from '../../notifications/notifications';
import {
  playFocusStartSound,
  playTickSound,
  preloadNativeSounds,
  preloadAmbientSounds,
  stopAmbientSound,
} from '../../audio/soundEngine';
import { translations, Language } from '../../i18n/translations';

type Props = {
  colors: AppColors;
  initialLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
  onComplete: (preferences: Partial<FocusPreferences>) => void;
};

const TOTAL_STEPS = 3;
const BG_COLOR = '#0A0A0C';

export const OnboardingScreen: React.FC<Props> = React.memo(function OnboardingScreen({
  initialLanguage = 'tr',
  onLanguageChange,
  onComplete,
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [step, setStep] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled] = useState(true);

  // Programmatic navigation lock to avoid duplicate sound/haptics
  const isProgrammaticNav = useRef(false);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eagerly preload native sound decoders & ambient buffers on mount
  useEffect(() => {
    preloadNativeSounds();
    preloadAmbientSounds();
    return () => {
      if (navTimeout.current) clearTimeout(navTimeout.current);
      stopAmbientSound();
    };
  }, []);

  const visualHeight = Math.round(height * 0.44);
  const t = translations[language];

  const triggerHaptic = useCallback(
    (style = Haptics.ImpactFeedbackStyle.Light) => {
      if (hapticsEnabled) {
        try {
          void Haptics.impactAsync(style);
        } catch {
          // safe fallback
        }
      }
    },
    [hapticsEnabled]
  );

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
    onLanguageChange?.(nextLang);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) {
      void playTickSound();
    }
  }, [language, onLanguageChange, soundEnabled, triggerHaptic]);

  const handleToggleNotifications = useCallback(
    async (next: boolean) => {
      if (next) {
        try {
          const granted = await requestNotificationPermission();
          setNotificationsEnabled(granted);
        } catch {
          setNotificationsEnabled(false);
        }
      } else {
        setNotificationsEnabled(false);
      }
    },
    []
  );

  const finish = useCallback(() => {
    stopAmbientSound();
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
      ambientSound,
      onboardingCompleted: true,
      completedSessions: 0,
      totalFocusMinutes: 0,
    });
  }, [
    ambientSound,
    hapticsEnabled,
    language,
    notificationsEnabled,
    onComplete,
    sessionMinutes,
    soundEnabled,
    triggerHaptic,
  ]);

  const handleMomentumSnap = useCallback(
    (snapIndex: number) => {
      if (isProgrammaticNav.current) return;
      setStep((prev) => {
        if (prev === snapIndex) return prev;
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        if (soundEnabled) {
          void playTickSound();
        }
        return snapIndex;
      });
    },
    [soundEnabled, triggerHaptic]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const current = Math.round(event.contentOffset.x / width);
      if (current >= 0 && current < TOTAL_STEPS) {
        runOnJS(handleMomentumSnap)(current);
      }
    },
    onMomentumEnd: (event) => {
      const current = Math.round(event.contentOffset.x / width);
      runOnJS(handleMomentumSnap)(current);
    },
  });

  const moveToStep = useCallback(
    (nextStep: number) => {
      if (nextStep >= TOTAL_STEPS) {
        finish();
        return;
      }

      if (navTimeout.current) clearTimeout(navTimeout.current);
      isProgrammaticNav.current = true;

      setStep(nextStep);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      if (soundEnabled) {
        void playTickSound();
      }

      scrollRef.current?.scrollTo({
        x: nextStep * width,
        animated: !reducedMotion,
      });

      navTimeout.current = setTimeout(() => {
        isProgrammaticNav.current = false;
      }, 420);
    },
    [finish, reducedMotion, soundEnabled, triggerHaptic, width]
  );

  const handlePrimaryCtaPress = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      moveToStep(step + 1);
    } else {
      finish();
    }
  }, [finish, moveToStep, step]);

  const cadenceOptions: CadenceOption[] = [
    { minutes: 15, label: t.onboarding.slide2.pomodoro.label },
    { minutes: 25, label: t.onboarding.slide2.deepWork.label },
    { minutes: 45, label: t.onboarding.slide2.flowState.label },
  ];

  const soundscapeOptions: SoundscapeOption[] = [
    { type: 'none', label: t.common.silent },
    { type: 'rain', label: t.drawer.sections.ambientSounds.rain },
    { type: 'storm', label: t.drawer.sections.ambientSounds.storm },
    { type: 'ocean', label: t.drawer.sections.ambientSounds.ocean },
  ];

  const ctaLabel =
    step === TOTAL_STEPS - 1 ? t.onboarding.start : t.onboarding.continue;

  return (
    <View style={styles.container}>
      {/* Top Floating Bar */}
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/focal-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="Focal Logo"
          />
          <Text style={styles.brandTitle}>{t.common.appName}</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.drawer.aria.languageSwitch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={toggleLanguage}
            style={({ pressed }) => [
              styles.headerTextBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.headerTextBtnLabel}>
              {language.toUpperCase()}
            </Text>
          </Pressable>

          {step < TOTAL_STEPS - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.onboarding.skip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={finish}
              style={({ pressed }) => [
                styles.headerTextBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.headerTextBtnLabel}>{t.onboarding.skip}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerBtnPlaceholder} />
          )}
        </View>
      </View>

      {/* Slide Carousel */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        style={styles.pager}
      >
        {/* Slide 1: Kinetic Focus Core */}
        <OnboardingSlide3D
          index={0}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <View style={[styles.visualArea, { height: visualHeight }]}>
            <InteractiveFocusCore
              width={width}
              height={visualHeight}
              hapticsEnabled={hapticsEnabled}
              soundEnabled={soundEnabled}
            />
          </View>
          <View style={styles.bottomContentArea}>
            <Text style={styles.headlineText}>{t.onboarding.slide1.title}</Text>
            <Text style={styles.subtitleText}>{t.onboarding.slide1.body}</Text>
          </View>
        </OnboardingSlide3D>

        {/* Slide 2: Dynamic Atmospheric Soundscape (Pure, borderless visuals) */}
        <OnboardingSlide3D
          index={1}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <View style={[styles.visualArea, { height: visualHeight }]}>
            <AtmosphericSoundscapeVisual
              ambientSound={ambientSound}
              width={width}
              height={visualHeight}
            />
          </View>
          <View style={styles.bottomContentArea}>
            <SoundscapeTextSelector
              selectedSound={ambientSound}
              onSelect={setAmbientSound}
              options={soundscapeOptions}
              hapticsEnabled={hapticsEnabled}
              soundEnabled={soundEnabled}
            />
            <Text style={styles.headlineText}>{t.onboarding.slide3.title}</Text>
            <Text style={styles.subtitleText}>{t.onboarding.slide3.body}</Text>
          </View>
        </OnboardingSlide3D>

        {/* Slide 3: Cadence & Native Minimalist Toggles */}
        <OnboardingSlide3D
          index={2}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          <View style={[styles.visualAreaCompact, { height: visualHeight - 40 }]}>
            <CadenceSelector
              selectedMinutes={sessionMinutes}
              onSelect={setSessionMinutes}
              options={cadenceOptions}
              unitLabel={t.common.minuteShort}
              hapticsEnabled={hapticsEnabled}
              soundEnabled={soundEnabled}
            />
          </View>
          <View style={styles.bottomContentAreaCompact}>
            {/* Minimal Apple UI/UX Toggle Controls - Zero Card Box */}
            <View style={styles.togglesWrapper}>
              <MinimalToggleRow
                title={t.drawer.sections.notificationsTitle}
                subtitle={t.drawer.sections.notificationsSubtitle}
                value={notificationsEnabled}
                onValueChange={(val) => void handleToggleNotifications(val)}
                hapticsEnabled={hapticsEnabled}
                soundEnabled={soundEnabled}
              />
              <MinimalToggleRow
                title={t.drawer.sections.hapticsTitle}
                subtitle={t.drawer.sections.hapticsSubtitle}
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                hapticsEnabled={hapticsEnabled}
                soundEnabled={soundEnabled}
                isLast
              />
            </View>
            <Text style={styles.headlineTextSmall}>{t.onboarding.slide2.title}</Text>
            <Text style={styles.subtitleTextSmall}>{t.onboarding.slide2.body}</Text>
          </View>
        </OnboardingSlide3D>
      </Animated.ScrollView>

      {/* Floating Bottom Footer: Dynamic Pill Indicator (Continuous 120 FPS gesture-driven morphing) & Apple Pro CTA Button */}
      <View
        style={[
          styles.floatingFooter,
          { paddingBottom: Math.max(insets.bottom + 16, 28) },
        ]}
      >
        <DynamicPillIndicator
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          scrollX={scrollX}
          width={width}
        />
        <View style={styles.footerSpacing} />
        <AppleCtaButton
          label={ctaLabel}
          onPress={handlePrimaryCtaPress}
          accessibilityLabel={ctaLabel}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  floatingHeader: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    height: 38,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTextBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBtnLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  headerBtnPlaceholder: {
    minWidth: 36,
    height: 28,
  },
  pager: {
    flex: 1,
  },
  visualArea: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualAreaCompact: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContentArea: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 10,
    alignItems: 'center',
  },
  bottomContentAreaCompact: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 4,
    alignItems: 'center',
  },
  togglesWrapper: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  headlineText: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 38,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
  },
  subtitleText: {
    fontFamily: 'System',
    fontSize: 15,
    lineHeight: 22,
    color: '#71717A',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  headlineTextSmall: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitleTextSmall: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
    color: '#71717A',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  floatingFooter: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  footerSpacing: {
    height: 18,
  },
  pressed: {
    opacity: 0.65,
  },
});

OnboardingScreen.displayName = 'OnboardingScreen';
