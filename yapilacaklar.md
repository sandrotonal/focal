Öncelik sırasıyla
1. Performans testi — en önemli
- Gerçek Android cihazda release APK test et.
- Timer çalışırken FPS/donma kontrolü.
- 3D onboarding → drawer → timer geçişlerini test et.
- 30–60 dk kesintisiz timer çalıştır.
- Arka plana alıp geri dön.
- Bildirim geldiğinde timer durumunu kontrol et.
- Düşük/orta seviye Android cihazda da dene.
App.tsx'in büyük olması burada tek başına problem değil. Asıl bakmamız gereken hangi state değişince tüm App yeniden render oluyor.

2. App.tsx'i böl
Şu an ~54 KB olması teknik olarak felaket değil ama ileride ciddi bakım problemi çıkarır.
Ben şöyle bölerdim:
App.tsx
├── hooks/
│   ├── useFocusTimer.ts
│   ├── usePreferences.ts
│   ├── useNotifications.ts
│   └── useFocusAudio.ts
│
├── screens/
│   ├── TimerScreen.tsx
│   └── SettingsScreen.tsx
│
├── components/
│   ├── FocusDrawer.tsx
│   ├── TimerDisplay.tsx
│   ├── CompletionBanner.tsx
│   └── ...
│
└── services/
    ├── notifications/
    ├── storage/
    └── audio/

UI'ye dokunmadan yapılabilir.
3. Test altyapısı
Şu an en belirgin eksiklerden biri bu.
Eklenmeli:
- timer unit testleri
- pause/resume
- reset
- session completion
- notification scheduling
- storage persistence
- app restart sonrası timer/preferences
- edge case testleri
Şu anda test tarafı ürünün geri kalanına göre zayıf.
4. Android gerçek cihaz / lifecycle testleri
Özellikle:
- ekran kilitlenince
- uygulama arka plana gidince
- uygulama öldürülüp tekrar açılınca
- bildirimden uygulamaya dönünce
- telefon sessize alınca
- düşük pil durumunda
- sistem saatini değiştirince
timer'ın ne yaptığı kesinleşmeli.
5. Accessibility son kontrol
VoiceOver / TalkBack ile:
- butonların isimleri
- switch'lerin durumları
- timer'ın okunması
- drawer navigation
- notification banner
- onboarding
kontrol edilmeli.
6. Asset optimizasyonu (Tamamlandı)
Tüm PNG görselleri kayıpsız palet sıkıştırması ve deflate algoritmalarıyla optimize edildi:
- focal-logo.png: ~1 MB -> 11 KB (Büyük rahatlama)
- icon.png: 389 KB -> 106 KB
- android-icon-foreground.png: 278 KB -> 74 KB
- Ekran görüntüleri: Toplam 83 KB
Bundle boyutu ve bellek ayak izi minimum seviyeye indirildi.
7. Release build kontrolü
Expo development build'e bakıp karar verme.
Gerçek release APK/AAB:
eas build --platform android

sonrasında gerçek cihazda test.
8. README / proje temizliği (Tamamlandı)
README güncellendi, yeni mimari, testler ve özellikler dokümante edildi.
Ayrıca:
- environment değişkenleri
- build instructions
- Android/iOS setup
- notification permissions
- release instructions
netleştirildi.
Tüm 6 README vitrin ekran görüntüsü (Ritim Çarkı, Pomodoro Üçlüsü, Minimalist Sayaç, Bildirim Bannerı, Onboarding) güncel arayüz ile çekildi ve optimize edildi.
Benim Focal için öncelik sıralamam
Öncelik	İş	Durum
🔴 1	Gerçek cihaz performans testi	Yapılmalı
🔴 2	Timer/lifecycle edge-case testleri	Yapılmalı
🟢 3	Unit test altyapısı	Tamamlandı (22/22 Test)
🟠 4	App.tsx'i parçalama	Önerilir
🟢 5	Büyük asset optimizasyonu	Tamamlandı
🟠 6	Accessibility gerçek cihaz testi	Yapılmalı
🟢 7	README & Ekran Görüntüleri	Tamamlandı (6 Vitrin Görseli Güncellendi)
🟢 8	Yeni özellikler	Ritim Çarkı & Pomodoro Eklendi


