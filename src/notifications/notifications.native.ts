import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleFocusCompletion(seconds: number) {
  if (seconds <= 0) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Odak oturumu tamamlandı',
      body: 'Kısa bir nefes al. Hazırsan yeni bir oturum başlat.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelFocusCompletion(identifier: string | null) {
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}
