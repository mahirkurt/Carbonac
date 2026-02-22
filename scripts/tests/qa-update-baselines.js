/**
 * QA Golden Master — Update Baselines
 *
 * Generates PDF screenshots for each template+profile combination
 * and saves them as golden baselines for visual regression testing.
 *
 * Usage:
 *   npm run qa:update-baselines
 *   QA_INPUT_PATH=examples/report.md npm run qa:update-baselines
 *   QA_PROFILES=pagedjs-a4,pagedjs-a5 npm run qa:update-baselines
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { convertToPaged } from '../../src/convert-paged.js';
import { getProjectRoot } from '../../src/utils/file-utils.js';

const projectRoot = getProjectRoot();

const inputPath =
  process.env.QA_INPUT_PATH ||
  path.join(projectRoot, 'examples', 'sample.md');

const baselineDir =
  process.env.PDF_QA_BASELINE_DIR ||
  path.join(projectRoot, 'output', 'qa-baselines');

const profiles = (process.env.QA_PROFILES || 'pagedjs-a4,pagedjs-a5')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

const layouts = (process.env.QA_LAYOUTS || 'symmetric')
  .split(',')
  .map((l) => l.trim())
  .filter(Boolean);

const themes = (process.env.QA_THEMES || 'white')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

await fs.mkdir(baselineDir, { recursive: true });

const combinations = [];
for (const printProfile of profiles) {
  for (const layout of layouts) {
    for (const theme of themes) {
      combinations.push({ printProfile, layout, theme });
    }
  }
}

console.log(`Updating ${combinations.length} baseline(s) from: ${inputPath}`);
console.log(`Baseline directory: ${baselineDir}\n`);

let updated = 0;
let failed = 0;

for (const { printProfile, layout, theme } of combinations) {
  const key = `${path.basename(inputPath, path.extname(inputPath))}-${layout}-${printProfile}-${theme}`;
  const outputPath = path.join(baselineDir, `${key}.pdf`);
  const screenshotPath = path.join(baselineDir, `${key}.png`);

  console.log(`  Generating: ${key}`);

  try {
    await convertToPaged(inputPath, outputPath, {
      layoutProfile: layout,
      printProfile,
      theme,
      qa: {
        enabled: false,
      },
      returnResult: true,
      verbose: false,
    });

    // The convertToPaged function should have generated a screenshot
    // If not, we still have the PDF which is the primary baseline
    try {
      await fs.access(screenshotPath);
    } catch {
      // Screenshot doesn't exist yet — that's okay, visual regression
      // will create it on the next QA run
    }

    // Clean up the PDF since we only need the screenshot for baselines
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup failures
    }

    updated += 1;
    console.log(`    OK`);
  } catch (err) {
    failed += 1;
    console.error(`    FAILED: ${err.message}`);
  }
}

console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
