# Focus Engine — Apple HIG araştırması

Bu not, Focus Engine’in görsel ve etkileşim kararlarını Apple’ın resmi Human Interface Guidelines kaynaklarına göre sabitlemek için hazırlandı. Araştırma 1 Ekim 2026 tarihinde yapıldı.

## Ürün kararı

Focus Engine bir “dashboard” değil, tek görevi olan canlı bir araçtır: geçen süreyi görünür ve kontrol edilebilir tutmak. Bu nedenle ana katmanda yalnızca sayaç, oturum bağlamı ve gerekli iki jest ipucu bulunur. Menü, oturum uzunluğu ve yardım gibi ikincil işlevler geçici bir yan panelde açılır.

## Kaynaklardan çıkan ilkeler

### 1. Amaç ve hiyerarşi

Apple, tasarım ilkelerinde her öğenin bir amaca hizmet etmesini, ana deneyime hızlı ulaşılmasını, hataların geri alınabilmesini ve geri bildirimin açık olmasını ister. Bu, Focus Engine’de “boşluğu doldurmak” için kartlar veya istatistikler eklemek yerine, sayaç etrafında anlamlı hiyerarşi kurmamız gerektiği anlamına gelir.

Kaynak: [Design principles — Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/design-principles)

### 2. Toolbar ve geçici yan panel

Apple’ın toolbar rehberine göre toolbar; başlık, navigasyon ve eylemleri içerir, fakat aşırı kalabalık olmamalıdır. Sidebar ise geniş alan olduğunda üst seviye alanlar arasında gezinmeye yarar; dar ekranlarda daha kompakt bir çözüm gerekir. Focus Engine bu yüzden sürekli görünen bir tab bar kullanmaz. Hamburger, yalnızca ikincil seçenekleri açan erişilebilir bir toolbar kontrolüdür; panel ana içeriğin üstünde görünür ve kapatılabilir.

Kaynaklar: [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)

### 3. Standart jest + özel jest dengesi

Apple, dokunmanın temel seçim/aktivasyon jesti olarak desteklenmesini; özel jestlerin ise belirli ve doğrudan etkileşimler için kullanılmasını önerir. Focus Engine’de dokunma başlatma/duraklatma için temel yol olarak kalır. Yukarı flick hızlı duraklatma/başlatma alternatifi, aşağı çekme ise açık bir sıfırlama niyeti olarak kullanılır. Jestler, ekrandaki metin ve VoiceOver açıklamasıyla desteklenir.

Kaynak: [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)

### 4. Hareketin amacı ve fiziksel tutarlılık

Apple’ın motion rehberi; hareketin amaca hizmet etmesini, kısa ve kesin olmasını, jesti takip etmesini ve kullanıcıyı gereksiz bekletmemesini ister. Focus Engine bu nedenle sadece üç hareket kullanır: sayacın parmakla 1:1 taşınması, sınırda rubber-band direnci ve bırakma anında velocity handoff alan spring dönüşü. Drawer da açıldığı kenara geri dönen tek eksenli bir spring kullanır.

Kaynak: [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

### 5. Erişilebilir dokunma alanı

Apple, iOS ve iPadOS için önerilen kontrol boyutunu 44×44 pt, minimum boyutu 28×28 pt olarak verir. Bu nedenle hamburger alanı 44 pt’den küçülmez; görünen çizgiler küçük kalsa bile dokunma yüzeyi geniş tutulur. Sayaç da tek ve geniş bir erişilebilir kontrol olarak davranır.

Kaynak: [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

### 6. Malzeme ve ürün kısıtı

Apple’ın güncel rehberinde Liquid Glass, kontrollerin içerikten ayrıldığı işlevsel bir katman olarak tanımlanır; içerik katmanında kullanılmaması önerilir. Focus Engine’in True Black/OLED ve glassmorphism yasağı ürün kararı olarak korunur. Drawer bu nedenle blur veya gölge yerine opak, düşük kontrastlı bir siyah katman olarak uygulanır. Hiyerarşi malzemeden değil, boşluk, tipografi, çizgi marker’ları ve hareketten gelir.

Kaynak: [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

## Uygulama kontrol listesi

- Ana ekran tek odak katmanı; tab bar ve kalıcı dashboard yok.
- Hamburger yalnızca ikincil ayar/yardım katmanını açıyor.
- Drawer opak siyah; blur, glass, card, shadow ve elevation yok.
- Tüm kontrol yüzeyleri en az 44 pt.
- Sayaç `tabular-nums`, sistem fontu ve düşük ağırlıkla gösteriliyor.
- Jest sırasında hareket UI thread üzerinde, bırakmada spring ile devam ediyor.
- Başlatma/duraklatma/sıfırlama haptics ile eşleşiyor.
- VoiceOver için sayaç ve hamburger anlamlı Türkçe etiket taşıyor.
- ReactBits LineSidebar fikri, web CSS’ini taşımak yerine native Reanimated portu olarak kullanılıyor.
