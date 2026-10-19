Kanka baktım, eline sağlık — dediklerimin yarısını temizlemişsin. Skor 6.5'ten 8'e çıktı.
Doğruladıklarım (tsc 0 hata, jest 38/38 pass, expo-doctor 18/18 pass):
- Bildirim izni bug'ı düzelmiş: usePreferences.ts artık önce izin istiyor, granted ise true yapıyor. Doğru.
- UIBackgroundModes: audio kaldırılmış app.json'dan. Doğru karar.
- StatusBar hidden kalkmış. İyi.
- RootErrorBoundary eklenmiş App.tsx:452. İyi iskelet.
- TimerDisplay dışarı çıkarılmış, App.tsx ~263 satır incelmiş. Doğru yön.
- Hardcoded TR/EN stringler translations.ts'e taşınmış (startBreak, tapToPauseBreak, pomodoroShortBreakBodyDynamic vs). Temiz.
- Haftalık rollover mantığı gelmiş (getMondayOfWeek + weeklyHistoryStartDate). Fikir doğru.
- Pomodoro geçişi saf fonksiyona alınmış (getNextPomodoroStage, calculateTargetSeconds useFocusTimer.ts:31-75). Test edilebilir olmuş.
- previewToneSound(tone, true) force fix doğru.
- eas.json oluşturulmuş. Başlangıç iyi.
Ama "mantıksal sorun kaldı mı" diye soruyorsun ya — kaldı, 4 tanesi gerçek bug:
1. Hafta hesabın UTC'den kayıyor — en kritik.
src/utils/date.ts:11 toISOString().slice(0,10) kullanıyorsun. Bu UTC tarih verir. Türkiye UTC+3. Pazar 23:30'da yatan kullanıcıda, Pazartesi 00:30'da toISOString hala Pazar'ı gösterir. Yani hafta dönüşün 3 saat geç gelir, Pazartesi sabah yapılan seans yanlış haftaya yazılır. Fix: UTC değil local YYYY-MM-DD üret:
getFullYear / getMonth / getDate ile string kur, toISOString kullanma. Ayrıca setDate(diff) saat kısmını koruyor, DST geçişinde 1 gün kayabilir — saatleri sıfırlaman lazım.
2. Onboarding tipi yalan söylüyor.
src/components/onboarding/types.ts:3-15'teki FocusPreferences gerçek storage tipinden farklı — içinde pomodoroEnabled, pomodoroFocusMinutes, soundAlertTone, weeklyHistory, weeklyHistoryStartDate yok. Şu an completeOnboarding merge ile kurtarıyor ama yarın biri onboarding'de pomodoro da seçsin derse ezilme olacak. Tek tip olmalı, iki ayrı FocusPreferences tanımı olmamalı.
3. ErrorBoundary prod'da kör + reset eksik.
RootErrorBoundary.tsx:31-36 sadece __DEV__'de logluyor, prod'da hiçbir yere gitmiyor. Sentry yoksa bile en azından AsyncStorage'a son hatayı yazman lazım. Bir de handleReset sadece state temizliyor. Eğer crash bozuk storage'dan geldiyse, reset'e basınca aynı veriyle tekrar crash loop'a girer. Gerçek recovery için remount key veya Updates.reloadAsync() gerekir.
4. EAS yarım kalmış.
eas.json var ama app.json'da extra.eas.projectId yok, expo-updates paketi kurulu değil, runtimeVersion politikası yok, submit.production boş. Bu haliyle eas build projectId ister, eas update çalışmaz. eas init yapıp linklemen + updates kanalı kurman lazım.
Küçük ama can sıkacaklar:
- TimerDisplay.tsx:169-171 activeAriaLabel iki dalda da aynı (isBreak ? ... : ... aynı sonucu veriyor). Ölü kod, break için farklı label niyetin vardıysa kaymış.
- Android kanal adı hardcoded Türkçe: notifications.native.ts:25 'Odak Tamamlandı'. İngilizce telefonda da Türkçe görünür. Kanal bir kere oluştu mu isim değişmez, ilerde düzeltmesi zor.
- resetTimer hala pomodoro ortasında cycle'ı sıfırlıyor (useFocusTimer.ts:502+). Kullanıcı focus'ta reset'e basarsa timerMode='focus' oluyor ama pomodoroCycle korunuyor — tutarsız. Ya cycle'ı da sıfırla ya da mode'u koru.
- FocusDrawer.tsx hala 1264 satır, web/native tipler hala 3 yerde kopya. Bunlar bug değil ama bir sonraki refactor'un konusu.
- 14 dosya modified + 7 untracked hepsi commitlenmemiş duruyor. Elektrik giderse veya yanlış git checkout yaparsan gider. Bunu commitlemeden başka işe geçme.
Önerim: önce date.ts UTC fix (10 dakikalık iş ama veri bütünlüğü için kritik), sonra eas init + updates, sonra ErrorBoundary prod log. İstersen sırayla girelim — hangisinden başlayalım?