# FOCAL Mimari ve Tasarım Güncellemeleri Raporu

Bu doküman, FOCAL mobil uygulamasında gerçekleştirilen tüm mimari, mantıksal, arayüz (UI/UX) ve stabilite iyileştirmelerini detaylandırmaktadır.

---

## 1. Zamanlayıcı ve Yaşam Döngüsü İyileştirmeleri (Timer Lifecycle)

### 1.1 Soğuk Başlangıç ve Durum Eşitleme (Cold Start Race Condition)
- **Sorun:** Uygulama tamamen kapatılıp yeniden açıldığında (cold start), asenkron depolamadan (`initTimerStorage`) veriler gelene kadar geçen sürede sayaç sıfırlanabiliyor veya çalışır durumdaki seans düşebiliyordu.
- **Çözüm:** `useFocusTimer` içine kalıcı depolama çözümleme (hydration) etkisi entegre edildi. Depolama tamamlandığında duvar saati (`Date.now() - persisted.startedAt`) hesaplanarak geçen süre otomatik olarak telafi edildi.

### 1.2 Arka Plan / Ön Plan Senkronizasyonu (AppState Reconcilation)
- **Sorun:** Uygulama arka plana atıldığında JavaScript zamanlayıcıları kısıtlandığı için süre duraklayabiliyordu.
- **Çözüm:** `AppState` dinleyicisi ile uygulama arka plana geçtiğinde zaman damgası (`startedAt`) kaydedildi; ön plana dönüldüğünde geçen gerçek süre hesaplanıp sayaç ileri sarıldı veya hedefe ulaşıldıysa seans tamamlama tetiklendi.

### 1.3 Bildirim Senkronizasyonu
- Seans başladığında yerel bildirim (`expo-notifications`) planlanır ve seans durdurulduğunda ya da sıfırlandığında planlanan bildirim iptal edilir.

---

## 2. Pomodoro ve Standart Sayaç Mantıksal Ayrımı

### 2.1 Süre Seçildiğinde Pomodoro Kilitlenmesinin Çözümü
- **Sorun:** Pomodoro modu açıkken kullanıcı `SÜRE` sekmesine gidip `15 dk`, `45 dk` veya özel bir süre seçtiğinde, `pomodoroEnabled` kapatılmıyordu. Sayaç motoru kullanıcının seçtiği süreyi yok sayıp Pomodoro odağını (veya molayı) çalıştırmaya devam ediyordu.
- **Çözüm:**
  - `usePreferences` kancasındaki `selectPreset`, `commitDuration` ve `handleChangeDurationUnit` fonksiyonları güncellendi.
  - Kullanıcı `SÜRE` sekmesinden herhangi bir hazır seçenek veya özel süre girdiğinde, sistem niyetin standart bir odak seansı olduğunu belirler ve `pomodoroEnabled` değerini `false` yapar.
  - `App.tsx` içerisindeki güvenli işleyiciler (`handleSelectPresetSafe`, `handleCommitDurationSafe`, `handleChangeDurationUnitSafe`) sayacı sıfırlayarak seçilen sürenin doğrudan ekrana yansımasını sağlar (`15:00 ODAK`).

### 2.2 Çekmece Kapatma Mantığı (`closeDrawer`)
- **Sorun:** Çekmece kapatılırken her defasında `commitDuration()` çağrılıyor, bu da kullanıcının o an hangi sekmede olduğuna bakılmaksızın süre durumunu etkileyebiliyordu.
- **Çözüm:** `commitDuration()` çağrısı sadece aktif sekme `SÜRE` (`activeMenuIndex === 1`) olduğunda çalışacak şekilde sınırlandırıldı.

### 2.3 Şeffaf Kullanıcı Arayüzü Bildirimi
- Pomodoro açıkken `SÜRE` sekmesine girilirse listenin üstünde minimal bir rehber belirmektedir:
  > *"Pomodoro ritim modu devrede. Buradan bir süre seçtiğinde standart odak sayacına geçilir."*
