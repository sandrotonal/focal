# MCP Sunucu Optimizasyonu ve Bakim Rehberi

## 1. Genel Bakis ve Problem Tanimi

IDE baslangicinda ve arka planda calisan Model Context Protocol (MCP) servisleri onceden `npx` ve `docker` uzerinden cagiriliyordu.

### Tespit Edilen Sorunlar
- **Yuksek Bellek Tuketimi**: Her `npx` cagirisi icin arka planda ayri bir `npx-cli.js` prosesi (~100 MB RAM) ayaga kalkiyordu. Coklu servislerde yalnizca araci katmanlar yaklasik 1.2 GB - 1.5 GB gereksiz RAM tuketimine yol aciyordu.
- **CPU ve Fan Yuku**: IDE her acildiginda `npx`, paket versiyon kontrolleri ve onbellek dogrulamalari gerceklestirdigi icin islemciye anlik yuk bindiriyor ve fanlarin yuksek devirde calismasina neden oluyordu.
- **Docker Yukleri**: GitHub MCP sunucusu Docker konteyneri uzerinden calisiyordu. Bu durum Docker Desktop bagimliligi ve ek kaynak tuketimi yaratiyordu.
- **Gecersiz Servis Cagirisi**: `@modelcontextprotocol/fetch-server` paketi npm kayit defterinde bulunmadigindan (HTTP 404), her baslatmada zaman asimi ve hata loglari uretiyordu.

---

## 2. Uygulanan Cozum

Tum MCP sunucu paketleri global Node.js ortamina yuklendi ve `mcp_config.json` dosyasindaki `npx` ara katmani kaldirilarak dogrudan global ikililer (CLI executable) tanimlandi.

### Calistirilan Global Kurulum Komutlari

```powershell
# 1. Temel MCP Paketleri
npm install -g @upstash/context7-mcp @supabase/mcp-server-supabase @modelcontextprotocol/server-github @modelcontextprotocol/server-brave-search @playwright/mcp @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-sequential-thinking notebooklm-mcp @google-cloud/cloud-run-mcp

# 2. Tamamlayici Paketler (Eksik npx bagimliliklarini sifirlamak icin)
npm install -g @modelcontextprotocol/server-memory @googlemaps/code-assist-mcp @21st-dev/magic @sentry/mcp-server
```

---

## 3. Global Paket ve Komut Eslestirme Tablosu

| Servis Adi | Kaynak Paket | Eski Yontem | Yeni Komut (`command`) | Parametreler (`args`) |
| :--- | :--- | :--- | :--- | :--- |
| **context7** | `@upstash/context7-mcp` | `npx -y @upstash/context7-mcp` | `context7-mcp` | `["--api-key", "..."]` |
| **supabase** | `@supabase/mcp-server-supabase` | `npx -y @supabase/mcp-server-supabase@latest` | `mcp-server-supabase` | `["--access-token", "..."]` |
| **github** | `@modelcontextprotocol/server-github` | `docker run ghcr.io/github/...` | `mcp-server-github` | `[]` |
| **brave-search** | `@modelcontextprotocol/server-brave-search` | `npx -y @modelcontextprotocol/server-brave-search` | `mcp-server-brave-search` | `[]` |
| **playwright** | `@playwright/mcp` | `npx @playwright/mcp@latest` | `playwright-mcp` | `[]` |
| **filesystem** | `@modelcontextprotocol/server-filesystem` | `npx -y @modelcontextprotocol/server-filesystem` | `mcp-server-filesystem` | `["C:/Users/.../PROJELERIM"]` |
| **sequential-thinking** | `@modelcontextprotocol/server-sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` | `mcp-server-sequential-thinking` | `[]` |
| **memory** | `@modelcontextprotocol/server-memory` | `npx -y @modelcontextprotocol/server-memory` | `mcp-server-memory` | `[]` |
| **notebooklm** | `notebooklm-mcp` | `npx -y notebooklm-mcp serve` | `notebooklm-mcp` | `["serve"]` |
| **cloud-run** | `@google-cloud/cloud-run-mcp` | `npx -y @google-cloud/cloud-run-mcp` | `cloud-run-mcp` | `[]` |
| **gmp-code-assist** | `@googlemaps/code-assist-mcp` | `npx -y @googlemaps/code-assist-mcp@latest` | `code-assist-mcp` | `[]` |
| **magic** | `@21st-dev/magic` | `npx -y @21st-dev/magic@latest` | `magic` | `[]` |
| **sentry** | `@sentry/mcp-server` | `npx -y @sentry/mcp-server` | `sentry-mcp` | `[]` |
| **fetch** | `@modelcontextprotocol/fetch-server` | Hatali npx (404) | Kaldirildi (Native `read_url_content` kullaniliyor) | - |

---

## 4. Guncellenen Konfigurasyon Dosyalari

Degisiklikler iki ana ayar dosyasinda eszamanlandi ve oncesinde `.bak` uzantili yedekleri alindi:

1. [mcp_config.json](file:///C:/Users/ACER%20NİTRO/.gemini/config/mcp_config.json)
2. [antigravity-ide/mcp_config.json](file:///C:/Users/ACER%20NİTRO/.gemini/antigravity-ide/mcp_config.json)

### Ornek Yapilandirma Formati

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7-mcp",
      "args": [
        "--api-key",
        "ctx7sk-..."
      ]
    },
    "github": {
      "command": "mcp-server-github",
      "args": [],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

---

## 5. Yeni MCP Sunucusu Ekleme Rehberi

Gelecekte yeni bir MCP sunucusu entegre edilirken asagidaki adimlar izlenmelidir:

1. Paketi global olarak kurun:
   ```powershell
   npm install -g <paket-adi>
   ```

2. Paketin sagladigi ikili komut adini ogrenin:
   ```powershell
   node -e "console.log(require('$env:APPDATA/npm/node_modules/<paket-adi>/package.json').bin)"
   ```

3. `mcp_config.json` icerisinde `command` degerini dogrudan bu komut adi olarak kaydedin, `args` icinden `-y` ve paket adini cikarin.

---

## 6. Geri Alma (Rollback)

Gerektigi takdirde orijinal yapilandirmaya donmek icin alinan yedek dosyalar kullanilabilir:
- `C:\Users\ACER NİTRO\.gemini\config\mcp_config.json.bak`
- `C:\Users\ACER NİTRO\.gemini\antigravity-ide\mcp_config.json.bak`
