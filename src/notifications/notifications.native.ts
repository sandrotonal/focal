import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  void Notifications.setNotificationChannelAsync('focus-completion', {
    name: 'Odak Tamamlandı',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0A84FF',
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
  } catch {
    return false;
  }
}

export async function scheduleFocusCompletion(seconds: number): Promise<string | null> {
  if (seconds <= 0) {
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Odak Seansı Tamamlandı',
        body: 'Derin çalışma turunu başarıyla tamamladın. Kısa bir mola verebilirsin.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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
  if (identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      // safe fallback
    }
  }
}
