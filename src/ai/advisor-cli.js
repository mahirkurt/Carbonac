/**
 * Carbon Design Advisor - CLI Interface
 * Interactive command-line tool for AI-powered design recommendations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeFile, askDesignQuestion, analyzeDocument } from './carbon-advisor.js';
import { readFile } from '../utils/file-utils.js';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.blue('╔═══════════════════════════════════════════════════════════╗')}
${chalk.blue('║')}   ${chalk.bold.white('Carbon Design Advisor')}                              ${chalk.blue('║')}
${chalk.blue('║')}   ${chalk.gray('AI-Powered IBM Carbon Design System Assistant')}     ${chalk.blue('║')}
${chalk.blue('║')}   ${chalk.gray('Powered by Gemini 2.0 Flash')}                        ${chalk.blue('║')}
${chalk.blue('╚═══════════════════════════════════════════════════════════╝')}
`;

program
  .name('carbon-advisor')
  .description('AI-powered Carbon Design System recommendations for markdown documents')
  .version('1.0.0')
  .addHelpText('beforeAll', banner);

// Analyze command
program
  .command('analyze <file>')
  .description('Analyze a markdown file and get Carbon Design recommendations')
  .option('-o, --output <file>', 'Save recommendations to file')
  .option('-v, --verbose', 'Show detailed analysis')
  .action(async (file, options) => {
    console.log(banner);
    console.log(chalk.blue.bold('\n📄 Dosya Analizi\n'));
    
    try {
      const filePath = path.resolve(file);
      console.log(chalk.gray(`Dosya: ${filePath}\n`));
      
      const recommendations = await analyzeFile(filePath);
      
      console.log(chalk.green.bold('\n✨ Tasarım Önerileri:\n'));
      console.log(recommendations);
      
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, recommendations, 'utf-8');
        console.log(chalk.green(`\n💾 Öneriler kaydedildi: ${options.output}`));
      }
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Hata:'), error.message);
      process.exit(1);
    }
  });

// Ask command
program
  .command('ask <question...>')
  .description('Ask a design question about Carbon Design System')
  .option('-c, --context <file>', 'Provide a markdown file as context')
  .action(async (questionParts, options) => {
    console.log(banner);
    
    const question = questionParts.join(' ');
    console.log(chalk.blue.bold('\n🤔 Sorunuz:\n'));
    console.log(chalk.white(question + '\n'));
    
    try {
      let context = '';
      if (options.context) {
        context = await readFile(path.resolve(options.context));
        console.log(chalk.gray(`Bağlam dosyası: ${options.context}\n`));
      }
      
      console.log(chalk.yellow('⏳ Yanıt hazırlanıyor...\n'));
      const response = await askDesignQuestion(question, context);
      
      console.log(chalk.green.bold('💡 Yanıt:\n'));
      console.log(response);
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Hata:'), error.message);
      process.exit(1);
    }
  });

// Interactive chat command
program
  .command('chat')
  .description('Start an interactive chat session with Carbon Design Advisor')
  .option('-c, --context <file>', 'Load a markdown file as initial context')
  .action(async (options) => {
    console.log(banner);
    console.log(chalk.blue.bold('🗣️  İnteraktif Sohbet Modu\n'));
    console.log(chalk.gray('Çıkmak için "exit" veya "quit" yazın.\n'));
    
    let context = '';
    if (options.context) {
      try {
        context = await readFile(path.resolve(options.context));
        console.log(chalk.green(`📄 Bağlam yüklendi: ${options.context}\n`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Bağlam dosyası yüklenemedi: ${error.message}\n`));
      }
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askQuestion = () => {
      rl.question(chalk.blue.bold('\n📝 Soru: '), async (input) => {
        const trimmedInput = input.trim().toLowerCase();
        
        if (trimmedInput === 'exit' || trimmedInput === 'quit') {
          console.log(chalk.blue('\n👋 Görüşmek üzere!\n'));
          rl.close();
          return;
        }
        
        if (trimmedInput === '') {
          askQuestion();
          return;
        }
        
        // Special commands
        if (trimmedInput.startsWith('/load ')) {
          const filePath = input.substring(6).trim();
          try {
            context = await readFile(path.resolve(filePath));
            console.log(chalk.green(`\n📄 Bağlam güncellendi: ${filePath}`));
          } catch (error) {
            console.log(chalk.red(`\n❌ Dosya yüklenemedi: ${error.message}`));
          }
          askQuestion();
          return;
        }
        
        if (trimmedInput === '/clear') {
          context = '';
          console.log(chalk.yellow('\n🗑️  Bağlam temizlendi.'));
          askQuestion();
          return;
        }
        
        if (trimmedInput === '/help') {
          console.log(chalk.cyan(`
Komutlar:
  /load <dosya>  - Markdown dosyasını bağlam olarak yükle
  /clear         - Bağlamı temizle
  /help          - Bu yardım mesajını göster
  exit, quit     - Sohbeti sonlandır
`));
          askQuestion();
          return;
        }
        
        try {
          console.log(chalk.yellow('\n⏳ Yanıt hazırlanıyor...'));
          const response = await askDesignQuestion(input, context);
          console.log(chalk.green.bold('\n💡 Yanıt:\n'));
          console.log(response);
        } catch (error) {
          console.log(chalk.red(`\n❌ Hata: ${error.message}`));
        }
        
        askQuestion();
      });
    };
    
    askQuestion();
  });

// Quick tips command
program
  .command('tips')
  .description('Show quick Carbon Design tips')
  .action(() => {
    console.log(banner);
    console.log(chalk.blue.bold('💡 Carbon Design Hızlı İpuçları\n'));
    
    console.log(chalk.white.bold('📐 Spacing (8px tabanlı):'));
    console.log(chalk.gray('   sp-03 = 8pt, sp-05 = 16pt, sp-07 = 32pt, sp-09 = 48pt\n'));
    
    console.log(chalk.white.bold('🎨 Ana Renkler:'));
    console.log(chalk.gray('   Primary: blue-60 (#0f62fe)'));
    console.log(chalk.gray('   Text: gray-100 (#161616)'));
    console.log(chalk.gray('   Background: gray-10 (#f4f4f4)'));
    console.log(chalk.gray('   Success: green-50 (#24a148)'));
    console.log(chalk.gray('   Error: red-60 (#da1e28)'));
    console.log(chalk.gray('   Warning: yellow-30 (#f1c21b)\n'));
    
    console.log(chalk.white.bold('🔤 Tipografi:'));
    console.log(chalk.gray('   Hero: heading-06 (42pt)'));
    console.log(chalk.gray('   Section: heading-05 (32pt)'));
    console.log(chalk.gray('   Body: body-long-02 (16pt)'));
    console.log(chalk.gray('   Code: code-02 (14pt)\n'));
    
    console.log(chalk.white.bold('📦 Componentler:'));
    console.log(chalk.gray('   card(), tile(), badge(), tag(), notification()'));
    console.log(chalk.gray('   callout(), progress-bar(), stat-tile(), timeline-item()\n'));
    
    console.log(chalk.white.bold('📊 Data Viz:'));
    console.log(chalk.gray('   bar-chart(), column-chart(), stacked-bar-chart()'));
    console.log(chalk.gray('   bullet-chart(), sparkline(), donut-stat()\n'));
  });

program.parse();
