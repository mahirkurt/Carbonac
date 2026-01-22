import './env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const templateStoreEnabled = Boolean(supabase);

const LAYOUT_PROFILES = new Set(['symmetric', 'asymmetric', 'dashboard']);
const PRINT_PROFILES = new Set(['pagedjs-a4', 'pagedjs-a3']);
const THEMES = new Set(['white', 'g10', 'g90', 'g100']);
const STATUSES = new Set(['draft', 'active', 'archived']);
const VERSION_STATUSES = new Set(['draft', 'review', 'approved', 'published']);

function normalizeTemplateKey(input) {
  if (!input) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateTemplateKey(key) {
  return /^carbon-[a-z0-9-]+$/.test(key);
}

function parseSchemaJson(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    return Array.isArray(value) ? null : value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeTemplateSchema(input) {
  const schema = parseSchemaJson(input) || {};
  const layoutProfile = LAYOUT_PROFILES.has(schema.layoutProfile)
    ? schema.layoutProfile
    : null;
  const printProfile = PRINT_PROFILES.has(schema.printProfile)
    ? schema.printProfile
    : null;
  const theme = THEMES.has(schema.theme) ? schema.theme : null;

  return {
    schema,
    layoutProfile,
    printProfile,
    theme,
  };
}

function validateTemplateSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { valid: false, error: 'Schema must be an object.' };
  }
  if (schema.layoutProfile && !LAYOUT_PROFILES.has(schema.layoutProfile)) {
    return { valid: false, error: 'Invalid layoutProfile.' };
  }
  if (schema.printProfile && !PRINT_PROFILES.has(schema.printProfile)) {
    return { valid: false, error: 'Invalid printProfile.' };
  }
  if (schema.theme && !THEMES.has(schema.theme)) {
    return { valid: false, error: 'Invalid theme.' };
  }
  return { valid: true };
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

async function listTemplates({ includeArchived = false } = {}) {
  if (!supabase) return [];
  let query = supabase
    .from('templates')
    .select('*')
    .eq('engine', 'pagedjs')
    .or('is_public.eq.true,is_system.eq.true');
  if (!includeArchived) {
    query = query.neq('status', 'archived');
  }

  const { data: templates, error } = await query.order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message || 'Failed to load templates.');
  }

  const versionIds = templates
    .map((template) => template.active_version_id || template.latest_version_id)
    .filter(Boolean);

  let versionsById = new Map();
  if (versionIds.length) {
    const { data: versions, error: versionError } = await supabase
      .from('template_versions')
      .select('*')
      .in('id', versionIds);
    if (versionError) {
      throw new Error(versionError.message || 'Failed to load template versions.');
    }
    versionsById = new Map(versions.map((version) => [version.id, version]));
  }

  let previewsByVersion = new Map();
  if (versionIds.length) {
    const { data: previews, error: previewError } = await supabase
      .from('template_previews')
      .select('*')
      .in('template_version_id', versionIds)
      .order('created_at', { ascending: false });
    if (previewError) {
      throw new Error(previewError.message || 'Failed to load template previews.');
    }
    previewsByVersion = new Map();
    previews.forEach((preview) => {
      if (!previewsByVersion.has(preview.template_version_id)) {
        previewsByVersion.set(preview.template_version_id, preview);
      }
    });
  }

  return templates.map((template) => {
    const versionId = template.active_version_id || template.latest_version_id;
    const activeVersion = versionId ? versionsById.get(versionId) : null;
    const preview = versionId ? previewsByVersion.get(versionId) : null;
    return {
      ...template,
      activeVersion,
      preview,
    };
  });
}

async function getTemplateByKey(key) {
  if (!supabase || !key) return null;
  const normalizedKey = normalizeTemplateKey(key);
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('key', normalizedKey)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || 'Failed to fetch template.');
  }
  if (!template) return null;

  const versionId = template.active_version_id || template.latest_version_id;
  let version = null;
  if (versionId) {
    const { data } = await supabase
      .from('template_versions')
      .select('*')
      .eq('id', versionId)
      .maybeSingle();
    version = data || null;
  }

  return { template, version };
}

