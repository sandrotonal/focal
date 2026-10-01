const timers = new Map<string, ReturnType<typeof setTimeout>>();

function getNotificationApi(): typeof Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return window.Notification;
}

export async function requestNotificationPermission() {
  const notificationApi = getNotificationApi();
  if (!notificationApi) {
    return false;
  }

  if (notificationApi.permission === 'granted') {
    return true;
  }

  return (await notificationApi.requestPermission()) === 'granted';
}

export async function scheduleFocusCompletion(
  seconds: number,
  title = 'Odak oturumu tamamlandı',
  body = 'Kısa bir nefes al. Hazırsan yeni bir oturum başlat.'
) {
  const notificationApi = getNotificationApi();
  if (!notificationApi || notificationApi.permission !== 'granted' || seconds <= 0) {
    return null;
  }

  const identifier = `focus-${Date.now()}`;
  const timer = setTimeout(() => {
    new notificationApi(title, {
      body,
    });
    timers.delete(identifier);
  }, seconds * 1000);
  timers.set(identifier, timer);
  return identifier;
}

export async function cancelFocusCompletion(identifier: string | null) {
  if (!identifier) {
    return;
  }

  const timer = timers.get(identifier);
  if (timer) {
    clearTimeout(timer);
    timers.delete(identifier);
  }
}
