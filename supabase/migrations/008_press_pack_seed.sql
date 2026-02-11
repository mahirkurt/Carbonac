-- =====================================================
-- Seed: Press Pack manifest for carbon-advanced
-- =====================================================

INSERT INTO public.press_packs (
  template_version_id,
  name,
  description,
  tags,
  version,
  status,
  schema_version,
  manifest_json
)
SELECT
  v.id,
  'Carbon Advanced Press Pack',
  'Default press pack for carbon-advanced template.',
  ARRAY['carbon', 'print', 'report'],
  '1.0.0',
  'approved',
  'v1.0',
  jsonb_build_object(
    'schemaVersion', 'v1.0',
    'pressPack', jsonb_build_object(
      'id', 'presspack-carbon-advanced-v1',
      'name', 'Carbon Advanced Press Pack',
      'version', '1.0.0',
      'status', 'approved',
      'tags', to_jsonb(ARRAY['carbon', 'print', 'report']::text[])
    ),
    'metadata', jsonb_build_object(
      'createdAt', now()::text,
      'updatedAt', now()::text
    ),
    'template', jsonb_build_object(
      'key', t.key,
      'version', v.version::text,
      'templateVersionId', v.id::text,
      'engine', 'pagedjs',
      'engineVersion', '0.4.x',
      'layoutProfile', v.layout_profile,
      'printProfile', v.print_profile,
      'theme', v.theme
    ),
    'tokens', jsonb_build_object(
      'tokenPack', jsonb_build_object(
        'id', 'carbon-print-pack',
        'version', '1.0.0',
        'overrides', jsonb_build_object(
          'cssVars', jsonb_build_object(
            '--report-max-width', '960px'
          ),
          'themes', jsonb_build_object(
            'white', jsonb_build_object(
              '--cds-accent', '#0f62fe'
            )
          )
        )
      ),
      'typography', jsonb_build_object(
        'body', 'body-long-02',
        'heading', 'heading-04'
      ),
      'spacing', jsonb_build_object('base', 8),
      'color', jsonb_build_object('accent', 'blue-60'),
      'print', jsonb_build_object('margin', '20mm', 'bleed', '3mm')
    ),
    'blockCatalog', jsonb_build_array(
      jsonb_build_object('blockType', 'RichText'),
      jsonb_build_object('blockType', 'CarbonChart'),
      jsonb_build_object('blockType', 'HighlightBox')
    ),
    'patterns', jsonb_build_array(
      jsonb_build_object(
        'id', 'executive-summary',
        'blockType', 'HighlightBox',
        'required', true,
        'minCount', 1,
        'maxCount', 1,
        'rules', jsonb_build_array('summary-first')
      )
    ),
    'qaRules', jsonb_build_array(
      jsonb_build_object(
        'id', 'no-widow',
        'type', 'widow',
        'scope', 'block',
        'severity', 'high',
        'blocking', true,
        'action', 'avoid-break'
      ),
      jsonb_build_object(
        'id', 'no-orphan',
        'type', 'orphan',
        'scope', 'block',
        'severity', 'high',
        'blocking', true,
        'action', 'avoid-break'
      ),
      jsonb_build_object(
        'id', 'no-overflow',
        'type', 'overflow',
        'scope', 'page',
        'severity', 'high',
        'blocking', true,
        'action', 'force-break'
      )
    ),
    'contentSchema', jsonb_build_object(
      'schemaRef', 'presspack://schemas/content/v1',
      'requiredFields', jsonb_build_array(
        'docType',
        'templateKey',
        'layoutProfile',
        'printProfile',
        'theme',
        'locale',
        'version'
      ),
      'optionalFields', jsonb_build_array('author', 'date', 'documentType'),
      'aliases', jsonb_build_object('documentType', 'docType')
    ),
    'sampleContent', jsonb_build_object(
      'frontmatter', jsonb_build_object(
        'title', 'Sample Carbon Report',
        'docType', 'report',
        'documentType', 'report',
        'templateKey', t.key,
        'layoutProfile', v.layout_profile,
        'printProfile', v.print_profile,
        'theme', v.theme,
        'locale', 'tr-TR',
        'version', '1.0'
      ),
      'body', '## Executive Summary\nKisa ozet metni burada yer alir.'
    )
  )
FROM public.template_versions v
JOIN public.templates t ON t.id = v.template_id
WHERE t.key = 'carbon-advanced'
  AND v.version = 1
  AND NOT EXISTS (
    SELECT 1
    FROM public.press_packs p
    WHERE p.template_version_id = v.id
      AND p.version = '1.0.0'
  );