- Kullanıcı herhangi bir süreye dokunduğu anda Pomodoro kapanır, bu bildirim kalkar ve seçilen sürenin yanında onay işareti (`✓`) yer alır.

---

## 3. FocusDrawer & Apple Clean List Arayüz Revizyonu

### 3.1 Çöken Boşluk ve Yapışık Tipografi Hatasının Giderilmesi
- **Sorun:** Eski arayüzde büyük rakam (`fontSize: 64`) ve `TextInput`, `alignItems: 'baseline'` içeren flex yapısı içinde çökmüş; sayı kaybolup ortada devasa karanlık bir boşluk ve eksi butonu (`—`) kalmıştı. Ayrıca `60m` gibi yazılarda harf ve rakam birbirine yapışmıştı.
- **Çözüm:**
  - Kutu, gri kart ve çerçeve kalıpları tamamen kaldırıldı.
  - Çekmecenin diğer sekmeleriyle (`SES`, `TEMA`, `BİLDİRİM`, `POMODORO`) birebir uyumlu **Apple Settings Clean List** mimarisine geçildi.
  - Sayı ve birim arasına doğal tipografik boşluk verildi (`15 dk`, `25 dk`, `45 dk`, `60 dk`).
  - Pomodoro mola ayarlarındaki yapışık `3m`, `5m`, `10m` metinleri dile duyarlı `3 dk`, `5 dk`, `10 dk` formatına geçirildi.

### 3.2 Özel Süre Giriş Alanı
- Listenin altında sabit boyutlu (`58x36 px`), taşmayan, çökmeyen ve iki temada da (`light`/`dark`) yüksek kontrastlı bir `Özel Süre` alanı oluşturuldu.
- Kullanıcı `1` ile `180` dakika (saniye modundaysa `5` ile `3600` saniye) arasında dilediği değeri doğrudan yazabilmektedir.

### 3.3 AppleNotificationBanner Bildirim Logosu Arka Planı
- **Sorun:** Bildirim banner'ında (`AppleNotificationBanner`), Focal logosunun arkasında 32x32 boyutunda beyaz dolgulu ve çerçeveli bir kare (`appIconContainer`) yer alıyordu. Bu durum logonun etrafında istenmeyen beyaz bir kutu oluşturuyordu.
- **Çözüm:** Beyaz kare kutu, gölge ve kenarlıklar tamamen kaldırıldı. Saydam Focal marka logosu (`Image`), minimal ve saf biçimde doğrudan banner başlık hizasına yerleştirildi.

---

## 4. Haftalık 7 Günlük Telemetri ve Seans Kaydı

- **Gerçek Veri:** Statik sahte veriler yerine `usePreferences` içinde gerçek seans kayıtlarından beslenen `weeklyHistory` dizisi (`[0, 0, 0, 0, 0, 0, 0]`) aktif edildi.
- **Otomatik Dağılım:** Seans tamamlandığında (`recordCompletedSession`), seans süresi haftanın geçerli gününe (Pazartesi=0 .. Pazar=6) eklenir ve kalıcı olarak saklanır.
- **Orantılı Grafik:** Gösterge sekmesindeki çubuklar 60 dakikalık tavan değere göre orantılı olarak mikro-dolgu ile çizilir.

---

## 5. Doğrulama ve Kalite Güvencesi (QA)

| Kontrol | Araç | Durum |
| :--- | :--- | :--- |
| Tip Güvenliği | TypeScript Compiler (`npx tsc --noEmit`) | 0 Hata |
| Kod Standartları | Expo ESLint (`npx expo lint`) | 0 Hata, 0 Uyarı |
| Bağımlılık & Yapılandırma | Expo Doctor (`npx expo-doctor`) | 18/18 Kontrol Başarılı |
| Birim Testleri | Jest Test Suite (`npm test`) | 5/5 Suite, 41/41 Test Başarılı |
| Git Kuralları | Local Isolation & Approval | Kullanıcı onayı olmadan push yapılmaz |
| Dil & Tipografi | Zero-Emoji & Temiz Kısaltmalar | Tam Uyum |

