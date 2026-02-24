#!/usr/bin/env node
/**
 * Export approved examples as JSONL for Gemini fine-tuning.
 *
 * Usage:
 *   node scripts/training/export-training-data.js                    # export all
 *   node scripts/training/export-training-data.js --output data.jsonl
 *   node scripts/training/export-training-data.js --min-score 90
 */

import fs from 'fs/promises';
import path from 'path';

const EXAMPLES_DIR = 'library/examples';

const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
}

async function main() {
  const outputPath = getArg('output', 'library/training-data.jsonl');
  const minScore = Number(getArg('min-score', 0));
  const testSplit = Number(getArg('test-split', 0.2));

  let entries;
  try {
    entries = await fs.readdir(EXAMPLES_DIR);
  } catch {
    console.error('No examples directory found.');
    process.exit(1);
  }

  const examples = [];
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const dir = path.join(EXAMPLES_DIR, entry);
    try {
      const scoreRaw = await fs.readFile(path.join(dir, 'score.json'), 'utf-8');
      const score = JSON.parse(scoreRaw);
      if (score.manualReview !== 'approved') continue;
      if (score.qaScore < minScore) continue;

      const markdown = await fs.readFile(path.join(dir, 'input.md'), 'utf-8');
      const layout = await fs.readFile(path.join(dir, 'layout.json'), 'utf-8');

      const layoutJson = JSON.parse(layout);
      const docType = score.docType || 'report';
      const template = score.template || 'unknown';
      const tags = (score.tags || []).join(', ');

      // Truncate markdown for training (max 8000 chars)
      const truncatedMd = markdown.length > 8000
        ? markdown.slice(0, 6000) + '\n...\n' + markdown.slice(-2000)
        : markdown;

      const textInput = [
        `Document type: ${docType}`,
        `Template: ${template}`,
        tags ? `Tags: ${tags}` : '',
        `\nMarkdown:\n${truncatedMd}`,
      ].filter(Boolean).join('\n');

      // Clean layout JSON (remove runtime metadata)
      const cleanLayout = { ...layoutJson };
      delete cleanLayout.ai;
      delete cleanLayout.version;
      delete cleanLayout.metadata;

      examples.push({
        text_input: textInput,
        output: JSON.stringify(cleanLayout),
        _meta: { id: entry, qaScore: score.qaScore },
      });
    } catch {
      // skip invalid entries
    }
  }

  if (!examples.length) {
    console.log('No approved examples found. Need at least 1 to export.');
    process.exit(0);
  }

  // Shuffle and split
  for (let i = examples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [examples[i], examples[j]] = [examples[j], examples[i]];
  }

  const testCount = Math.max(1, Math.floor(examples.length * testSplit));
  const trainSet = examples.slice(testCount);
  const testSet = examples.slice(0, testCount);

  // Write training JSONL
  const trainLines = trainSet.map((e) => JSON.stringify({ text_input: e.text_input, output: e.output }));
  await fs.writeFile(outputPath, trainLines.join('\n') + '\n');

  // Write test JSONL
  const testPath = outputPath.replace('.jsonl', '-test.jsonl');
  const testLines = testSet.map((e) => JSON.stringify({ text_input: e.text_input, output: e.output }));
  await fs.writeFile(testPath, testLines.join('\n') + '\n');

  console.log(`Exported ${trainSet.length} training + ${testSet.length} test examples`);
  console.log(`Training: ${outputPath}`);
  console.log(`Test:     ${testPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
