#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { readFile, writeFile, ensureDir, fileExists } from './utils/file-utils.js';
import { parseMarkdown } from './utils/markdown-parser.js';
import { convertToPaged } from './convert-paged.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), 'output', 'cli');
const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), '.cache', 'carbonac');

const banner = `
${chalk.blue('╔═══════════════════════════════════════════════════════╗')}
${chalk.blue('║')}   ${chalk.bold.white('Carbonac CLI')}                                 ${chalk.blue('║')}
${chalk.blue('║')}   ${chalk.gray('IBM Carbon + Paged.js PDF Pipeline')}              ${chalk.blue('║')}
${chalk.blue('╚═══════════════════════════════════════════════════════╝')}
`;

async function resolvePackageVersion() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function resolveTemplateKey(options, metadata) {
  return (
    options.template ||
    metadata.templateKey ||
    metadata.template ||
    metadata.templateId ||
    metadata.templateName ||
    ''
  );
}

function buildCacheKey({ content, templateKey, theme, layoutProfile, printProfile }) {
  const hash = crypto.createHash('sha256');
  hash.update(content || '');
  hash.update(`|template:${templateKey || ''}`);
  hash.update(`|theme:${theme || ''}`);
  hash.update(`|layout:${layoutProfile || ''}`);
  hash.update(`|print:${printProfile || ''}`);
  return hash.digest('hex');
}

function resolveCachePaths(cacheDir, key) {
  const baseDir = path.join(cacheDir, key);
  return {
    dir: baseDir,
    pdf: path.join(baseDir, 'output.pdf'),
    html: path.join(baseDir, 'output.html'),
    png: path.join(baseDir, 'preview.png'),
    meta: path.join(baseDir, 'meta.json'),
  };
}

function resolveOutputPaths(inputPath, options) {
  const outputDir = path.resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const pdfPath = options.output
    ? path.resolve(options.output)
    : path.join(outputDir, `${baseName}.pdf`);
  return {
    outputDir,
    baseName,
    pdf: pdfPath,
    html: options.html ? path.join(outputDir, `${baseName}.html`) : null,
    png: options.png ? path.join(outputDir, `${baseName}-preview.png`) : null,
    qaReport: path.join(outputDir, `${baseName}-qa-report.json`),
    qaReportHtml: path.join(outputDir, `${baseName}-qa-report.html`),
  };
}

async function copyFileSafe(source, dest) {
  if (!source || !dest) return false;
  if (!(await fileExists(source))) return false;
  await ensureDir(path.dirname(dest));
  await fs.copyFile(source, dest);
  return true;
}

async function handleCacheHit(cachePaths, outputs, options) {
  const copied = [];
  if (await copyFileSafe(cachePaths.pdf, outputs.pdf)) {
    copied.push(outputs.pdf);
  }
  if (options.html && await copyFileSafe(cachePaths.html, outputs.html)) {
    copied.push(outputs.html);
  }
  if (options.png && await copyFileSafe(cachePaths.png, outputs.png)) {
    copied.push(outputs.png);
  }
  return copied;
}

async function updateCache(cachePaths, outputs, meta) {
  await ensureDir(cachePaths.dir);
  await copyFileSafe(outputs.pdf, cachePaths.pdf);
  if (outputs.html) {
    await copyFileSafe(outputs.html, cachePaths.html);
  }
  if (outputs.png) {
    await copyFileSafe(outputs.png, cachePaths.png);
  }
  await writeFile(cachePaths.meta, JSON.stringify(meta, null, 2));
}

