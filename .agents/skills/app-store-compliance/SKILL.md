---
name: app-store-compliance
description: Auditing and enforcing mobile app store submission rules, native permission state integrity, Apple review rejection prevention (UIBackgroundModes), Error Boundaries, and zero-leak temporal rolling telemetry.
---

# App Store Compliance & Native Resilience Skill

## Overview

Bu yetenek, bir React Native / Expo uygulamasını App Store (Apple) ve Google Play Store onay standartlarına uygun hale getirmek, yaygın inceleme (review) redlerini önlemek ve native işletim sistemi entegrasyonlarını hatasız kılmak için kullanılır.

---

## 1. Permission Flow & State Truthfulness Checklist

- [ ] **Opt-in Önce Native Sor:** Toggle açıldığında ASLA doğrudan `true` set edilmez.
- [ ] **Red Edilirse Revert Et:** Kullanıcı sistem diyaloğunda "İzin Verme" seçerse React state ve AsyncStorage derhal `false` yapılır.
- [ ] **Catch Bloğu Koruması:** Asenkron izin çağrısında istisna fırlatılırsa state `false`'a çekilir.

### Örnek Doğru Entegrasyon

```typescript
const handleTogglePermission = async () => {
  if (isEnabled) {
    setIsEnabled(false);
    await savePreferences({ isEnabled: false });
    return;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setIsEnabled(granted);
    await savePreferences({ isEnabled: granted });
  } catch (error) {
    setIsEnabled(false);
    await savePreferences({ isEnabled: false });
  }
};
```

---

## 2. Background Modes Audit (Apple Guideline 2.5.4)

| Kullanım Durumu | `UIBackgroundModes: ["audio"]` Gerekli mi? | İnceleme Sonucu |
|---|---|---|
| Kesintisiz Müzik / Podcast / Radyo | Evet | Kabul edilir (Audible background stream) |
| Kesintisiz Pembe Gürültü / Ambient Focus Sound | Evet | Kabul edilir (Audible continuous stream) |
| Süre bitince tek seferlik zil/alarm sesi | **HAYIR (ASLA)** | **REJECT (Apple Guideline 2.5.4)** |

Tek seferlik bildirim alarmlarında arka plan sesi istenemez; yerel bildirim ses dosyası (`sound: 'alert.wav'`) kullanılmalıdır.

---

## 3. Global Error Boundary Requirement

Her release öncesi `App.tsx` kökünün bir `ErrorBoundary` ile sarıldığı teyit edilir:

```tsx
export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <FocusEngineScreen />
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
```

---

## 4. Status Bar Guidelines (Apple HIG)

- Odaklanma ve araç uygulamalarında saat ve pil gizlenemez.
- `<StatusBar hidden={false} style={theme === 'dark' ? 'light' : 'dark'} />` kullanılmalıdır.

---

## 5. Temporal Windowing (Haftalık Veri Bütünlüğü)

Haftalık veri yapıları hafta başlangıç tarihi (`weekStartDate`) saklamalıdır:
- Her seans kaydedildiğinde mevcut haftanın tarihi kontrol edilir.
- Hafta değişmişse `weeklyHistory` sıfırlanıp yeni haftanın ilk gününe yazılır.
