/**
 * Template serialization and preview attachment helpers
 */

import {
  templatePreviewEnabled,
  createTemplatePreviewSignedUrl,
} from '../stores/storage.js';

export async function attachTemplatePreviews(templates = []) {
  if (!templatePreviewEnabled) {
    return templates.map((template) => ({
      ...template,
      previewUrl: null,
      previewExpiresAt: null,
    }));
  }

  return Promise.all(
    templates.map(async (template) => {
      const storagePath = template.preview?.storage_path;
      if (!storagePath) {
        return {
          ...template,
          previewUrl: null,
          previewExpiresAt: null,
        };
      }

      const signed = await createTemplatePreviewSignedUrl({ storagePath });
      return {
        ...template,
        previewUrl: signed?.signedUrl || null,
        previewExpiresAt: signed?.expiresAt || null,
      };
    })
  );
}

export function serializeTemplate(template) {
  const activeVersion = template.activeVersion
    ? {
        id: template.activeVersion.id,
        version: template.activeVersion.version,
        layoutProfile: template.activeVersion.layout_profile,
        printProfile: template.activeVersion.print_profile,
        theme: template.activeVersion.theme,
        status: template.activeVersion.status || null,
        approvedAt: template.activeVersion.approved_at || null,
        schema: template.activeVersion.schema_json,
      }
    : null;

  return {
    id: template.id,
    key: template.key,
    name: template.name,
    description: template.description,
    status: template.status,
    engine: template.engine,
    category: template.category,
    tags: template.tags || [],
    isPublic: template.is_public,
    isSystem: template.is_system,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
    activeVersion,
    previewUrl: template.previewUrl || null,
    previewExpiresAt: template.previewExpiresAt || null,
  };
}
