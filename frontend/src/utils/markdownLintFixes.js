/**
 * markdownLintFixes
 *
 * Amaç: Markdown lint uyarılarının bir kısmı için güvenli/öngörülebilir “otomatik düzeltme” uygulamak.
 *
 * Notlar:
 * - Yalnızca deterministik ve düşük-riskli düzeltmeler hedeflenir.
 * - Dış servis çağrısı yoktur (offline çalışır).
 * - İçerik anlamını değiştirme riski yüksek kuralları (örn. long-paragraph) otomatik düzeltmeyiz.
 */

function normalizeHeading(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseDirectiveAttributeKeyFromMessage(message) {
  const text = String(message || '');
  // ör: "Directive 'chart' için desteklenmeyen attribute: foo."
  const match = text.match(/attribute:\s*([a-zA-Z0-9_-]+)\b/);
  return match ? match[1] : null;
}

function parseDirectiveAttributeValueKeyFromMessage(message) {
  const text = String(message || '');
  // ör: "Directive 'chart' için geçersiz değer: type=bar."
  const match = text.match(/değer:\s*([a-zA-Z0-9_-]+)\s*=/);
  return match ? match[1] : null;
}

function parseAttributes(raw = '') {
  const attrs = [];
  const regex = /([a-zA-Z0-9_-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s"]+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    attrs.push({
      key: match[1],
      source: match[0],
    });
  }
  return attrs;
}

function removeDirectiveAttributeFromLine(line, keysToRemove) {
  const text = String(line || '');
  const open = text.indexOf('{');
  const close = text.lastIndexOf('}');
  if (open === -1 || close === -1 || close <= open) {
    return { nextLine: text, changed: false };
  }

  const raw = text.slice(open + 1, close);
  const attrs = parseAttributes(raw);
  if (!attrs.length) {
    return { nextLine: text, changed: false };
  }

  const removeSet = new Set(Array.from(keysToRemove || []).map((x) => String(x || '').trim()).filter(Boolean));
  if (!removeSet.size) {
    return { nextLine: text, changed: false };
  }

  const kept = attrs.filter((entry) => !removeSet.has(entry.key));
  if (kept.length === attrs.length) {
    return { nextLine: text, changed: false };
  }

  const newRaw = kept.map((entry) => entry.source.trim()).filter(Boolean).join(' ');
  const before = text.slice(0, open).replace(/\s*$/, '');
  const after = text.slice(close + 1);
  const bracePart = newRaw ? ` {${newRaw}}` : '';
  return { nextLine: `${before}${bracePart}${after}`, changed: true };
}

