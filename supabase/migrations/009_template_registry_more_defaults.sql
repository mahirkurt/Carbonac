-- =====================================================
-- Carbonac Template Registry: Additional System Templates
-- =====================================================

-- Seed: Additional system templates (Paged.js)
INSERT INTO public.templates (
  key,
  name,
  description,
  engine,
  status,
  is_system,
  is_public,
  category,
  tags,
  content
)
VALUES
  (
    'carbon-template',
    'Carbon Template',
    'Baslangic icin sade Carbon rapor sablonu.',
    'pagedjs',
    'active',
    true,
    true,
    'report',
    ARRAY['starter', 'baseline'],
    ''
  ),
  (
    'carbon-colors',
    'Carbon Colors',
    'Tema paletleri ve renk tokenlari icin vitrin sablonu.',
    'pagedjs',
    'active',
    true,
    true,
    'system',
    ARRAY['themes', 'tokens', 'palette'],
    ''
  ),
  (
    'carbon-components',
    'Carbon Components',
    'Directive tabanli icerik bilesenlerini ornekleyen sablon.',
    'pagedjs',
    'active',
    true,
    true,
    'system',
    ARRAY['components', 'patterns', 'directives'],
    ''
  ),
  (
    'carbon-dataviz',
    'Carbon Dataviz',
    'Grafik ve KPI odakli analitik rapor sablonu.',
    'pagedjs',
    'active',
    true,
    true,
    'analytics',
    ARRAY['charts', 'kpi', 'tables'],
    ''
  ),
  (
    'carbon-forms',
    'Carbon Forms',
    'Forms, validation ve read-only inputs gibi UI patternleri icin sablon.',
    'pagedjs',
    'active',
    true,
    true,
    'ux',
    ARRAY['forms', 'validation', 'inputs'],
    ''
  ),
  (
    'carbon-notifications',
    'Carbon Notifications',
    'Bildirim, durum ve callout modullerini one cikaran sablon.',
    'pagedjs',
    'active',
    true,
    true,
    'ux',
    ARRAY['notifications', 'callouts', 'status'],
    ''
  ),
  (
    'carbon-empty-states',
    'Carbon Empty States',
    'Empty state ve onboarding sayfalari icin sade, yonlendirici tasarim.',
    'pagedjs',
    'active',
    true,
    true,
    'ux',
    ARRAY['empty-states', 'onboarding', 'guidance'],
    ''
  )
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Seed: Template versions (v1) with preview markdown
-- =====================================================

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'symmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'white',
    'gridSystem', 'symmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Template

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
$$
  ),
  'symmetric',
  'pagedjs-a4',
  'white',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-template'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'symmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'white',
    'gridSystem', 'symmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Colors

## Theme Setleri
- White
- G10
- G90
- G100

:::callout{tone="info" title="Not"}
Renkler CSS token’lari uzerinden yonetilir. Template overrides ile accent ve yuzey tonlari ozellestirilebilir.
:::
$$
  ),
  'symmetric',
  'pagedjs-a4',
  'white',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-colors'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'symmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'white',
    'gridSystem', 'symmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Components

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
$$
  ),
  'symmetric',
  'pagedjs-a4',
  'white',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-components'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'dashboard',
    'printProfile', 'pagedjs-a4',
    'theme', 'white',
    'gridSystem', 'dashboard',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Dataviz

## KPI Snapshot
:::chart{type="bar" caption="Bolgeye gore pay" source="Internal" highlight="+18%"}
```json
[{"group":"EMEA","value":42},{"group":"Americas","value":33},{"group":"APAC","value":25}]
```
:::

:::chart{type="line" caption="Aylik trend" source="Internal"}
```json
[{"group":"Jan","value":120},{"group":"Feb","value":132},{"group":"Mar","value":145},{"group":"Apr","value":158},{"group":"May","value":171}]
```
:::
$$
  ),
  'dashboard',
  'pagedjs-a4',
  'white',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-dataviz'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'asymmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'g10',
    'gridSystem', 'asymmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Forms

:::callout{tone="warning" title="Validation"}
Zorunlu alanlari ve hatalari net, tek bir dilde belirtin. Print ciktilarda acik acik etiketleyin.
:::

| Field | Value | Status |
| --- | --- | --- |
| Company | Carbonac | OK |
| Email | user@example.com | OK |
| Tax ID | - | Missing |
$$
  ),
  'asymmetric',
  'pagedjs-a4',
  'g10',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-forms'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'symmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'g90',
    'gridSystem', 'symmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Notifications

:::callout{tone="info" title="Info"}
Sistem bilgisi veya durum mesaji.
:::

:::callout{tone="success" title="Success"}
Islem tamamlandi ve kaydedildi.
:::

:::callout{tone="danger" title="Error"}
Beklenmeyen bir hata olustu.
:::
$$
  ),
  'symmetric',
  'pagedjs-a4',
  'g90',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-notifications'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme,
  status
)
SELECT
  t.id,
  1,
  jsonb_build_object(
    'layoutProfile', 'symmetric',
    'printProfile', 'pagedjs-a4',
    'theme', 'g10',
    'gridSystem', 'symmetric',
    'components', '[]'::jsonb,
    'styleHints', jsonb_build_object(
      'avoidBreakSelectors', jsonb_build_array('table', 'pre', 'blockquote', 'figure'),
      'forceBreakSelectors', jsonb_build_array('h2', 'h3')
    ),
    'previewMarkdown', $$# Carbon Empty States

:::pattern{type="cover-page-hero" title="No data yet" subtitle="Start by adding your first report"}
:::

:::pattern{type="action-box" title="Next actions"}
- Upload content
- Choose template
- Generate PDF
:::
$$
  ),
  'symmetric',
  'pagedjs-a4',
  'g10',
  'approved'
FROM public.templates t
WHERE t.key = 'carbon-empty-states'
ON CONFLICT (template_id, version) DO NOTHING;

-- Set active/latest version if missing
UPDATE public.templates t
SET
  active_version_id = v.id,
  latest_version_id = v.id
FROM public.template_versions v
WHERE v.template_id = t.id
  AND v.version = 1
  AND t.key IN (
    'carbon-template',
    'carbon-colors',
    'carbon-components',
    'carbon-dataviz',
    'carbon-forms',
    'carbon-notifications',
    'carbon-empty-states'
  )
  AND t.active_version_id IS NULL;

