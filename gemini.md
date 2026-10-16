Kanka, senior gözüyle acımasızca baktım. Lafı dolandırmadan söylüyorum: şu an elindeki şey iyi bir prototype, store'a çıkacak ürün değil. 6.5/10.
npx tsc --noEmit = 0 hata, temiz. npx expo-doctor = 17/18 geçti, 4 paket eski (expo ~57.0.28, expo-notifications, expo-asset, metro-runtime). npx expo install --fix lazım.
İyi yaptıkların:
- Timer mantığı doğru: useFocusTimer.ts:401-424 wall-clock reconciliation + AppState düzeltmesi var. Drift'e karşı düşünmüşsün.
- Storage'ı native/web diye ayırmışsın, serial write queue koymuşsun (preferencesStorage.native.ts:157-167). Çoğu junior bunu atlar.
- Ses motorunda tick pool + lazy preload (soundEngine.ts:148-164) doğru karar. Testler var, 5 dosya.
Şimdi eksikler, öncelik sırasıyla:
P0 - Store'a çıkışı engeller:
1. EAS yok. eas.json yok, app.json'da extra.eas.projectId yok. Yani eas build, eas update, OTA, kanal yönetimi hiç yok. Bu haliyle release APK/AAB üretemezsin.
2. Bildirim izni bug'ı. src/hooks/usePreferences.ts:219-248 - toggle'a basınca önce setNotificationsEnabled(true) yapıyorsun, sonra izin istiyorsun. Kullanıcı reddederse UI "açık" gösteriyor ama izin yok. Reddedince false'a geri çekmen lazım. Şu an yalan söylüyor.
3. UIBackgroundModes: audio yanlış kullanım. app.json:18-20'de arka plan sesi izni almışsın ama sürekli ses çalmıyorsun, sadece kısa wav patlatıyorsun. Apple review'da bunu sorar, reddedilme sebebi. Ya kaldır, ya gerçek background task'a geç.
4. Error Boundary yok. App.tsx:454-460 - tek bir JS hatası tüm app'i siyah ekrana düşürür. Sentry / expo-dev-client / crash reporting sıfır. Production'da kör uçuyorsun.
5. Expo Router kullanmıyorsun. AGENTS.md Router istiyor ama sende src/app/ yok, her şey tek App.tsx (523 satır) içinde. FocusDrawer.tsx tek başına 1264 satır - bu god component. Bakımı imkansızlaşır.
P1 - Gerçek kullanıcıda patlar:
 6. StatusBar hidden. App.tsx:328 - saati/pili gizliyorsun. Focus app'te kullanıcı süreyi merak eder, Apple HIG'e de ters.
 7. Locale algılama yok. expo-localization yok. Dil default tr, cihaz İngilizce olsa bile Türkçe açılıyor. usePreferences.ts:31 hardcoded.
 8. Çeviri bypass. App.tsx:196-202 completion mesajlarını translations dosyasından değil inline yazmışsın. Yarın bir metin değişince iki yeri düzeltmek zorundasın.
 9. Haftalık grafik hiç sıfırlanmıyor. recordCompletedSession hep topluyor (usePreferences.ts:301-319), hafta dönümü, streak, reset mantığı yok. 3 ay sonra grafik anlamsızlaşır.
10. Timer hedefi persist edilmiyor. Arka planda öldürülüp açılınca elapsed kurtarılıyor ama effectiveTargetSeconds değişmişse (kullanıcı süre değiştirdiyse) tutarsızlık var. Ayrıca resetTimer her zaman focus'a dönüyor (useFocusTimer.ts:502-527), pomodoro ortasındaysan cycle kayboluyor.
11. Onboarding eksik veri geçiyor. OnboardingScreen.tsx:106-118 - onComplete'e pomodoro alanları, weeklyHistory, soundAlertTone göndermiyorsun. Şu an latestPreferencesRef merge kurtarıyor ama tip olarak kırılgan.
12. Sound preview sessizken çalışmıyor. previewToneSound -> playFocusCompleteSound isSoundEnabled kontrolüne takılıyor. Ses kapalıyken ton seçen kullanıcı hiçbir şey duyamaz, ne seçtiğini bilemez.
P2 - Kalite / performans:
13. Tip tanımları 3 yerde kopyala-yapıştır: preferencesStorage.web.ts, .native.ts, translations.ts hepsinde ayrı Language, ThemeMode. Tek source of truth yok.
14. soundEngine.ts:178-182 - import anında setTimeout(preload) side-effect. Test edilebilirliği düşürür, cleanupAudioEngine hiç çağrılmıyor.
15. Sonsuz animasyonlar (MainFocus3D.tsx:57-66 20sn rotation + 2.4sn pulse) timer çalışırken pil yer. Düşük seviye Android'de FPS testi yapmadan bilemezsin - yapilacaklar.md'de zaten yazmışsın, haklısın.
16. Tema OS'yi takip etmiyor. userInterfaceStyle: automatic demişsin ama theme state'i hep dark başlıyor, useColorScheme dinlemiyorsun.
17. CI yok, eas update kanalı yok, Maesto/Detox E2E yok. Sadece unit test var.
Store öncesi checklist:
- npx expo install --fix
- eas.json + projectId + preview/production profilleri
- Bildirim izni bug fix
- audio background mode karar ver (kaldır veya gerçek task)
- Error Boundary + Sentry
- App.tsx böl: TimerScreen, useNotifications, CompletionBanner
- Gerçek cihazda 60dk + kilit ekranı + kill/reopen testi
- TalkBack/VoiceOver turu
İstersen P0'lardan başlayıp tek tek düzeltelim. Hangisinden girelim: bildirim bug'ı mı, EAS setup mı, App.tsx parçalama mı?