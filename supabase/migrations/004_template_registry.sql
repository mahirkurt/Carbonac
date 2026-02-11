-- =====================================================
-- Carbonac Template Registry (Paged.js)
-- =====================================================

-- Templates: add registry fields for versioning
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS key TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS active_version_id UUID,
  ADD COLUMN IF NOT EXISTS latest_version_id UUID;

ALTER TABLE public.templates
  ALTER COLUMN engine SET DEFAULT 'pagedjs';

ALTER TABLE public.templates
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE public.templates
  DROP CONSTRAINT IF EXISTS templates_status_check;
ALTER TABLE public.templates
  ADD CONSTRAINT templates_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_key ON public.templates(key);

-- Template versions: JSON schema + derived fields
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_profile TEXT DEFAULT 'symmetric',
  print_profile TEXT DEFAULT 'pagedjs-a4',
  theme TEXT DEFAULT 'white',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_versions
  DROP CONSTRAINT IF EXISTS template_versions_layout_profile_check;
ALTER TABLE public.template_versions
  ADD CONSTRAINT template_versions_layout_profile_check
  CHECK (layout_profile IN ('symmetric', 'asymmetric', 'dashboard'));

ALTER TABLE public.template_versions
  DROP CONSTRAINT IF EXISTS template_versions_print_profile_check;
ALTER TABLE public.template_versions
  ADD CONSTRAINT template_versions_print_profile_check
  CHECK (print_profile IN ('pagedjs-a4', 'pagedjs-a3'));

ALTER TABLE public.template_versions
  DROP CONSTRAINT IF EXISTS template_versions_theme_check;
ALTER TABLE public.template_versions
  ADD CONSTRAINT template_versions_theme_check
  CHECK (theme IN ('white', 'g10', 'g90', 'g100'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_versions_template_version
  ON public.template_versions(template_id, version);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id
  ON public.template_versions(template_id);

-- Template previews: storage references
CREATE TABLE IF NOT EXISTS public.template_previews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_version_id UUID NOT NULL REFERENCES public.template_versions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  format TEXT DEFAULT 'png',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_previews
  DROP CONSTRAINT IF EXISTS template_previews_format_check;
ALTER TABLE public.template_previews
  ADD CONSTRAINT template_previews_format_check
  CHECK (format IN ('png', 'pdf'));

CREATE INDEX IF NOT EXISTS idx_template_previews_version_id
  ON public.template_previews(template_version_id);

-- Add foreign keys after template_versions exists
ALTER TABLE public.templates
  DROP CONSTRAINT IF EXISTS templates_active_version_fkey;
ALTER TABLE public.templates
  ADD CONSTRAINT templates_active_version_fkey
  FOREIGN KEY (active_version_id) REFERENCES public.template_versions(id) ON DELETE SET NULL;

ALTER TABLE public.templates
  DROP CONSTRAINT IF EXISTS templates_latest_version_fkey;
ALTER TABLE public.templates
  ADD CONSTRAINT templates_latest_version_fkey
  FOREIGN KEY (latest_version_id) REFERENCES public.template_versions(id) ON DELETE SET NULL;

-- =====================================================
-- RLS Policies (Template Versions & Previews)
-- =====================================================
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template versions" ON public.template_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND (t.is_public = true OR t.is_system = true OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own template versions" ON public.template_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own template versions" ON public.template_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view template previews" ON public.template_previews
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.template_versions v
      JOIN public.templates t ON t.id = v.template_id
      WHERE v.id = template_version_id
        AND (t.is_public = true OR t.is_system = true OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own template previews" ON public.template_previews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.template_versions v
      JOIN public.templates t ON t.id = v.template_id
      WHERE v.id = template_version_id
        AND t.user_id = auth.uid()
    )
  );

-- =====================================================
-- Seed: Default system templates (Paged.js)
-- =====================================================
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
    'carbon-advanced',
    'Carbon Advanced',
    'Kurumsal raporlar icin dengeli, AI destekli layout.',
    'pagedjs',
    'active',
    true,
    true,
    'report',
    ARRAY['executive', 'balanced'],
    ''
  ),
  (
    'carbon-grid',
    'Carbon Grid',
    'Veri agirlikli raporlar icin grid oncelikli layout.',
    'pagedjs',
    'active',
    true,
    true,
    'analytics',
    ARRAY['data', 'grid'],
    ''
  ),
  (
    'carbon-theme-g100',
    'Carbon G100',
    'Koyu tema ve vurgu odakli tasarim.',
    'pagedjs',
    'active',
    true,
    true,
    'presentation',
    ARRAY['dark', 'contrast'],
    ''
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme
)
SELECT
  t.id,
  1,
  '{
    "layoutProfile": "symmetric",
    "printProfile": "pagedjs-a4",
    "theme": "white",
    "gridSystem": "symmetric",
    "components": [],
    "styleHints": {
      "avoidBreakSelectors": ["table", "pre", "blockquote"],
      "forceBreakSelectors": ["h2"]
    }
  }'::jsonb,
  'symmetric',
  'pagedjs-a4',
  'white'
FROM public.templates t
WHERE t.key = 'carbon-advanced'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme
)
SELECT
  t.id,
  1,
  '{
    "layoutProfile": "dashboard",
    "printProfile": "pagedjs-a4",
    "theme": "g10",
    "gridSystem": "dashboard",
    "components": [],
    "styleHints": {
      "avoidBreakSelectors": ["table", "pre", "blockquote"],
      "forceBreakSelectors": ["h2", "h3"]
    }
  }'::jsonb,
  'dashboard',
  'pagedjs-a4',
  'g10'
FROM public.templates t
WHERE t.key = 'carbon-grid'
ON CONFLICT (template_id, version) DO NOTHING;

INSERT INTO public.template_versions (
  template_id,
  version,
  schema_json,
  layout_profile,
  print_profile,
  theme
)
SELECT
  t.id,
  1,
  '{
    "layoutProfile": "asymmetric",
    "printProfile": "pagedjs-a4",
    "theme": "g100",
    "gridSystem": "asymmetric",
    "components": [],
    "styleHints": {
      "avoidBreakSelectors": ["table", "pre", "blockquote"],
      "forceBreakSelectors": ["h2"]
    }
  }'::jsonb,
  'asymmetric',
  'pagedjs-a4',
  'g100'
FROM public.templates t
WHERE t.key = 'carbon-theme-g100'
ON CONFLICT (template_id, version) DO NOTHING;

UPDATE public.templates t
SET
  active_version_id = v.id,
  latest_version_id = v.id
FROM public.template_versions v
WHERE v.template_id = t.id
  AND v.version = 1
  AND t.active_version_id IS NULL;
