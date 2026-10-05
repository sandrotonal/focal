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
6. Asset optimizasyonu
Repoda büyük PNG'ler var. Özellikle yaklaşık:
- focal-logo.png ~1 MB
- focal.png ~1.7 MB
Bunları WebP/uygun sıkıştırma ve gerekiyorsa doğru resolution ile optimize etmek APK boyutu ve memory açısından daha mantıklı.
7. Release build kontrolü
Expo development build'e bakıp karar verme.
Gerçek release APK/AAB:
eas build --platform android

sonrasında gerçek cihazda test.
8. README / proje temizliği
README'deki eski clone/repo adı gibi küçük tutarsızlıkları düzelt.
Ayrıca:
- environment değişkenleri
- build instructions
- Android/iOS setup
- notification permissions
- release instructions
net olmalı.
Benim Focal için öncelik sıralamam
Öncelik	İş	Durum
🔴 1	Gerçek cihaz performans testi	Yapılmalı
🔴 2	Timer/lifecycle edge-case testleri	Yapılmalı
🔴 3	Unit test altyapısı	Eksik
🟠 4	App.tsx'i parçalama	Önerilir
🟠 5	Büyük asset optimizasyonu	Önerilir
🟠 6	Accessibility gerçek cihaz testi	Yapılmalı
🟡 7	README/dokümantasyon temizliği	Küçük iş
🟢 8	Yeni özellikler	Şimdilik bekleyebilir


