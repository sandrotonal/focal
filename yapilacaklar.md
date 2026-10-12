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
9. Ses Tasarimi ve Web/Mobil Akustik Paritesi (Tamamlandi)
- Brief v1.0: 1.5s minimal kristal can (focus_complete_crystal.wav / focus-complete.wav, C#6 -> E6 -> G#6, sicak alt harmonikler, yumusak atak, havadar sonlanma, -1.2 dBFS tepe normalizasyonu).
- Iki ek ozgun ses: Kutup Isigi (focus_complete_aurora.wav) ve Tibet Canagi (focus_complete_tibetan.wav).
- Web Audio API ile Expo native oynatim arasinda 1:1 frekans ve zarf paritesi saglandi.
- Native ses motoru expo-audio asenkron seek yaris kosullari giderildi; arka plan ve sessiz mod izinleri optimize edildi.

10. Apple Dynamic Island Bildirim Uyumu (Tamamlandi)
- AppleNotificationBanner bilesenine Dynamic Island tespiti (topInset >= 50) eklendi.
- Ada altina oturan 28px kavisli ada formu ve ada genislemesini simule eden ust baglanti kapsulu eklendi.

Benim Focal icin oncelik siralamasi
Oncelik	Is	Durum
1	Gercek cihaz performans testi	Yapilmali
2	Timer/lifecycle edge-case testleri	Yapilmali
3	Unit test altyapisi	Tamamlandi (22/22 Test)
4	App.tsx'i parcalama	Onerilir
5	Buyuk asset optimizasyonu	Tamamlandi
6	Accessibility gercek cihaz testi	Yapilmali
7	README & Ekran Goruntuleri	Tamamlandi (6 Vitrin Gorseli Guncellendi)
8	Yeni ozellikler	Ritim Carki & Pomodoro Eklendi
9	Ses Tasarimi & Mobil Parite	Tamamlandi (Kristal, Kutup Isigi, Tibet)
10	Apple Dynamic Island Banner	Tamamlandi
