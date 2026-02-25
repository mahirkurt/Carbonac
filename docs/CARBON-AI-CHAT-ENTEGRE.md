# Carbon AI Chat v1 ile Carbonac AI Danisman Entegrasyonu (Talimatname)

Bu dokuman, Carbon Design System'in `@carbon/ai-chat` paketini Carbonac'in mevcut Vite + React + Carbon React (frontend) ve Express (backend) mimarisine nasil entegre edebileceginizi adim adim tarif eder.

## 0) v1 Release Notlari (Kaynak: Carbon Design Medium)

Carbon AI Chat v1.0.0 ile birlikte (ozet):

- API "stable" konumuna geldi (v1 major).
- Konfigurasyon yapisi sadeletirildi: `PublicConfig` alanlari artik `ChatContainer` icinde top-level prop'lar olarak kullaniliyor.
- Custom Elements Registry kullanan JS uygulamalarinda custom element tanimlama hatalarini azaltmak icin `dist/es-custom` altinda ozel bir build ayrildi.
- Terminoloji/method isimlerinde guncellemeler (or: `ConversationSidebar` -> `SecondaryPanel`, `HOME_SCREEN` -> `HOMESCREEN`).
- Test ID'leri daha acik hale getirildi; dokumantasyon ve migration guide'lar guclendirildi.

Bu repo acisindan kritik nokta: React tarafinda `ChatContainer` top-level config prop'lari ile dogru kullanim; web-component / custom registry senaryosu varsa `es-custom` build secenegi.

## 1) Amac ve Kapsam

Hedef, Carbonac icinde tek bir "AI Danisman" deneyimi saglamak:

- Markdown icerigi uzerinde formatlama, ifade, bilgi mimarisi ve Carbon token onerileri
- Editor/QA akisi icinde lint bulgularini aciklama ve duzeltme onerileri
- Template, layout profile, print profile secimlerine yonlendirme
- Donusturme (Markdown/PDF) sureclerinde hata mesaji yorumlama ve aksiyon onerileri

Not: Carbonac backend'inde hali hazirda `POST /api/ai/ask` (soru-cevap) ve `POST /api/ai/analyze` (dokuman analizi) endpoint'leri var. Bu talimatname, chat UI'yi oncelikle `ai/ask` uzerine kurar; gerekiyorsa `ai/analyze` ile zenginlestirir.

## 1.1) Carbonac'ta Mevcut Entegrasyon (Durum)

Bu repo'da AI Chat zaten uca kadar kablolanmis durumda:

- UI: `frontend/src/components/ai/CarbonacAiChat.jsx`
- App wiring (toggle/open state): `frontend/src/App.jsx`
- API client: `frontend/src/services/aiService.js`
- Backend: `/api/ai/ask`, `/api/ai/analyze` (Express)

Bu dokumanin geri kalanini, mevcut entegrasyonu modern ilkelerle "uretim kalitesine" tasimak icin kontrol listesi gibi dusunebilirsiniz.

## 1.2) 2026-02 Uygulanan Guncellemeler (Carbonac Snapshot)

Bu bolum, repoda halihazirda tamamlanan entegrasyonlari ozetler. Asagidaki maddeler "plan" degil, uygulanan guncel davranistir:

- Markdown temizleme + metadata infer hattı eklendi:
  - `src/utils/markdown-cleanup.js` ile gorunmeyen karakter temizligi (`sanitizeMarkdownContent`) ve baslik/yazar infer'i (`resolveDocumentMetadata`) merkezilestirildi.
  - Bu hat hem `backend/worker.js` hem `src/convert-paged.js` tarafinda kullaniliyor.
- PDF ayarlarinda yeni alanlar uctan uca gecirildi:
  - `colorMode` (`color|mono`), `includeCover`, `showPageNumbers`, `printBackground`
  - UI state: `frontend/src/contexts/DocumentContext.jsx`
  - Wizard controls: `frontend/src/components/wizard/ReportWizard.jsx`
  - API frontmatter: `backend/server.js`
  - Render/PDF export: `src/convert-paged.js`
- Print CSS iyilestirmeleri uygulandi:
  - Tablo okunabilirligi (caption, header, border ve spacing iyilestirmeleri)
  - Callout ikonlarinin `data-icon` ile gorunur basimi
  - Mono modda kosullu grayscale (renkli modda zorla griye cevirme yok)
  - Dosya: `styles/print/print-base.css`
