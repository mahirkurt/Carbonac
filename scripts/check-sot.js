import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SOT_FILE = 'docs/PROJE-TALIMATLARI.md';
const DEPENDENT_DOCS = [
  'docs/SPRINT-0-DELIVERABLES.md',
  'docs/IS-PLANI.md',
  'docs/archive/FAZ-0-SPRINT-0.md',
  'docs/archive/FAZ-1-SPRINT-1.md',
  'docs/archive/FAZ-1-SPRINT-2.md',
  'docs/archive/FAZ-2-SPRINT-3.md',
  'docs/archive/FAZ-2-SPRINT-4.md',
  'docs/archive/FAZ-3-SPRINT-5.md',
  'docs/archive/FAZ-3-SPRINT-6.md',
  'docs/REPO-HARITASI.md',
  'docs/SCHEMA-KONTRATLARI.md',
  'docs/PROJE-DURUMU.md',
  'docs/TO-DO-LIST.md',
  'docs/nihai-todo-list.md'
];

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return null;
  try {
    return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  } catch (error) {
    console.error('[check-sot] Failed to read event payload:', error.message);
    return null;
  }
}

function getDiffRange() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const payload = readEventPayload();

  if (eventName === 'pull_request' && payload?.pull_request) {
    return {
      base: payload.pull_request.base.sha,
      head: payload.pull_request.head.sha,
    };
  }

  if (eventName === 'push' && payload?.before && payload?.after) {
    return {
      base: payload.before,
      head: payload.after,
    };
  }

  return null;
}

function getChangedFiles() {
  const range = getDiffRange();
  const diffTarget = range ? `${range.base}..${range.head}` : 'HEAD~1..HEAD';

  try {
    const output = execSync(`git diff --name-only ${diffTarget}`, { encoding: 'utf8' });
    return output.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch (error) {
    console.error('[check-sot] git diff failed:', error.message);
    return [];
  }
}

const changedFiles = getChangedFiles();
if (!changedFiles.length) {
  console.log('[check-sot] No changed files detected.');
  process.exit(0);
}

const sotChanged = changedFiles.includes(SOT_FILE);
if (!sotChanged) {
  console.log('[check-sot] SoT not modified.');
  process.exit(0);
}

const dependentChanged = DEPENDENT_DOCS.some((doc) => changedFiles.includes(doc));
if (!dependentChanged) {
  console.error('[check-sot] SoT changed without dependent doc updates.');
  console.error('[check-sot] Update at least one of:');
  DEPENDENT_DOCS.forEach((doc) => console.error(`- ${doc}`));
  process.exit(1);
}

console.log('[check-sot] SoT change validated with dependent docs.');
