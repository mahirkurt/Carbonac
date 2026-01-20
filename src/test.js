import assert from 'node:assert/strict';

import path from 'path';
import { parseMarkdown, markdownToHtml } from './utils/markdown-parser.js';
import { fileExists, getProjectRoot } from './utils/file-utils.js';

const sample = `---
title: "Test Document"
---
# Hello`;

const { metadata, content } = parseMarkdown(sample);
assert.equal(metadata.title, 'Test Document');
assert.ok(content.includes('# Hello'));

const html = markdownToHtml('# Hello');
assert.ok(html.includes('<h1'));

const projectRoot = getProjectRoot();
const basePrint = path.join(projectRoot, 'styles', 'print', 'print-base.css');
const a4Print = path.join(projectRoot, 'styles', 'print', 'pagedjs-a4.css');

const [baseExists, a4Exists] = await Promise.all([
  fileExists(basePrint),
  fileExists(a4Print),
]);

assert.ok(baseExists, 'Missing print-base.css');
assert.ok(a4Exists, 'Missing pagedjs-a4.css');

console.log('Tests passed.');
