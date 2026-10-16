# App Store Compliance & Native Permissions Standard

Bu kural, mobil uygulamaların Apple App Store ve Google Play Store onay süreçlerinde reddedilmesini önlemek ve işletim sistemi seviyesindeki native izin ve yaşam döngüsü tuzaklarını engellemek için zorunludur.

---

## 1. Permission Flow & State Truthfulness (İzin Doğruluğu)

- **Asla İzin İstenmeden Önce UI State'i Güncellenemez:**
  - Kullanıcı bir toggle/switch'e bastığında UI state'i hemen `true` yapılamaz.
  - Önce işletim sistemi seviyesinde native izin diyaloğu tetiklenir (`requestPermissionAsync()`).
  - Sadece ve sadece işletim sistemi `granted === true` döndüğünde React state ve kalıcı depolama (AsyncStorage) `true` olarak güncellenir.
  - Kullanıcı "İzin Verme" (Deny) derse veya işlem hata (`catch`) ile sonuçlanırsa, UI state'i kesinlikle `false` kalmalı veya derhal `false`'a geri çekilmelidir. UI kullanıcıya ve sisteme asla yalan söyleyemez.

```ts
// YANLIS PATTERN:
setNotificationsEnabled(true);
savePreferences({ notificationsEnabled: true });
const granted = await requestNotificationPermission(); // Kullanıcı reddetse bile state açık kaldı!

// DOGRU ARCHITECTURAL PATTERN:
try {
  const granted = await requestNotificationPermission();
  if (granted) {
    setNotificationsEnabled(true);
    savePreferences({ notificationsEnabled: true });
    return true;
  } else {
    setNotificationsEnabled(false);
    savePreferences({ notificationsEnabled: false });
    return false;
  }
} catch {
  setNotificationsEnabled(false);
  savePreferences({ notificationsEnabled: false });
  return false;
}
```

---

## 2. Apple App Store Review: UIBackgroundModes Compliance

- **Sadece Sürekli Akış Çalan Uygulamalar Audio İzni Alabilir:**
  - Apple Guideline 2.5.4 gereğince, `UIBackgroundModes: ["audio"]` yetkisi **yalnızca** arka planda kesintisiz müzik, podcast, radyo veya sürekli beyaz gürültü (ambient sound) çalan uygulamalara verilir.
  - Süre bittiğinde tek seferlik zil, uyarı veya bip sesi çalan uygulamalarda Info.plist `UIBackgroundModes: audio` beyan edilirse Apple App Review doğrudan **Guideline 2.5.4 rejection** verir.
  - Tek seferlik süre sonu sesleri için native local notification sound payload (`sound: 'focal_alert.wav'`) kullanılır.

---

## 3. Global Error Boundary & Crash Safety

- Uygulamanın kök bileşeni (`App.tsx` veya root layout) mutlaka bir `RootErrorBoundary` ile sarmalanmalıdır.
- JS runtime seviyesinde render veya lifecycle sırasında fırlatılan bir istisna (exception), uygulamanın tamamen siyah ekrana düşmesine neden olmamalıdır.
- Minimalist, Dieter Rams tasarım diline uygun, kullanıcıyı bilgilendiren ve uygulamayı sıfırlama/yeniden başlatma imkanı sunan bir kurtarma ekranı (fallback UI) gösterilmelidir.

---

## 4. System Status Bar & Apple HIG Standartları

- Üretkenlik, odaklanma ve araç (utility) uygulamalarında sistem durum çubuğu gizlenemez (`StatusBar hidden={false}`).
- Kullanıcının sistem saatini, pil yüzdesini ve bağlantı durumunu görmesi Apple Human Interface Guidelines ve kullanıcı güvenliği açısından esastır. Sadece tam ekran video/oyun deneyimlerinde gizleme yapılabilir.
- Durum çubuğu rengi dinamik olarak aktif tema (Dark/Light) ile uyumlu olmalıdır.

---

## 5. Dil Algılama ve Çeviri Bütünlüğü

- Uygulama asla tek bir dile (örneğin sadece `tr`) hardcoded bağlanamaz.
- Cihazın yerel dili (`expo-localization` / `getLocales()`) okunmalı, desteklenen diller (`tr`, `en`) arasından en uygun olan seçilmelidir.
- **Inline Çeviri Yasağı:** Kod bileşenleri veya hook'lar içinde `language === 'tr' ? 'Metin A' : 'Text B'` şeklinde inline metin yazımı yasaktır. Tüm metinler tek bir kaynaktan (`src/i18n/translations.ts`) türetilmelidir.

---

## 6. Zamansal Veri Sınırları & Rolling Windows (Haftalık Sıfırlama)

- Haftalık veya günlük istatistik tutan veri yapıları, sadece gün dizini (`dayIndex: 0-6`) üzerine körü körüne ekleme yapamaz.
- Depolamada haftanın başlangıç tarihi (`weekStartDate`) veya ISO hafta numarası (`yearWeek: "2026-W42"`) saklanmalıdır.
- Yeni bir haftaya girildiğinde geçmiş haftanın verisi üzerine yığılmadan temiz bir döngü başlatılmalı ve geçmiş veri korunacaksa arşivlenmelidir.

---

## 7. Ses Motoru & Sessiz Mod Önizleme Kuralı (Audio Previews)

- Ayarlar veya özelleştirme çekmecesinde kullanıcı bir alarm/zil tonu önizlemesi dinlemek istediğinde (`previewToneSound`), bu eylem kullanıcının genel uygulama sesini kapatmış olmasından etkilenmemelidir.
- Önizleme açık bir kullanıcı niyetidir (explicit user intent); bu nedenle `forcePreview` bayrağı ile genel `isSoundEnabled === false` kontrolünü aşarak tonu çalmalıdır.

---

## 8. Release Altyapısı (EAS & Sürüm Eşitleme)

- Mağazaya gönderim öncesinde `eas.json` yapılandırması (development, preview, production profilleri) hazır olmalıdır.
- `npx expo-doctor` ile 18/18 kontrolün tamamı başarılı olmalıdır.
- Versiyon uyuşmazlığı tespit edildiğinde derhal `npx expo install --fix` çalıştırılmalıdır.
