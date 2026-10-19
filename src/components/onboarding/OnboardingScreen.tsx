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
import {
  ArtworkSundialDesk,
  ArtworkAcousticWaves,
  ArtworkFlowState,
  PreferencesToggleList,
  InlineProgressPill,
  CapsuleCtaButton,
} from './Artwork3D';
import { OnboardingSlide3D } from './OnboardingSlide3D';
import type { AppColors, FocusPreferences } from './types';
import { requestNotificationPermission } from '../../notifications/notifications';
import {
  playFocusStartSound,
  playTickSound,
  preloadNativeSounds,
} from '../../audio/soundEngine';
import { translations, Language } from '../../i18n/translations';

type Props = {
  colors: AppColors;
  initialLanguage?: Language;
  onComplete: (preferences: Partial<FocusPreferences>) => void;
};

const TOTAL_STEPS = 3;
const BG_COLOR = '#0A0A0C';

export const OnboardingScreen: React.FC<Props> = React.memo(function OnboardingScreen({
  initialLanguage = 'tr',
  onComplete,
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [step, setStep] = useState(0);
  const [sessionMinutes] = useState(25);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Programmatic navigation lock to avoid duplicate sound/haptics
  const isProgrammaticNav = useRef(false);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eagerly preload native sound decoders on screen mount for zero-latency audio
  useEffect(() => {
    preloadNativeSounds();
    return () => {
      if (navTimeout.current) clearTimeout(navTimeout.current);
    };
  }, []);

  // Top 55% visual height calculation
  const visualHeight = Math.round(height * 0.54);

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

  // Handle manual swipe momentum snap (only triggers audio/haptics when user finishes drag)
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

  // Pure UI-thread scroll handler for 120 FPS buttery parallax
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const current = Math.round(event.contentOffset.x / width);
      runOnJS(handleMomentumSnap)(current);
    },
  });

  // Programmatic forward step navigation
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

  const handleRequestNotification = useCallback(async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        if (soundEnabled) {
          void playTickSound();
        }
      }
    } catch {
      setNotificationsEnabled(false);
    }
  }, [soundEnabled, triggerHaptic]);

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      await handleRequestNotification();
    } else {
      setNotificationsEnabled(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      if (soundEnabled) {
        void playTickSound();
      }
    }
  }, [handleRequestNotification, notificationsEnabled, soundEnabled, triggerHaptic]);

  const handlePrimaryCtaPress = useCallback(async () => {
    if (step === 0) {
      moveToStep(1);
    } else if (step === 1) {
      if (!notificationsEnabled) {
        await handleRequestNotification();
      }
      moveToStep(2);
    } else if (step === 2) {
      finish();
    }
  }, [finish, handleRequestNotification, moveToStep, notificationsEnabled, step]);

  // Primary CTA label depending on active step
  const capsuleCtaLabel =
    step === 2
      ? t.onboarding.start
      : step === 1 && !notificationsEnabled
      ? t.onboarding.allowNotifications
      : t.onboarding.continue;

  return (
    <View style={styles.container}>
      {/* Floating Top Bar (z-index: 20) gently overlaying artwork */}
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
          {/* Borderless Text-Only Language Switcher */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.drawer.aria.languageSwitch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={toggleLanguage}
            style={({ pressed }) => [styles.headerTextBtn, pressed && styles.pressed]}
          >
            <Text style={styles.headerTextBtnLabel}>{language.toUpperCase()}</Text>
          </Pressable>

          {/* Borderless Text Skip Button with Space Reservation */}
          {step < TOTAL_STEPS - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.onboarding.skip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={finish}
              style={({ pressed }) => [styles.headerTextBtn, pressed && styles.pressed]}
            >
              <Text style={styles.headerTextBtnLabel}>{t.onboarding.skip}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerBtnPlaceholder} />
          )}
        </View>
      </View>

      {/* Horizontal Carousel (3 Refined Editorial Screens) */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        style={styles.pager}
      >
        {/* ================================================================ */}
        {/* EKRAN 1: KARŞILAMA (SUNDIAL DESK HERO)                           */}
        {/* ================================================================ */}
        <OnboardingSlide3D
          index={0}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          {/* Top 55% Full-Bleed Artwork */}
          <ArtworkSundialDesk width={width} height={visualHeight} />

          {/* Bottom 45% Editorial Content Area */}
          <View style={styles.bottomContentArea}>
            <Text style={styles.headlineText}>{t.onboarding.slide1.title}</Text>
            <Text style={styles.subtitleText}>{t.onboarding.slide1.body}</Text>
            <InlineProgressPill currentStep={0} totalSteps={TOTAL_STEPS} />
          </View>
        </OnboardingSlide3D>

        {/* ================================================================ */}
        {/* EKRAN 2: BİLDİRİM İZNİ (ACOUSTIC WAVES)                          */}
        {/* ================================================================ */}
        <OnboardingSlide3D
          index={1}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          {/* Top 55% Full-Bleed Artwork */}
          <ArtworkAcousticWaves width={width} height={visualHeight} />

          {/* Bottom 45% Editorial Content Area */}
          <View style={styles.bottomContentArea}>
            <Text style={styles.headlineText}>{t.onboarding.slide3.title}</Text>
            <Text style={styles.subtitleText}>{t.onboarding.slide3.body}</Text>
            <InlineProgressPill currentStep={1} totalSteps={TOTAL_STEPS} />
          </View>
        </OnboardingSlide3D>

        {/* ================================================================ */}
        {/* EKRAN 3: TERCİHLER & TOGGLES (FLOW STATE)                       */}
        {/* ================================================================ */}
        <OnboardingSlide3D
          index={2}
          width={width}
          scrollX={scrollX}
          reducedMotion={Boolean(reducedMotion)}
        >
          {/* Top 55% Full-Bleed Artwork */}
          <ArtworkFlowState width={width} height={visualHeight} />

          {/* Bottom 45% Editorial Content Area */}
          <View style={styles.bottomContentArea}>
            <Text style={styles.headlineText}>{t.onboarding.slide4.title}</Text>
            <Text style={styles.subtitleText}>{t.onboarding.slide4.body}</Text>

            {/* Clean Modern Switch Toggle Rows */}
            <PreferencesToggleList
              language={language}
              notificationsEnabled={notificationsEnabled}
              hapticsEnabled={hapticsEnabled}
              soundEnabled={soundEnabled}
              onToggleNotifications={handleToggleNotifications}
              onToggleHaptics={() => setHapticsEnabled((prev) => !prev)}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
            />

            <InlineProgressPill currentStep={2} totalSteps={TOTAL_STEPS} />
          </View>
        </OnboardingSlide3D>
      </Animated.ScrollView>

      {/* Floating Bottom Footer: Harmonious Signature Capsule CTA Button */}
      <View
        style={[
          styles.floatingFooter,
          { paddingBottom: Math.max(insets.bottom + 14, 26) },
        ]}
      >
        {/* Secondary Action Link on Step 1 ("Şimdi geç" / "Skip for now") */}
        {step === 1 && !notificationsEnabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.skipForNow}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            onPress={() => moveToStep(2)}
            style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLinkText}>
              {t.onboarding.skipForNow}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.secondaryLinkPlaceholder} />
        )}

        {/* Harmonious Signature Capsule CTA Button */}
        <CapsuleCtaButton
          label={capsuleCtaLabel}
          onPress={() => void handlePrimaryCtaPress()}
          accessibilityLabel={capsuleCtaLabel}
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
  bottomContentArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  headlineText: {
    fontFamily: 'System',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 35,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  subtitleText: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 20,
    color: '#A1A1AA',
    textAlign: 'left',
    marginTop: 6,
    maxWidth: 320,
  },
  floatingFooter: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  secondaryLink: {
    height: 26,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryLinkPlaceholder: {
    height: 26,
    marginBottom: 8,
  },
  secondaryLinkText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
  },
  pressed: {
    opacity: 0.65,
  },
});

OnboardingScreen.displayName = 'OnboardingScreen';
