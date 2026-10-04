# Code Quality & Architectural Standards

## 1. Strict TypeScript (Sıfır 'any')
- Asla `any` tipi kullanma.
- Tüm `props`, `state`, geri çağrımlar (callbacks) ve storage şemaları açık ve katı tipler/interfaceler ile tanımlanmalıdır.
- Tip uyuşmazlıklarında `as any` veya `// @ts-ignore` kullanmak kesinlikle yasaktır; tipler doğru modellenmelidir.

## 2. Hata Yönetimi (Error Handling)
- Her async işlem (`fetch`, `storage`, `audio`, `notifications`, `haptics`) istisnasız `try-catch` bloğunda olmalıdır.
- Hata durumunda uygulama çökmeyip (crash) kullanıcıya veya fallback mekanizmasına güvenli şekilde geri dönmelidir.

## 3. Kesin Emoji Yasağı (Zero Emojis)
- UI bileşenlerinde, hata mesajlarında, konsol loglarında, commit mesajlarında, kod yorumlarında ve dökümanlarda (README dahil) **ASLA EMOJİ KULLANILMAZ**.
- Durum ve aksiyonlar için profesyonel SVG ikonları veya sade metin göstergeleri kullanılmalıdır.

## 4. Çapraz Platform Uyum (Cross-Platform Integrity)
- Uygulama hem Web (`react-native-web`) hem de Mobil (iOS & Android) ortamında hatasız çalışmalıdır.
- Native bağımlılıklar (`react-native-mmkv`, `expo-audio`, `expo-notifications`) platform ayrımı yapılarak (`.web.ts` ve `.native.ts`) yönetilmelidir.

## 5. Mimari ve Temizlik
- DRY (Don't Repeat Yourself) ve Single Responsibility ilkelerine sadık kalınmalıdır.
- Kullanılmayan importlar, ölü kod blokları ve geçici loglar derhal temizlenmelidir.
- Görev tamamlandı denmeden önce mutlaka `npx tsc --noEmit` çalıştırılarak 0 hata teyit edilmelidir.
