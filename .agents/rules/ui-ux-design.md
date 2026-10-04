# UI/UX & Design Standards

## 1. Aesthetic Direction (Swiss Minimal & Apple Pro Hardware)
- **Tasarım Dili:** Dieter Rams ilkeleri, İsviçre tipografisi ve Apple Pro donanım estetiği (monokrom kontrast, keskin oranlar, rafine mikro-etkileşimler).
- **Yüzey ve Malzemeler:**
  - Kullanıcı açıkça talep etmedikçe rastgele cam (glassmorphism), neon parlamalar veya şişkin jelibon efektlerinden kaçın.
  - Katı (solid), net, yüksek kontrastlı yüzeyleri ve 1px hassas hairline kenarlıkları tercih et.
  - Karanlık modda derin OLED kontrastı (`#000000` / `#0B0B0D`), aydınlık modda saf beyaz ve titanyum grisi (`#FFFFFF` / `#F5F5F7`).

## 2. Animasyon ve Hareket (Reanimated & Physics)
- **Kapanma ve Çıkış Animasyonları:**
  - Açılan her bileşenin (modal, bildirim, buton, drawer) mutlaka akıcı bir **kapanma/çıkış animasyonu** bulunmalıdır.
  - Bileşenler anında unmount edilip ekrandan pat diye kaybolamaz; state veya callback önce animasyonu tamamlar, ardından unmount gerçekleşir.
- **Performans:**
  - Tüm animasyonlar UI thread üzerinde 60/120fps çalışmalı; `useSharedValue`, `withSpring`, `withTiming` ve worklet'ler kullanılmalıdır.
  - `useReducedMotion()` kancası daima dikkate alınmalıdır.

## 3. Dokunmatik ve Erişilebilirlik (A11y)
- **Dokunma Alanı (Touch Targets):**
  - Tüm butonlar ve etkileşimli alanlar en az 44x44pt dokunma alanına veya uygun `hitSlop` değerine sahip olmalıdır.
  - `accessible`, `accessibilityRole`, `accessibilityLabel` ve `accessibilityHint` değerleri eksiksiz tanımlanmalıdır.
- **Haptik ve Ses:**
  - Kullanıcı tercihlerine (`hapticsEnabled`, `soundEnabled`) tam riayet edilmeli, gereksiz ve agresif titreşimlerden kaçınılmalıdır.
