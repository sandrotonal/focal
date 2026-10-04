---
name: dark-mode-surface-hierarchy
description: Apple-inspired dark mode surface hierarchy, tonal elevation architecture, restrained contrast ratios, and cohesive material elevation guidelines for mobile and web interfaces.
---

# Dark Mode Surface Hierarchy & Tonal Elevation

Bu beceri (skill), koyu mod (Dark Mode) arayüzlerinde sistem yüzeyleri, pencereler, bildirimler ve bileşenler tasarlanırken veya denetlenirken uygulanması zorunlu olan tonal yükselti ve malzeme hiyerarşisi standartlarını tanımlar.

---

## 1. Temel Problem: "Pure Black" Tuzağı

- **Sorun:** Katı siyah (`#000000`) zemin kullanıldığında, fiziksel gölgeler (`drop shadow`) arka planda tamamen kaybolur ve görünmez hale gelir.
- **Sonuç:** Koyu gri (`#2C2C2E` / `#30343C`) olan bildirim kartları veya pencereler, siyah zemin üzerinde havada duran bir sistem yüzeyi gibi değil; kopuk, gölgesiz, çiğ bir "gri kutu" olarak algılanır.
- **Çözüm:** Taban yüzey katı siyahtan kontrollü bir şekilde yukarı çekilir (`#0F1012` – `#121316`). Böylece gölgeler görünürlük kazanır ve yumuşak bir derinlik basamağı oluşturulur.

---

## 2. Tonal Hiyerarşi Merdiveni (Elevation Ladder)

Karanlık modda derinlik, aşırı parlaklık sıçramalarıyla değil; her katmanda %4 - %6 arası kontrollü açıklık (Lightness) adımlarıyla kurulur:

```
[Level 0] TABAN ZEMİN (App Base Surface)
          #0F1012 – #121316  (Örnek: #111215)
          ↓
[Level 1] PANELLER & ÇEKMECELER (Drawers, Grouped Cards)
          #16171B – #181A1F  (Örnek: #17181C)
          ↓
[Level 2] SİSTEM YÜZEYLERİ (Banners, Modals, Action Sheets)
          #1B1D21 – #202226  (Örnek: rgba(29, 31, 36, 0.94) / #1D1F24)
          ↓
[Level 3] YÜZEY İÇİ AKSİYONLAR (Action Pills, Buttons, Chips)
          rgba(255, 255, 255, 0.08) – rgba(255, 255, 255, 0.10)
```

---

## 3. Kenarlık (Rim Light) ve Işıklandırma Prensipleri

1. **Opak Kenarlık Yasağı:**
   - Koyu yüzeylerin etrafına asla katı opak gri veya yüksek kontrastlı beyaz çizgiler çekilmez.
   - Yalnızca ortam ışığını yakalayan ultra-ince ışık çizgisi (`rim highlight`) kullanılır:
     ```css
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.08)' /* veya 0.09 */
     ```
2. **Ayırıcı Çizgiler (Hairlines):**
   - Bölücü ve ayırıcı çizgiler taban zeminle yarışmamalıdır: `#25272D` seviyesinde tutulur.

---

## 4. Gölgelendirme (Physics & Shadows)

Taban zemin hafifçe yükseltildiğinde (`#111215`), yumuşak ve geniş gölgeler yüzeyin havada durduğunu doğal olarak hissettirir:

```typescript
// Apple OS Floating Elevation Standard
cardShadowDark: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.48,
  shadowRadius: 26,
  elevation: 10, // Android
  // Web CSS:
  // boxShadow: '0 18px 40px rgba(0, 0, 0, 0.52), 0 2px 8px rgba(0, 0, 0, 0.28)'
}
```

---

## 5. Tipografi ve Metin Kontrastı

Apple Human Interface Guidelines hiyerarşisi:

- **Birincil Metin (Title/Header):** `#FFFFFF` (yüksek netlik, tam kontrast)
- **İkincil Metin (Body/Subtitle):** `rgba(235, 235, 245, 0.65)` (sakin, okunabilir)
- **Yardımcı/Meta Metin (Footnote/Muted):** `rgba(235, 235, 245, 0.40)`
- **Kapatma / İkincil İkonlar:** `rgba(255, 255, 255, 0.72)`

---

## 6. Aydınlık Mod (Light Mode) Dokunulmazlığı

- Koyu mod yüzey dengelenirken aydınlık mod renklerine, kontrastına veya token'larına kesinlikle dokunulmaz.
- Aydınlık mod zemin standardı: `#F2F2F7` – `#F5F5F7`.
- Aydınlık mod kart standardı: `#FFFFFF` veya `rgba(244, 246, 249, 0.88)`.
- Aydınlık mod kenarlık standardı: `rgba(0, 0, 0, 0.06 – 0.08)`.

---

## 7. Doğrulama ve Audit Kontrol Listesi

Bir koyu mod bileşeni teslim edilmeden önce:
1. Taban zemin katı siyah (`#000000`) mı, yoksa derin obsidyen (`#111215`) mi?
2. Bildirim veya modal taban zemin üzerinde "ayrı bir gri levha" gibi mi duruyor, yoksa derinlik basamağı ile entegre mi?
3. Kenarlık ışık yansıması (`rgba(255, 255, 255, 0.08 - 0.10)`) şeklinde mi ayarlanmış?
4. Gölge yumuşaklığı ve mesafesi yeterli mi?
5. Aydınlık modun görünümü ve okunabilirliği korundu mu?
