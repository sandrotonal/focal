export type Language = 'tr' | 'en';

export interface TranslationSchema {
  common: {
    appName: string;
    minuteShort: string;
    secondShort: string;
    minutes: string;
    seconds: string;
    continue: string;
    start: string;
    skip: string;
    ready: string;
    active: string;
    inactive: string;
    silent: string;
  };
  drawer: {
    title: string;
    menu: {
      focus: string;
      duration: string;
      theme: string;
      notifications: string;
      haptics: string;
      sound: string;
      language: string;
    };
    sections: {
      focusDuration: string;
      focusSubtitle: string;
      customDuration: string;
      customPlaceholder: string;
      unitMinutes: string;
      unitSeconds: string;
      save: string;
      darkMode: string;
      lightMode: string;
      darkSubtitle: string;
      lightSubtitle: string;
      notificationsTitle: string;
      notificationsSubtitle: string;
      hapticsTitle: string;
      hapticsSubtitle: string;
      soundTitle: string;
      soundSubtitle: string;
      languageTitle: string;
      languageSubtitle: string;
    };
    stats: {
      sessions: string;
      minutes: string;
    };
    aria: {
      themeSwitch: string;
      notificationsSwitch: string;
      hapticsSwitch: string;
      soundSwitch: string;
      languageSwitch: string;
    };
  };
  mainTimer: {
    focus: string;
    tapToToggle: string;
    pullToReset: string;
    releaseToReset: string;
    sessionCompleted: string;
    sessionCompletedDesc: string;
    completedSessions: (count: number) => string;
    resetBadge: string;
    newSession: string;
    now: string;
    dismiss: string;
    ariaStart: string;
    ariaPause: string;
    ariaMenuOpen: string;
    ariaMenuClose: string;
    ariaNewSession: string;
    ariaReset: string;
    ariaHint: string;
  };
  onboarding: {
    slide1: {
      eyebrow: string;
      title: string;
      body: string;
      tag: string;
    };
    slide2: {
      eyebrow: string;
      title: string;
      body: string;
      pomodoro: { label: string; subtitle: string };
      deepWork: { label: string; subtitle: string };
      flowState: { label: string; subtitle: string };
      ultraSprint: { label: string; subtitle: string };
    };
    slide3: {
      eyebrow: string;
      title: string;
      body: string;
      notifications: string;
      notificationsCaption: string;
      haptics: string;
      hapticsCaption: string;
      sound: string;
      soundCaption: string;
    };
  };
  notifications: {
    title: string;
    body: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  tr: {
    common: {
      appName: 'FOCUS ENGINE',
      minuteShort: 'dk',
      secondShort: 'sn',
      minutes: 'Dakika',
      seconds: 'Saniye',
      continue: 'DEVAM ET',
      start: 'ODAKLANMAYA BAŞLA',
      skip: 'ATLA',
      ready: 'HAZIR',
      active: 'AÇIK',
      inactive: 'KAPALI',
      silent: 'SESSİZ',
    },
    drawer: {
      title: 'KONTROL',
      menu: {
        focus: 'Odak',
        duration: 'Süre',
        theme: 'Tema',
        notifications: 'Bildirim',
        haptics: 'Haptik',
        sound: 'Ses',
        language: 'Dil',
      },
      sections: {
        focusDuration: 'Seans Süresi',
        focusSubtitle: 'Seçilen blok uzunluğu',
        customDuration: 'Özel Süre Belirle',
        customPlaceholder: 'Örn: 25',
        unitMinutes: 'Dakika',
        unitSeconds: 'Saniye',
        save: 'KAYDET',
        darkMode: 'Karanlık Mod',
        lightMode: 'Aydınlık Mod',
        darkSubtitle: 'OLED saf siyah arayüz',
        lightSubtitle: 'Yüksek kontrastlı aydınlık arayüz',
        notificationsTitle: 'Bitiş Bildirimi',
        notificationsSubtitle: 'Seans tamamlandığında sistem uyarısı',
        hapticsTitle: 'Haptik Titreşim',
        hapticsSubtitle: 'Dokunsal fiziksel geri bildirim',
        soundTitle: 'Akustik Efektler',
        soundSubtitle: '528Hz & 432Hz odak ve mekanik tonlar',
        languageTitle: 'Arayüz Dili',
        languageSubtitle: 'Türkçe (TR) / English (EN)',
      },
      stats: {
        sessions: 'OTURUM',
        minutes: 'DAKİKA',
      },
      aria: {
        themeSwitch: 'Karanlık tema anahtarı',
        notificationsSwitch: 'Bitiş bildirimi anahtarı',
        hapticsSwitch: 'Haptik titreşim anahtarı',
        soundSwitch: 'Akustik ses efektleri anahtarı',
        languageSwitch: 'Arayüz dili değiştirme anahtarı',
      },
    },
    mainTimer: {
      focus: 'Focus',
      tapToToggle: 'Dokunarak başlat / durdur',
      pullToReset: 'Seansı sıfırlamak için aşağı çek',
      releaseToReset: 'Bırak ve Sıfırla',
      sessionCompleted: 'Seans tamamlandı',
      sessionCompletedDesc: 'Hedeflenen odak süresine ulaştın.',
      completedSessions: (count: number) => `Tamamlanan: ${count} seans`,
      resetBadge: 'SIFIRLA',
      newSession: 'Yeni seans',
      now: 'şimdi',
      dismiss: 'Kapat',
      ariaStart: 'Odaklanma sayacını başlat',
      ariaPause: 'Odaklanma sayacını duraklat',
      ariaMenuOpen: 'Menüyü aç',
      ariaMenuClose: 'Menüyü kapat',
      ariaNewSession: 'Yeni oturum başlat',
      ariaReset: 'Sayacı sıfırla',
      ariaHint: 'Başlatmak veya duraklatmak için dokunun. Aşağı çekerek sıfırlayabilirsiniz.',
    },
    onboarding: {
      slide1: {
        eyebrow: '01 // ODAK ÇEKİRDEĞİ',
        title: 'Zihnini topla.',
        body: 'Bölünmelerden arınmış minimalist alan. Zamanı başlat ve sadece önündeki tek bir göreve odaklan.',
        tag: 'ODAK PROTOKOLÜ',
      },
      slide2: {
        eyebrow: '02 // ÇALIŞMA RİTMİ',
        title: 'Kişisel ritmini seç.',
        body: 'Kısa sprint mi, yoksa kesintisiz derin bir çalışma bloğu mu? Seans uzunluğunu belirle.',
        pomodoro: { label: 'Pomodoro', subtitle: 'Kısa sprint & yüksek momentum' },
        deepWork: { label: 'Deep Work', subtitle: 'Yoğun zihinsel odak bloğu' },
        flowState: { label: 'Flow State', subtitle: 'Kesintisiz tek akış seansı' },
        ultraSprint: { label: 'Ultra Sprint', subtitle: 'Maksimum dayanıklılık turu' },
      },
      slide3: {
        eyebrow: '03 // GERİ BİLDİRİM',
        title: 'Duyusal uyarılar.',
        body: 'Seans bitişini kaçırmaman için taptic motor, bildirimler ve akustik tonları yapılandır.',
        notifications: 'Bitiş Bildirimi',
        notificationsCaption: 'Zaman dolduğunda sessiz sistem uyarısı',
        haptics: 'Haptik Titreşim',
        hapticsCaption: 'Apple Taptic motor ile dokunsal temas',
        sound: 'Akustik Efektler',
        soundCaption: '528Hz & 432Hz saf meditasyon tonları',
      },
    },
    notifications: {
      title: 'Odak Seansı Tamamlandı',
      body: 'Tebrikler! Seansını başarıyla tamamladın.',
    },
  },
  en: {
    common: {
      appName: 'FOCUS ENGINE',
      minuteShort: 'min',
      secondShort: 'sec',
      minutes: 'Minutes',
      seconds: 'Seconds',
      continue: 'CONTINUE',
      start: 'START FOCUS',
      skip: 'SKIP',
      ready: 'READY',
      active: 'ON',
      inactive: 'OFF',
      silent: 'SILENT',
    },
    drawer: {
      title: 'CONTROLS',
      menu: {
        focus: 'Focus',
        duration: 'Duration',
        theme: 'Theme',
        notifications: 'Notification',
        haptics: 'Haptics',
        sound: 'Sound',
        language: 'Language',
      },
      sections: {
        focusDuration: 'Session Duration',
        focusSubtitle: 'Selected block duration',
        customDuration: 'Set Custom Duration',
        customPlaceholder: 'e.g. 25',
        unitMinutes: 'Minutes',
        unitSeconds: 'Seconds',
        save: 'SAVE',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        darkSubtitle: 'OLED true black interface',
        lightSubtitle: 'High contrast light interface',
        notificationsTitle: 'Completion Alert',
        notificationsSubtitle: 'System alert when session ends',
        hapticsTitle: 'Haptic Feedback',
        hapticsSubtitle: 'Tactile physical feedback',
        soundTitle: 'Acoustic Effects',
        soundSubtitle: '528Hz & 432Hz focus and mechanical tones',
        languageTitle: 'Interface Language',
        languageSubtitle: 'English (EN) / Türkçe (TR)',
      },
      stats: {
        sessions: 'SESSIONS',
        minutes: 'MINUTES',
      },
      aria: {
        themeSwitch: 'Dark theme toggle',
        notificationsSwitch: 'Completion notification toggle',
        hapticsSwitch: 'Haptic feedback toggle',
        soundSwitch: 'Acoustic effects toggle',
        languageSwitch: 'Interface language toggle',
      },
    },
    mainTimer: {
      focus: 'Focus',
      tapToToggle: 'Tap to start / pause',
      pullToReset: 'Pull down to reset session',
      releaseToReset: 'Release to Reset',
      sessionCompleted: 'Session completed',
      sessionCompletedDesc: 'Target focus duration reached.',
      completedSessions: (count: number) => `Completed: ${count} sessions`,
      resetBadge: 'RESET',
      newSession: 'New session',
      now: 'now',
      dismiss: 'Dismiss',
      ariaStart: 'Start focus timer',
      ariaPause: 'Pause focus timer',
      ariaMenuOpen: 'Open menu',
      ariaMenuClose: 'Close menu',
      ariaNewSession: 'Start new session',
      ariaReset: 'Reset timer',
      ariaHint: 'Tap to start or pause. Pull down to reset the session.',
    },
    onboarding: {
      slide1: {
        eyebrow: '01 // FOCUS CORE',
        title: 'Gather your mind.',
        body: 'A distraction-free minimalist space. Start the clock and immerse in a single priority.',
        tag: 'FOCUS PROTOCOL',
      },
      slide2: {
        eyebrow: '02 // FOCUS RHYTHM',
        title: 'Choose your rhythm.',
        body: 'A quick sprint or an uninterrupted deep work block? Define your session length.',
        pomodoro: { label: 'Pomodoro', subtitle: 'Quick sprint & high momentum' },
        deepWork: { label: 'Deep Work', subtitle: 'Intense cognitive focus block' },
        flowState: { label: 'Flow State', subtitle: 'Unbroken single flow session' },
        ultraSprint: { label: 'Ultra Sprint', subtitle: 'Maximum endurance interval' },
      },
      slide3: {
        eyebrow: '03 // SENSORY FEEDBACK',
        title: 'Sensory alerts.',
        body: 'Configure the taptic engine, notifications, and acoustic tones so you never miss a transition.',
        notifications: 'Completion Alert',
        notificationsCaption: 'Silent system alert when time expires',
        haptics: 'Haptic Vibration',
        hapticsCaption: 'Tactile touch via Apple Taptic motor',
        sound: 'Acoustic Effects',
        soundCaption: '528Hz & 432Hz pure meditation tones',
      },
    },
    notifications: {
      title: 'Focus Session Completed',
      body: 'Well done! You have successfully completed your session.',
    },
  },
};
