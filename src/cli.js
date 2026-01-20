#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { readFile } from './utils/file-utils.js';
import { convertToPaged } from './convert-paged.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Read package.json for version
const packageJsonPath = path.join(__dirname, '../package.json');
let version = '1.0.0';
try {
  const packageJson = JSON.parse(await readFile(packageJsonPath));
  version = packageJson.version;
} catch (error) {
  // Use default version if package.json can't be read
}

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.blue('╔═══════════════════════════════════════════════════════╗')}
${chalk.blue('║')}   ${chalk.bold.white('Carbon Markdown to PDF Converter')}              ${chalk.blue('║')}
${chalk.blue('║')}   ${chalk.gray('IBM Carbon Design System')}                      ${chalk.blue('║')}
${chalk.blue('╚═══════════════════════════════════════════════════════╝')}
`;

program
  .name('carbon-pdf')
  .description('Convert markdown to print-ready PDFs using Carbon + Paged.js')
  .version(version)
  .addHelpText('beforeAll', banner);

program
  .argument('<input>', 'Input markdown file')
  .option('--layout-profile <profile>', 'Layout profile: symmetric, asymmetric, dashboard', 'symmetric')
  .option('--print-profile <profile>', 'Print profile: pagedjs-a4, pagedjs-a3', 'pagedjs-a4')
  .option('--theme <theme>', 'Theme: white, g10, g90, g100', 'white')
  .option('-o, --output <output>', 'Output PDF file path')
  .option('-v, --verbose', 'Verbose output')
  .action(async (input, options) => {
    try {
      console.log(banner);
      console.log(chalk.bold.white('Starting conversion...\n'));

      const inputPath = path.resolve(input);
      const { layoutProfile, printProfile, theme, output, verbose } = options;

      if (verbose) {
        console.log(chalk.gray(`Input: ${inputPath}`));
        console.log(chalk.gray(`Layout profile: ${layoutProfile}`));
        console.log(chalk.gray(`Print profile: ${printProfile}`));
        console.log(chalk.gray(`Theme: ${theme}`));
        console.log(chalk.gray(`Output: ${output || 'auto'}\n`));
      }

      console.log(chalk.blue.bold('\n━━━ Paged.js Conversion ━━━\n'));
      const pagedOutput = await convertToPaged(inputPath, output || null, {
        layoutProfile,
        printProfile,
        theme,
        verbose,
      });
      console.log(chalk.green.bold(`\n✓ PDF: ${pagedOutput}`));

      console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.green.bold('✓ Conversion completed successfully!'));
      console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    } catch (error) {
      console.error(chalk.red.bold('\n✗ Error:'), error.message);
      if (options.verbose) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Info command
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

    // Check Paged.js
    try {
      const pagedVersion = readPackageVersion('pagedjs');
      if (pagedVersion) {
        console.log(chalk.green('✓'), chalk.bold('Paged.js:'), `v${pagedVersion}`);
      } else {
        console.log(chalk.red('✗'), chalk.bold('Paged.js:'), 'Not installed');
      }
    } catch {
      console.log(chalk.red('✗'), chalk.bold('Paged.js:'), 'Not installed');
    }

    // Check Puppeteer
    try {
      const puppeteerVersion = readPackageVersion('puppeteer');
      if (puppeteerVersion) {
        console.log(chalk.green('✓'), chalk.bold('Puppeteer:'), `v${puppeteerVersion}`);
      } else {
        console.log(chalk.red('✗'), chalk.bold('Puppeteer:'), 'Not installed');
      }
    } catch {
      console.log(chalk.red('✗'), chalk.bold('Puppeteer:'), 'Not installed');
    }

    console.log(chalk.green('✓'), chalk.bold('Node.js:'), process.version);
    console.log(chalk.green('✓'), chalk.bold('Carbon PDF:'), `v${version}`);

    console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  });

// Example command
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
    const { writeFile } = await import('./utils/file-utils.js');
    await writeFile(examplePath, exampleContent);

    console.log(chalk.green('✓'), `Example created: ${examplePath}`);
    console.log(chalk.blue('\nTo convert to PDF, run:'));
    console.log(chalk.gray(`  carbon-pdf example.md\n`));
  });

program.parse();
