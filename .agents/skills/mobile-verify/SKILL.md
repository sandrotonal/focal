---
name: mobile-verify
description: Comprehensive verification workflow for mobile React Native and Expo applications covering type safety, cross-platform checks, safe insets, and zero-emoji compliance.
---

# Mobile Verification Workflow

Bu beceri (skill), herhangi bir değişiklik tamamlandı ilan edilmeden önce aşağıdaki denetim adımlarını yürütür:

## 1. Tip Güvenliği ve Derleme Kontrolü
```bash
npx tsc --noEmit
```
- Çıktıda 0 hata alındığı teyit edilmelidir.
- Kod tabanında `any`, `@ts-ignore` veya gevşek tip kalıntıları aranır ve temizlenir.

## 2. Çapraz Platform Uyum Doğrulaması
- Web ve mobil platform ayrımı kontrol edilir:
  - `preferencesStorage.web.ts` / `preferencesStorage.native.ts`
  - `notifications.web.ts` / `notifications.native.ts`
  - `soundEngine.ts` (Platform.OS kontrolleri ve fallback'ler)
- Web üzerinde eksik kalan CSS/DOM veya mobilde çöken native API çağrısı olmadığından emin olunur.

## 3. Arayüz ve Animasyon Kapanış Doğrulaması
- Açılır/kapanır tüm bileşenlerin (Reset butonu, Notification banner, Drawer menu) çıkış animasyonu test edilir.
- `showCompletion` veya `isClosing` durumlarında animasyon tamamlanmadan doğrudan unmount edilme hatası bulunmadığı kontrol edilir.

## 4. Güvenlik ve Git İzolasyonu
- `git status` kontrol edilir:
  - Kullanıcı o mesajda açık teyit vermeden hiçbir commit veya push yapılmadığı doğrulanır.
  - Değişikliklerin sadece yerel feature branch'inde tutulduğu kontrol edilir.
- Kodda ve dökümanlarda emoji bulunmadığı doğrulanır.