async function runConversion({ inputPath, mode, options }) {
  const resolvedInput = path.resolve(inputPath);
  const rawContent = await readFile(resolvedInput);
  const { metadata } = parseMarkdown(rawContent);

  const layoutProfile = options.layoutProfile || metadata.layoutProfile || 'symmetric';
  const printProfile = options.printProfile || metadata.printProfile || 'pagedjs-a4';
  const theme = options.theme || metadata.theme || 'white';
  const templateKey = resolveTemplateKey(options, metadata);

  const outputs = resolveOutputPaths(resolvedInput, options);
  await ensureDir(path.dirname(outputs.pdf));
  if (options.verbose) {
    console.log(`[${mode}] ${resolvedInput} -> ${outputs.pdf}`);
  }

  const cacheEnabled = options.cache !== false;
  const cacheDir = path.resolve(options.cacheDir || DEFAULT_CACHE_DIR);
  const cacheKey = buildCacheKey({
    content: rawContent,
    templateKey,
    theme,
    layoutProfile,
    printProfile,
  });
  const cachePaths = resolveCachePaths(cacheDir, cacheKey);

  if (cacheEnabled) {
    const hasPdf = await fileExists(cachePaths.pdf);
    const hasHtml = !options.html || await fileExists(cachePaths.html);
    const hasPng = !options.png || await fileExists(cachePaths.png);
    if (hasPdf && hasHtml && hasPng) {
      const copied = await handleCacheHit(cachePaths, outputs, options);
      if (options.verbose) {
        console.log(`[${mode}] cache hit: ${cacheKey}`);
      }
      return {
        cached: true,
        copied,
        outputs,
      };
    }
  }

  const artifacts = {
    htmlPath: options.html ? outputs.html : null,
  };
  if (mode === 'qa') {
    artifacts.qaReportPath = outputs.qaReport;
    artifacts.qaReportHtmlPath = outputs.qaReportHtml;
  }

  const preview = options.png ? { screenshotPath: outputs.png } : {};
  const tokens = templateKey ? { templateKey } : null;

  const qa = mode === 'qa'
    ? { enabled: true }
    : {};

  const result = await convertToPaged(resolvedInput, outputs.pdf, {
    layoutProfile,
    printProfile,
    theme,
    verbose: options.verbose,
    preview,
    qa,
    tokens,
    artifacts,
    returnResult: true,
  });

  if (cacheEnabled) {
    await updateCache(cachePaths, outputs, {
      inputPath: resolvedInput,
      cacheKey,
      layoutProfile,
      printProfile,
      theme,
      templateKey,
      generatedAt: new Date().toISOString(),
    });
  }

  return {
    cached: false,
    result,
    outputs,
  };
}

async function runBatch({ inputs, mode, options }) {
  const concurrency = Math.max(1, Number(options.concurrency || os.cpus().length));
  let index = 0;
  let firstError = null;

  const tasks = inputs.map((input) => async () => {
    if (firstError) return null;
    try {
      const info = await runConversion({ inputPath: input, mode, options });
      return { input, info };
    } catch (error) {
      firstError = error;
      return null;
    }
  });

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      await tasks[current]();
    }
  });

  await Promise.all(workers);

  if (firstError) {
    throw firstError;
  }
}

function addCommonOptions(command) {
  return command
    .option('--layout-profile <profile>', 'Layout profile (frontmatter default: symmetric)')
    .option('--print-profile <profile>', 'Print profile (frontmatter default: pagedjs-a4)')
    .option('--theme <theme>', 'Theme (frontmatter default: white)')
    .option('--template <key>', 'Template key override (used for tokens + cache)')
    .option('--output <path>', 'Output PDF path (single input only)')
    .option('--output-dir <dir>', 'Output directory for batch builds')
    .option('--html', 'Export HTML alongside PDF', false)
    .option('--png', 'Export PNG preview thumbnail', false)
    .option('--no-cache', 'Disable build cache')
    .option('--cache-dir <dir>', 'Cache directory (default: .cache/carbonac)')
    .option('--concurrency <n>', 'Parallel build concurrency')
    .option('-v, --verbose', 'Verbose output');
}

const program = new Command();
const version = await resolvePackageVersion();

program
  .name('carbonac')
  .description('Build PDF outputs using Carbon + Paged.js')
  .version(version)
  .addHelpText('beforeAll', banner);