---

## 6. App Store Uyumluluğu ve Mimari İyileştirmeler (P0 / P1)

### 6.1 Bildirim İzin Doğruluğu (Permission Truthfulness)
- **Sorun:** Kullanıcı bildirim izni vermeden önce arayüzde bildirim toggle'ı hemen `true` yapılıyor, işletim sistemi izni reddetse dahi UI açık kalabiliyordu.
- **Çözüm:** `usePreferences.ts` içinde iyimser güncelleme kaldırıldı. Sadece işletim sistemi `granted === true` döndüğünde durum `true` yapılır; izin reddedildiğinde veya hata alındığında durum `false`'a geri alınır ve AsyncStorage ile senkronize edilir.

### 6.2 Apple Review Guideline 2.5.4 (UIBackgroundModes: Audio) Kaldırılması
- **Sorun:** `app.json` içinde `UIBackgroundModes: ["audio"]` tanımlıydı. Uygulama sürekli arka plan sesi çalmayan bir sayaç aracı olduğundan, App Store incelemesinde anında red (reject) sebebi teşkil ediyordu.
- **Çözüm:** `app.json` iOS konfigürasyonundan `UIBackgroundModes: ["audio"]` kaldırıldı.

### 6.3 Yerel Zaman Dilimi Gece Yarısı Kayması (Timezone Midnight Offset)
- **Sorun:** `toISOString().slice(0, 10)` kullanımı UTC zamanına göre tarih ürettiğinden, UTC+3 zaman diliminde (ör. Türkiye) Pazartesi gecesi 00:00 - 02:59 arasında tarih UTC Pazar olarak hesaplanıyor ve haftalık sayaç devri bozuluyordu.
- **Çözüm:** `src/utils/date.ts` modülü oluşturularak `getFullYear()`, `getMonth() + 1` ve `getDate()` ile yerel takvim tabanlı ve `setHours(0, 0, 0, 0)` normalizasyonlu saf tarih fonksiyonlarına geçildi.

### 6.4 Tek Doğruluk Kaynağı Tip Tanımları (Single Source of Truth)
- **Sorun:** `FocusPreferences` tipi hem `src/storage/preferencesStorage.ts` hem de `src/components/onboarding/types.ts` içinde iki ayrı yerde tanımlanmıştı ve uyumsuzluk riski taşıyordu.
- **Çözüm:** Onboarding içindeki mükerrer tip tanımı kaldırılarak depolama katmanındaki kanonik tip dışa aktarıldı ve `OnboardingScreen` `onComplete` prop'u `Partial<FocusPreferences>` ile gevşetildi.

### 6.5 Ses Önizleme Baypas Mekanizması
- **Sorun:** Sesler kapalıyken (`soundEnabled === false`), çekmecedeki ses tonu seçiminde önizleme çalınamıyordu.
- **Çözüm:** `playFocusCompleteSound` fonksiyonuna `force = false` parametresi eklendi ve çekmecedeki `previewToneSound(tone, true)` çağrısıyla ses ayarı kapalı olsa bile kullanıcının seçtiği tonu duyabilmesi sağlandı.

### 6.6 StatusBar Görünürlüğü (Apple HIG)
- **Sorun:** `App.tsx` içinde StatusBar `hidden` olarak ayarlanmıştı. Apple İnsan Arayüzü Yönergelerine göre üretkenlik araçlarında durum çubuğunun gizlenmesi uygun değildir.
- **Çözüm:** `hidden` prop'u kaldırılarak temaya göre dinamik `light`/`dark` stil verildi.

