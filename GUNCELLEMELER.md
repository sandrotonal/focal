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
| Birim Testleri | Jest Test Suite (`npm test`) | 5/5 Suite, 24/24 Test Başarılı |
| Git Kuralları | Local Isolation | Kullanıcı onayı olmadan push yapılmadı |
| Dil & Tipografi | Zero-Emoji & Temiz Kısaltmalar | Tam Uyum |

---

## 6. Değiştirilen Dosyalar Özeti

1. `App.tsx`: Çekmece işleyicileri, güvenli sıfırlama, Pomodoro toggle güvenliği ve menü senkronizasyonu.
2. `src/components/FocusDrawer.tsx`: Apple Settings Clean List düzeni, çökmeyen özel süre alanı, Pomodoro durum bildirimi, yapışık birimlerin düzeltilmesi.
3. `src/hooks/usePreferences.ts`: Süre seçildiğinde Pomodoro'yu otomatik kapatma, `setPomodoroActive` fonksiyonu, kalıcı tercihler güncellemesi.
4. `src/hooks/useFocusTimer.ts`: Soğuk başlangıç telafisi, AppState duvar saati doğrulaması, Pomodoro mod geçişinde temiz sıfırlama.
5. `src/components/ui/AppleNotificationBanner.tsx`: Bildirim başlığındaki beyaz kare arka planın kaldırılarak saydam saf logonun konumlandırılması.