addCommonOptions(
  program
    .command('build', { isDefault: true })
    .description('Build PDF outputs (default command)')
    .argument('<input...>', 'Input markdown file(s)')
    .action(async (inputs, options) => {
      try {
        console.log(banner);
        if (options.output && inputs.length > 1) {
          throw new Error('--output can only be used with a single input.');
        }
        await runBatch({ inputs, mode: 'build', options });
        console.log(chalk.green('✓ Build completed.'));
      } catch (error) {
        console.error(chalk.red('✗ Build failed:'), error.message);
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    })
);

addCommonOptions(
  program
    .command('qa')
    .description('Build PDF outputs with QA artifacts')
    .argument('<input...>', 'Input markdown file(s)')
    .action(async (inputs, options) => {
      try {
        console.log(banner);
        if (options.output && inputs.length > 1) {
          throw new Error('--output can only be used with a single input.');
        }
        await runBatch({ inputs, mode: 'qa', options });
        console.log(chalk.green('✓ QA build completed.'));
      } catch (error) {
        console.error(chalk.red('✗ QA build failed:'), error.message);
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    })
);

program
  .command('info')
  .description('Display system information')
  .action(async () => {
    console.log(banner);
    console.log(chalk.bold.white('System Information:\n'));

    const readPackageVersion = (packageName) => {
      try {
        return require(`${packageName}/package.json`).version;
      } catch {
        return null;
      }
    };

    const pagedVersion = readPackageVersion('pagedjs');
    console.log(
      pagedVersion
        ? `${chalk.green('✓')} ${chalk.bold('Paged.js:')} v${pagedVersion}`
        : `${chalk.red('✗')} ${chalk.bold('Paged.js:')} Not installed`
    );

    const puppeteerVersion = readPackageVersion('puppeteer');
    console.log(
      puppeteerVersion
        ? `${chalk.green('✓')} ${chalk.bold('Puppeteer:')} v${puppeteerVersion}`
        : `${chalk.red('✗')} ${chalk.bold('Puppeteer:')} Not installed`
    );

    console.log(chalk.green('✓'), chalk.bold('Node.js:'), process.version);
    console.log(chalk.green('✓'), chalk.bold('Carbonac CLI:'), `v${version}`);
    console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  });

program
  .command('example')
  .description('Generate an example markdown file')
  .action(async () => {
    console.log(banner);
    console.log(chalk.bold.white('Creating example markdown file...\n'));

    const exampleContent = `---
title: "Sample Academic Report"
subtitle: "IBM Carbon Design System Integration"
author: "Dr. Jane Smith"
date: "December 2024"
---

# Introduction

This is a **sample academic report** demonstrating the *IBM Carbon Design System* integration with markdown to PDF conversion.

## Key Features

### Typography

The document uses **IBM Plex Sans** for body text, creating a professional and readable appearance.

### Color Palette

Carbon's carefully crafted color system ensures:

- Optimal contrast ratios
- Accessibility compliance
- Visual hierarchy
- Professional appearance

## Code Examples

Here's a simple Python example:

\`\`\`python
def fibonacci(n):
    """Calculate fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

Inline code looks like this: \`const result = calculate(42);\`

## Mathematical Notation

The formula for the area of a circle: A = πr²

## Lists

### Ordered List

1. First item
2. Second item
3. Third item

### Unordered List

- Research methodology
- Data collection
- Analysis procedures
- Conclusion

## Blockquotes

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

## Layout Profiles

| Profile | Use Case |
|---------|----------|
| symmetric | Balanced editorial layout |
| asymmetric | Text + insight callouts |
| dashboard | Dense data grids |

## Links

Visit [IBM Carbon Design System](https://carbondesignsystem.com) for more information.

## Conclusion

This template demonstrates professional document styling using IBM's Carbon Design System with Paged.js print rules for production-ready output.
`;

    const examplePath = path.join(process.cwd(), 'example.md');
    await writeFile(examplePath, exampleContent);

    console.log(chalk.green('✓'), `Example created: ${examplePath}`);
    console.log(chalk.blue('\nTo convert to PDF, run:'));
    console.log(chalk.gray('  carbonac build example.md\n'));
  });

program.parse();
