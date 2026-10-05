---
description: Production-Grade Quality Audit & 4-Gate Verification Workflow
---

# Production Audit Workflow

Bu iş akışı, bir özelliği veya tüm uygulamayı "localhost'ta çalışıyor" aşamasından "production-ready" seviyesine taşımak için 4 kapılı doğrulama sistemini çalıştırır.

---

## Aşama 1: GATE 1 — Kod ve Mimari Kalitesi

1. **Tip Doğrulaması:**
   ```bash
   npx tsc --noEmit
   ```
   Çıktıda 0 hata alındığı teyit edilir. Gevşek tipler (`any`, `@ts-ignore`) temizlenir.

2. **Linter Denetimi:**
   ```bash
   npm run lint # veya npx expo lint
   ```
   Kritik uyarı ve hatalar giderilir.

3. **Gizli Bilgi ve Güvenlik Taraması:**
   - Kod tabanında hardcoded API key, private token, veritabanı şifresi veya servis anahtarı bulunmadığı doğrulanır.
   - `.env` dosyalarının `.gitignore` altında olduğu teyit edilir.

4. **Bağımlılık Sağlığı:**
   ```bash
   npm audit
   ```
   Yüksek ve kritik güvenlik açıkları kontrol edilir.

---

## Aşama 2: GATE 2 — Davranışsal Bütünlük ve Edge Case Testleri

1. **İzole Mantık Testleri (Unit):**
   - Hesaplamalar, zamanlayıcılar, formatlayıcılar ve durum geçişleri test edilir.

2. **Uç Durum (Edge Case) Denetimleri:**
   - Boş veri (empty state)
   - Geçersiz girdi (invalid input)
   - İnternet kesintisi (offline / network error)
   - Zaman aşımı (timeout)
   - Hızlı ardışık tıklamalar (debounce / duplicate action)
   - Oturum ve token süresi dolması (expired session)

3. **Hata ve Durum Yönetimi (State Completeness):**
   - Asenkron her işlem 6 durumu eksiksiz tanımlamalıdır:
     `idle` → `loading` → `success` / `empty` / `error` → `retry`
   - Sonsuz yükleme (infinite loading) veya donmuş arayüzler engellenir.

---

## Aşama 3: GATE 3 — Kullanıcı Deneyimi, Performans ve Erişilebilirlik

1. **Performans ve Akıcılık:**
   - Mobilde 60-120 FPS akıcılık, worklet kullanımı, ana thread bloklanmasının engellenmesi.
   - Bellek sızıntısı (memory leak) olmaması.
   - Web için Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1).

2. **UI/UX Koruma Kuralı (Preserve Existing UX):**
   - Teknik düzeltmeler yapılırken mevcut arayüz gereksiz yere değiştirilmez.
   - Dieter Rams & Apple donanım estetiği (monokrom kontrast, 1px hairlines, fiziksel kapanma animasyonları) korunur.
   - Koyu mod yüzey hiyerarşisi (`#111215` taban, `#17181C` panel, `#1D1F24` sistem yüzeyi) muhafaza edilir.

3. **Erişilebilirlik (a11y):**
   - Tüm buton ve etkileşimli alanlar en az 44x44pt dokunma hedefine sahip olmalıdır.
   - `accessibilityLabel`, `accessibilityRole` ve ekran okuyucu uyumluluğu kontrol edilir.
   - `useReducedMotion` tercihi dikkate alınır.
   - Renk kontrastı (WCAG 2.1 AA) sağlanır.

---

## Aşama 4: GATE 4 — Production Ortamı ve Sürüm Onayı

1. **Canlı Sürüm Derlemesi (Release Build):**
   - Web: `npm run build`
   - Mobil: `npx expo-doctor` ve release profil doğrulaması.

2. **Duman Testi (Smoke Test):**
   - Temiz kurulum ile birincil kullanıcı akışı (primary product journey) baştan sona test edilir.
   - Çökme raporlama (Sentry) ve telemetri doğrulanır.

3. **Sürüm Kararı:**
   - 4 kapının tamamı geçilmeden `PRODUCTION READY` kararı verilmez.
