import fs from 'fs/promises';
import path from 'path';
import { fileExists } from './file-utils.js';

const THEME_KEYS = ['white', 'g10', 'g90', 'g100'];

async function readJson(filePath) {
  if (!filePath) return null;
  if (!(await fileExists(filePath))) {
    return null;
  }
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`[tokens] Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

function normalizeCssVars(vars = {}) {
  if (!vars || typeof vars !== 'object') return {};
  const normalized = {};
  Object.entries(vars).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const resolvedKey = key.startsWith('--') ? key : `--${key}`;
    normalized[resolvedKey] = typeof value === 'number' ? String(value) : String(value);
  });
  return normalized;
}

function mergeCssVars(...sets) {
  return sets.reduce((acc, vars) => {
    if (!vars) return acc;
    Object.entries(vars).forEach(([key, value]) => {
      acc[key] = value;
    });
    return acc;
  }, {});
}

function extractOverrides(source) {
  const result = { cssVars: {}, themes: {} };
  if (!source || typeof source !== 'object') return result;

  const candidates = [
    source,
    source.overrides,
    source.tokenPack?.overrides,
  ].filter(Boolean);

  candidates.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    const vars = candidate.cssVars || candidate.vars || null;
    if (vars) {
      result.cssVars = mergeCssVars(result.cssVars, normalizeCssVars(vars));
    }
    const themes = candidate.themes || candidate.themeOverrides || null;
    if (themes && typeof themes === 'object') {
      Object.entries(themes).forEach(([themeKey, value]) => {
        if (!value || typeof value !== 'object') return;
        const normalized = normalizeCssVars(value);
        result.themes[themeKey] = mergeCssVars(result.themes[themeKey] || {}, normalized);
      });
    }
  });

  return result;
}

function buildCssVarBlock(selector, vars) {
  const entries = Object.entries(vars || {});
  if (!entries.length) return '';
  const lines = entries.map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export async function buildTokenCss({ projectRoot, templateKey, tokenOverrides } = {}) {
  const tokenRoot = process.env.PRINT_TOKEN_DIR
    ? path.resolve(projectRoot, process.env.PRINT_TOKEN_DIR)
    : path.join(projectRoot, 'tokens');
  const corePack = await readJson(path.join(tokenRoot, 'core.json'));
  const printPack = await readJson(path.join(tokenRoot, 'print.json'));

  const themePacks = {};
  for (const themeKey of THEME_KEYS) {
    const themePack = await readJson(path.join(tokenRoot, 'themes', `${themeKey}.json`));
    if (themePack?.cssVars) {
      themePacks[themeKey] = normalizeCssVars(themePack.cssVars);
    }
  }

  const safeTemplateKey = typeof templateKey === 'string'
    ? templateKey.replace(/[\\/]/g, '')
    : null;
  const templateOverrides = safeTemplateKey
    ? await readJson(path.join(projectRoot, 'templates', safeTemplateKey, 'overrides.json'))
    : null;

  const templateOverridesResolved = extractOverrides(templateOverrides);
  const runtimeOverridesResolved = extractOverrides(tokenOverrides);

  const rootVars = mergeCssVars(
    normalizeCssVars(corePack?.cssVars),
    normalizeCssVars(printPack?.cssVars),
    templateOverridesResolved.cssVars,
    runtimeOverridesResolved.cssVars
  );

  const blocks = [];
  if (Object.keys(rootVars).length) {
    blocks.push(buildCssVarBlock(':root', rootVars));
  }

  for (const themeKey of THEME_KEYS) {
    const themeVars = mergeCssVars(
      themePacks[themeKey] || {},
      templateOverridesResolved.themes?.[themeKey],
      runtimeOverridesResolved.themes?.[themeKey]
    );
    if (Object.keys(themeVars).length) {
      blocks.push(buildCssVarBlock(`.theme--${themeKey}`, themeVars));
    }
  }

  return blocks.join('\n\n');
}
