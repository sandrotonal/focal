import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsType from 'expo-notifications';

const isExpoGoOnAndroid = Platform.OS === 'android' && isRunningInExpoGo();

let notificationsModule: typeof NotificationsType | null = null;

if (!isExpoGoOnAndroid) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as typeof NotificationsType;

    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      void notificationsModule.setNotificationChannelAsync('focus-completion', {
        name: 'Odak Tamamlandı',
        importance: notificationsModule.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0A84FF',
        sound: 'default',
      });
    }
  } catch (error) {
    console.warn('[FOCAL] expo-notifications initialization bypassed:', error);
    notificationsModule = null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsModule) {
    return false;
  }

  try {
    const current = await notificationsModule.getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === notificationsModule.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const requested = await notificationsModule.requestPermissionsAsync();
    return Boolean(
      requested.granted ||
        requested.ios?.status === notificationsModule.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function scheduleFocusCompletion(
  seconds: number,
  title = 'Odak Seansı Tamamlandı',
  body = 'Derin çalışma turunu başarıyla tamamladın. Kısa bir mola verebilirsin.'
): Promise<string | null> {
  if (seconds <= 0 || !notificationsModule) {
    return null;
  }

  try {
    return await notificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: notificationsModule.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: notificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        channelId: 'focus-completion',
      },
    });
  } catch {
    return null;
  }
}

export async function cancelFocusCompletion(identifier: string | null): Promise<void> {
  if (identifier && notificationsModule) {
    try {
      await notificationsModule.cancelScheduledNotificationAsync(identifier);
    } catch {
      // safe fallback
    }
  }
}

