---
description: Production-Ready Mobile App Store Compliance, Permission Integrity & Review Readiness Workflow
---

# Mobile App Store Compliance & Review Readiness Workflow

Bu iş akışı, bir mobil uygulamanın App Store (Apple) ve Play Store (Google) inceleme süreçlerine girmeden önce reddedilme risklerini sıfıra indirmek ve işletim sistemi seviyesindeki native izin/yaşam döngüsü açıklarını denetlemek için çalıştırılır.

---

## Aşama 1: İzin Doğruluğu ve Durum Bütünlüğü (Permission Integrity)

1. **İzin Reddi Simülasyonu:**
   - Bildirim, kamera veya konum gibi sistem izinleri açılmak istendiğinde önce native izin diyaloğunun açıldığı kontrol edilir.
   - Kullanıcı "İzin Verme" dediğinde state'in `false` kaldığı doğrulanır.
   - Hata (`catch`) durumunda UI'ın "açık" göstermediği teyit edilir.
2. **Kalıcı Depolama Senkronizasyonu:**
   - İzin red durumu kalıcı depolamaya (`AsyncStorage`) `false` olarak kaydedilmelidir.

---

## Aşama 2: App Store Manifest & Entitlement Denetimi (Review Rejection Traps)

1. **Arka Plan Modları (`UIBackgroundModes`):**
   - `app.json` veya `Info.plist` incelenir.
   - `UIBackgroundModes: ["audio"]` beyan edilmişse:
     - Uygulama arka planda kesintisiz müzik/podcast/radyo veya ambient beyaz gürültü çalıyor mu?
     - Eğer sadece süre sonu alarmı/bip çalıyorsa, bu izin derhal kaldırılır. Yerel bildirim sesi (`sound`) kullanılır. Aksi halde Apple Guideline 2.5.4 gereği incelemeden red alınır.
2. **Kamera / Konum / Bildirim Açıklama Metinleri (Usage Descriptions):**
   - `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` gibi metinlerin genel/boş bırakılmadığı, amacın net açıklandığı doğrulanır.

---

## Aşama 3: Çökme Koruması ve Dayanıklılık (Crash Resilience)

1. **Kök Seviye Error Boundary:**
   - `App.tsx` veya root layout'un `RootErrorBoundary` ile sarmalandığı doğrulanır.
   - Render crash durumunda uygulamanın siyah ekranda kalmadığı, kurtarma butonu içeren zarif bir ekran sunduğu teyit edilir.
2. **Sıfır Konsol / Crash Sessizliği:**
   - Prodüksiyonda sessizce yutulan (`empty catch`) veya patlamaya yol açan asenkron işlemler try-catch ve raporlama ile güvenceye alınır.

---

## Aşama 4: İki Dilli Bütünlük ve Sistem UI Standartları

1. **Status Bar Görünürlüğü (Apple HIG):**
   - `<StatusBar hidden />` kullanımı kontrol edilir. Odaklanma ve araç uygulamalarında saat ve pil gizlenemez.
2. **Merkezi Çeviri ve Dil Algılama:**
   - `expo-localization` ile cihaz dili okunuyor mu?
   - Kod içinde inline dil kontrolü (`language === 'tr' ? ... : ...`) kalmadığı grep ile taranır:
     ```bash
     grep -rn "language ===" src/
     ```
   - Tüm metinlerin `src/i18n/translations.ts` üzerinden geldiği doğrulanır.

---

## Aşama 5: Zamansal Telemetri ve Hafta Sınırları (Temporal Windows)

1. **Döngü Sıfırlanma Mantığı:**
   - `weeklyHistory` gibi haftalık veri dizilerinde hafta numarası veya başlangıç tarihi (`weekStartDate`) saklanmalı.
   - Yeni haftanın ilk kaydında eski haftanın üzerine yazılmadığı, dizinin sıfırlanıp yeni haftaya başlandığı test edilir.

---

## Aşama 6: Expo Sağlık ve EAS Build Doğrulaması

1. **Expo Doctor:**
   ```bash
   npx expo-doctor
   ```
   18/18 testin geçtiği teyit edilir. Versiyon uyuşmazlığında `npx expo install --fix` çalıştırılır.
2. **EAS Yapılandırması:**
   - `eas.json` dosyasının mevcut olduğu doğrulanır.
   - `preview` ve `production` profillerinin tanımlı olduğu teyit edilir.
