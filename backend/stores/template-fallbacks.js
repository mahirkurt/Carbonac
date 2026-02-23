function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FALLBACK_THEME_SWATCH = {
  white: {
    background: '#ffffff',
    surface: '#f4f4f4',
    text: '#161616',
    muted: '#525252',
    border: '#e0e0e0',
  },
  g10: {
    background: '#f4f4f4',
    surface: '#ffffff',
    text: '#161616',
    muted: '#525252',
    border: '#d0d0d0',
  },
  g90: {
    background: '#262626',
    surface: '#393939',
    text: '#f4f4f4',
    muted: '#c6c6c6',
    border: '#525252',
  },
  g100: {
    background: '#161616',
    surface: '#262626',
    text: '#f4f4f4',
    muted: '#c6c6c6',
    border: '#393939',
  },
};

function buildFallbackPreviewUrl({ title, subtitle, theme = 'white', accent = '#0f62fe' } = {}) {
  const palette = FALLBACK_THEME_SWATCH[theme] || FALLBACK_THEME_SWATCH.white;
  const safeTitle = escapeXml(title || 'Carbon Template');
  const safeSubtitle = escapeXml(subtitle || '');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="${palette.background}" />
  <rect x="48" y="44" width="544" height="332" rx="10" fill="${palette.surface}" stroke="${palette.border}" />
  <rect x="48" y="44" width="10" height="332" fill="${accent}" />
  <text x="78" y="98" font-family="IBM Plex Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="${palette.text}">
    ${safeTitle}
  </text>
  <text x="78" y="128" font-family="IBM Plex Sans, Arial, sans-serif" font-size="14" fill="${palette.muted}">
    ${safeSubtitle}
  </text>
  <rect x="78" y="160" width="460" height="10" rx="5" fill="${palette.border}" opacity="0.65" />
  <rect x="78" y="182" width="410" height="10" rx="5" fill="${palette.border}" opacity="0.5" />
  <rect x="78" y="204" width="480" height="10" rx="5" fill="${palette.border}" opacity="0.5" />

  <rect x="78" y="240" width="220" height="96" rx="8" fill="${palette.background}" stroke="${palette.border}" />
  <rect x="312" y="240" width="246" height="96" rx="8" fill="${palette.background}" stroke="${palette.border}" />

  <rect x="98" y="262" width="180" height="10" rx="5" fill="${accent}" opacity="0.8" />
  <rect x="332" y="262" width="206" height="10" rx="5" fill="${accent}" opacity="0.55" />

  <rect x="98" y="284" width="150" height="8" rx="4" fill="${palette.border}" opacity="0.5" />
  <rect x="332" y="284" width="170" height="8" rx="4" fill="${palette.border}" opacity="0.5" />
  <rect x="98" y="302" width="172" height="8" rx="4" fill="${palette.border}" opacity="0.5" />
  <rect x="332" y="302" width="142" height="8" rx="4" fill="${palette.border}" opacity="0.5" />
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const COMMON_STYLE_HINTS = {
  avoidBreakSelectors: ['table', 'pre', 'blockquote', 'figure'],
  forceBreakSelectors: ['h2', 'h3'],
};

const LOCAL_TEMPLATE_FALLBACKS = [
  {
    id: 'local-carbon-template',
    key: 'carbon-template',
    name: 'Carbon Template',
    description: 'Baslangic icin sade Carbon rapor sablonu.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'report',
    tags: ['starter', 'baseline'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-template-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Template

## Summary
:::callout{tone="info" title="Baslangic"}
Bu template; baslik, paragraflar, liste, callout ve tablo gibi temel ogeleri dengeli bir sekilde gosterir.
:::

## Key Points
- Net hiyerarsi
- Tutarlı bosluklar
- Okunabilir tablolar

## KPI
| Metrix | Q1 | Q2 | Degisim |
| --- | --- | --- | --- |
| Gelir | 12.4M | 14.6M | +18% |
| Marj | 32% | 34.1% | +2.1pt |
| NPS | 41 | 47 | +6 |
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Template',
      subtitle: 'Baseline report',
      theme: 'white',
      accent: '#0f62fe',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-advanced',
    key: 'carbon-advanced',
    name: 'Carbon Advanced',
    description: 'Kurumsal raporlar icin dengeli, AI destekli layout.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'report',
    tags: ['executive', 'balanced'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-advanced-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Advanced',
      subtitle: 'Executive report',
      theme: 'white',
      accent: '#0043ce',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-grid',
    key: 'carbon-grid',
    name: 'Carbon Grid',
    description: 'Veri agirlikli raporlar icin grid oncelikli layout.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'analytics',
    tags: ['data', 'grid', 'dashboard'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-grid-v1',
      version: 1,
      layout_profile: 'dashboard',
      print_profile: 'pagedjs-a4',
      theme: 'g10',
      status: 'approved',
      schema_json: {
        layoutProfile: 'dashboard',
        printProfile: 'pagedjs-a4',
        theme: 'g10',
        gridSystem: 'dashboard',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Grid',
      subtitle: 'Dashboard layout',
      theme: 'g10',
      accent: '#1192e8',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-cv',
    key: 'carbon-cv',
    name: 'Carbon CV',
    description: 'Tek sayfa CV / resume icin hizli sablon.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'profile',
    tags: ['cv', 'resume', 'profile'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-cv-v1',
      version: 1,
      layout_profile: 'asymmetric',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'asymmetric',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'asymmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# CV / Resume

:::pattern{type="cv-profile" title="Profil"}
<div class="pattern__title">Ad Soyad</div>
<div class="pattern__subtitle">Product Designer / UX Lead</div>
<div class="pattern__eyebrow">Istanbul, TR • email@example.com • +90 555 000 00 00</div>
:::

:::pattern{type="cv-summary" title="Ozet"}
Kullanici deneyimi ve urun stratejisi alaninda 8+ yil tecrube.
- 3 ulkede ekip liderligi
- 12+ urun lansmani
:::

:::pattern{type="cv-experience" title="Deneyim"}
- **Lead Product Designer**, Carbonac — *2021–Now, Istanbul*
  - Tasarim sistemini ölcekledim.
  - Aktivasyon +%18.
:::

:::pattern{type="cv-skills" title="Yetenekler"}
- Product Design
- Design Systems
- Data Visualization
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon CV',
      subtitle: 'One-page resume',
      theme: 'white',
      accent: '#0f62fe',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-dataviz',
    key: 'carbon-dataviz',
    name: 'Carbon Dataviz',
    description: 'Grafik ve KPI odakli analitik rapor sablonu.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'analytics',
    tags: ['charts', 'kpi', 'tables'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-dataviz-v1',
      version: 1,
      layout_profile: 'dashboard',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'dashboard',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'dashboard',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Dataviz

## KPI Snapshot
:::chart{type="bar" caption="Bolgeye gore pay" source="Internal" highlight="+18%"}
\`\`\`json
[{"group":"EMEA","value":42},{"group":"Americas","value":33},{"group":"APAC","value":25}]
\`\`\`
:::

:::chart{type="line" caption="Aylik trend" source="Internal"}
\`\`\`json
[{"group":"Jan","value":120},{"group":"Feb","value":132},{"group":"Mar","value":145},{"group":"Apr","value":158},{"group":"May","value":171}]
\`\`\`
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Dataviz',
      subtitle: 'Charts + KPIs',
      theme: 'white',
      accent: '#8a3ffc',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-components',
    key: 'carbon-components',
    name: 'Carbon Components',
    description: 'Directive tabanli icerik bilesenlerini ornekleyen sablon.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'system',
    tags: ['components', 'patterns', 'directives'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-components-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Components

:marginnote[Bu bir margin note ornegidir.]{align="right"}

:::callout{tone="success" title="Reusable blocks"}
Callout, timeline, accordion, quote ve figure gibi directive’ler PDF’te print-friendly olarak render edilir.
:::

:::timeline{layout="horizontal" start="Q1" end="Q4"}
- Q1: Planlama
- Q2: Uygulama
- Q3: Olcum
- Q4: Iyilestirme
:::

:::accordion{variant="compact"}
### SSS
- Bu bir accordion icerigidir.
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Components',
      subtitle: 'Directives showcase',
      theme: 'white',
      accent: '#007d79',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-colors',
    key: 'carbon-colors',
    name: 'Carbon Colors',
    description: 'Tema paletleri ve renk tokenlari icin vitrin sablonu.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'system',
    tags: ['themes', 'tokens', 'palette'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-colors-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'white',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'white',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Colors

## Theme Setleri
- White
- G10
- G90
- G100

:::callout{tone="info" title="Not"}
Renkler CSS token’lari uzerinden yonetilir. Template overrides ile accent ve yuzey tonlari ozellestirilebilir.
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Colors',
      subtitle: 'Themes + tokens',
      theme: 'white',
      accent: '#ee5396',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-forms',
    key: 'carbon-forms',
    name: 'Carbon Forms',
    description: 'Forms, validation ve read-only inputs gibi UI patternleri icin sablon.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'ux',
    tags: ['forms', 'validation', 'inputs'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-forms-v1',
      version: 1,
      layout_profile: 'asymmetric',
      print_profile: 'pagedjs-a4',
      theme: 'g10',
      status: 'approved',
      schema_json: {
        layoutProfile: 'asymmetric',
        printProfile: 'pagedjs-a4',
        theme: 'g10',
        gridSystem: 'asymmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Forms

:::callout{tone="warning" title="Validation"}
Zorunlu alanlari ve hatalari net, tek bir dilde belirtin. Print ciktilarda acik acik etiketleyin.
:::

| Field | Value | Status |
| --- | --- | --- |
| Company | Carbonac | OK |
| Email | user@example.com | OK |
| Tax ID | - | Missing |
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Forms',
      subtitle: 'Forms + validation',
      theme: 'g10',
      accent: '#24a148',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-notifications',
    key: 'carbon-notifications',
    name: 'Carbon Notifications',
    description: 'Bildirim, durum ve callout modullerini one cikaran sablon.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'ux',
    tags: ['notifications', 'callouts', 'status'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-notifications-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'g90',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'g90',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Notifications

:::callout{tone="info" title="Info"}
Sistem bilgisi veya durum mesaji.
:::

:::callout{tone="success" title="Success"}
Islem tamamlandi ve kaydedildi.
:::

:::callout{tone="danger" title="Error"}
Beklenmeyen bir hata olustu.
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Notifications',
      subtitle: 'Callouts + status',
      theme: 'g90',
      accent: '#da1e28',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-empty-states',
    key: 'carbon-empty-states',
    name: 'Carbon Empty States',
    description: 'Empty state ve onboarding sayfalari icin sade, yonlendirici tasarim.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'ux',
    tags: ['empty-states', 'onboarding', 'guidance'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-empty-states-v1',
      version: 1,
      layout_profile: 'symmetric',
      print_profile: 'pagedjs-a4',
      theme: 'g10',
      status: 'approved',
      schema_json: {
        layoutProfile: 'symmetric',
        printProfile: 'pagedjs-a4',
        theme: 'g10',
        gridSystem: 'symmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
        previewMarkdown: `# Carbon Empty States

:::pattern{type="cover-page-hero" title="No data yet" subtitle="Start by adding your first report"}
:::

:::pattern{type="action-box" title="Next actions"}
- Upload content
- Choose template
- Generate PDF
:::
`,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon Empty States',
      subtitle: 'Onboarding',
      theme: 'g10',
      accent: '#8d8d8d',
    }),
    previewExpiresAt: null,
  },
  {
    id: 'local-carbon-theme-g100',
    key: 'carbon-theme-g100',
    name: 'Carbon G100',
    description: 'Koyu tema ve vurgu odakli tasarim.',
    engine: 'pagedjs',
    status: 'active',
    is_public: true,
    is_system: true,
    category: 'presentation',
    tags: ['dark', 'contrast'],
    created_at: null,
    updated_at: null,
    activeVersion: {
      id: 'local-carbon-theme-g100-v1',
      version: 1,
      layout_profile: 'asymmetric',
      print_profile: 'pagedjs-a4',
      theme: 'g100',
      status: 'approved',
      schema_json: {
        layoutProfile: 'asymmetric',
        printProfile: 'pagedjs-a4',
        theme: 'g100',
        gridSystem: 'asymmetric',
        components: [],
        styleHints: COMMON_STYLE_HINTS,
      },
    },
    previewUrl: buildFallbackPreviewUrl({
      title: 'Carbon G100',
      subtitle: 'Dark theme',
      theme: 'g100',
      accent: '#78a9ff',
    }),
    previewExpiresAt: null,
  },
];

export { LOCAL_TEMPLATE_FALLBACKS };
