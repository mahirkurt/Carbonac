#!/usr/bin/env node
/**
 * Collect a completed job output as a training example candidate.
 *
 * Usage:
 *   node scripts/training/collect-example.js \
 *     --markdown path/to/input.md \
 *     --layout path/to/layout.json \
 *     --qa-score 92 \
 *     --tags report,data-heavy \
 *     --template corporate-standard
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

async function main() {
  const markdownPath = getArg('markdown');
  const layoutPath = getArg('layout');
  const qaScore = Number(getArg('qa-score') || 0);
  const tags = (getArg('tags') || '').split(',').filter(Boolean);
  const template = getArg('template') || 'unknown';
  const docType = getArg('doc-type') || 'report';

  if (!markdownPath || !layoutPath) {
    console.error('Usage: collect-example.js --markdown <path> --layout <path> [--qa-score N] [--tags a,b] [--template name] [--doc-type type]');
    process.exit(1);
  }

  const markdown = await fs.readFile(markdownPath, 'utf-8');
  const layout = await fs.readFile(layoutPath, 'utf-8');
  JSON.parse(layout); // validate

  const id = `example-${randomUUID().slice(0, 8)}`;
  const stagingDir = path.join('library', 'examples-staging', id);
  await fs.mkdir(stagingDir, { recursive: true });

  await fs.writeFile(path.join(stagingDir, 'input.md'), markdown);
  await fs.writeFile(path.join(stagingDir, 'layout.json'), layout);
  await fs.writeFile(
    path.join(stagingDir, 'score.json'),
    JSON.stringify({
      qaScore,
      manualReview: 'pending',
      strengths: [],
      weaknesses: [],
      tags,
      template,
      docType,
      createdAt: new Date().toISOString(),
    }, null, 2)
  );

  console.log(`Example staged: ${stagingDir}`);
  console.log(`QA score: ${qaScore} | Tags: ${tags.join(', ') || 'none'} | Template: ${template}`);
  console.log('Run: node scripts/training/review-candidates.js to approve/reject');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
