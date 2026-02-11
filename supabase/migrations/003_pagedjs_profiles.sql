-- =====================================================
-- Carbonac Paged.js Profiles Migration
-- =====================================================

-- Conversions: add layout/print profiles
ALTER TABLE public.conversions
  ADD COLUMN IF NOT EXISTS layout_profile TEXT DEFAULT 'symmetric',
  ADD COLUMN IF NOT EXISTS print_profile TEXT DEFAULT 'pagedjs-a4';

ALTER TABLE public.conversions
  DROP CONSTRAINT IF EXISTS conversions_layout_profile_check;
ALTER TABLE public.conversions
  ADD CONSTRAINT conversions_layout_profile_check
  CHECK (layout_profile IN ('symmetric', 'asymmetric', 'dashboard'));

ALTER TABLE public.conversions
  DROP CONSTRAINT IF EXISTS conversions_print_profile_check;
ALTER TABLE public.conversions
  ADD CONSTRAINT conversions_print_profile_check
  CHECK (print_profile IN ('pagedjs-a4', 'pagedjs-a3'));

-- Expand engine check to include pagedjs for compatibility
ALTER TABLE public.conversions
  DROP CONSTRAINT IF EXISTS conversions_engine_check;
ALTER TABLE public.conversions
  ADD CONSTRAINT conversions_engine_check
  CHECK (engine IN ('pagedjs', 'typst', 'quarto'));

-- Profiles: default to pagedjs and allow new option
ALTER TABLE public.profiles
  ALTER COLUMN preferred_engine SET DEFAULT 'pagedjs';
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_engine_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_engine_check
  CHECK (preferred_engine IN ('pagedjs', 'typst', 'quarto', 'both'));

-- Templates: allow pagedjs for future use
ALTER TABLE public.templates
  DROP CONSTRAINT IF EXISTS templates_engine_check;
ALTER TABLE public.templates
  ADD CONSTRAINT templates_engine_check
  CHECK (engine IN ('pagedjs', 'typst', 'quarto'));
