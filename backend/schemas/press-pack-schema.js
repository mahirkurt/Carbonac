import { z } from 'zod';

const STATUS_VALUES = ['draft', 'review', 'approved', 'published'];
const LAYOUT_PROFILES = ['symmetric', 'asymmetric', 'dashboard'];
const PRINT_PROFILES = ['pagedjs-a4', 'pagedjs-a3', 'pagedjs-a5'];
const THEMES = ['white', 'g10', 'g90', 'g100'];
const QA_SCOPES = ['document', 'page', 'block'];

const pressPackSchema = z
  .object({
    schemaVersion: z.string(),
    pressPack: z
      .object({
        id: z.string(),
        name: z.string().optional(),
        version: z.string(),
        status: z.enum(STATUS_VALUES).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
      .passthrough(),
    metadata: z
      .object({
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
        hash: z.string().optional(),
      })
      .optional(),
    template: z
      .object({
        key: z.string(),
        version: z.string(),
        templateVersionId: z.string().optional(),
        engine: z.string().optional(),
        engineVersion: z.string().optional(),
        layoutProfile: z.enum(LAYOUT_PROFILES).optional(),
        printProfile: z.enum(PRINT_PROFILES).optional(),
        theme: z.enum(THEMES).optional(),
      })
      .passthrough(),
    tokens: z
      .object({
        tokenPack: z
          .object({
            id: z.string(),
            version: z.string(),
            hash: z.string().optional(),
            overrides: z.record(z.unknown()).optional(),
          })
          .optional(),
        typography: z.record(z.unknown()).optional(),
        spacing: z.record(z.unknown()).optional(),
        color: z.record(z.unknown()).optional(),
        print: z.record(z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    blockCatalog: z
      .array(
        z
          .object({
            blockType: z.string(),
            required: z.boolean().optional(),
            allowedComponents: z.array(z.string()).optional(),
            constraints: z.record(z.unknown()).optional(),
          })
          .passthrough()
      )
      .optional(),
    patterns: z
      .array(
        z
          .object({
            id: z.string(),
            blockType: z.string(),
            required: z.boolean().optional(),
            minCount: z.number().int().optional(),
            maxCount: z.number().int().optional(),
            components: z.array(z.string()).optional(),
            rules: z.array(z.string()).optional(),
          })
          .passthrough()
      )
      .optional(),
    qaRules: z
      .array(
        z
          .object({
            id: z.string(),
            type: z.string(),
            scope: z.enum(QA_SCOPES).optional(),
            severity: z.enum(['low', 'medium', 'high']),
            blocking: z.boolean().optional(),
            selector: z.string().optional(),
            action: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    contentSchema: z
      .object({
        schemaRef: z.string(),
        requiredFields: z.array(z.string()),
        optionalFields: z.array(z.string()).optional(),
        aliases: z.record(z.string()).optional(),
      })
      .passthrough(),
    sampleContent: z
      .object({
        frontmatter: z.record(z.unknown()),
        body: z.string(),
        assets: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function validatePressPackManifest(input) {
  const result = pressPackSchema.safeParse(input);
  if (!result.success) {
    return { valid: false, error: result.error?.errors?.[0]?.message || 'Invalid Press Pack schema.' };
  }
  return { valid: true, data: result.data };
}

function normalizePressPackStatus(value) {
  return STATUS_VALUES.includes(value) ? value : 'draft';
}

function getPressPackSummary(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }
  return {
    id: manifest.pressPack?.id || null,
    name: manifest.pressPack?.name || null,
    version: manifest.pressPack?.version || null,
    status: normalizePressPackStatus(manifest.pressPack?.status),
    schemaVersion: manifest.schemaVersion || null,
    templateKey: manifest.template?.key || null,
    templateVersionId: manifest.template?.templateVersionId || null,
  };
}

export { pressPackSchema, validatePressPackManifest, normalizePressPackStatus, getPressPackSummary };
