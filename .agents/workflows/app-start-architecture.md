---
description: Production-Ready Mobile Cold Start, Resource Lifecycle & Store Compliance Audit Workflow
---

# Mobile Cold Start & Lifecycle Audit Workflow

Bu iş akışı, bir mobil uygulamanın ilk açılış (cold start), arka plan depolama eşitlemesi, ses dekoder yönetimi ve uygulama mağazası (App Store / Google Play) uygunluğunu denetler.

---

## Aşama 1: Depolama ve Başlangıç Yarış Denetimi (Cold Start Gate)

1. **AsyncStorage / SQLite Yükleme Doğrulaması:**
   - Depolama kütüphanesinin diski asenkron okuduğu teyit edilir.
   - React state'i içinde `isLoaded` veya `isReady` bayrağının `false` ile başladığı ve diskten okuma bittiğinde `true` yapıldığı kontrol edilir.
   - Asenkron disk okuması tamamlanmadan önce UI'ın kullanıcı verilerini varsayılanlarla ezmediği doğrulanır.

2. **Kayıt Şeması ve Tip Koruması:**
   - Depolamadan okunan JSON verisindeki tüm alanların güncel union tipleriyle (örneğin yeni eklenen ses tonları, diller, temalar) eşleştiği; bilinmeyen değerler yerine geçerli yeni seçeneklerin korunduğu doğrulanır.

---

## Aşama 2: Atomik Tercih Kayıt Denetimi (Write Race Gate)

1. **Eşzamanlı Yazma Testi:**
   - Kullanıcının hızlıca iki ayara peş peşe basması (ör. haptic toggle -> sound toggle <50ms) simüle edilir.
   - "Read-modify-write" deseni yerine bellek tabanlı tekil durum (Single Source of Truth) ve asenkron yazma kuyruğu (serial write queue) kullanıldığı kontrol edilir.

---

## Aşama 3: Donanım ve Medya Kaynak Yönetimi (Native Resource Gate)

1. **AudioPlayer ve Dekoder Havuzu:**
   - Açılışta 4'ten fazla eşzamanlı `AudioPlayer` nesnesinin başlatılmadığı doğrulanır.
   - Sadece kritik yol (haptik/tık sesleri ve kullanıcının seçtiği aktif ton) önden yüklenir.
   - Çekmecedeki diğer tonlar (preview/alternatifler) sadece kullanıcı talep ettiğinde dinamik (lazy) olarak yüklenir.

2. **Arka Plan İzin Paritesi:**
   - Kodda `shouldPlayInBackground: true` kullanılıyorsa, `app.json` içinde `UIBackgroundModes: ["audio"]` tanımlı olduğu doğrulanır.

---

## Aşama 4: Paket Bütünlüğü ve Mağaza Uyumu (Store Compliance Gate)

1. **Paket Kimliği (Namespace):**
   - `bundleIdentifier` ve `android.package` alanlarının genel geçer isimler (`com.focal.app` vb.) yerine kuruluşa özgü benzersiz bir ters alan adı formatında olduğu doğrulanır.

2. **Asset Tekrarları:**
   - `assets/` dizininde aynı ikili (binary) veriye sahip mükerrer dosyalar bulunmadığı kontrol edilir.

3. **Dokümantasyon Doğruluğu:**
   - `README.md` içerisindeki rozetler, depolama açıklamaları ve bağımlılıkların `package.json` ile yüzde yüz uyumlu olduğu teyit edilir.