function findPreviousHeadingLevel(lines, lineIdx) {
  for (let i = lineIdx - 1; i >= 0; i -= 1) {
    const match = String(lines[i] || '').match(/^(#{1,6})\s*(.*)$/);
    if (!match) continue;
    return match[1].length;
  }
  return 0;
}

function setHeadingLevel(line, nextLevel) {
  const text = String(line || '');
  const match = text.match(/^(#{1,6})(\s*)(.*)$/);
  if (!match) return { nextLine: text, changed: false };

  const title = String(match[3] || '').trim();
  const level = Math.min(6, Math.max(1, Number(nextLevel) || 1));
  const next = `${'#'.repeat(level)}${title ? ` ${title}` : ''}`;
  return { nextLine: next, changed: next !== text };
}

function isEmptyHeadingLine(line) {
  return /^(#{1,6})\s*$/.test(String(line || '').trimEnd());
}

/**
 * @param {string} markdown
 * @param {Array<{ruleId?: string, message?: string, line?: number, column?: number}>} lintIssues
 */
export function applyLintFixes(markdown = '', lintIssues = []) {
  const original = String(markdown || '');
  const issues = Array.isArray(lintIssues) ? lintIssues : [];
  const lines = original.split('\n');

  const applied = [];
  const skipped = [];

  // 1) Directive attribute/value: satır bazlı key temizliği
  const directiveRemovals = new Map(); // lineIdx -> Set(keys)
  issues.forEach((issue) => {
    const ruleId = String(issue?.ruleId || '').trim();
    if (ruleId !== 'directive-attribute' && ruleId !== 'directive-attribute-value') return;

    const lineIdx = (Number(issue?.line) || 0) - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) return;

    const key =
      ruleId === 'directive-attribute'
        ? parseDirectiveAttributeKeyFromMessage(issue?.message)
        : parseDirectiveAttributeValueKeyFromMessage(issue?.message);
    if (!key) return;

    if (!directiveRemovals.has(lineIdx)) {
      directiveRemovals.set(lineIdx, new Set());
    }
    directiveRemovals.get(lineIdx).add(key);
  });

  for (const [lineIdx, keys] of directiveRemovals.entries()) {
    const before = lines[lineIdx];
    const { nextLine, changed } = removeDirectiveAttributeFromLine(before, keys);
    if (changed) {
      lines[lineIdx] = nextLine;
      applied.push({ ruleId: 'directive-attribute', line: lineIdx + 1, details: Array.from(keys) });
    }
  }

  // 2) Heading order: H2 -> H4 gibi atlamaları yumuşat
  issues
    .filter((issue) => String(issue?.ruleId || '').trim() === 'heading-order')
    .forEach((issue) => {
      const lineIdx = (Number(issue?.line) || 0) - 1;
      if (lineIdx < 0 || lineIdx >= lines.length) return;

      const prevLevel = findPreviousHeadingLevel(lines, lineIdx);
      if (!prevLevel) {
        skipped.push({ ruleId: 'heading-order', line: lineIdx + 1, reason: 'Önceki başlık bulunamadı.' });
        return;
      }
      const match = String(lines[lineIdx] || '').match(/^(#{1,6})\s*(.*)$/);
      if (!match) return;
      const currentLevel = match[1].length;
      const desiredLevel = Math.min(6, prevLevel + 1);
      if (currentLevel <= desiredLevel) return;
      const { nextLine, changed } = setHeadingLevel(lines[lineIdx], desiredLevel);
      if (changed) {
        lines[lineIdx] = nextLine;
        applied.push({ ruleId: 'heading-order', line: lineIdx + 1, details: { from: currentLevel, to: desiredLevel } });
      }
    });

  // 3) Duplicate headings: sonraki tekrarları (2), (3) şeklinde benzersizleştir
  const duplicateLineIdx = new Set(
    issues
      .filter((issue) => String(issue?.ruleId || '').trim() === 'duplicate-heading')
      .map((issue) => (Number(issue?.line) || 0) - 1)
      .filter((idx) => idx >= 0 && idx < lines.length)
  );

  const seenCounts = new Map();
  for (let i = 0; i < lines.length; i += 1) {
    if (!duplicateLineIdx.has(i)) {
      // Yine de sayacı yürütmek için başlığı okuyoruz.
      const match = String(lines[i] || '').match(/^(#{1,6})\s*(.*)$/);
      if (!match) continue;
      const title = String(match[2] || '').trim();
      const norm = normalizeHeading(title);
      if (!norm) continue;
      seenCounts.set(norm, (seenCounts.get(norm) || 0) + 1);
      continue;
    }

    const match = String(lines[i] || '').match(/^(#{1,6})\s*(.*)$/);
    if (!match) continue;
    const hashes = match[1];
    const title = String(match[2] || '').trim();
    const norm = normalizeHeading(title);
    if (!norm) continue;

    const nextCount = (seenCounts.get(norm) || 0) + 1;
    seenCounts.set(norm, nextCount);

    if (nextCount <= 1) continue;
    // Zaten suffix varsa üst üste eklememek için basit koruma.
    const alreadySuffixed = /\(\d+\)\s*$/.test(title);
    if (alreadySuffixed) continue;

    const nextTitle = `${title} (${nextCount})`;
    const nextLine = `${hashes} ${nextTitle}`;
    if (nextLine !== lines[i]) {
      lines[i] = nextLine;
      applied.push({ ruleId: 'duplicate-heading', line: i + 1, details: { suffix: nextCount } });
    }
  }

  // 4) Empty headings: başlığı kaldır (satır siler → indeks kaymaması için sondan başa)
  const emptyHeadingIdx = issues
    .filter((issue) => String(issue?.ruleId || '').trim() === 'empty-heading')
    .map((issue) => (Number(issue?.line) || 0) - 1)
    .filter((idx) => idx >= 0 && idx < lines.length)
    .sort((a, b) => b - a);

  emptyHeadingIdx.forEach((idx) => {
    const before = lines[idx];
    if (!isEmptyHeadingLine(before)) {
      skipped.push({ ruleId: 'empty-heading', line: idx + 1, reason: 'Satır artık boş başlık görünmüyor.' });
      return;
    }
    lines.splice(idx, 1);
    applied.push({ ruleId: 'empty-heading', line: idx + 1, details: 'removed' });
  });

  const nextMarkdown = lines.join('\n');
  return {
    nextMarkdown,
    applied,
    skipped,
  };
}

