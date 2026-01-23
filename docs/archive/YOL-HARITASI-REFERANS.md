# IBM Carbon + Gemini 3 Pro Destekli Akilli PDF Rapor Olusturma Sistemi (Referans)

Bu dokuman uzun vadeli referans mimarisi ve kapsamli yol haritasidir.
Uygulama plani icin esas kaynak `docs/IS-PLANI.md`, kararlar icin `docs/SPRINT-0-DELIVERABLES.md`,
genel SoT icin `docs/PROJE-TALIMATLARI.md` gecerlidir. Cakisma varsa SoT kazanir.

Tarih: 20 Haziran 2025
Konu: Gemini 3 Pro destekli uzamsal zeka ve Paged.js ile mukemmeliyetci PDF uretimi
Durum: Nihai stratejik karar dokumani

---

## 1. Yonetici Ozeti: Neden Bu Mimari?

Bu rapor, onceki alternatif arayislarini (LaTeX, Typst vb.) sonlandirir ve tek bir nihai cozum yolunu
kesinlestirir. IBM Carbon Design System'in tasarim tutarliligi, Gemini 3 Pro'nun gelismis muhakeme
yetenekleri ve Paged.js'in baski muhendisligi ayni mimaride birlestirilir.

**Nihai Teknoloji Stack'i:**
- Rendering Motoru: React + Carbon Components (gorunum icin tek kaynak)
- Baski Motoru: Paged.js (print CSS ile sayfalandirma)
- Beyin (Art Director): Gemini 3 Pro (preview) + 2.5 Pro fallback
- Kalite Zinciri: PDF lint + Gemini QA (self-healing)

---

## 2. Gemini 3 Pro Entegrasyon Alanlari

Gemini 3 Pro, standart bir chatbot degil, sistemin karar verici cekirdegi olarak konumlandirilir.

### A. Uzamsal Muhakeme ve Dinamik Grid
Standart sablonlar yerine, Gemini 3 Pro icerigin yogunluguna ve gorselin oranina gore
sayfaya ozel bir grid tasarlar.

**Ornek:**
"Bu paragraf cok yogun ve grafik dikey. Okunabilirlik icin metni 2/3 genislige al, grafiği saga yasla
ve araya Key Insight kutusu ekle."

Gemini gorevi: Icerigi analiz edip Carbon Grid sistemine uygun React prop'larini (lg={8}, md={4})
dinamik olarak uretmek.

### B. Data Storytelling (Veri Hikayelestirme)
Grafik tek basina yeterli degildir. Gemini 3 Pro, ham veriyi okuyup outlier ve trendleri tespit eder
ve CEO seviyesinde, jargon olmayan bir ozet yazar.

### C. Logic-Based Styling (Kosullu CSS)
Paged.js kurallari (sayfa kirilimi, yetim satir) karmasiktir. Gemini 3 Pro icerik akisina gore
kosullu CSS yazar:
- "Eger tablo sayfanin son %15'inde basliyorsa, break-before: page uygula."
- "Eger bolum basligi sol sayfaya denk geliyorsa, bos sayfa ekleyerek saga tası."

---

## 3. Nihai Uygulama Mimarisi

### Adim 1: Akilli CSS (Paged.js)
Bu katman, React ciktisini kagit formatina zorlar ve matbaa standartlarini (tasma payi, kesim isaretleri)
yonetir.

```css
/* print.css - Nihai Baski Kurallari */
@page {
  size: A4;
  margin: 20mm;
  bleed: 3mm;
  marks: crop cross;

  @bottom-center {
    content: "Sayfa " counter(page) " / " counter(pages);
    font-family: 'IBM Plex Sans';
    font-size: 8pt;
    color: var(--cds-text-secondary);
  }
}

@page :left {
  margin-right: 25mm;
  @top-left { content: string(chapter-title); }
}

@page :right {
  margin-left: 25mm;
  @top-right { content: string(doc-title); }
}

.avoid-break { break-inside: avoid; }
.force-break { break-before: page; }
```

### Adim 2: Gemini 3 Pro Art Director Modulu
Gemini 3 Pro, icerigi analiz edip React'e "Nasil cizmeliyim?" talimatini JSON olarak verir.

```ts
// src/core/ai/art-director.ts
interface LayoutInstruction {
  gridSystem: "symmetric" | "asymmetric" | "dashboard";
  components: Array<{
    type: "CarbonChart" | "RichText" | "HighlightBox";
    data: unknown;
    layoutProps: { colSpan: number; offset?: number };
    styleOverrides?: { theme: "g10" | "white" };
  }>;
  storytelling: {
    title: string;
    executiveSummary: string;
  };
}
```