- Wizard tarafinda AI tabanli template onerisi sadeleştirildi:
  - AI'dan 3 template + gerekce uretiliyor, parse fallback ile guvenli sekilde kullaniciya sunuluyor.
  - Secim dogrudan template secimine uygulanabiliyor.
  - Dosya: `frontend/src/components/wizard/ReportWizard.jsx`
- Workflow sadeleştirildi, preview adimi kaldirildi:
  - Akis artik `upload -> processing -> wizard -> editor` olarak ilerliyor.
  - `WORKFLOW_STEPS.PREVIEW` kullanimi kaldirildi.
  - Dosyalar: `frontend/src/contexts/DocumentContext.jsx`, `frontend/src/App.jsx`
- Editor deneyimi "canvas" modeline tasindi:
  - Markdown editor ana alanda, AI chat yan rail'de (embedded) calisiyor.
  - QA/quality panel ayni rail icinde compact varyantla konumlandirildi.
  - Dosya: `frontend/src/App.jsx`
- AI revizyonu secim-duyarli hale getirildi:
  - Editor secili metin araligi (`start/end/text`) context'e ekleniyor.
  - Revizyon komutlari once secili parcaya uygulanip fallback ile tum metne donuyor.
  - Dosyalar: `frontend/src/contexts/DocumentContext.jsx`, `frontend/src/components/ai/CarbonacAiChat.jsx`, `frontend/src/App.jsx`
- Sihirbazda editor oncesi zorunlu template secimi getirildi:
  - AI'nin onerdigi 3 template'ten birini secmeden editor adimina gecis engelleniyor.
  - Secim yoksa kullaniciya acik hata/uyari gosteriliyor.
  - Dosya: `frontend/src/components/wizard/ReportWizard.jsx`
- Sihirbaz layout'u modern Carbon ilkeleriyle yeniden duzenlendi:
  - Bilgi hiyerarsisi, panel ayrimi ve aksiyon navigasyonu netlestirildi.
  - Dosya: `frontend/src/components/wizard/ReportWizard.scss`
- AI Chat tarafinda serbest metinden "revizyon" niyeti algilanip markdown'a uygulanmasi eklendi:
  - `revize et`, `yeniden yaz`, `metni duzenle`, `/revize` vb. niyetlerde AI cevabindan markdown cikarilip editor state'ine yaziliyor.
  - Dosya: `frontend/src/components/ai/CarbonacAiChat.jsx`
- Lint tarafinda gorunmeyen karakter kurali eklendi:
  - Dosya: `frontend/src/utils/markdownLint.js`

## 2) On Kosullar

