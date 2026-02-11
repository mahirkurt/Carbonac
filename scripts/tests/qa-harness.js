import path from 'node:path';
import fs from 'node:fs/promises';

import { convertToPaged } from '../../src/convert-paged.js';
import { getProjectRoot } from '../../src/utils/file-utils.js';

const projectRoot = getProjectRoot();
const inputPath =
  process.env.QA_INPUT_PATH ||
  path.join(projectRoot, 'examples', 'sample.md');

const outputDir = path.join(projectRoot, 'output', 'qa');
await fs.mkdir(outputDir, { recursive: true });

const outputPath =
  process.env.QA_OUTPUT_PATH ||
  path.join(outputDir, 'qa-preview.pdf');
const screenshotPath =
  process.env.QA_SCREENSHOT_PATH ||
  path.join(outputDir, 'qa-preview.png');
const baselineKey =
  process.env.QA_BASELINE_KEY ||
  path.basename(inputPath, path.extname(inputPath));

const qaReportEnabled = process.env.QA_ENABLED !== 'false';
const qaUseGemini = process.env.QA_USE_GEMINI === 'true';

const result = await convertToPaged(inputPath, outputPath, {
  layoutProfile: process.env.QA_LAYOUT_PROFILE || 'symmetric',
  printProfile: process.env.QA_PRINT_PROFILE || 'pagedjs-a4',
  theme: process.env.QA_THEME || 'white',
  qa: {
    enabled: qaReportEnabled,
    useGemini: qaUseGemini,
    screenshotPath,
    baselineKey,
  },
  returnResult: true,
  verbose: true,
});

const qaReport = result?.qaReport || {};
const summary = {
  outputPath: result?.outputPath || outputPath,
  issues: qaReport.issues?.length || 0,
  accessibilityIssues: qaReport.accessibilityIssues?.length || 0,
  iterations: qaReport.iterations || 0,
  aiSeverity: qaReport.aiReview?.severity || null,
};

console.log(JSON.stringify(summary, null, 2));