### 6.7 Kök Hata Yakalayıcı (Root Error Boundary)
- **Sorun:** Beklenmeyen bir JavaScript çalışma zamanı hatasında uygulama çöküyor veya beyaz ekranda kalıyordu.
- **Çözüm:** Dieter Rams minimalist tasarım ilkelerine uygun, yüksek kontrastlı ve keskin kenarlıklı `RootErrorBoundary` bileşeni geliştirildi. Hata oluştuğunda alt ağacı temiz bir şekilde unmount/remount eden `resetKey` mekanizması ile kurtarma düğmesi sağlandı.

### 6.8 Yerelleştirme ve Merkezi Çeviri Temizliği
- **Sorun:** `App.tsx` içinde `language === 'tr'` şeklinde inline ternary metinler bulunuyordu.
- **Çözüm:** Tüm metinler `src/i18n/translations.ts` merkezi sözlüğüne taşındı (`startBreak`, `tapToPauseBreak`, `tapToStartBreak`, dinamik Pomodoro seans tamamlandı gövde metinleri).

### 6.9 EAS Yapılandırması ve Bağımlılık Eşitlemesi
- **EAS Build:** `eas.json` oluşturularak development, preview ve production build profilleri yapılandırıldı.
- **Expo Doctor:** Expo SDK 57 uyumlu yamalar uygulanarak Metro runtime, expo-asset ve expo-notifications versiyonları senkronize edildi.

---

## 7. Değiştirilen ve Eklenen Dosyalar Özeti

1. `AGENTS.md`: App Store uyumluluğu, izin doğruluğu ve sıfır emoji kuralının eklenmesi.
2. `App.tsx`: StatusBar görünürlüğü, RootErrorBoundary sarmalaması, merkezi çeviriler ve güvenli çekmece işleyicileri.
3. `app.json`: `UIBackgroundModes: ["audio"]` kaldırılması.
4. `eas.json`: EAS build konfigürasyonu.
5. `package.json` & `package-lock.json`: Expo SDK 57 uyumlu bağımlılık güncellemeleri.
6. `src/audio/soundEngine.ts`: `force` parametresi ile ses kapalıyken önizleme desteği.
7. `src/components/common/RootErrorBoundary.tsx`: Minimalist kök hata yakalayıcı bileşeni.
8. `src/components/onboarding/OnboardingScreen.tsx` & `src/components/onboarding/types.ts`: Tekil `FocusPreferences` tipi.
9. `src/components/timer/TimerDisplay.tsx`: Erişilebilirlik etiketlerindeki ölü kod temizliği.
10. `src/hooks/useFocusTimer.ts`: Pomodoro döngüsü sıfırlama, duvar saati senkronizasyonu.
11. `src/hooks/usePreferences.ts`: Bildirim izni doğrulaması, haftalık tarih devri, Pomodoro/süre ayrımı.
12. `src/i18n/translations.ts`: Merkezi çeviri sözlüğü genişletmesi.
13. `src/notifications/notifications.native.ts`: Bildirim kanalı adının uluslararası standartlaştırılması.
14. `src/storage/preferencesStorage.native.ts` & `src/storage/preferencesStorage.web.ts`: `weeklyHistoryStartDate` depolaması.
15. `src/utils/date.ts`: Yerel zaman dilimi ve hafta başlangıcı hesaplama yardımcıları.
16. `.agents/rules/10-app-store-compliance-and-native-permissions.md`: App Store uyumluluk kuralları.
17. `.agents/skills/app-store-compliance/SKILL.md`: App Store uyumluluk becerisi.
18. `.agents/workflows/app-store-readiness-audit.md`: App Store hazırlık denetim iş akışı.
19. `__tests__/preferencesStorage.test.ts` & `__tests__/useFocusTimer.test.ts`: Kapsamlı birim testleri.

---

## 8. Kalan P0/P1 İyileştirmeleri ve Görsel Güncellemeleri