- Node.js `>=20.19.0` (frontend ve backend zaten bunu istiyor)
- Frontend: `@carbon/react` mevcut (Carbonac'ta var)
- Auth: Backend `Authorization: Bearer <supabase_access_token>` bekliyor (Carbonac'ta zaten bazi isteklerde kullaniliyor)

## 3) Paket Kurulumu (Frontend)

`@carbon/ai-chat` React tarafinda calisir; peer dependency olarak `@carbon/web-components` ister.

```bash
cd frontend
npm i @carbon/ai-chat @carbon/web-components
```

Not (v1): Custom Elements Registry / Web Components kullaniyorsaniz, v1 ile gelen `dist/es-custom` build senaryosunu inceleyin. React `ChatContainer` kullaniminda genelde gerekmez; ama `ChatCustomElement` veya `defineCustomElements` gibi yollara giriyorsaniz onemli olur.

## 4) UI Entegrasyonu Stratejisi

Carbon AI Chat React'te iki temel yerlesim modeli sunar:

- Float layout: Sag alt kose launcher ile "widget" gibi.
- Container layout: Siz bir container bolge ayirirsiniz, chat orayi doldurur.

Carbonac icin pratik iki secenek:

Guncel Carbonac uygulamasi varsayilan olarak **Container (Editor Canvas Rail)** modelini kullanir; chat, editor'un yan panelinde embedded render edilir.

### Secenek A: Float Launcher (Hizli Baslangic)

1. Uygulamanin root seviyesinde (App'in en disinda) bir `ChatContainer` render edin.
1. Launcher uzerinden ac/kapa ile deneyimi kullanin.

Avantaj: Uygulama layout'una minimum mudahale. Dezavantaj: Header'da "AI Danisman" butonu ile birebir butunlesmez (isterseniz sonra ekleyebilirsiniz).

### Secenek B: Header Aksiyon Butonu ile Ac/Kapa

1. Header'a `Chat` icon'lu bir `HeaderGlobalAction` ekleyin.
1. `ChatContainer` instance'ini yakalayip `instance.changeView('mainWindow')` / `instance.changeView('launcher')` ile ac/kapa yapin.
1. Isterseniz launcher'i kapatip tamamen header butonunu kullanin (launcher konfigurasyonunu dokumantasyona gore ayarlayin).

Avantaj: Carbonac'in mevcut global action desenine uyar. Dezavantaj: Ilk kurulum biraz daha fazla kablolama ister.

## 5) Mesajlasma: Carbon AI Chat -> Carbonac Backend

### 5.1) Temel Prensip

Carbon AI Chat tarafinda mesaj gonderimi icin `messaging.customSendMessage(request, requestOptions, instance)` tanimlarsiniz.

- `request.input.text`: kullanicinin yazdigi soru
- `request.history.is_welcome_request`: ilk acilista hos geldin akisi icin
- `requestOptions.signal`: iptal (abort) destegi icin

Bu callback bir `MessageResponse` **return etmez**; bunun yerine `instance.messaging.addMessage(...)` (veya streaming icin `addMessageChunk(...)`) ile yaniti UI'a eklersiniz.

### 5.2) Context (Baglam) Tasarimi

`/api/ai/ask` endpoint'i `question` ve `context` bekliyor. En iyi sonuc icin context'i "kisa ama yeterli" tutun:

- Workflow step: `upload | processing | wizard | editor`
- Secili template / theme / layout / print profilleri
- Lint issue ozeti (adet + top 5)
- Editor secimi (varsa): `start`, `end`, `text`
- Markdown icerigi: tamami yerine
  - ya sadece secili bolum (varsa)
  - ya da ilk N karakter + outline (H1/H2) + son N karakter

## 6) Ornek Uygulama Iskeleti (React)

Bu kisim, gercek entegrasyon icin referans iskelet verir. Dosya isimlerini projede tercih ettiginiz yapuya gore degistirebilirsiniz.

### 6.1) `frontend/src/services/aiService.js`

```js
import { supabase } from '../lib/supabase';
import { buildApiUrl } from '../utils/apiBase';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export async function askAi({ question, context, signal }) {
  const token = await getAccessToken();

  const response = await fetch(buildApiUrl('/api/ai/ask'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question, context }),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message || payload?.message || 'AI istegi basarisiz.';
    throw new Error(message);
  }

  const payload = await response.json();
  return payload.output || '';
}
```

### 6.2) `frontend/src/components/ai/CarbonacAiChat.jsx`

```jsx
import React, { useCallback, useMemo } from 'react';
import { ChatContainer, MessageResponseTypes } from '@carbon/ai-chat';
import { useDocument } from '../../contexts';
import { askAi } from '../../services/aiService';

function buildCarbonacContext(doc) {
  const lintSummary = (doc.lintIssues || [])
    .slice(0, 5)
    .map((issue) => `- ${issue.ruleId}: ${issue.message}`)
    .join('\\n');

  const md = doc.markdownContent || '';
  const mdHead = md.slice(0, 4000);
  const mdTail = md.length > 4000 ? md.slice(-1500) : '';

  return [
    `WorkflowStep: ${doc.currentStep}`,
    `Template: ${doc.selectedTemplate}`,
    `Theme: ${doc.selectedTheme}`,
    `LayoutProfile: ${doc.selectedLayoutProfile}`,
    `PrintProfile: ${doc.selectedPrintProfile}`,
    '',
    `LintIssues(top5):\\n${lintSummary || '(none)'}`,
    '',
    `Markdown(head):\\n${mdHead}`,
    mdTail ? `\\n\\nMarkdown(tail):\\n${mdTail}` : '',
  ].filter(Boolean).join('\\n');
}

export default function CarbonacAiChat() {
  const doc = useDocument();

  const customSendMessage = useCallback(async (request, requestOptions, instance) => {
    const signal = requestOptions?.signal;

    if (request?.history?.is_welcome_request) {
      await instance.messaging.addMessage({
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.TEXT,
              text: 'Merhaba. Markdown ve Carbon tasarim kararlarinda yardimci olabilirim. Ne yapmak istersiniz?',
            },
          ],
        },
      });
      return;
    }

    const question = String(request?.input?.text || '').trim();
    if (!question) {
      await instance.messaging.addMessage({
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.TEXT,
              text: 'Bir soru yazip gonderebilirsiniz.',
            },
          ],
        },
      });
      return;
    }

    const context = buildCarbonacContext(doc);
    const answer = await askAi({ question, context, signal });

    await instance.messaging.addMessage({
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.TEXT,
            text: answer,
          },
        ],
      },
    });
  }, [doc]);

  const messaging = useMemo(() => ({ customSendMessage }), [customSendMessage]);

  return (
    <ChatContainer
      aiEnabled
      assistantName="Carbonac AI"
      header={{ title: 'AI Danisman' }}
      messaging={messaging}
      debug={false}
    />
  );
}
```

### 6.3) App'a Ekleme

- Guncel Carbonac akisinda `frontend/src/App.jsx` icinde editor adimi, `editor-canvas-layout` altinda iki kolonlu render edilir:
  - Sol: markdown editor
  - Sag rail: `CarbonacAiChat` (`embedded`) + compact quality panel
- Bu modelde ayri bir preview route/step yerine editor icinden PDF aksiyonlari kullanilir.
- Float launcher veya header-action toggle modeli hala opsiyoneldir; ancak varsayilan deneyim editor-canvas icine gomulu chat'tir.

## 7) UI Ozellestirme (Carbonac'a Ozel)

Zenginlestirme fikirleri:

- Homescreen: Sik sorulan 4-6 hazir aksiyon ("Bu bolumu daha kurumsal yap", "Token oner", "Lint sorunlarini acikla", "Grid onerisi ver")
- `user_defined` response: Chat icinde "Uygula" butonu ile editor'e patch onerileri (ornek: directiveTemplates ekleme)
- Tema: Carbonac zaten Carbon theme kullandigi icin chat tema token'larini host'tan devralabilir; gerekirse `injectCarbonTheme` ile zorlayin.

### 7.1) Ileri Seviye: `user_defined` Response ile "Action Card" UI

Carbon AI Chat, assistant mesajlarinda `MessageResponseTypes.USER_DEFINED` ile sizin kendi UI'inizi render etmenize izin verir. Bu sayede "Editor'e uygula", "Lint'i duzelt", "Chart directive ekle" gibi aksiyonlari chat icinden tek tikla yaptirabilirsiniz.

Yuksek seviye akisi:

1. Backend (veya client) chat'e `user_defined` tipinde bir item gonderir.
2. `ChatContainer` icinde `renderUserDefinedResponse` ile bu item React UI'a donusturulur.
3. Buton aksiyonlari, Carbonac state'ini (markdown/editor) update eder.

Ornek (iskelet):

```jsx
import { MessageResponseTypes } from '@carbon/ai-chat';

// customSendMessage icinde:
await instance.messaging.addMessage({
  output: {
    generic: [
      {
        response_type: MessageResponseTypes.USER_DEFINED,
        user_defined: {
          type: 'APPLY_MARKDOWN_PATCH',
          patch: { /* ... */ }
        }
      }
    ]
  }
});

// ChatContainer prop'u:
<ChatContainer
  // ...
  renderUserDefinedResponse={({ item, instance }) => {
    const payload = item?.user_defined;
    if (payload?.type === 'APPLY_MARKDOWN_PATCH') {
      return (
        <button
          type="button"
          onClick={() => {
            // markdown state'ini update et (ornek: setMarkdown)
          }}
        >
          Uygula
        </button>
      );
    }
    return null;
  }}
/>
```

Not: v1 ile birlikte dokumantasyon tarafinda `renderUserDefinedResponse` ve `writeableElements` konulari genisletildi; bu mekanizma modern "agentic UI" icin temel altyapi.

## 8) Guvenlik, Rate Limit ve Maliyet

- Backend zaten PII redaction ve rate limit uyguluyor; yine de client tarafinda context'i truncation ile sinirlayin.
- Kullanici auth yoksa `input.isDisabled=true` veya `isReadonly=true` ile chat input'unu kapatin ve "Giris yapin" mesajiyla karsilayin.

### 8.1) API Sozlesmesi Guncel Notlar (Carbonac)

- `POST /api/convert/to-pdf` ayarlari içinde asagidaki alanlar desteklenir:
  - `settings.colorMode`
  - `settings.includeCover`
  - `settings.showPageNumbers`
  - `settings.printBackground`
- `POST /api/convert/to-markdown` ve worker markdown pipeline'inda cleanup adimi uygulanir; temizleme ozeti yanit/meta icine eklenir.
- Frontmatter uretiminde bu ayarlar markdown basina yazilir ve worker render hattina tasinir.

## 9) Modern ve Ileri Seviye Ilkeler (Uretim Standardi)

Bu bolum, "calisan demo"dan "uretim kalitesi"ne gecis icin kontrol listesi.

### 9.1) Privacy / Data Minimization (Default)

- Markdown'i her mesajla full gondermeyin: outline + head/tail excerpt + secili bolum (varsa) yeter.
- Kullanicinin "context gonderme" seviyesini ayarlayabilecegi bir mod ekleyin:
  - `compact` (default): outline + excerpt
  - `full` (opsiyonel): tum markdown (uyariyla)
- Hassas veri politikasi: UI'da net uyarilar + backend'te redaction + log'larda PII maskeleme.

### 9.2) Prompt Injection ve Yetkilendirme Sinirlari

- Backend tarafinda "tool" / "action" kullanimini whitelisting ile sinirlayin (AI'nin direct sistem komutu calistirmasina izin vermeyin).
- Kullanici markdown'u "untrusted input" sayin; system prompt'ta bu siniri net belirtin.
- Her istege `workspace`, `workflow_step`, `template`, `theme` gibi "guardrail" metadata ekleyin.

### 9.3) Dayaniklilik (Timeout, Abort, Retry)

- `AbortSignal` ile iptal (UI stop / navigation) mutlaka destekleyin.
- 429 durumunda `Retry-After` (veya backend benzeri) ile kullaniciya net geri bildirim verin.
- Token yenileme/sessiz re-auth: Supabase session kontrolu.

### 9.4) Gozlemlenebilirlik (Observability)

- `request_id`/correlation ID uretin ve hem client hem backend log'larinda tasiyin.
- p50/p95 latency, hata oranlari, iptal oranlari, token/char kullanimi (approx) gibi metrikleri olcun.

### 9.5) UX ve A11y

- Chat acildiginda odak yonetimi (focus) ve Esc ile kapatma (uygun view'e donus) tutarli olmali.
- Uyari/disclaimer metinleri kisa ve anlasilir olmali; HTML sanitize acik kalmali.

## 10) Yol Haritasi (Opsiyonel Gelistirmeler)

- Streaming: Backend'i SSE/stream destekler hale getirip `instance.messaging.addMessageChunk(...)` ile daha hizli algi.
- Alinti/Citation: Yanita kaynak linki veya dokuman bolum referansi eklemek icin `user_defined` content.
- Telemetry: Basari/hatayi ve gecikmeyi (p95) olc.

## 11) Kisa Operasyon Kontrol Listesi (Guncel)

- Wizard'da PDF ozellestirme seceneklerinin (`colorMode`, `includeCover`, `showPageNumbers`, `printBackground`) secildigini dogrula.
- Wizard son asamada AI'nin onerdigi 3 template'ten biri secilmeden editor'e gecisin engellendigini dogrula.
- Editor canvas'ta AI chat rail'in gorundugunu ve secili metinle revizyon komutlarinin once secili parcaya uygulandigini dogrula.
- Preview ekrani olmadan editor uzerinden PDF aksiyonlarinin calistigini dogrula.
- Print ciktilarinda:
  - renkli modda chart/callout bileşenlerinin renk korudugunu,
  - mono modda gri ton davranisinin aktif oldugunu,
  - tablo/callout ikonlarinin okunabilir oldugunu dogrula.
