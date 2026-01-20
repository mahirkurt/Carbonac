-- =====================================================
-- Carbonac Press Pack + Release + Governance Schema
-- =====================================================

-- Template version governance fields
ALTER TABLE public.template_versions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.template_versions
  DROP CONSTRAINT IF EXISTS template_versions_status_check;
ALTER TABLE public.template_versions
  ADD CONSTRAINT template_versions_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'published'));

UPDATE public.template_versions
  SET status = 'approved'
  WHERE status IS NULL;

-- =====================================================
-- Press Packs: manifest bundles for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.press_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_version_id UUID NOT NULL REFERENCES public.template_versions(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  version TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  schema_version TEXT,
  manifest_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  hash TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.press_packs
  DROP CONSTRAINT IF EXISTS press_packs_status_check;
ALTER TABLE public.press_packs
  ADD CONSTRAINT press_packs_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_press_packs_template_version
  ON public.press_packs(template_version_id, version);

CREATE INDEX IF NOT EXISTS idx_press_packs_template_version_id
  ON public.press_packs(template_version_id);

CREATE INDEX IF NOT EXISTS idx_press_packs_status
  ON public.press_packs(status);

-- =====================================================
-- Releases: editorial publish pipeline
-- =====================================================
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  template_version_id UUID REFERENCES public.template_versions(id) ON DELETE SET NULL,
  press_pack_id UUID REFERENCES public.press_packs(id) ON DELETE SET NULL,
  source_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  output_manifest JSONB DEFAULT '{}'::jsonb,
  preflight JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

ALTER TABLE public.releases
  DROP CONSTRAINT IF EXISTS releases_status_check;
ALTER TABLE public.releases
  ADD CONSTRAINT releases_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'published'));

CREATE INDEX IF NOT EXISTS idx_releases_user_id
  ON public.releases(user_id);

CREATE INDEX IF NOT EXISTS idx_releases_document_id
  ON public.releases(document_id);

CREATE INDEX IF NOT EXISTS idx_releases_status
  ON public.releases(status);

-- =====================================================
-- RLS Policies (Press Packs + Releases)
-- =====================================================
ALTER TABLE public.press_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view press packs" ON public.press_packs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.template_versions v
      JOIN public.templates t ON t.id = v.template_id
      WHERE v.id = template_version_id
        AND (t.is_public = true OR t.is_system = true OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own press packs" ON public.press_packs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.template_versions v
      JOIN public.templates t ON t.id = v.template_id
      WHERE v.id = template_version_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own press packs" ON public.press_packs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.template_versions v
      JOIN public.templates t ON t.id = v.template_id
      WHERE v.id = template_version_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own releases" ON public.releases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own releases" ON public.releases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own releases" ON public.releases
  FOR UPDATE USING (auth.uid() = user_id);
