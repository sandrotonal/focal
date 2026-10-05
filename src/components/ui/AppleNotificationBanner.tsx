import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export interface AppleNotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  appName?: string;
  timeText?: string;
  actionText: string;
  dismissText?: string;
  theme: 'dark' | 'light';
  colors: {
    background: string;
    panel: string;
    primary: string;
    secondary: string;
    muted: string;
    hairline: string;
    accent: string;
    scrim: string;
  };
  topInset: number;
  hapticsEnabled?: boolean;
  onAction: () => void;
  onDismiss: () => void;
}

export const AppleNotificationBanner: React.FC<AppleNotificationBannerProps> = React.memo(function AppleNotificationBanner({
  visible,
  title,
  body,
  appName = 'FOCAL',
  timeText = 'şimdi',
  actionText = 'Yeni seans',
  dismissText = 'Kapat',
  theme,
  colors,
  topInset,
  hapticsEnabled = true,
  onAction,
  onDismiss,
}) {
  const isDark = theme === 'dark';
  const translateY = useSharedValue(0);

  // Semantic Design Tokens strictly adhering to Apple OS Design System
  const tokens = useMemo(
    () =>
      isDark
        ? {
            surface: 'rgba(29, 31, 36, 0.94)',
            border: 'rgba(255, 255, 255, 0.09)',
            textPrimary: '#FFFFFF',
            textSecondary: 'rgba(235, 235, 245, 0.65)',
            textMuted: 'rgba(235, 235, 245, 0.40)',
            headerMeta: 'rgba(255, 255, 255, 0.72)',
            iconContainerBg: '#FFFFFF',
            iconContainerBorder: 'rgba(255, 255, 255, 0.12)',
            iconGlyph: '#0A84FF',
            closeBg: 'rgba(255, 255, 255, 0.08)',
            closeIcon: 'rgba(255, 255, 255, 0.72)',
            actionBg: 'rgba(255, 255, 255, 0.09)',
            actionBorder: 'rgba(255, 255, 255, 0.11)',
            actionText: '#F5F5F7',
          }
        : {
            surface: 'rgba(244, 246, 249, 0.88)',
            border: 'rgba(0, 0, 0, 0.08)',
            textPrimary: '#1D1D1F',
            textSecondary: 'rgba(60, 60, 67, 0.70)',
            textMuted: 'rgba(60, 60, 67, 0.44)',
            headerMeta: 'rgba(30, 30, 35, 0.75)',
            iconContainerBg: '#FFFFFF',
            iconContainerBorder: 'rgba(0, 0, 0, 0.08)',
            iconGlyph: '#007AFF',
            closeBg: 'rgba(0, 0, 0, 0.06)',
            closeIcon: 'rgba(60, 60, 67, 0.70)',
            actionBg: 'rgba(0, 0, 0, 0.06)',
            actionBorder: 'rgba(0, 0, 0, 0.08)',
            actionText: '#1D1D1F',
          },
    [isDark]
  );

  const handleAction = useCallback(() => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAction();
  }, [hapticsEnabled, onAction]);

  const handleDismiss = useCallback(() => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  }, [hapticsEnabled, onDismiss]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (event.translationY < 0) {
            translateY.value = event.translationY;
          }
        })
        .onEnd((event) => {
          if (event.translationY < -24 || event.velocityY < -240) {
            runOnJS(handleDismiss)();
          } else {
            translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
          }
        }),
    [handleDismiss, translateY]
  );

  const gestureStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(19).stiffness(240).mass(0.85)}
      exiting={SlideOutUp.duration(180)}
      style={[
        styles.positionWrapper,
        { top: Math.max(topInset + 10, 16) },
      ]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            gestureStyle,
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${body}`}
        >
          {/* Header Row: Refined App Icon, Name, Time, Subtle Close */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.appIconContainer,
                  {
                    backgroundColor: tokens.iconContainerBg,
                    borderColor: tokens.iconContainerBorder,
                  },
                ]}
              >
                <Image
                  source={require('../../../assets/focal-logo.png')}
                  style={styles.appIconImage}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel="Focal Logo"
                />
              </View>

              <Text style={[styles.appName, { color: tokens.headerMeta }]}>
                {appName.toUpperCase()}
              </Text>
              <Text style={[styles.bullet, { color: tokens.textMuted }]}>•</Text>
              <Text style={[styles.timeText, { color: tokens.textMuted }]}>{timeText}</Text>
            </View>

            {/* Subtle Minimal Close Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dismissText}
              hitSlop={10}
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: tokens.closeBg },
                pressed && styles.itemPressed,
              ]}
            >
              <Svg width={9} height={9} viewBox="0 0 12 12" fill="none">
                <Path
                  d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
                  stroke={tokens.closeIcon}
                  strokeWidth={1.7}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
          </View>

          {/* Content & Action Row */}
          <View style={styles.contentRow}>
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: tokens.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.body, { color: tokens.textSecondary }]} numberOfLines={2}>
                {body}
              </Text>
            </View>

            {/* Restrained Native Action Button ("Yeni seans") */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionText}
              onPress={handleAction}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: tokens.actionBg,
                  borderColor: tokens.actionBorder,
                },
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, { color: tokens.actionText }]}>
                {actionText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

const SYSTEM_FONT = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
  default: 'System',
});

const styles = StyleSheet.create({
  positionWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 15,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      } as unknown as Record<string, unknown>,
    }),
  },
  cardShadowDark: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.48,
        shadowRadius: 26,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.52), 0 2px 8px rgba(0, 0, 0, 0.28)',
      },
    }),
  },
  cardShadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  appIconImage: {
    width: 22,
    height: 22,
  },
  appName: {
    fontFamily: SYSTEM_FONT,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bullet: {
    fontSize: 10,
    marginHorizontal: -2,
  },
  timeText: {
    fontFamily: SYSTEM_FONT,
    fontSize: 12,
    fontWeight: '400',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.94 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 2,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontFamily: SYSTEM_FONT,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    marginTop: 3,
    fontFamily: SYSTEM_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  actionButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: SYSTEM_FONT,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

AppleNotificationBanner.displayName = 'AppleNotificationBanner';

