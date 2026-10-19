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
      pomodoro: string;
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
      flipToFocusTitle: string;
      flipToFocusSubtitle: string;
      soundTitle: string;
      soundSubtitle: string;
      pomodoroTitle: string;
      pomodoroSubtitle: string;
      soundAlertTone: string;
      soundAlertToneSubtitle: string;
      soundTones: {
        crystal: string;
        aurora: string;
        clarity: string;
        tibetan: string;
        mechanical: string;
      };
      soundToneSubtitles: {
        crystal: string;
        aurora: string;
        clarity: string;
        tibetan: string;
        mechanical: string;
      };
      ambientSoundTitle: string;
      ambientSoundSubtitle: string;
      ambientSounds: {
        none: string;
        brown: string;
        rain: string;
        storm: string;
        ocean: string;
      };
      ambientSoundSubtitles: {
        none: string;
        brown: string;
        rain: string;
        storm: string;
        ocean: string;
      };

      pomodoroPlan: {
        title: string;
        focusLabel: string;
        shortBreakLabel: string;
        longBreakLabel: string;
        cycleExplanation: (cycles: number, longBreakMinutes: number) => string;
        presetsTitle: string;
        presetStandard: string;
        presetDeep: string;
        presetSprint: string;
        shortBreakSelect: string;
        longBreakSelect: string;
      };
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
      flipToFocusSwitch: string;
      soundSwitch: string;
      pomodoroSwitch: string;
      soundToneSelect: string;
      languageSwitch: string;
    };
  };
  mainTimer: {
    focus: string;
    stageFocus: string;
    stageShortBreak: string;
    stageLongBreak: string;
    cycleBadge: (cycle: number, max?: number) => string;
    tapToToggle: string;
    skipBreak: string;
    sessionCompleted: string;
    sessionCompletedDesc: string;
    resetBadge: string;
    newSession: string;
    startBreak: string;
    tapToPauseBreak: string;
    tapToStartBreak: string;
    now: string;
    dismiss: string;
    ariaStart: string;
    ariaPause: string;
    ariaSkipBreak: string;
    ariaMenuOpen: string;
    ariaMenuClose: string;
    ariaNewSession: string;
    ariaReset: string;
    ariaHint: string;
  };
  onboarding: {
    skip: string;
    notNow: string;
    skipForNow: string;
    continue: string;
    start: string;
    allowNotifications: string;
    slide1: {
      title: string;
      body: string;
    };
    slide2: {
      title: string;
      body: string;
      recommended: string;
      pomodoro: { label: string; subtitle: string };
      deepWork: { label: string; subtitle: string };
      flowState: { label: string; subtitle: string };
      ultraSprint: { label: string; subtitle: string };
    };
    slide3: {
      title: string;
      body: string;
      buttonEnable: string;
      enabledBadge: string;
      loading: string;
      benefit: string;
    };
    slide4: {
      title: string;
      body: string;
      summaryTitle: string;
      dailyCadence: string;
      sessionLabel: string;
      dailyGoalLabel: string;
      notifications: string;
      haptics: string;
      sound: string;
      statusActive: string;
      statusInactive: string;
      statusOn: string;
      statusOff: string;
    };
  };
  notifications: {
    title: string;
    body: string;
    breakTitle: string;
    breakBody: string;
    pomodoroShortBreakTitle: string;
    pomodoroShortBreakBody: string;
    pomodoroShortBreakBodyDynamic: (minutes: number) => string;
    pomodoroLongBreakTitle: string;
    pomodoroLongBreakBody: string;
    pomodoroLongBreakBodyDynamic: (minutes: number) => string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  tr: {
    common: {
      appName: 'FOCAL',
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
      title: 'FOCAL',
      menu: {
        focus: 'Odak',
        duration: 'Süre',
        pomodoro: 'Pomodoro',
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
        flipToFocusTitle: 'Ters Çevir ve Başlat',
        flipToFocusSubtitle: 'Yüzüstü algılandığında sayacı başlatır',
        soundTitle: 'Akustik Efektler',
        soundSubtitle: 'Sistem ve odak tonları',
        pomodoroTitle: 'Pomodoro Ritmi',
        pomodoroSubtitle: '25 dk odak · 5 dk mola · 4 döngü',
        soundAlertTone: 'Bitiş Tonu',
        soundAlertToneSubtitle: 'Rezonans karakteri',
        soundTones: {
          crystal: 'Kristal',
          aurora: 'Aurora',
          clarity: 'Berrak',
          tibetan: 'Zen',
          mechanical: 'Mekanik',
        },
        soundToneSubtitles: {
          crystal: 'Kristal tınısı',
          aurora: 'Eterik armoni',
          clarity: 'Ahşap akoru',
          tibetan: 'Meditasyon kasesi',
          mechanical: 'Mekanik darbe',
        },
        ambientSoundTitle: 'Odak Ambiyansı',
        ambientSoundSubtitle: 'Arka plan sesi',
        ambientSounds: {
          none: 'Kapalı',
          brown: 'Kahverengi Gürültü',
          rain: 'Yağmur',
          storm: 'Fırtına',
          ocean: 'Okyanus',
        },
        ambientSoundSubtitles: {
          none: 'Sessiz',
          brown: 'Derin frekans',
          rain: 'Doğal yağmur dokusu',
          storm: 'Gök gürültüsü ve sağanak',
          ocean: 'Dalgalar ve kıyı esintisi',
        },

        pomodoroPlan: {
          title: 'RİTİM PLANI',
          focusLabel: 'ODAK',
          shortBreakLabel: 'KISA MOLA',
          longBreakLabel: 'UZUN MOLA',
          cycleExplanation: (cycles: number, longBreakMinutes: number) =>
            `${cycles} odak seansı sonrası ${longBreakMinutes} dk uzun mola verilir`,
          presetsTitle: 'Hazır Ritimler',
          presetStandard: 'Standart',
          presetDeep: 'Derin',
          presetSprint: 'Sprint',
          shortBreakSelect: 'Kısa Mola',
          longBreakSelect: 'Uzun Mola',
        },
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
        flipToFocusSwitch: 'Ters çevir ve odaklan anahtarı',
        soundSwitch: 'Akustik ses efektleri anahtarı',
        pomodoroSwitch: 'Pomodoro ritmi anahtarı',
        soundToneSelect: 'Uyarı tonu seçimi',
        languageSwitch: 'Arayüz dili değiştirme anahtarı',
      },
    },
    mainTimer: {
      focus: 'Odak',
      stageFocus: 'ODAK',
      stageShortBreak: 'KISA MOLA',
      stageLongBreak: 'UZUN MOLA',
      cycleBadge: (cycle: number, max: number = 4) => `DÖNGÜ ${cycle}/${max}`,
      tapToToggle: 'Dokunarak başlat / durdur',
      skipBreak: 'Molayı Geç',
      sessionCompleted: 'Seans tamamlandı',
      sessionCompletedDesc: 'Hedeflenen odak süresine ulaştın.',
      resetBadge: 'SIFIRLA',
      newSession: 'Yeni Seans',
      startBreak: 'Molayı Başlat',
      tapToPauseBreak: 'Molayı duraklatmak için dokun',
      tapToStartBreak: 'Molayı başlatmak için dokun',
      now: 'şimdi',
      dismiss: 'Kapat',
      ariaStart: 'Odaklanma sayacını başlat',
      ariaPause: 'Odaklanma sayacını duraklat',
      ariaSkipBreak: 'Molayı atla ve yeni seansa geç',
      ariaMenuOpen: 'Menüyü aç',
      ariaMenuClose: 'Menüyü kapat',
      ariaNewSession: 'Yeni oturum başlat',
      ariaReset: 'Sayacı sıfırla',
      ariaHint: 'Başlatmak veya duraklatmak için dokunun. Aşağı çekerek sıfırlayabilirsiniz.',
    },
    onboarding: {
      skip: 'Atla',
      notNow: 'Şimdi değil',
      skipForNow: 'Şimdi geç',
      continue: 'Devam et',
      start: 'Odaklanmaya başla',
      allowNotifications: 'Bildirimlere izin ver',
      slide1: {
        title: 'Bölünmeden çalış.',
        body: 'Reklamsız, hesapsız, tamamen çevrimdışı odak zamanlayıcısı.',
      },
      slide2: {
        title: 'Ne kadar odaklanabilirsin?',
        body: 'Sana en uygun seans süresini seç.',
        recommended: 'Önerilen',
        pomodoro: { label: 'Pomodoro', subtitle: 'Kısa sprint ve yüksek momentum' },
        deepWork: { label: 'Derin Çalışma', subtitle: 'Yoğun zihinsel odak bloğu' },
        flowState: { label: 'Akış Hali', subtitle: 'Kesintisiz tek akış seansı' },
        ultraSprint: { label: 'Uzun Seans', subtitle: 'Maksimum zihinsel dayanıklılık' },
      },
      slide3: {
        title: 'Seans bitince haber verelim.',
        body: 'Sadece seans bittiğinde bildirim göndeririz. Dikkat dağıtan hiçbir reklam veya gereksiz uyarı yok.',
        buttonEnable: 'Bildirimlere izin ver',
        enabledBadge: 'Bildirimler Etkin',
        loading: 'İzin Bekleniyor...',
        benefit: 'Zamanlayıcı tamamlandığında tek bir sessiz uyarı alırsın.',
      },
      slide4: {
        title: 'Her şey hazır.',
        body: 'Kişisel odak planın oluşturuldu.',
        summaryTitle: 'Kişisel Odak Planı',
        dailyCadence: 'Günde 1 Seans',
        sessionLabel: 'SEANS',
        dailyGoalLabel: 'GÜNLÜK HEDEF',
        notifications: 'Bitiş Bildirimi',
        haptics: 'Titreşim',
        sound: 'Ses Efekti',
        statusActive: 'Açık',
        statusInactive: 'Kapalı',
        statusOn: 'Açık',
        statusOff: 'Kapalı',
      },
    },
    notifications: {
      title: 'Odak Seansı Tamamlandı',
      body: 'Hedeflenen odak süresine ulaştın. Zihnini dinlendirmek için kısa bir mola verebilirsin.',
      breakTitle: 'Mola Tamamlandı',
      breakBody: 'Zihnini tazeledin. Yeni odak seansına hazırsın.',
      pomodoroShortBreakTitle: 'Odak Seansı Tamamlandı',
      pomodoroShortBreakBody: 'Tebrikler! 5 dakikalık kısa dinlenme zamanı.',
      pomodoroShortBreakBodyDynamic: (minutes: number) => `Tebrikler! ${minutes} dakikalık kısa dinlenme zamanı.`,
      pomodoroLongBreakTitle: '4 Odak Seansı Tamamlandı',
      pomodoroLongBreakBody: 'Mükemmel disiplin! 15 dakikalık uzun mola zamanı.',
      pomodoroLongBreakBodyDynamic: (minutes: number) => `Mükemmel disiplin! ${minutes} dakikalık uzun mola zamanı.`,
    },
  },
  en: {
    common: {
      appName: 'FOCAL',
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
      title: 'FOCAL',
      menu: {
        focus: 'Focus',
        duration: 'Duration',
        pomodoro: 'Pomodoro',
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
        flipToFocusTitle: 'Flip to Start',
        flipToFocusSubtitle: 'Starts timer when placed face down',
        soundTitle: 'Acoustic Effects',
        soundSubtitle: 'System and focus tones',
        pomodoroTitle: 'Pomodoro Rhythm',
        pomodoroSubtitle: '25m focus · 5m break · 4 cycles',
        soundAlertTone: 'Alert Tone',
        soundAlertToneSubtitle: 'Resonance character',
        soundTones: {
          crystal: 'Crystal',
          aurora: 'Aurora',
          clarity: 'Clarity',
          tibetan: 'Zen',
          mechanical: 'Mechanical',
        },
        soundToneSubtitles: {
          crystal: 'Crystal chime',
          aurora: 'Ethereal harmony',
          clarity: 'Rosewood triad',
          tibetan: 'Meditation bowl',
          mechanical: 'Chronometer impulse',
        },
        ambientSoundTitle: 'Focus Soundscape',
        ambientSoundSubtitle: 'Background sound',
        ambientSounds: {
          none: 'Off',
          brown: 'Brown Noise',
          rain: 'Rain',
          storm: 'Storm',
          ocean: 'Ocean',
        },
        ambientSoundSubtitles: {
          none: 'Silence',
          brown: 'Deep frequency',
          rain: 'Natural rainfall texture',
          storm: 'Thunder & downpour',
          ocean: 'Waves & distant birds',
        },

        pomodoroPlan: {
          title: 'RHYTHM PLAN',
          focusLabel: 'FOCUS',
          shortBreakLabel: 'SHORT BREAK',
          longBreakLabel: 'LONG BREAK',
          cycleExplanation: (cycles: number, longBreakMinutes: number) =>
            `${cycles} focus sessions followed by a ${longBreakMinutes}m long break`,
          presetsTitle: 'Rhythm Presets',
          presetStandard: 'Standard',
          presetDeep: 'Deep',
          presetSprint: 'Sprint',
          shortBreakSelect: 'Short Break',
          longBreakSelect: 'Long Break',
        },
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
        flipToFocusSwitch: 'Flip to focus toggle',
        soundSwitch: 'Acoustic effects toggle',
        pomodoroSwitch: 'Pomodoro rhythm toggle',
        soundToneSelect: 'Alert tone selector',
        languageSwitch: 'Interface language toggle',
      },
    },
    mainTimer: {
      focus: 'Focus',
      stageFocus: 'FOCUS',
      stageShortBreak: 'SHORT BREAK',
      stageLongBreak: 'LONG BREAK',
      cycleBadge: (cycle: number, max: number = 4) => `CYCLE ${cycle}/${max}`,
      tapToToggle: 'Tap to start / pause',
      skipBreak: 'Skip Break',
      sessionCompleted: 'Session completed',
      sessionCompletedDesc: 'Target focus duration reached.',
      resetBadge: 'RESET',
      newSession: 'New Session',
      startBreak: 'Start Break',
      tapToPauseBreak: 'Tap to pause break',
      tapToStartBreak: 'Tap to start break',
      now: 'now',
      dismiss: 'Dismiss',
      ariaStart: 'Start focus timer',
      ariaPause: 'Pause focus timer',
      ariaSkipBreak: 'Skip break and proceed to next session',
      ariaMenuOpen: 'Open menu',
      ariaMenuClose: 'Close menu',
      ariaNewSession: 'Start new session',
      ariaReset: 'Reset timer',
      ariaHint: 'Tap to start or pause. Pull down to reset the session.',
    },
    onboarding: {
      skip: 'Skip',
      notNow: 'Not now',
      skipForNow: 'Skip for now',
      continue: 'Continue',
      start: 'Start focusing',
      allowNotifications: 'Allow notifications',
      slide1: {
        title: 'Work uninterrupted.',
        body: 'An ad-free, account-free, fully offline focus timer.',
      },
      slide2: {
        title: 'How long can you focus?',
        body: 'Pick a session length that suits your rhythm.',
        recommended: 'Recommended',
        pomodoro: { label: 'Pomodoro', subtitle: 'Short sprint & high momentum' },
        deepWork: { label: 'Deep Work', subtitle: 'Intense cognitive focus block' },
        flowState: { label: 'Flow State', subtitle: 'Unbroken single flow session' },
        ultraSprint: { label: 'Long Session', subtitle: 'Maximum cognitive endurance' },
      },
      slide3: {
        title: "We'll let you know when time is up.",
        body: 'We only send a notification when your session finishes. Zero ads, zero marketing, zero distractions.',
        buttonEnable: 'Allow notifications',
        enabledBadge: 'Notifications Enabled',
        loading: 'Requesting Permission...',
        benefit: 'Get a gentle, quiet chime right when your focus timer finishes.',
      },
      slide4: {
        title: 'Everything is set.',
        body: 'Your personalized focus setup is ready.',
        summaryTitle: 'Your Focus Plan',
        dailyCadence: '1 Session Daily',
        sessionLabel: 'SESSION',
        dailyGoalLabel: 'DAILY GOAL',
        notifications: 'Completion Alert',
        haptics: 'Haptics',
        sound: 'Sound Effects',
        statusActive: 'On',
        statusInactive: 'Off',
        statusOn: 'On',
        statusOff: 'Off',
      },
    },
    notifications: {
      title: 'Focus Session Completed',
      body: 'Target focus duration reached. Take a short mindful break to recharge.',
      breakTitle: 'Break Completed',
      breakBody: 'Mind recharged. Ready for the next focus session.',
      pomodoroShortBreakTitle: 'Focus Session Completed',
      pomodoroShortBreakBody: 'Well done! Time for a 5-minute mindful break.',
      pomodoroShortBreakBodyDynamic: (minutes: number) => `Well done! Time for a ${minutes}-minute short rest.`,
      pomodoroLongBreakTitle: '4 Focus Sessions Completed',
      pomodoroLongBreakBody: 'Superb discipline! Time for a 15-minute long break.',
      pomodoroLongBreakBodyDynamic: (minutes: number) => `Outstanding discipline! Time for a ${minutes}-minute long break.`,
    },
  },
};
