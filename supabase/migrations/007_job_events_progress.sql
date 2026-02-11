-- =====================================================
-- Extend job_events with progress metadata
-- =====================================================

ALTER TABLE public.job_events
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS progress INTEGER,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.job_events
  DROP CONSTRAINT IF EXISTS job_events_stage_check;
ALTER TABLE public.job_events
  ADD CONSTRAINT job_events_stage_check
  CHECK (
    stage IS NULL OR stage IN (
      'ingest',
      'parse',
      'plan',
      'render-html',
      'paginate',
      'export-pdf',
      'postprocess',
      'upload',
      'complete'
    )
  );

ALTER TABLE public.job_events
  DROP CONSTRAINT IF EXISTS job_events_level_check;
ALTER TABLE public.job_events
  ADD CONSTRAINT job_events_level_check
  CHECK (level IS NULL OR level IN ('info', 'warning', 'error'));

ALTER TABLE public.job_events
  DROP CONSTRAINT IF EXISTS job_events_progress_check;
ALTER TABLE public.job_events
  ADD CONSTRAINT job_events_progress_check
  CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100));

CREATE INDEX IF NOT EXISTS idx_job_events_stage ON public.job_events(stage);
