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
  actionText = 'YENİ SEANS',
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
        translateY.value = withSpring(0, { damping: 24, stiffness: 340 });
      }
    });

  const gestureStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  // Solid, architectural, zero-glass colors
  const cardBg = isDark ? colors.panel : '#FFFFFF';
  const cardBorder = colors.hairline;
  const primaryText = colors.primary;
  const secondaryText = colors.secondary;
  const mutedText = colors.muted;

  // Solid high-contrast action button (Swiss/Apple Hardware aesthetic)
  const buttonBg = isDark ? '#FFFFFF' : '#1D1D1F';
  const buttonTextColor = isDark ? '#000000' : '#FFFFFF';
  const closeBtnBg = isDark ? '#1C1C1E' : '#EBEBEF';
  const iconBadgeBg = isDark ? '#18181A' : '#F2F2F5';

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20).stiffness(260).mass(0.8)}
      exiting={SlideOutUp.duration(160)}
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
          {/* Header Row: App Identity & Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.appIconBadge,
                  {
                    backgroundColor: iconBadgeBg,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={8.5} stroke={colors.accent} strokeWidth={2.4} />
                  <Circle cx={12} cy={12} r={3} fill={colors.accent} />
                </Svg>
              </View>
              <Text style={[styles.appName, { color: secondaryText }]}>
                {appName.toUpperCase()}
              </Text>
              <Text style={[styles.bullet, { color: mutedText }]}>•</Text>
              <Text style={[styles.timeText, { color: mutedText }]}>{timeText}</Text>
            </View>

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
              <Svg width={9} height={9} viewBox="0 0 12 12" fill="none">
                <Path
                  d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
                  stroke={secondaryText}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
          </View>

          {/* Content Row: Text & Solid High-Contrast Action Button */}
          <View style={styles.contentRow}>
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: primaryText }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.body, { color: secondaryText }]} numberOfLines={2}>
                {body}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionText}
              onPress={handleAction}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: buttonBg },
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, { color: buttonTextColor }]}>
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
    left: 16,
    right: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  cardShadowDark: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      },
    }),
  },
  cardShadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
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
    gap: 6,
  },
  appIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bullet: {
    fontSize: 8,
  },
  timeText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
  },
  closeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    gap: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  body: {
    marginTop: 2,
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