async function getTemplateById(templateId) {
  if (!supabase || !templateId) return null;
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || 'Failed to fetch template.');
  }
  if (!template) return null;

  const versionId = template.active_version_id || template.latest_version_id;
  let version = null;
  if (versionId) {
    const { data } = await supabase
      .from('template_versions')
      .select('*')
      .eq('id', versionId)
      .maybeSingle();
    version = data || null;
  }

  return { template, version };
}

async function getTemplateVersionById(versionId) {
  if (!supabase || !versionId) return null;
  const { data, error } = await supabase
    .from('template_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || 'Failed to fetch template version.');
  }
  return data || null;
}

async function getTemplateVersions(templateId) {
  if (!supabase || !templateId) return [];
  const { data, error } = await supabase
    .from('template_versions')
    .select('*')
    .eq('template_id', templateId)
    .order('version', { ascending: false });
  if (error) {
    throw new Error(error.message || 'Failed to fetch template versions.');
  }
  return data || [];
}

async function createTemplate({
  key,
  name,
  description,
  status = 'active',
  category,
  tags,
  schema,
  createdBy = null,
  isPublic = false,
  isSystem = false,
}) {
  if (!supabase) return null;

  const normalizedKey = normalizeTemplateKey(key);
  if (!validateTemplateKey(normalizedKey)) {
    throw new Error('Template key must match carbon-<variant>.');
  }

  if (!STATUSES.has(status)) {
    throw new Error('Invalid template status.');
  }

  const normalized = normalizeTemplateSchema(schema);
  const validation = validateTemplateSchema(normalized.schema);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid template schema.');
  }

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      key: normalizedKey,
      name,
      description: description || null,
      engine: 'pagedjs',
      status,
      category: category || 'general',
      tags: normalizeTags(tags),
      is_public: Boolean(isPublic),
      is_system: Boolean(isSystem),
      user_id: createdBy,
      content: '',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Template creation failed.');
  }

  const version = await createTemplateVersion({
    templateId: template.id,
    schema: normalized.schema,
    createdBy,
    activate: true,
  });

  return { template, version };
}

async function updateTemplateMetadata(templateId, updates = {}) {
  if (!supabase) return null;
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) {
    if (!STATUSES.has(updates.status)) {
      throw new Error('Invalid template status.');
    }
    payload.status = updates.status;
  }
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.tags !== undefined) payload.tags = normalizeTags(updates.tags);
  if (updates.is_public !== undefined) payload.is_public = Boolean(updates.is_public);

  const { data, error } = await supabase
    .from('templates')
    .update(payload)
    .eq('id', templateId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Template update failed.');
  }
  return data;
}

async function deleteTemplate(templateId, hard = false) {
  if (!supabase) return null;
  if (hard) {
    const { error } = await supabase.from('templates').delete().eq('id', templateId);
    if (error) {
      throw new Error(error.message || 'Template delete failed.');
    }
    return { deleted: true };
  }
  const { data, error } = await supabase
    .from('templates')
    .update({ status: 'archived' })
    .eq('id', templateId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Template archive failed.');
  }
  return data;
}

async function createTemplateVersion({
  templateId,
  schema,
  createdBy = null,
  notes = null,
  activate = true,
  status = 'approved',
}) {
  if (!supabase) return null;
  const normalizedStatus = VERSION_STATUSES.has(status) ? status : 'draft';
  const normalized = normalizeTemplateSchema(schema);
  const validation = validateTemplateSchema(normalized.schema);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid template schema.');
  }

  const { data: latest } = await supabase
    .from('template_versions')
    .select('version')
    .eq('template_id', templateId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version || 0) + 1;
  const { data: version, error } = await supabase
    .from('template_versions')
    .insert({
      template_id: templateId,
      version: nextVersion,
      schema_json: normalized.schema,
      layout_profile: normalized.layoutProfile || 'symmetric',
      print_profile: normalized.printProfile || 'pagedjs-a4',
      theme: normalized.theme || 'white',
      notes,
      created_by: createdBy,
      status: normalizedStatus,
      approved_by: normalizedStatus === 'approved' || normalizedStatus === 'published'
        ? createdBy
        : null,
      approved_at: normalizedStatus === 'approved' || normalizedStatus === 'published'
        ? new Date().toISOString()
        : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Template version creation failed.');
  }

  const updatePayload = {
    latest_version_id: version.id,
  };
  if (activate) {
    if (!['approved', 'published'].includes(normalizedStatus)) {
      throw new Error('Only approved template versions can be activated.');
    }
    updatePayload.active_version_id = version.id;
  }

  const { error: updateError } = await supabase
    .from('templates')
    .update(updatePayload)
    .eq('id', templateId);
  if (updateError) {
    throw new Error(updateError.message || 'Failed to update template version pointers.');
  }

  return version;
}

