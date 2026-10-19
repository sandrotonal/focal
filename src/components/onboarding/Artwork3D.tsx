import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Polygon,
  G,
  Line,
} from 'react-native-svg';
import type { Language } from '../../i18n/translations';
import { translations } from '../../i18n/translations';
import { playTickSound } from '../../audio/soundEngine';
import { ModernSwitch } from '../ui/ModernSwitch';

// ============================================================================
// 1. TOP 55% FULL-BLEED ARTWORK 1: ISOMETRIC ARCHITECTURAL SUNDIAL DESK
// ============================================================================
export const ArtworkSundialDesk: React.FC<{
  width: number;
  height: number;
}> = React.memo(function ArtworkSundialDesk({ width, height }) {
  return (
    <View style={[styles.artworkContainer, { width, height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 380 440" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="deskSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0B0C10" />
            <Stop offset="45%" stopColor="#12141A" />
            <Stop offset="100%" stopColor="#0A0A0C" />
          </LinearGradient>

          <LinearGradient id="sunBeam" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="50%" stopColor="#0A84FF" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
          </LinearGradient>

          <LinearGradient id="plinthTop" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#252834" />
            <Stop offset="100%" stopColor="#181A22" />
          </LinearGradient>

          <LinearGradient id="plinthLeft" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1D202A" />
            <Stop offset="100%" stopColor="#101217" />
          </LinearGradient>

          <LinearGradient id="plinthRight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#14161E" />
            <Stop offset="100%" stopColor="#0C0D12" />
          </LinearGradient>

          <LinearGradient id="bottomFade1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0A0A0C" stopOpacity="0" />
            <Stop offset="55%" stopColor="#0A0A0C" stopOpacity="0.7" />
            <Stop offset="88%" stopColor="#0A0A0C" stopOpacity="0.96" />
            <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="380" height="440" fill="url(#deskSky)" />
        <Polygon points="40,0 180,0 340,360 120,360" fill="url(#sunBeam)" />

        <G stroke="rgba(255,255,255,0.04)" strokeWidth="1">
          <Line x1="190" y1="80" x2="0" y2="280" />
          <Line x1="190" y1="80" x2="380" y2="280" />
          <Line x1="190" y1="80" x2="70" y2="380" />
          <Line x1="190" y1="80" x2="310" y2="380" />
        </G>

        <Polygon points="190,230 360,265 290,340 190,265" fill="rgba(0,0,0,0.72)" />
        <Polygon points="70,250 200,380 140,410 40,280" fill="rgba(0,0,0,0.55)" />

        <Polygon points="60,240 190,305 190,340 60,275" fill="url(#plinthLeft)" />
        <Polygon points="190,305 320,240 320,275 190,340" fill="url(#plinthRight)" />
        <Polygon points="190,175 320,240 190,305 60,240" fill="url(#plinthTop)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        <G stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="none">
          <Path d="M100,240 C140,210 240,210 280,240" strokeDasharray="3 3" />
          <Path d="M120,240 C150,220 230,220 260,240" />
        </G>

        <G stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
          <Line x1="145" y1="230" x2="140" y2="225" />
          <Line x1="190" y1="222" x2="190" y2="215" />
          <Line x1="235" y1="230" x2="240" y2="225" />
        </G>

        <Polygon points="190,130 190,245 182,240 182,135" fill="#1C1F2B" />
        <Polygon points="190,130 200,135 200,240 190,245" fill="#3D4255" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <Polygon points="190,130 182,135 190,138 200,135" fill="#585F79" />

        <Circle cx="190" cy="245" r="4.5" fill="#0A84FF" />
        <Circle cx="190" cy="245" r="9" stroke="rgba(10,132,255,0.4)" strokeWidth="1" fill="none" />

        <Circle cx="270" cy="170" r="14" fill="#1E212D" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <Circle cx="266" cy="166" r="3.5" fill="#FFFFFF" opacity={0.35} />

        <Rect x="0" y="240" width="380" height="200" fill="url(#bottomFade1)" />
      </Svg>
    </View>
  );
});

// ============================================================================
// 2. TOP 55% FULL-BLEED ARTWORK 2: CALM ACOUSTIC WAVES & SPOTLIGHT BEAMS
// ============================================================================
export const ArtworkAcousticWaves: React.FC<{
  width: number;
  height: number;
}> = React.memo(function ArtworkAcousticWaves({ width, height }) {
  return (
    <View style={[styles.artworkContainer, { width, height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 380 440" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="acousticSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#090A0E" />
            <Stop offset="50%" stopColor="#11131C" />
            <Stop offset="100%" stopColor="#0A0A0C" />
          </LinearGradient>

          <LinearGradient id="spotlightBeam" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="40%" stopColor="#0A84FF" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
          </LinearGradient>

          <RadialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0A84FF" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="bottomFade2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0A0A0C" stopOpacity="0" />
            <Stop offset="50%" stopColor="#0A0A0C" stopOpacity="0.75" />
            <Stop offset="90%" stopColor="#0A0A0C" stopOpacity="0.98" />
            <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="380" height="440" fill="url(#acousticSky)" />
        <Polygon points="290,0 350,0 170,360 70,360" fill="url(#spotlightBeam)" />

        <G stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none">
          <Path d="M-20,120 Q190,50 400,120" />
          <Path d="M0,160 Q190,95 380,160" />
          <Path d="M20,200 Q190,140 360,200" />
        </G>

        <G stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="none">
          <Circle cx="190" cy="220" r="130" strokeDasharray="4 4" opacity={0.4} />
          <Circle cx="190" cy="220" r="95" stroke="rgba(255,255,255,0.2)" opacity={0.6} />
          <Circle cx="190" cy="220" r="60" stroke="#0A84FF" strokeWidth={1.8} opacity={0.8} />
          <Circle cx="190" cy="220" r="28" stroke="#FFFFFF" strokeWidth={1.5} />
        </G>

        <Circle cx="190" cy="220" r="30" fill="url(#nodeGlow)" />
        <Polygon points="190,165 196,175 196,265 190,275 184,265 184,175" fill="#252A3A" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <Line x1="190" y1="165" x2="190" y2="275" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.8} />

        <Circle cx="130" cy="220" r="3" fill="#FFFFFF" opacity={0.6} />
        <Circle cx="250" cy="220" r="3" fill="#FFFFFF" opacity={0.6} />
        <Circle cx="190" cy="125" r="4" fill="#0A84FF" />
        <Circle cx="190" cy="315" r="3.5" fill="#0A84FF" opacity={0.7} />

        <Rect x="0" y="240" width="380" height="200" fill="url(#bottomFade2)" />
      </Svg>
    </View>
  );
});

// ============================================================================
// 3. TOP 55% FULL-BLEED ARTWORK 3: INSPIRING FLOW STATE & PEAK FOCUS
// ============================================================================
export const ArtworkFlowState: React.FC<{
  width: number;
  height: number;
}> = React.memo(function ArtworkFlowState({ width, height }) {
  return (
    <View style={[styles.artworkContainer, { width, height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 380 440" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="flowSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0B0C10" />
            <Stop offset="45%" stopColor="#12151E" />
            <Stop offset="100%" stopColor="#0A0A0C" />
          </LinearGradient>

          <RadialGradient id="flowCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0A84FF" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#0A84FF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="ribbon1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#0A84FF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
          </LinearGradient>

          <LinearGradient id="bottomFade3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0A0A0C" stopOpacity="0" />
            <Stop offset="50%" stopColor="#0A0A0C" stopOpacity="0.75" />
            <Stop offset="90%" stopColor="#0A0A0C" stopOpacity="0.98" />
            <Stop offset="100%" stopColor="#0A0A0C" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="380" height="440" fill="url(#flowSky)" />
        <Circle cx="190" cy="180" r="120" fill="url(#flowCore)" />

        <G stroke="rgba(255,255,255,0.06)" strokeWidth="1">
          <Line x1="190" y1="180" x2="30" y2="380" />
          <Line x1="190" y1="180" x2="110" y2="380" />
          <Line x1="190" y1="180" x2="190" y2="380" />
          <Line x1="190" y1="180" x2="270" y2="380" />
          <Line x1="190" y1="180" x2="350" y2="380" />
        </G>

        <G stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="none">
          <Circle cx="190" cy="180" r="140" strokeDasharray="3 3" opacity={0.35} />
          <Circle cx="190" cy="180" r="105" opacity={0.5} />
          <Circle cx="190" cy="180" r="70" stroke="rgba(10,132,255,0.5)" strokeWidth={1.8} />
        </G>

        <Path
          d="M70,250 C110,130 190,120 190,180 C190,240 270,230 310,110"
          fill="none"
          stroke="url(#ribbon1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <Path
          d="M90,130 C130,220 190,230 190,180 C190,130 250,140 290,250"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.6"
          strokeDasharray="5 3"
        />

        <Polygon points="190,110 178,185 190,195" fill="#1C202C" />
        <Polygon points="190,110 202,185 190,195" fill="#31374A" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        <Circle cx="190" cy="110" r="6" fill="#FFFFFF" />
        <Circle cx="190" cy="110" r="12" stroke="#0A84FF" strokeWidth={1.8} fill="none" />

        <Circle cx="70" cy="250" r="3" fill="#0A84FF" />
        <Circle cx="310" cy="110" r="3" fill="#FFFFFF" />
        <Circle cx="190" cy="280" r="4" fill="#0A84FF" opacity={0.7} />

        <Rect x="0" y="240" width="380" height="200" fill="url(#bottomFade3)" />
      </Svg>
    </View>
  );
});

// ============================================================================
// 4. SCREEN 3: MODERN SWITCH TOGGLES (TITREŞİM, SES, BİLDİRİM)
// ============================================================================
export const PreferencesToggleList: React.FC<{
  language: Language;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  onToggleNotifications: () => void;
  onToggleHaptics: () => void;
  onToggleSound: () => void;
}> = React.memo(function PreferencesToggleList({
  language,
  notificationsEnabled,
  hapticsEnabled,
  soundEnabled,
  onToggleNotifications,
  onToggleHaptics,
  onToggleSound,
}) {
  const t = translations[language];

  return (
    <View style={styles.toggleListContainer}>
      {/* Titreşim / Haptics Toggle Row */}
      <View style={styles.toggleItemRow}>
        <Text style={styles.toggleItemLabel}>
          {t.onboarding.slide4.haptics}
        </Text>
        <ModernSwitch
          value={hapticsEnabled}
          onValueChange={() => {
            onToggleHaptics();
            void playTickSound();
            if (!hapticsEnabled) {
              try {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // safe fallback
              }
            }
          }}
          checkedBg="#0A84FF"
          uncheckedBg="rgba(255, 255, 255, 0.16)"
          crossColor="rgba(255, 255, 255, 0.4)"
          checkmarkColor="#FFFFFF"
          accessibilityLabel={t.onboarding.slide4.haptics}
        />
      </View>

      {/* Ses Efektleri / Sound Toggle Row */}
      <View style={styles.toggleItemRow}>
        <Text style={styles.toggleItemLabel}>
          {t.onboarding.slide4.sound}
        </Text>
        <ModernSwitch
          value={soundEnabled}
          onValueChange={() => {
            onToggleSound();
            void playTickSound();
            if (hapticsEnabled) {
              try {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // safe fallback
              }
            }
          }}
          checkedBg="#0A84FF"
          uncheckedBg="rgba(255, 255, 255, 0.16)"
          crossColor="rgba(255, 255, 255, 0.4)"
          checkmarkColor="#FFFFFF"
          accessibilityLabel={t.onboarding.slide4.sound}
        />
      </View>

      {/* Bitiş Bildirimi / Notifications Toggle Row */}
      <View style={styles.toggleItemRow}>
        <Text style={styles.toggleItemLabel}>
          {t.onboarding.slide4.notifications}
        </Text>
        <ModernSwitch
          value={notificationsEnabled}
          onValueChange={() => {
            onToggleNotifications();
            void playTickSound();
            if (hapticsEnabled) {
              try {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // safe fallback
              }
            }
          }}
          checkedBg="#0A84FF"
          uncheckedBg="rgba(255, 255, 255, 0.16)"
          crossColor="rgba(255, 255, 255, 0.4)"
          checkmarkColor="#FFFFFF"
          accessibilityLabel={t.onboarding.slide4.notifications}
        />
      </View>
    </View>
  );
});

// ============================================================================
// 5. INLINE PILL PROGRESS INDICATOR
// ============================================================================
export const InlineProgressPill: React.FC<{
  currentStep: number;
  totalSteps?: number;
}> = React.memo(function InlineProgressPill({ currentStep, totalSteps = 3 }) {
  return (
    <View style={styles.progressPillContainer}>
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isActive = idx === currentStep;
        return (
          <View
            key={idx}
            style={[
              styles.progressPillDot,
              isActive && styles.progressPillActiveBar,
            ]}
          />
        );
      })}
    </View>
  );
});

// ============================================================================
// 6. HARMONIOUS SIGNATURE DUAL-CIRCLE CAPSULE CTA BUTTON
// ============================================================================
export const CapsuleCtaButton: React.FC<{
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}> = React.memo(function CapsuleCtaButton({ label, onPress, accessibilityLabel }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.capsuleWrapper, animStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 320 });
        }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.capsuleContainer,
          pressed && { opacity: 0.9 },
        ]}
      >
        {/* Left Circle: Integrated Inset Dark Badge with Focal Blue Spark */}
        <View style={styles.capsuleLeftCircle}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="#0A84FF"
            />
          </Svg>
        </View>

        {/* Center Label: Pure Crisp White Editorial Typography */}
        <Text style={styles.capsuleLabel}>{label}</Text>

        {/* Right Circle: Luminous Pure White Target Button with Sharp Dark Arrow */}
        <View style={styles.capsuleRightCircle}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="#0A0A0C"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  artworkContainer: {
    overflow: 'hidden',
    backgroundColor: '#0A0A0C',
  },

  // Toggle List
  toggleListContainer: {
    width: '100%',
    marginTop: 10,
    gap: 4,
  },
  toggleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  toggleItemLabel: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Inline Pill Progress Indicator
  progressPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  progressPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  progressPillActiveBar: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A84FF',
  },

  // Harmonious Signature Capsule CTA Button
  capsuleWrapper: {
    width: '100%',
  },
  capsuleContainer: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capsuleLeftCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleLabel: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  capsuleRightCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

ArtworkSundialDesk.displayName = 'ArtworkSundialDesk';
ArtworkAcousticWaves.displayName = 'ArtworkAcousticWaves';
ArtworkFlowState.displayName = 'ArtworkFlowState';
PreferencesToggleList.displayName = 'PreferencesToggleList';
InlineProgressPill.displayName = 'InlineProgressPill';
CapsuleCtaButton.displayName = 'CapsuleCtaButton';
