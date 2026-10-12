Viewed yapilacaklar.md:1-100
Ran command: `Get-ChildItem -Path assets -Recurse | Select-Object Name, Length`

Bir **Senior Full Stack Architect** ve **SaaS Expert** gözüyle baktığımızda, Focal'ın temel çekirdeği (tasarım dili, ses mimarisi, fizik tabanlı animasyonları) şu an çok güçlü bir temele oturdu. 

Uygulamayı bir prototipten **App Store / Google Play'de öne çıkacak ticari kalitede bir SaaS ürününe** dönüştürmek için yapabileceğimiz geliştirmeleri 4 ana başlıkta toplayabiliriz:

---

### 1. Mimari ve Kod Temizliği (Refactoring)
* **`App.tsx`'in Parçalanması (~1800 satır):**
  * `FocusDrawer.tsx` şu an doğrudan `App.tsx` içinde yaşıyor. Bunu `src/components/FocusDrawer.tsx` altına taşımak.
  * Mantıksal katmanı iki ana custom hook'a ayırmak:
    * `useFocusTimer`: Zaman sayımı, `Date.now()` drift telafisi, arka plan/ön plan (`AppState`) senkronizasyonu ve bildirim tetiklemeleri.
    * `usePreferences`: Dil, tema, haptik, ses ve süre tercihlerinin saklanması/yüklenmesi.
  * **Kazanım:** Hem kod okunabilirliği artar hem de `useFocusTimer` UI'dan bağımsız olarak headless birim testlerine tabi tutulabilir.

### 2. SaaS ve Kullanıcı Bağlılığı (Product & Retention)
* **Minimalist Odak İstatistikleri & Streak (01 Focus Sekmesi):**
  * Menüdeki ilk sekmede şu an sadece oturum sayısı ve toplam dakika var. Oraya Apple Fitness veya Dieter Rams tarzı 1px hairlines ile **Haftalık Odak Grafiği (Son 7 gün)** ve **Günlük Seri (Streak)** eklenebilir.
* **Pomodoro / Mola Modu (Opsiyonel Ritim):**
  * Sadece tek düze geri sayım yerine; 25 dk Odak -> 5 dk Kısa Mola -> 15 dk Uzun Mola döngüsünü açıp kapatabilen minimalist bir anahtar.
* **Arka Plan Ambiyans / Beyaz Gürültü (Ambient Focus Noise):**
  * SaaS odak uygulamalarında (Endel, Brain.fm, Opal) en çok kullanılan özellik. Sayaç çalışırken çok derinden gelen kesintisiz pembe gürültü (pink noise), yağmur veya 432 Hz odak dronu.

### 3. Performans ve Donanım Optimizasyonu
* **Büyük Asset'lerin Küçültülmesi:**
  * `assets/focal-logo.png` tek başına **~1 MB** yer kaplıyor. Bunu kayıpsız sıkıştırarak (veya vektörel SVG/optimize WebP) 30-40 KB seviyesine çekmek hem açılış süresini hem de bellek tüketimini ciddi oranda rahatlatır.
* **Arka Plan Pil Optimizasyonu:**
  * Uygulama arka plana (`AppState === 'background'`) geçtiğinde JavaScript setInterval döngüsünü tamamen dondurup, uygulama öne geldiğinde geçen zamanı tek seferde hesaplamak (pil tüketimini sıfıra indirir).

### 4. Test Kapsamı ve Canlıya Çıkış
* **Timer Lifecycle Birim Testleri:**
  * Sistem saati ileri/geri alındığında, telefon uykuya dalıp uyandığında timer'ın sapma yapmadığını doğrulayan mock testler.
* **EAS Production Build Hazırlığı:**
  * Mağazaya gönderilecek release APK / AAB paketinin oluşturulması (`eas build --platform android`).

---

### Hangi Adımla Başlayalım?
1. **Önce Mimari Temizlik:** `FocusDrawer` ve `useFocusTimer` hook'unu ayırıp `App.tsx`'i modüler hale getirelim.
2. **Performans / Asset:** 1 MB'lık logoyu optimize edip arka plan pil tüketimi mantığını sıkılaştıralım.
3. **Yeni Özellik:** 01 Focus sekmesine haftalık minimalist odak istatistik grafiğini ekleyelim.

Hangisine odaklanmak istersen doğrudan o adımla başlayabiliriz.