async function setActiveTemplateVersion(templateId, versionId) {
  if (!supabase) return null;
  const { data: version, error: versionError } = await supabase
    .from('template_versions')
    .select('id, template_id, status')
    .eq('id', versionId)
    .maybeSingle();
  if (versionError) {
    throw new Error(versionError.message || 'Failed to load template version.');
  }
  if (!version || version.template_id !== templateId) {
    throw new Error('Version does not belong to template.');
  }
  if (!['approved', 'published'].includes(version.status)) {
    throw new Error('Template version must be approved before activation.');
  }

  const { data, error } = await supabase
    .from('templates')
    .update({ active_version_id: versionId })
    .eq('id', templateId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to activate template version.');
  }
  return data;
}

async function rollbackTemplateVersion(templateId, targetVersionId) {
  if (!supabase) return null;
  if (!templateId || !targetVersionId) {
    throw new Error('Template and target version are required.');
  }

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('id, active_version_id')
    .eq('id', templateId)
    .maybeSingle();
  if (templateError) {
    throw new Error(templateError.message || 'Failed to load template.');
  }
  if (!template) {
    throw new Error('Template not found.');
  }
  if (!template.active_version_id) {
    throw new Error('Template has no active version to rollback from.');
  }
  if (template.active_version_id === targetVersionId) {
    throw new Error('Template is already using the requested version.');
  }

  const { data: versions, error: versionsError } = await supabase
    .from('template_versions')
    .select('id, template_id, status, version')
    .in('id', [template.active_version_id, targetVersionId]);
  if (versionsError) {
    throw new Error(versionsError.message || 'Failed to load template versions.');
  }

  const activeVersion = versions.find((version) => version.id === template.active_version_id);
  const targetVersion = versions.find((version) => version.id === targetVersionId);

  if (!activeVersion) {
    throw new Error('Active template version not found.');
  }
  if (!targetVersion) {
    throw new Error('Target template version not found.');
  }
  if (targetVersion.template_id !== templateId) {
    throw new Error('Target version does not belong to template.');
  }
  if (!['approved', 'published'].includes(activeVersion.status)) {
    throw new Error('Rollback is only allowed from approved template versions.');
  }
  if (!['approved', 'published'].includes(targetVersion.status)) {
    throw new Error('Rollback target must be an approved template version.');
  }
  if (targetVersion.version >= activeVersion.version) {
    throw new Error('Rollback target must be an earlier template version.');
  }

  const { data, error } = await supabase
    .from('templates')
    .update({ active_version_id: targetVersionId })
    .eq('id', templateId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to rollback template version.');
  }

  return {
    template: data,
    fromVersion: activeVersion,
    toVersion: targetVersion,
  };
}

async function createTemplatePreview({ templateVersionId, storagePath, format = 'png', createdBy = null }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('template_previews')
    .insert({
      template_version_id: templateVersionId,
      storage_path: storagePath,
      format,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Template preview insert failed.');
  }
  return data;
}

async function setTemplateVersionStatus(versionId, status, approvedBy = null) {
  if (!supabase) return null;
  if (!VERSION_STATUSES.has(status)) {
    throw new Error('Invalid template version status.');
  }
  const update = {
    status,
    approved_by: ['approved', 'published'].includes(status) ? approvedBy : null,
    approved_at: ['approved', 'published'].includes(status) ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from('template_versions')
    .update(update)
    .eq('id', versionId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to update template version.');
  }
  return data;
}

export {
  templateStoreEnabled,
  normalizeTemplateKey,
  validateTemplateKey,
  normalizeTemplateSchema,
  validateTemplateSchema,
  listTemplates,
  getTemplateByKey,
  getTemplateById,
  getTemplateVersionById,
  getTemplateVersions,
  createTemplate,
  updateTemplateMetadata,
  deleteTemplate,
  createTemplateVersion,
  setActiveTemplateVersion,
  rollbackTemplateVersion,
  createTemplatePreview,
  setTemplateVersionStatus,
};
