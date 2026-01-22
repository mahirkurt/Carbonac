-- =====================================================
-- Carbonac Documents / Assets / Outputs / Usage Schema
-- =====================================================

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  doc_type TEXT,
  template_key TEXT,
  layout_profile TEXT DEFAULT 'symmetric',
  print_profile TEXT DEFAULT 'pagedjs-a4',
  theme TEXT DEFAULT 'white',
  locale TEXT DEFAULT 'en-US',
  version TEXT,
  status TEXT DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS layout_profile TEXT DEFAULT 'symmetric',
  ADD COLUMN IF NOT EXISTS print_profile TEXT DEFAULT 'pagedjs-a4',
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'white',
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.documents
  ALTER COLUMN layout_profile SET DEFAULT 'symmetric',
  ALTER COLUMN print_profile SET DEFAULT 'pagedjs-a4',
  ALTER COLUMN theme SET DEFAULT 'white',
  ALTER COLUMN locale SET DEFAULT 'en-US';

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_layout_profile_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_layout_profile_check
  CHECK (layout_profile IN ('symmetric', 'asymmetric', 'dashboard'));

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_print_profile_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_print_profile_check
  CHECK (print_profile IN ('pagedjs-a4', 'pagedjs-a3'));

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_theme_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_theme_check
  CHECK (theme IN ('white', 'g10', 'g90', 'g100'));

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- =====================================================
-- DOCUMENT VERSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  storage_path TEXT,
  checksum TEXT,
  frontmatter JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_versions_document_version
  ON public.document_versions(document_id, version);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id
  ON public.document_versions(document_id);

-- =====================================================
-- ASSETS TABLE (UPLOADS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind TEXT DEFAULT 'asset',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  checksum TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_kind_check;
ALTER TABLE public.assets
  ADD CONSTRAINT assets_kind_check
  CHECK (kind IN ('asset', 'original', 'markdown', 'attachment', 'preview'));

CREATE INDEX IF NOT EXISTS idx_assets_document_id ON public.assets(document_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);

-- =====================================================
-- OUTPUTS TABLE (ARTIFACTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.outputs
  DROP CONSTRAINT IF EXISTS outputs_artifact_type_check;
ALTER TABLE public.outputs
  ADD CONSTRAINT outputs_artifact_type_check
  CHECK (artifact_type IN ('pdf', 'png', 'html', 'manifest', 'qa-report', 'log'));

CREATE INDEX IF NOT EXISTS idx_outputs_job_id ON public.outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_outputs_document_id ON public.outputs(document_id);
CREATE INDEX IF NOT EXISTS idx_outputs_user_id ON public.outputs(user_id);

-- =====================================================
-- USAGE EVENTS TABLE (BILLING/ANALYTICS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  units INTEGER DEFAULT 0,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type);

-- =====================================================
-- BILLING LIMITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.billing_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  max_jobs INTEGER,
  max_pages INTEGER,
  max_storage_mb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_limits_user_id ON public.billing_limits(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_limits ENABLE ROW LEVEL SECURITY;

-- Documents policies
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Document versions policies
DROP POLICY IF EXISTS "Users can view own document versions" ON public.document_versions;
CREATE POLICY "Users can view own document versions" ON public.document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
        AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own document versions" ON public.document_versions;
CREATE POLICY "Users can manage own document versions" ON public.document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
        AND d.user_id = auth.uid()
    )
  );

-- Assets policies
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own assets" ON public.assets;
CREATE POLICY "Users can manage own assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Outputs policies
DROP POLICY IF EXISTS "Users can view own outputs" ON public.outputs;
CREATE POLICY "Users can view own outputs" ON public.outputs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own outputs" ON public.outputs;
CREATE POLICY "Users can manage own outputs" ON public.outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage events policies
DROP POLICY IF EXISTS "Users can view own usage events" ON public.usage_events;
CREATE POLICY "Users can view own usage events" ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own usage events" ON public.usage_events;
CREATE POLICY "Users can manage own usage events" ON public.usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Billing limits policies
DROP POLICY IF EXISTS "Users can view own billing limits" ON public.billing_limits;
CREATE POLICY "Users can view own billing limits" ON public.billing_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own billing limits" ON public.billing_limits;
CREATE POLICY "Users can manage own billing limits" ON public.billing_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