**Ek: Iki Asamali Planlama (onerilen)**
- DocumentPlan: bolum amaci, pattern secimi (WhatToDo, CaseStudy, SurveyChartPage)
- LayoutPlan: grid/colSpan/offset + page-break directives

Bu ayrim, determinism ve QA karsilastirmasini guclendirir.

### Adim 2.1: Print Token Pack + Pattern Library
PDF tasarim standardini sabitlemek icin iki temel paket:
- `tokens/print.json`: tipografi (pt), spacing, caption/footnote, baseline, safe-area
- `patterns/`: ExecutiveSummary, HeroStatWithQuote, SurveyChartPage, WhatToDo, CaseStudyModule

Bu paket, Carbon tokenlarini print guardrail'leri ile birlestirir.

### Adim 2.2: Press Pack + Editorial Preflight
CarbonPress yaklasimini Carbonac'a uyarlayan ikinci katman:
- **Press Pack**: template + print tokens + pattern set + QA rules + sample content
- **Content schema**: docType, templateKey, layoutProfile, printProfile, theme, locale, version
- **Release manifest**: template/version/tokens hash + QA sonucu + output metadata
- **Editorial states**: draft -> review -> approved -> published
- **Preflight gate**: lint + AI QA basarisizsa publish edilmez

### Adim 3: React + Paged.js Entegrasyonu
AI'dan gelen talimatlari ekrana basan ve sayfalayan motor.

```tsx
// src/core/renderer/smart-renderer.tsx
import { Previewer } from 'pagedjs';
import { useEffect, useRef } from 'react';
import { Grid, Column, Theme } from '@carbon/react';

export const SmartReportRenderer = ({ aiLayoutData }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const paged = new Previewer();
    paged.preview(
      containerRef.current.innerHTML,
      ["/css/print.css"],
      document.body
    );
  }, [aiLayoutData]);

  return (
    <div ref={containerRef} className="printable-area">
      <Theme theme={aiLayoutData.theme}>
        <Grid>
          {aiLayoutData.components.map((comp, i) => (
            <Column key={i} lg={comp.layoutProps.colSpan} md={comp.layoutProps.colSpan / 2}>
              <ComponentFactory type={comp.type} data={comp.data} />
              {comp.insight && (
                <div className="ai-insight-box">
                  <h4 className="cds--heading-02">AI Insight</h4>
                  <p className="cds--body-01">{comp.insight}</p>
                </div>
              )}
            </Column>
          ))}
        </Grid>
      </Theme>
    </div>
  );
};
```

---

## 4. Visual Self-Healing (Mukemmeliyet Kontrolu)

Gemini 3 Pro'nun multimodal yetenegi, kalite kontrolu otomatiklestirir.

Is akisi:
1. Draft render (HTML/PDF)
2. Statik PDF lint (overflow, widows/orphans, min font, contrast)
3. Screenshot analizi (headless Chromium)
4. Gemini QA (layout hatasi tespiti)
5. CSS auto-fix + yeniden render
3. Gemini QA: "Metin tasmasi, kotu kirilim var mi?"
4. Auto-correction: `break-inside: avoid` gibi kurallar eklenir
5. Tekrar render

Bu dongu, "insan gozuyle kontrol" surecini simule eder.

---

## 5. Yol Haritasi (Referans)

### Faz 1: Core Pipeline (Sprint 1-2)
- Queue + worker + job modeli
- Paged.js print CSS ve PDF cikti
- Gemini 3 Pro art director JSON

### Faz 2: Storage + Download (Sprint 2)
- Supabase path standardi
- Signed URL ile download

### Faz 3: Visual Self-Healing (Sprint 3)
- Screenshot QA
- CSS auto-fix rules

### Faz 4: Template Registry (Sprint 5-6)
- Template CRUD
- Token mapping
- Press Pack manifest + block catalog
- Editorial preflight gate

### Faz 5: Urunlesme (Sprint 7-8)
- Billing
- Observability

---

## 6. Mevcut Durum Profili (Snapshot)
- Faz 1-2 tamam: job pipeline + Paged.js + signed URL akisi dogrulandi.
- Faz 3 tamam: visual self-healing ve statik lint kurallari calisiyor.
- Faz 4 kismi: template registry + preview + gallery tamam; Press Pack manifest ve editorial preflight bekliyor.

## 7. Sonuc

Bu plan, LaTeX/Typst gibi yaklasimlari eler ve web teknolojilerinin esnekligini
Gemini 3 Pro'nun zekasi ile birlestirir. Hedef sadece rapor ureten bir arac degil,
"sanal kreatif ajans" yetenekleri olan bir platformdur.
