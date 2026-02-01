/**
 * Carbon Design Advisor
 * LLM-powered system that analyzes markdown documents and suggests
 * appropriate Carbon Design System elements for styling
 */

import { readFile } from '../utils/file-utils.js';
import { getProjectRoot } from '../utils/file-utils.js';
import path from 'path';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDQXLlll0KrScz5BIDgD0eMH3CH5onowz8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Load Carbon Design System reference documentation
 */
async function loadCarbonReference() {
  const projectRoot = getProjectRoot();
  const carbonElementsPath = path.join(projectRoot, 'docs', 'CARBON_ELEMENTS.md');
  
  try {
    const content = await readFile(carbonElementsPath);
    return content;
  } catch (error) {
    console.error('Failed to load Carbon elements reference:', error.message);
    return null;
  }
}

/**
 * Build the system prompt for Carbon Design analysis
 */
function buildSystemPrompt(carbonReference) {
  return `Sen IBM Carbon Design System uzmanısın. Kullanıcının sağladığı markdown dokümanlarını analiz ederek, 
profesyonel PDF çıktısı için en uygun Carbon Design elementlerini öneriyorsun.

## Görevin

1. **Doküman Analizi**: Markdown içeriğini analiz et (başlıklar, listeler, tablolar, kod blokları, vurgular)
2. **Element Eşleştirme**: Her içerik türü için uygun Carbon elementini belirle
3. **Tasarım Önerileri**: Renk, tipografi, spacing ve layout önerileri sun
4. **Kod Örnekleri**: Typst template'inde nasıl kullanılacağını göster

## Mevcut Carbon Elementleri

${carbonReference ? carbonReference.substring(0, 15000) : 'Carbon referansı yüklenemedi.'}

## Çıktı Formatı

Her analiz için şu yapıyı kullan:

### 📄 Doküman Özeti
- Doküman türü (rapor, makale, sunum, vb.)
- Ana içerik kategorileri
- Hedef kitle

### 🎨 Önerilen Tasarım Elementleri

| İçerik Türü | Carbon Element | Token/Değer | Açıklama |
|-------------|----------------|-------------|----------|
| ... | ... | ... | ... |

### 🔤 Tipografi Önerileri
- Başlık stilleri (heading-01 - heading-07)
- Gövde metni (body-01, body-02)
- Özel metin stilleri (code, label, legal)

### 🎨 Renk Paleti
- Ana renkler
- Vurgu renkleri
- Durum renkleri (success, warning, error, info)

### 📐 Layout Önerileri
- Sayfa düzeni
- Spacing tokenları
- Grid kullanımı

### 💡 Typst Kod Örnekleri
\`\`\`typst
// Önerilen Typst kodları
\`\`\`

Yanıtlarını Türkçe olarak ver.`;
}

/**
 * Call Gemini API with the analysis request
 */
async function callGeminiAPI(prompt, userContent) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\n---\n\n## Analiz Edilecek Markdown Dokümanı:\n\n${userContent}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    throw error;
  }
}

/**
 * Analyze a markdown document and get Carbon Design recommendations
 * @param {string} markdownContent - The markdown content to analyze
 * @returns {Promise<string>} - Design recommendations
 */
export async function analyzeDocument(markdownContent) {
  console.log('🔍 Loading Carbon Design System reference...');
  const carbonReference = await loadCarbonReference();
  
  console.log('🤖 Building analysis prompt...');
  const systemPrompt = buildSystemPrompt(carbonReference);
  
  console.log('📤 Sending to Gemini API...');
  const recommendations = await callGeminiAPI(systemPrompt, markdownContent);
  
  return recommendations;
}

/**
 * Analyze a markdown file by path
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<string>} - Design recommendations
 */
export async function analyzeFile(filePath) {
  console.log(`📄 Reading file: ${filePath}`);
  const content = await readFile(filePath);
  return analyzeDocument(content);
}

/**
 * Interactive chat mode for design questions
 * @param {string} question - User's design question
 * @param {string} context - Optional markdown context
 * @returns {Promise<string>} - AI response
 */
export async function askDesignQuestion(question, context = '') {
  const carbonReference = await loadCarbonReference();
  
  const prompt = `Sen IBM Carbon Design System uzmanısın. Kullanıcının tasarım sorularını yanıtlıyorsun.

## Carbon Design System Referansı (Özet)
${carbonReference ? carbonReference.substring(0, 10000) : ''}

## Kurallar
- Yanıtlarını Türkçe ver
- Somut kod örnekleri sun
- Carbon tokenlarını ve değerlerini belirt
- Typst veya Quarto template örnekleri ver

${context ? `## Mevcut Doküman Bağlamı:\n${context}\n` : ''}

## Kullanıcı Sorusu:
${question}`;

  const response = await callGeminiAPI(prompt, '');
  return response;
}

// CLI Support
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Carbon Design Advisor - AI-Powered Design Assistant     ║
╚═══════════════════════════════════════════════════════════╝

Kullanım:
  node src/ai/carbon-advisor.js <markdown-file>    # Dosya analizi
  node src/ai/carbon-advisor.js --ask "soru"       # Tasarım sorusu

Örnekler:
  node src/ai/carbon-advisor.js examples/sample.md
  node src/ai/carbon-advisor.js --ask "Tablo için hangi renkleri kullanmalıyım?"
`);
    process.exit(0);
  }
  
  if (args[0] === '--ask' && args[1]) {
    const question = args.slice(1).join(' ');
    console.log('\n🤖 Sorunuz işleniyor...\n');
    
    askDesignQuestion(question)
      .then(response => {
        console.log('═'.repeat(60));
        console.log(response);
        console.log('═'.repeat(60));
      })
      .catch(error => {
        console.error('Hata:', error.message);
        process.exit(1);
      });
  } else {
    const filePath = path.resolve(args[0]);
    
    analyzeFile(filePath)
      .then(recommendations => {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 CARBON DESIGN ÖNERİLERİ');
        console.log('═'.repeat(60) + '\n');
        console.log(recommendations);
        console.log('\n' + '═'.repeat(60));
      })
      .catch(error => {
        console.error('Hata:', error.message);
        process.exit(1);
      });
  }
}

export default {
  analyzeDocument,
  analyzeFile,
  askDesignQuestion
};
