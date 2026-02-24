#!/usr/bin/env node
/**
 * Review staged training examples — approve or reject.
 *
 * Usage:
 *   node scripts/training/review-candidates.js          # list all pending
 *   node scripts/training/review-candidates.js approve <id>
 *   node scripts/training/review-candidates.js reject <id>
 */

import fs from 'fs/promises';
import path from 'path';

const STAGING_DIR = 'library/examples-staging';
const APPROVED_DIR = 'library/examples';

async function listCandidates() {
  let entries;
  try {
    entries = await fs.readdir(STAGING_DIR);
  } catch {
    console.log('No staging directory found.');
    return;
  }
  const dirs = [];
  for (const entry of entries) {
    const scorePath = path.join(STAGING_DIR, entry, 'score.json');
    try {
      const raw = await fs.readFile(scorePath, 'utf-8');
      const score = JSON.parse(raw);
      dirs.push({ id: entry, ...score });
    } catch {
      // skip non-example entries
    }
  }
  if (!dirs.length) {
    console.log('No pending candidates.');
    return;
  }
  console.log(`\n${dirs.length} candidate(s):\n`);
  for (const d of dirs) {
    const status = d.manualReview === 'pending' ? '[pending]' : d.manualReview === 'approved' ? '[approved]' : '[rejected]';
    console.log(`  ${status} ${d.id}  QA: ${d.qaScore}  Tags: ${(d.tags || []).join(',')}  Template: ${d.template || '?'}`);
  }
  console.log('\nUsage: review-candidates.js approve|reject <id>');
}

async function moveExample(id, action) {
  const srcDir = path.join(STAGING_DIR, id);
  const scorePath = path.join(srcDir, 'score.json');

  try {
    await fs.access(srcDir);
  } catch {
    console.error(`Candidate not found: ${id}`);
    process.exit(1);
  }

  const raw = await fs.readFile(scorePath, 'utf-8');
  const score = JSON.parse(raw);

  if (action === 'approve') {
    score.manualReview = 'approved';
    score.reviewedAt = new Date().toISOString();
    await fs.writeFile(scorePath, JSON.stringify(score, null, 2));
    const destDir = path.join(APPROVED_DIR, id);
    await fs.rename(srcDir, destDir);
    console.log(`Approved and moved to ${destDir}`);
  } else if (action === 'reject') {
    score.manualReview = 'rejected';
    score.reviewedAt = new Date().toISOString();
    await fs.writeFile(scorePath, JSON.stringify(score, null, 2));
    await fs.rm(srcDir, { recursive: true });
    console.log(`Rejected and removed: ${id}`);
  }
}

const [action, id] = process.argv.slice(2);

if (!action || action === 'list') {
  listCandidates();
} else if ((action === 'approve' || action === 'reject') && id) {
  moveExample(id, action);
} else {
  console.log('Usage: review-candidates.js [list|approve <id>|reject <id>]');
}