### 8.1 Hafta Hesabı DST & UTC+3 Doğrulaması (P0-1)
- `src/utils/date.ts` içindeki `getMondayOfWeek` yardımcı fonksiyonu, hem `Date` hem de `string` parametreleri güvenle kabul edecek şekilde güncellendi.
- `date.setHours(0, 0, 0, 0)` normalizasyonu `setDate(diff)` sonrasında da uygulanarak DST (yaz saati) kaymaları tamamen engellendi.
- `__tests__/preferencesStorage.test.ts` içine Türkiye yerel saatinde Pazartesi 00:30 (`2026-10-19T00:30:00+03:00`) test senaryosu eklenerek `2026-10-19` haftalık devri doğrulandı.

### 8.2 RootErrorBoundary Üretim Telemetrisi & Kurtarma (P0-2)
- Beklenmeyen çalışma zamanı hataları üretim ortamında kaybolmayacak şekilde `AsyncStorage` üzerindeki `focal.last-error` anahtarına JSON olarak yazıldı (`message`, `stack`, `componentStack`, `timestamp`).
- `handleReset` kurtarma tetikleyicisi, üretimde `Updates.reloadAsync()` çağrısı yapacak; geliştirme ortamında veya reload başarısızlığında `resetKey` artırımı ile tüm alt bileşen ağacını temiz bir şekilde remount edecek mimariye kavuşturuldu.
- Geliştirici hata kutusu yalnızca `__DEV__` durumunda sınırlandırıldı.

### 8.3 EAS ve expo-updates Yapılandırması (P0-3)
- `npx expo install expo-updates` ile SDK 57 uyumlu paket kuruldu.
- `app.json` içine `"runtimeVersion": { "policy": "appVersion" }` eklendi.
- `eas.json` yapılandırmasına `development`, `preview` ve `production` build kanalları eklendi, preview APK ve production AAB ayrımı korundu.

### 8.4 Ölü Kod Temizliği ve Prop Budama (P1-1)
- `src/components/ui/demo.tsx`, `src/components/ui/option-wheel.tsx`, `src/lib/utils.ts` ve `src/components/onboarding/AmbientGlow.tsx` atıl dosyaları tamamen silindi.
- `Artwork3D.tsx` içindeki 4 eski uyumluluk alias'ı kaldırıldı.
- `MainFocus3D.tsx`, `TimerDisplay.tsx` ve `App.tsx` bileşen zincirinden kullanılmayan `sessionMinutes` ve `secondaryColor` prop'ları budandı.
- `translations.ts` dosyasından atıl `pullToReset`, `releaseToReset` ve `completedSessions` anahtarları temizlendi.

### 8.5 resetTimer Pomodoro Tutarlılığı (P1-3)
- Sayaç sıfırlandığında Pomodoro açık ise seans modu her zaman `'focus'` ve döngü her zaman `1` olacak şekilde standartlaştırıldı.
- `getResetPomodoroState` saf fonksiyonu yazılarak `__tests__/useFocusTimer.test.ts` içine 3 yeni birim testi eklendi.

### 8.6 Android Bildirim Kanalı Yerelleştirmesi (P1-4)
- `src/notifications/notifications.native.ts` içinde cihaz diline (`Intl.DateTimeFormat`) göre `'Odak Seansları'` / `'Focus Sessions'` kanal adı ve açıklaması dinamik olarak ayarlandı.
- `app.json` `expo-notifications` plugin yapılandırmasına bildirim ikonu (`./assets/icon.png`) ve rengi (`#0A84FF`) tanımlandı.

### 8.7 README ve Ekran Görüntüleri Revizyonu
- Playwright otomasyonu ile çalışan uygulamadan güncel ekran görüntüleri yakalandı (`390x844` piksel):
  - `04_main_timer.png`: Sade, logo başlıklı ana sayaç ekranı.
  - `05_drawer_menu.png`: Apple Settings Clean List düzeni ve haftalık gerçek telemetri grafiği.
  - `06_notification_banner.png`: Arkasındaki beyaz kutu kaldırılmış, şeffaf saf Focal logolu Apple Notification Banner.
- `README.md` içerisindeki mimari ilkeler ve proje dosya ağacı güncel duruma uyarlandı.
