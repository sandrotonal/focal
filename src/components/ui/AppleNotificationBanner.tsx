import React, { useCallback } from 'react';
import {
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
import Svg, { Circle, Path } from 'react-native-svg';
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

export const AppleNotificationBanner: React.FC<AppleNotificationBannerProps> = ({
  visible,
  title,
  body,
  appName = 'FOCUS ENGINE',
  timeText = 'şimdi',
  actionText = 'Yeni seans',
  dismissText = 'Kapat',
  theme,
  colors,
  topInset,
  hapticsEnabled = true,
  onAction,
  onDismiss,
}) => {
  const isDark = theme === 'dark';
  const translateY = useSharedValue(0);

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

  const panGesture = Gesture.Pan()
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
    });

  const gestureStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  // Exact 1-to-1 match with reference Apple iOS banner design
  const cardBg = isDark ? 'rgba(50, 54, 62, 0.76)' : 'rgba(240, 242, 246, 0.88)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.09)';
  const primaryText = isDark ? '#FFFFFF' : '#111113';
  const secondaryText = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(30, 30, 35, 0.68)';
  const headerMetaText = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(30, 30, 35, 0.75)';
  const bulletText = isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(30, 30, 35, 0.40)';
  const timeMetaText = isDark ? 'rgba(255, 255, 255, 0.52)' : 'rgba(30, 30, 35, 0.52)';

  const closeBtnBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.07)';
  const closeIconColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)';

  const actionBtnBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const actionBtnBorder = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.10)';
  const actionBtnTextColor = isDark ? '#FFFFFF' : '#111113';

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
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            gestureStyle,
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${body}`}
        >
          {/* Header Row: White App Icon Squircle, App Name, Time, and Circular Close */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {/* White App Icon Squircle matching reference */}
              <View style={styles.appIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={8.5} stroke="#0A84FF" strokeWidth={2.5} />
                  <Circle cx={12} cy={12} r={3.2} fill="#0A84FF" />
                </Svg>
              </View>

              <Text style={[styles.appName, { color: headerMetaText }]}>
                {appName.toUpperCase()}
              </Text>
              <Text style={[styles.bullet, { color: bulletText }]}>•</Text>
              <Text style={[styles.timeText, { color: timeMetaText }]}>{timeText}</Text>
            </View>

            {/* Circular Close Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dismissText}
              hitSlop={12}
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: closeBtnBg },
                pressed && styles.itemPressed,
              ]}
            >
              <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                <Path
                  d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
                  stroke={closeIconColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
          </View>

          {/* Content & Action Row */}
          <View style={styles.contentRow}>
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: primaryText }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.body, { color: secondaryText }]} numberOfLines={2}>
                {body}
              </Text>
            </View>

            {/* Frosted Action Pill ("Yeni seans") */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionText}
              onPress={handleAction}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: actionBtnBg,
                  borderColor: actionBtnBorder,
                },
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, { color: actionBtnTextColor }]}>
                {actionText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

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
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 15,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(30px) saturate(190%)',
        WebkitBackdropFilter: 'blur(30px) saturate(190%)',
      } as unknown as Record<string, unknown>,
    }),
  },
  cardShadowDark: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 20px 42px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  cardShadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  appName: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bullet: {
    fontSize: 10,
    marginHorizontal: -2,
  },
  timeText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.6,
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
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  body: {
    marginTop: 3,
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
