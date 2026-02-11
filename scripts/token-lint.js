import fs from 'fs/promises';
import path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'styles', 'print');
const FILE_EXT = '.css';
const PATTERNS = [
  { label: 'hex color', regex: /#[0-9a-fA-F]{3,8}/g },
  { label: 'px value', regex: /\b\d*\.?\d+px\b/g },
];

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(FILE_EXT)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findMatches(content, regex) {
  const matches = [];
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(content)) !== null) {
    matches.push({ index: match.index, value: match[0] });
  }
  return matches;
}

function getLineInfo(content, index) {
  const lines = content.slice(0, index).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

async function main() {
  const files = await listFiles(TARGET_DIR);
  const violations = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    PATTERNS.forEach((pattern) => {
      const matches = findMatches(content, pattern.regex);
      matches.forEach((match) => {
        const location = getLineInfo(content, match.index);
        violations.push({
          file,
          label: pattern.label,
          value: match.value,
          line: location.line,
          column: location.column,
        });
      });
    });
  }

  if (!violations.length) {
    console.log('[token-lint] No hard-coded hex/px values found.');
    return;
  }

  console.error('[token-lint] Hard-coded hex/px values detected:');
  violations.forEach((violation) => {
    console.error(
      `- ${violation.file}:${violation.line}:${violation.column} ${violation.label} (${violation.value})`
    );
  });
  process.exit(1);
}

main().catch((error) => {
  console.error(`[token-lint] Failed: ${error.message}`);
  process.exit(1);
});
