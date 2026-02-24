/**
 * ReportWizard - AI-guided report style wizard
 * Dynamic question flow + background template selection
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Accordion,
  AccordionItem,
  AILabel,
  Button,
  ClickableTile,
  Dropdown,
  InlineNotification,
} from '@carbon/react';

import {
  Bot,
  User,
  ArrowRight,
  ArrowLeft,
  Checkmark,
  Document,
  PresentationFile,
  Report,
  Analytics,
  Book,
  Education,
  Enterprise,
  UserMultiple,
  ChartBar,
  DataTable,
  TextLongParagraph,
  Image,
  ColorPalette,
  Grid,
  Restart,
  Renew,
} from '@carbon/icons-react';

import { useDocument, WORKFLOW_STEPS } from '../../contexts/DocumentContext';
import { askAi } from '../../services/aiService';
import { usePatternSuggestions } from '../../hooks/usePatternSuggestions';
import PatternSuggestionCards from './PatternSuggestionCards';
import './ReportWizard.scss';

const QUESTION_ORDER = [
  'documentType',
  'audience',
  'purpose',
  'emphasis',
  'dataDensity',
  'pageGoal',
  'outputMode',
  'tone',
  'colorScheme',
];

const QUESTION_BANK = {
  documentType: {
    id: 'documentType',
    summaryLabel: 'Doküman Tipi',
    question: 'Merhaba! İlk olarak hangi tür bir doküman üretmek istediğinizi seçelim.',
    type: 'single-choice',
    options: [
      { value: 'report', label: 'İş Raporu', icon: Report, description: 'Kurumsal değerlendirme ve karar raporları' },
      { value: 'presentation', label: 'Sunum', icon: PresentationFile, description: 'Yönetim veya ekip sunumları' },
      { value: 'article', label: 'Makale', icon: Document, description: 'Açıklayıcı veya düşünce liderliği içerikleri' },
      { value: 'documentation', label: 'Dokümantasyon', icon: Book, description: 'Teknik doküman ve kılavuzlar' },
      { value: 'analytics', label: 'Analiz Raporu', icon: Analytics, description: 'Veri odaklı analiz ve içgörü raporları' },
      { value: 'academic', label: 'Akademik', icon: Education, description: 'Araştırma ve akademik yayın formatı' },
    ],
  },
  audience: {
    id: 'audience',
    summaryLabel: 'Hedef Kitle',
    question: 'Bu dokümanı öncelikle kim okuyacak?',
    type: 'single-choice',
    options: [
      { value: 'executive', label: 'Üst Yönetim', icon: Enterprise, description: 'Kısa, net, karar odaklı çıktı' },
      { value: 'technical', label: 'Teknik Ekip', icon: Analytics, description: 'Detaylı analiz, teknik doğruluk' },
      { value: 'business', label: 'İş Birimi', icon: UserMultiple, description: 'Operasyonel aksiyon ve KPI odaklı' },
      { value: 'general', label: 'Genel Kitle', icon: User, description: 'Açık ve anlaşılır anlatım' },
      { value: 'academic', label: 'Akademik Kitle', icon: Education, description: 'Metodoloji ve kaynak hassasiyeti yüksek' },
    ],
  },
  purpose: {
    id: 'purpose',
    summaryLabel: 'Temel Amaç',
    question: (answers) => {
      if (answers.documentType === 'analytics') {
        return 'Analiz raporunda ana hedef nedir?';
      }
      if (answers.documentType === 'documentation') {
        return 'Bu dokümantasyonun ana kullanım amacı nedir?';
      }
      return 'Dokümanın temel amacı nedir?';
    },
    type: 'single-choice',
    options: [
      { value: 'inform', label: 'Bilgilendirmek', description: 'Net bilgi aktarımı ve özetleme' },
      { value: 'persuade', label: 'İkna Etmek', description: 'Karar vericiyi aksiyona yönlendirmek' },
      { value: 'document', label: 'Kayıt Altına Almak', description: 'Resmi ve izlenebilir kayıt üretmek' },
      { value: 'analyze', label: 'Analiz Sunmak', description: 'Bulgu, trend ve yorum üretmek' },
      { value: 'instruct', label: 'Talimat Vermek', description: 'Adım adım uygulanabilir rehber vermek' },
    ],
  },
  emphasis: {
    id: 'emphasis',
    summaryLabel: 'İçerik Vurgusu',
    question: (answers) => {
      if (answers.purpose === 'persuade') {
        return 'İkna gücünü artırmak için hangi içerik unsurları öne çıksın?';
      }
      if (answers.purpose === 'analyze') {
        return 'Analizinizi en iyi taşıyacak vurgu alanlarını seçin.';
      }
      return 'PDF tasarımında hangi unsurlar öncelikli olmalı?';
    },
    type: 'multi-choice',
    options: [
      { value: 'data', label: 'Veri & Metrikler', icon: ChartBar, description: 'KPI, sayı ve ölçüm yoğunluğu' },
      { value: 'tables', label: 'Tablolar', icon: DataTable, description: 'Karşılaştırmalı ve detay veriler' },
      { value: 'narrative', label: 'Anlatı', icon: TextLongParagraph, description: 'Açıklama, bağlam ve hikâye akışı' },
      { value: 'visuals', label: 'Görseller', icon: Image, description: 'Şema, ikon ve görsel anlatım' },
    ],
  },
  dataDensity: {
    id: 'dataDensity',
    summaryLabel: 'Yoğunluk Tercihi',
    when: (answers) => {
      const emphasis = Array.isArray(answers.emphasis) ? answers.emphasis : [];
      const dataHeavyDoc = ['analytics', 'report', 'presentation'].includes(String(answers.documentType || ''));
      return dataHeavyDoc || emphasis.some((item) => ['data', 'tables', 'visuals'].includes(item));
    },
    question: (answers) => {
      const emphasis = Array.isArray(answers.emphasis) ? answers.emphasis : [];
      if (emphasis.includes('tables')) {
        return 'Tablo ve metrikleri sayfada hangi yoğunlukta konumlandıralım?';
      }
      if (emphasis.includes('visuals')) {
        return 'Görsel blok yoğunluğu nasıl olsun?';
      }
      return 'İçerik yoğunluğu ve boşluk dengesini nasıl kurmalıyız?';
    },
    type: 'single-choice',
    options: [
      { value: 'lite', label: 'Ferah', icon: Grid, description: 'Az öğe, bol boşluk, yüksek okunabilirlik' },
      { value: 'balanced', label: 'Dengeli', icon: ColorPalette, description: 'Standart rapor dengesi, güvenli varsayılan' },
      { value: 'dense', label: 'Yoğun', icon: DataTable, description: 'Daha çok veri, daha sıkı grid düzeni' },
    ],
  },
  pageGoal: {
    id: 'pageGoal',
    summaryLabel: 'Hedef Uzunluk',
    question: 'PDF çıktısında hedef uzunluk aralığı nedir?',
    type: 'single-choice',
    options: [
      { value: 'short', label: 'Kısa (4-8 sayfa)', description: 'Özet ve hızlı tüketim odaklı' },
      { value: 'medium', label: 'Orta (8-18 sayfa)', description: 'Dengeli detay seviyesi' },
      { value: 'long', label: 'Uzun (18+ sayfa)', description: 'Kapsamlı ve detaylı içerik' },
    ],
  },
  outputMode: {
    id: 'outputMode',
    summaryLabel: 'Kullanım Önceliği',
    question: 'Çıktı nerede daha çok kullanılacak?',
    type: 'single-choice',
    options: [
      { value: 'print', label: 'Baskı Odaklı', description: 'Matbaa/ofis yazıcı için optimize' },
      { value: 'digital', label: 'Dijital Odaklı', description: 'Ekran ve paylaşım için optimize' },
      { value: 'hybrid', label: 'Hibrit', description: 'Hem ekran hem baskı dengesi' },
    ],
  },
  tone: {
    id: 'tone',
    summaryLabel: 'Ton',
    when: (answers) => answers.documentType !== 'academic',
    question: (answers) => {
      if (answers.audience === 'executive') {
        return 'Yönetici kitlesi için ton nasıl olmalı?';
      }
      return 'Metin tonu nasıl olsun?';
    },
    type: 'single-choice',
    options: [
      { value: 'formal', label: 'Resmi', description: 'Kurumsal ve profesyonel üslup' },
      { value: 'semiformal', label: 'Yarı Resmi', description: 'Profesyonel ama erişilebilir dil' },
      { value: 'casual', label: 'Günlük', description: 'Samimi ve akıcı anlatım' },
      { value: 'technical', label: 'Teknik', description: 'Alan terimleri ve teknik netlik' },
    ],
  },
  colorScheme: {
    id: 'colorScheme',
    summaryLabel: 'Renk Şeması',
    when: (answers) => Boolean(answers.outputMode),
    question: (answers) => {
      if (answers.outputMode === 'print') {
        return 'Baskı odaklı kullanımda hangi renk yaklaşımı uygun olur?';
      }
      return 'Renk şemasını nasıl kuralım?';
    },
    type: 'single-choice',
    isColorChoice: true,
    options: (answers) => {
      const printFocused = answers.outputMode === 'print';
      const shared = [
        { value: 'professional', label: 'Profesyonel', colors: ['#1a5cff', '#393939', '#f4f4f4'], description: 'Kurumsal mavi-gri denge' },
        { value: 'minimal', label: 'Minimal', colors: ['#161616', '#525252', '#ffffff'], description: 'Yüksek kontrast, sade görünüm' },
        { value: 'cool', label: 'Soğuk', colors: ['#1a5cff', '#0072c3', '#009d9a'], description: 'Analitik ve teknik algı' },
      ];
      if (printFocused) {
        return shared;
      }
      return [
        ...shared,
        { value: 'vibrant', label: 'Canlı', colors: ['#1a5cff', '#e8528a', '#198038'], description: 'Enerjik ve dikkat çekici' },
        { value: 'warm', label: 'Sıcak', colors: ['#da1e28', '#ff832b', '#f1c21b'], description: 'Samimi ve davetkâr tonlar' },
      ];
    },
  },
};

const layoutProfileOptions = [
  { id: 'symmetric', label: 'Simetrik (Dengeli)' },
  { id: 'asymmetric', label: 'Asimetrik (Vurgu)' },
  { id: 'dashboard', label: 'Dashboard (Yoğun)' },
];

const printProfileOptions = [
  { id: 'pagedjs-a3', label: 'Paged.js A3 (297×420mm)' },
  { id: 'pagedjs-a4', label: 'Paged.js A4 (210×297mm)' },
  { id: 'pagedjs-a5', label: 'Paged.js A5 (148×210mm)' },
];

const themeOptions = [
  { id: 'white', label: 'White' },
  { id: 'g10', label: 'G10' },
  { id: 'g90', label: 'G90' },
  { id: 'g100', label: 'G100' },
];

const pdfColorModeOptions = [
  { id: 'color', label: 'Renkli' },
  { id: 'mono', label: 'Monokrom (Gri tonlama)' },
];

function resolveQuestionNode(questionId, answers) {
  const config = QUESTION_BANK[questionId];
  if (!config) {
    return null;
  }

  const question = typeof config.question === 'function'
    ? config.question(answers)
    : config.question;
  const options = typeof config.options === 'function'
    ? config.options(answers)
    : config.options;

  return {
    ...config,
    id: questionId,
    question,
    options: Array.isArray(options) ? options : [],
  };
}

function shouldAskQuestion(questionId, answers) {
  const config = QUESTION_BANK[questionId];
  if (!config) {
    return false;
  }
  if (typeof config.when !== 'function') {
    return true;
  }
  return Boolean(config.when(answers));
}

function buildQuestionFlow(answers) {
  return QUESTION_ORDER.filter((questionId) => shouldAskQuestion(questionId, answers));
}

function hasAnswer(question, answer) {
  if (!question) {
    return false;
  }
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }
  return Boolean(answer);
}

function formatAnswerText(question, answer) {
  if (!question) {
    return '';
  }
  if (Array.isArray(answer)) {
    const labels = answer
      .map((value) => question.options.find((option) => option.value === value)?.label)
      .filter(Boolean);
    return labels.join(', ');
  }
  return question.options.find((option) => option.value === answer)?.label || '';
}

function inferDerivedSettings(answers, existingSettings = {}) {
  const emphasis = Array.isArray(answers.emphasis)
    ? answers.emphasis
    : Array.isArray(existingSettings.emphasis)
      ? existingSettings.emphasis
      : [];

  const documentType = answers.documentType || existingSettings.documentType || 'report';
  const purpose = answers.purpose || existingSettings.purpose || 'inform';
  const audience = answers.audience || existingSettings.audience || 'general';
  const pageGoal = answers.pageGoal || existingSettings.pageGoal || 'medium';
  const outputMode = answers.outputMode || existingSettings.outputMode || 'hybrid';
  const colorScheme = answers.colorScheme || existingSettings.colorScheme || 'professional';
  const dataDensity =
    answers.dataDensity
    || existingSettings.dataDensity
    || (emphasis.includes('data') || emphasis.includes('tables') ? 'balanced' : 'lite');

  const components = new Set(Array.isArray(existingSettings.components) ? existingSettings.components : []);
  if (emphasis.includes('data')) {
    components.add('charts');
    components.add('stats');
  }
  if (emphasis.includes('tables')) {
    components.add('tables');
    components.add('comparisons');
  }
  if (emphasis.includes('visuals')) {
    components.add('icons');
  }
  if (emphasis.includes('narrative')) {
    components.add('quotes');
  }
  if (purpose === 'instruct') {
    components.add('timelines');
    components.add('tables');
  }
  if (purpose === 'persuade') {
    components.add('stats');
    components.add('quotes');
  }
  if (documentType === 'documentation') {
    components.add('tables');
    components.add('icons');
  }
  if (documentType === 'academic') {
    components.add('tables');
    components.add('quotes');
  }

  let layoutStyle = 'balanced';
  if (dataDensity === 'dense' || pageGoal === 'long') {
    layoutStyle = 'compact';
  } else if (dataDensity === 'lite' && pageGoal === 'short') {
    layoutStyle = 'spacious';
  }

  let layoutProfile = 'symmetric';
  if (dataDensity === 'dense' || emphasis.includes('data') || documentType === 'analytics') {
    layoutProfile = 'dashboard';
  } else if (purpose === 'persuade' || documentType === 'presentation') {
    layoutProfile = 'asymmetric';
  }

  let printProfile = 'pagedjs-a4';
  if (outputMode === 'print' && (dataDensity === 'dense' || emphasis.includes('tables'))) {
    printProfile = 'pagedjs-a3';
  } else if (pageGoal === 'short' && outputMode !== 'print') {
    printProfile = 'pagedjs-a5';
  }

  let theme = 'white';
  if (outputMode === 'digital') {
    if (colorScheme === 'minimal') {
      theme = 'g10';
    } else if (colorScheme === 'cool') {
      theme = 'g90';
    } else if (colorScheme === 'vibrant') {
      theme = 'g10';
    }
  } else if (outputMode === 'hybrid' && colorScheme === 'cool') {
    theme = 'g10';
  }

  const colorMode = outputMode === 'print' || colorScheme === 'minimal' ? 'mono' : 'color';
  const includeCover = ['report', 'presentation', 'analytics'].includes(documentType)
    || ['executive', 'business'].includes(audience);
  const includeToc = pageGoal !== 'short' || ['documentation', 'academic'].includes(documentType);
  const includeBackCover = outputMode !== 'digital' || purpose === 'persuade';
  const printBackground = outputMode !== 'print';

  const reportPatch = {
    ...answers,
    docType: documentType,
    dataDensity,
    pageGoal,
    outputMode,
    layoutStyle,
    components: Array.from(components),
    colorMode,
    includeCover,
    includeToc,
    includeBackCover,
    printBackground,
  };

  if (documentType === 'academic' && !reportPatch.tone) {
    reportPatch.tone = 'formal';
  }

  return {
    layoutProfile,
    printProfile,
    theme,
    reportPatch,
  };
}

function templateText(template) {
  const tags = Array.isArray(template?.tags) ? template.tags.join(' ') : '';
  return [
    template?.key,
    template?.name,
    template?.description,
    template?.category,
    tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreTemplateCandidate(template, profile) {
  const text = templateText(template);
  let score = 0;

  if (text.includes('cv')) {
    score -= 30;
  }

  const emphasis = Array.isArray(profile.emphasis) ? profile.emphasis : [];

  if (profile.documentType === 'analytics') {
    if (text.includes('dataviz')) score += 14;
    if (text.includes('grid')) score += 8;
    if (text.includes('advanced')) score += 6;
  }
  if (profile.documentType === 'presentation') {
    if (text.includes('advanced')) score += 10;
    if (text.includes('colors')) score += 7;
    if (text.includes('components')) score += 5;
  }
  if (profile.documentType === 'documentation') {
    if (text.includes('components')) score += 10;
    if (text.includes('forms')) score += 8;
    if (text.includes('grid')) score += 6;
  }
  if (profile.documentType === 'report') {
    if (text.includes('default')) score += 9;
    if (text.includes('advanced')) score += 6;
    if (text.includes('template')) score += 4;
  }
  if (profile.documentType === 'academic') {
    if (text.includes('default')) score += 7;
    if (text.includes('advanced')) score += 6;
    if (text.includes('grid')) score += 4;
  }

  if (emphasis.includes('data')) {
    if (text.includes('dataviz')) score += 10;
    if (text.includes('grid')) score += 7;
  }
  if (emphasis.includes('tables')) {
    if (text.includes('grid')) score += 6;
    if (text.includes('components')) score += 5;
  }
  if (emphasis.includes('visuals')) {
    if (text.includes('colors')) score += 6;
    if (text.includes('components')) score += 5;
  }
  if (emphasis.includes('narrative')) {
    if (text.includes('template')) score += 4;
    if (text.includes('advanced')) score += 3;
  }

  if (profile.purpose === 'instruct') {
    if (text.includes('forms')) score += 6;
    if (text.includes('components')) score += 4;
  }
  if (profile.purpose === 'persuade') {
    if (text.includes('advanced')) score += 5;
    if (text.includes('colors')) score += 4;
  }

  if (profile.outputMode === 'print') {
    if (text.includes('theme-g100')) score += 6;
    if (text.includes('default')) score += 4;
    if (text.includes('colors')) score -= 2;
  }
  if (profile.dataDensity === 'dense') {
    if (text.includes('dataviz')) score += 5;
    if (text.includes('grid')) score += 5;
    if (text.includes('advanced')) score += 4;
  }
  if (profile.pageGoal === 'short' && text.includes('grid')) {
    score += 3;
  }

  if (['approved', 'published'].includes(template?.activeVersion?.status)) {
    score += 2;
  }

  // Pattern-aware scoring boost
  if (Array.isArray(profile.enabledPatterns)) {
    const patternBoosts = {
      'kpi-grid': ['dataviz', 'grid', 'dashboard'],
      'chart-composition': ['dataviz', 'chart', 'visual'],
      'data-table-spread': ['grid', 'data', 'table'],
      'comparison-table': ['grid', 'table', 'compare'],
      'two-column-narrative': ['narrative', 'column', 'text'],
      'infographic-strip': ['dataviz', 'visual', 'infographic'],
      'timeline-process': ['process', 'timeline', 'step'],
      'methodology-section': ['research', 'academic', 'method'],
      'survey-chart-page': ['dataviz', 'survey', 'chart'],
    };

    for (const patternId of profile.enabledPatterns) {
      const keywords = patternBoosts[patternId] || [];
      for (const kw of keywords) {
        if (text.includes(kw)) {
          score += 3;
          break; // max one boost per pattern
        }
      }
    }
  }

  return score;
}

function pickHeuristicTemplateKey(templates, profile) {
  if (!Array.isArray(templates) || templates.length === 0) {
    return null;
  }

  const ranked = [...templates]
    .filter((template) => template?.key)
    .map((template) => ({
      key: template.key,
      score: scoreTemplateCandidate(template, profile),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.key || templates[0]?.key || null;
}

function parseAiJson(output) {
  const raw = String(output || '').trim();
  if (!raw) return null;
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const jsonCandidate = fenced ? fenced[1] : raw;

  try {
    return JSON.parse(jsonCandidate);
  } catch {
    return null;
  }
}

async function resolveTemplateByAi(templates, profile, markdownContent) {
  if (!Array.isArray(templates) || templates.length === 0) {
    return null;
  }

  const templateBrief = templates
    .slice(0, 16)
    .map((template) => {
      const key = template?.key || '';
      const name = template?.name || key;
      const desc = template?.description || '';
      const tags = Array.isArray(template?.tags) ? template.tags.join(', ') : '';
      return `- ${key}: ${name}${desc ? ` | ${desc}` : ''}${tags ? ` | tags: ${tags}` : ''}`;
    })
    .join('\n');

  const patternsContext = Array.isArray(profile.enabledPatterns) && profile.enabledPatterns.length
    ? `\nKullanıcının seçtiği layout pattern'ları: ${profile.enabledPatterns.join(', ')}`
    : '';

  const aiPrompt = [
    'Aşağıdaki adaylar arasından kullanıcı profiline en uygun TEK template anahtarını seç.',
    'Yanıtı sadece JSON ver.',
    'JSON şeması: {"templateKey":"...","confidence":"high|medium|low"}',
    '',
    `Kullanıcı profili: ${JSON.stringify(profile)}`,
    patternsContext,
    '',
    'Template adayları:',
    templateBrief,
  ].join('\n');

  const aiOutput = await askAi({
    question: aiPrompt,
    context: String(markdownContent || '').slice(0, 5000),
  });

  const parsed = parseAiJson(aiOutput);
  const templateKey = String(parsed?.templateKey || '').trim();
  if (!templateKey) {
    return null;
  }
  const isValid = templates.some((template) => template.key === templateKey);
  return isValid ? templateKey : null;
}

function generateAIResponse(questionId, answer, answers, nextQuestion) {
  const answerValue = Array.isArray(answer) ? answer[0] : answer;
  const emphasis = Array.isArray(answers.emphasis) ? answers.emphasis : [];
  const docLabel = {
    report: 'is raporu', presentation: 'sunum', article: 'makale',
    documentation: 'dokumantasyon', analytics: 'analiz raporu', academic: 'akademik rapor',
  }[answers.documentType] || 'dokuman';
  const audienceLabel = {
    executive: 'ust yonetim', technical: 'teknik ekip',
    business: 'is birimi', general: 'genel okuyucu', academic: 'akademik cevre',
  }[answers.audience] || '';

  switch (questionId) {
    case 'documentType':
      if (answerValue === 'analytics') return 'Analiz odakli bir yapi sectiniz. Veri hiyerarsisini buna gore optimize edecegim.';
      if (answerValue === 'academic') return 'Akademik format secildi. Metodoloji bolumu ve kaynak yapisi otomatik planlanacak.';
      if (answerValue === 'presentation') return 'Sunum tipi icin daha vurgu odakli bir sayfa akisi tasarlayacagim.';
      return 'Dokuman tipini aldim. Sonraki adimlari bu profile gore kisisellestiriyorum.';

    case 'audience':
      if (audienceLabel) return `${audienceLabel.charAt(0).toUpperCase() + audienceLabel.slice(1)} hedef kitlesi icin ${docLabel} — ${answerValue === 'executive' ? 'kisa ve karar destekli' : 'detay odakli'} bilgi akisi kuracagiz.`;
      return 'Hedef kitleyi kaydettim. Soru akisini buna gore adapte ediyorum.';

    case 'purpose':
      return `${docLabel.charAt(0).toUpperCase() + docLabel.slice(1)} amaci netlesti: ${answerValue === 'persuade' ? 'ikna odakli vurgu bloklari' : answerValue === 'instruct' ? 'adim adim net duzen' : 'icerik vurgularini keskinlestirme'}.`;

    case 'emphasis':
      if (emphasis.includes('data') || emphasis.includes('tables'))
        return `${audienceLabel ? audienceLabel + ' hedef kitlesi icin ' : ''}Veri odakli ${docLabel}. Bir sonraki adimda yogunluk tercihini soracagim.`;
      return 'Vurgu alanlarini aldim. Bu secimle uyumlu sade ve okunur bir akis kuracagiz.';

    case 'dataDensity':
      return answerValue === 'dense'
        ? 'Yogun icerik tercihini aldim. Grid ve sayfa dagilimini buna gore sikilastiriyorum.'
        : 'Yogunluk tercihini aldim. Okunabilirlik dengesini buna gore ayarliyorum.';

    case 'pageGoal': {
      const pInfo = answerValue === 'long' ? 'Icindekiler ve Appendix pattern\'lari da eklendi.' : '';
      return `Hedef sayfa araligini kaydettim.${pInfo ? ' ' + pInfo : ''} Baski profili onerisini optimize edecegim.`;
    }

    case 'outputMode':
      return answerValue === 'print'
        ? 'Baski onceligi aktif. Kontrast ve cikti guvenligi odakli ayarlari devreye aliyorum.'
        : 'Kullanim onceligi kaydedildi. Gorsel dengeyi buna gore ayarliyorum.';

    case 'tone':
      return `${docLabel.charAt(0).toUpperCase() + docLabel.slice(1)} icin ${answerValue === 'formal' ? 'resmi' : answerValue === 'technical' ? 'teknik' : 'yari resmi'} ton ayarlandi.`;

    case 'colorScheme':
      return 'Renk yaklasimi tamam. Tum secimleri birlestirip ideal PDF profilini olusturuyorum.';

    default:
      break;
  }

  if (nextQuestion?.summaryLabel) {
    return `Siradaki: "${nextQuestion.summaryLabel}" tercihine gecelim.`;
  }
  return 'Tercihlerinizi kaydettim. Bir sonraki adima gecebiliriz.';
}

function ReportWizard() {
  const {
    reportSettings,
    updateReportSettings,
    setWizardAnswer,
    setStep,
    markdownContent,
    selectedLayoutProfile,
    selectedPrintProfile,
    selectedTheme,
    selectedTemplate,
    setLayoutProfile,
    setPrintProfile,
    setTheme,
    templates,
    templatesLoading,
    templatesError,
    loadTemplates,
    selectTemplate,
  } = useDocument();

  const initialQuestion = useMemo(() => resolveQuestionNode(QUESTION_ORDER[0], {}), []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [profileApplyState, setProfileApplyState] = useState({
    status: 'idle',
    message: '',
  });
  const profileApplyLockRef = useRef(false);
  const messagesEndRef = useRef(null);

  const { suggestions: patternSuggestions, togglePattern, enabledPatterns } = usePatternSuggestions(selectedOptions);
  const patternSuggestionsShownRef = useRef(false);

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Merhaba! Ben Carbon Design asistanınızım. Cevaplarınıza göre adaptif bir soru akışıyla en iyi PDF tasarım profilini hazırlayacağım. 🎨',
    },
    {
      type: 'ai',
      content: initialQuestion?.question || 'Önce doküman türünüzü seçelim.',
    },
  ]);

  const questionFlow = useMemo(() => {
    const flow = buildQuestionFlow(selectedOptions);
    return flow.length ? flow : [QUESTION_ORDER[0]];
  }, [selectedOptions]);

  const currentQuestionId = questionFlow[currentQuestionIndex] || questionFlow[questionFlow.length - 1];
  const currentQuestion = useMemo(
    () => resolveQuestionNode(currentQuestionId, selectedOptions),
    [currentQuestionId, selectedOptions]
  );

  const totalQuestions = questionFlow.length;
  const progress = totalQuestions > 0
    ? (currentQuestionIndex / totalQuestions) * 100
    : 0;

  const resolvedLayoutProfile = layoutProfileOptions.find(
    (option) => option.id === selectedLayoutProfile
  ) || layoutProfileOptions[0];
  const resolvedPrintProfile = printProfileOptions.find(
    (option) => option.id === selectedPrintProfile
  ) || printProfileOptions[0];
  const resolvedTheme = themeOptions.find(
    (option) => option.id === selectedTheme
  ) || themeOptions[0];
  const resolvedPdfColorMode = pdfColorModeOptions.find(
    (option) => option.id === (reportSettings.colorMode || 'color')
  ) || pdfColorModeOptions[0];

  const summaryEntries = useMemo(() => {
    return questionFlow
      .map((questionId) => {
        const question = resolveQuestionNode(questionId, selectedOptions);
        const value = selectedOptions[questionId];
        if (!question || !hasAnswer(question, value)) {
          return null;
        }
        return {
          id: questionId,
          question,
          displayValue: formatAnswerText(question, value),
        };
      })
      .filter(Boolean);
  }, [questionFlow, selectedOptions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentQuestionIndex <= totalQuestions - 1) {
      return;
    }
    setCurrentQuestionIndex(Math.max(totalQuestions - 1, 0));
  }, [currentQuestionIndex, totalQuestions]);

  useEffect(() => {
    setShowValidation(false);
  }, [currentQuestionId]);

  useEffect(() => {
    if (!currentQuestion || currentQuestionIndex === 0 || showSummary) {
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: currentQuestion.question },
      ]);
      setIsTyping(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentQuestion, currentQuestionId, currentQuestionIndex, showSummary]);

  useEffect(() => {
    loadTemplates().catch(() => null);
  }, [loadTemplates]);

  const applyDerivedProfiles = useCallback((answersSnapshot) => {
    const derived = inferDerivedSettings(answersSnapshot, reportSettings);
    updateReportSettings(derived.reportPatch);
    setLayoutProfile(derived.layoutProfile);
    setPrintProfile(derived.printProfile);
    setTheme(derived.theme);
    return derived;
  }, [reportSettings, setLayoutProfile, setPrintProfile, setTheme, updateReportSettings]);

  const applyBackgroundDesignProfile = useCallback(async (answersSnapshot = selectedOptions) => {
    if (profileApplyLockRef.current) {
      return false;
    }

    profileApplyLockRef.current = true;
    setProfileApplyState({
      status: 'loading',
      message: 'Tasarım profili arka planda optimize ediliyor...',
    });

    try {
      const derived = applyDerivedProfiles(answersSnapshot);

      let availableTemplates = templates;
      if (!availableTemplates.length && !templatesLoading) {
        await loadTemplates().catch(() => null);
        availableTemplates = templates;
      }

      let resolvedTemplateKey = selectedTemplate || reportSettings.templateKey || 'carbon-default';

      if (availableTemplates.length > 0) {
        const profile = {
          documentType: answersSnapshot.documentType || reportSettings.documentType,
          audience: answersSnapshot.audience || reportSettings.audience,
          purpose: answersSnapshot.purpose || reportSettings.purpose,
          emphasis: Array.isArray(answersSnapshot.emphasis)
            ? answersSnapshot.emphasis
            : Array.isArray(reportSettings.emphasis)
              ? reportSettings.emphasis
              : [],
          dataDensity: answersSnapshot.dataDensity || reportSettings.dataDensity || derived.reportPatch.dataDensity,
          pageGoal: answersSnapshot.pageGoal || reportSettings.pageGoal || derived.reportPatch.pageGoal,
          outputMode: answersSnapshot.outputMode || reportSettings.outputMode || derived.reportPatch.outputMode,
          colorScheme: answersSnapshot.colorScheme || reportSettings.colorScheme || derived.reportPatch.colorScheme,
          enabledPatterns: enabledPatterns || [],
        };

        const aiTemplateKey = await resolveTemplateByAi(availableTemplates, profile, markdownContent)
          .catch(() => null);
        const heuristicTemplateKey = pickHeuristicTemplateKey(availableTemplates, profile);
        const selectedTemplateKey = aiTemplateKey || heuristicTemplateKey || availableTemplates[0]?.key;
        const template = availableTemplates.find((item) => item.key === selectedTemplateKey)
          || availableTemplates[0];

        if (template) {
          selectTemplate(template);
          resolvedTemplateKey = template.key;
        }
      }

      updateReportSettings({ templateKey: resolvedTemplateKey });
      setProfileApplyState({
        status: 'applied',
        message: 'Tasarım profili uygulandı. Editöre geçebilirsiniz.',
      });
      return true;
    } catch (error) {
      updateReportSettings({
        templateKey: selectedTemplate || reportSettings.templateKey || 'carbon-default',
      });
      setProfileApplyState({
        status: 'error',
        message: 'Tasarım profili varsayılan ayarlarla uygulandı.',
      });
      return true;
    } finally {
      profileApplyLockRef.current = false;
    }
  }, [
    applyDerivedProfiles,
    enabledPatterns,
    loadTemplates,
    markdownContent,
    reportSettings.audience,
    reportSettings.dataDensity,
    reportSettings.documentType,
    reportSettings.emphasis,
    reportSettings.outputMode,
    reportSettings.pageGoal,
    reportSettings.purpose,
    reportSettings.colorScheme,
    reportSettings.templateKey,
    selectTemplate,
    selectedOptions,
    selectedTemplate,
    templates,
    templatesLoading,
    updateReportSettings,
  ]);

  useEffect(() => {
    if (!showSummary) {
      return;
    }
    if (profileApplyState.status === 'loading' || profileApplyState.status === 'applied') {
      return;
    }
    applyBackgroundDesignProfile(selectedOptions).catch(() => null);
  }, [applyBackgroundDesignProfile, profileApplyState.status, selectedOptions, showSummary]);

  const handleOptionSelect = useCallback((value) => {
    if (!currentQuestion) {
      return;
    }

    const questionId = currentQuestion.id;
    setShowValidation(false);

    setSelectedOptions((prev) => {
      if (currentQuestion.type === 'multi-choice') {
        const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const updated = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return {
          ...prev,
          [questionId]: updated,
        };
      }

      return {
        ...prev,
        [questionId]: value,
      };
    });
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    const questionId = currentQuestion.id;
    const answer = selectedOptions[questionId];

    if (!hasAnswer(currentQuestion, answer)) {
      setShowValidation(true);
      return;
    }

    const answerText = formatAnswerText(currentQuestion, answer);
    const nextAnswers = {
      ...selectedOptions,
      [questionId]: answer,
    };

    setMessages((prev) => [
      ...prev,
      { type: 'user', content: answerText },
    ]);

    updateReportSettings({ [questionId]: answer });
    setWizardAnswer(questionId, answer);

    setIsTyping(true);

    const nextFlow = buildQuestionFlow(nextAnswers);
    const currentIndexInNextFlow = nextFlow.indexOf(questionId);
    const nextIndex = currentIndexInNextFlow >= 0
      ? currentIndexInNextFlow + 1
      : currentQuestionIndex + 1;
    const nextQuestionId = nextFlow[nextIndex];
    const nextQuestion = nextQuestionId
      ? resolveQuestionNode(nextQuestionId, nextAnswers)
      : null;

    setTimeout(() => {
      const aiResponse = generateAIResponse(questionId, answer, nextAnswers, nextQuestion);
      setMessages((prev) => {
        const updated = [...prev, { type: 'ai', content: aiResponse }];

        // Inject pattern suggestions after emphasis question (first time only)
        if (questionId === 'emphasis' && !patternSuggestionsShownRef.current) {
          patternSuggestionsShownRef.current = true;
          updated.push({ type: 'patterns', content: '' });
        }

        return updated;
      });
      setIsTyping(false);

      if (nextIndex < nextFlow.length) {
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex);
        }, 350);
        return;
      }

      const derived = inferDerivedSettings(nextAnswers, reportSettings);
      updateReportSettings(derived.reportPatch);
      setLayoutProfile(derived.layoutProfile);
      setPrintProfile(derived.printProfile);
      setTheme(derived.theme);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            content: 'Seçimleri tamamladık. Özeti hazırlıyorum; tasarım profili arka planda otomatik uygulanacak.',
          },
        ]);
        setProfileApplyState({ status: 'idle', message: '' });
        updateReportSettings({ enabledPatterns });
        setShowSummary(true);
      }, 500);
    }, 900);
  }, [
    currentQuestion,
    currentQuestionIndex,
    enabledPatterns,
    patternSuggestions,
    togglePattern,
    reportSettings,
    selectedOptions,
    setLayoutProfile,
    setPrintProfile,
    setTheme,
    setWizardAnswer,
    updateReportSettings,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleRestart = useCallback(() => {
    const firstQuestion = resolveQuestionNode(QUESTION_ORDER[0], {});

    setCurrentQuestionIndex(0);
    setSelectedOptions({});
    setShowSummary(false);
    setIsTyping(false);
    setIsFinalizing(false);
    setProfileApplyState({ status: 'idle', message: '' });
    setMessages([
      {
        type: 'ai',
        content: 'Sihirbazı sıfırladım. Adaptif akışı baştan kuruyoruz. 🔄',
      },
      {
        type: 'ai',
        content: firstQuestion?.question || 'Önce doküman türünüzü seçelim.',
      },
    ]);
  }, []);

  const handleContinue = useCallback(async () => {
    if (isTyping || isFinalizing) {
      return;
    }

    setIsFinalizing(true);
    try {
      if (profileApplyState.status !== 'applied') {
        await applyBackgroundDesignProfile(selectedOptions);
      }
      setStep(WORKFLOW_STEPS.EDITOR);
    } finally {
      setIsFinalizing(false);
    }
  }, [
    applyBackgroundDesignProfile,
    isFinalizing,
    isTyping,
    profileApplyState.status,
    selectedOptions,
    setStep,
  ]);

  const currentAnswer = currentQuestion ? selectedOptions[currentQuestion.id] : null;
  const canProceed = hasAnswer(currentQuestion, currentAnswer);

  return (
    <div className="report-wizard">
      {/* Progress Header */}
      <div className="report-wizard__header">
        <div className="report-wizard__progress-info">
          <h2>Rapor Sihirbazı</h2>
          <span className="report-wizard__step-count">
            Adım {Math.min(currentQuestionIndex + 1, totalQuestions)} / {totalQuestions}
          </span>
        </div>
        <div className="report-wizard__progress-bar">
          <div
            className="report-wizard__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Chat Area */}
      {!showSummary ? (
        <div className="report-wizard__chat">
          <div className="report-wizard__chat-header">
            <div className="report-wizard__chat-header-left">
              <div className="report-wizard__chat-header-icon">
                <Bot size={20} />
              </div>
              <div className="report-wizard__chat-header-text">
                <span className="report-wizard__chat-header-title">AI Danışmanı</span>
                <span className="report-wizard__chat-header-subtitle">Carbonac AI <AILabel size="mini" /></span>
              </div>
            </div>
            <div className="report-wizard__chat-header-actions">
              <button
                className="report-wizard__chat-header-btn"
                onClick={handleRestart}
                title="Sıfırla"
                aria-label="Sohbeti sıfırla"
              >
                <Renew size={16} />
              </button>
            </div>
          </div>

          <div className="report-wizard__messages">
            {messages.map((msg, index) => {
              if (msg.type === 'patterns') {
                return (
                  <div key={index} className="report-wizard__message report-wizard__message--ai">
                    <div className="report-wizard__avatar report-wizard__avatar--ai">
                      <Bot size={18} />
                    </div>
                    <div className="report-wizard__message-content">
                      <PatternSuggestionCards
                        suggestions={patternSuggestions}
                        onToggle={togglePattern}
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={index}
                  className={`report-wizard__message report-wizard__message--${msg.type}`}
                >
                  <div className={`report-wizard__avatar report-wizard__avatar--${msg.type}`}>
                    {msg.type === 'ai' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="report-wizard__message-content">
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="report-wizard__message report-wizard__message--ai">
                <div className="report-wizard__avatar report-wizard__avatar--ai">
                  <Bot size={18} />
                </div>
                <div className="report-wizard__message-content report-wizard__typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Options Area */}
          {currentQuestion && !isTyping && !showSummary ? (
            <div key={currentQuestion.id} className="report-wizard__options report-wizard__question-transition">
              {showValidation && !canProceed ? (
                <InlineNotification
                  kind="warning"
                  title="Seçim gerekli"
                  subtitle="Devam etmek için bir seçenek işaretleyin."
                  lowContrast
                />
              ) : null}

              <div className={`report-wizard__options-grid ${currentQuestion.isColorChoice ? 'report-wizard__options-grid--colors' : ''}`}>
                {currentQuestion.options.map((option) => {
                  const selected = currentQuestion.type === 'multi-choice'
                    ? (selectedOptions[currentQuestion.id] || []).includes(option.value)
                    : selectedOptions[currentQuestion.id] === option.value;

                  return (
                    <ClickableTile
                      key={option.value}
                      className={`report-wizard__option ${selected ? 'report-wizard__option--selected' : ''}`}
                      onClick={() => handleOptionSelect(option.value)}
                    >
                      {option.icon ? <option.icon size={24} className="report-wizard__option-icon" /> : null}

                      {option.colors ? (
                        <div className="report-wizard__color-preview">
                          {option.colors.map((color, colorIndex) => (
                            <span key={`${option.value}-${colorIndex}`} style={{ background: color }} />
                          ))}
                        </div>
                      ) : null}

                      <div className="report-wizard__option-text">
                        <span className="report-wizard__option-label">{option.label}</span>
                        {option.description ? (
                          <span className="report-wizard__option-description">{option.description}</span>
                        ) : null}
                      </div>

                      {selected ? (
                        <Checkmark size={20} className="report-wizard__option-check" />
                      ) : null}
                    </ClickableTile>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Summary */}
      {showSummary ? (
        <div className="report-wizard__summary-panel">
          <h3>Özet Onayı</h3>
          <p>Seçimleriniz aşağıda özetlendi. Tasarım profili arka planda otomatik uygulanır.</p>

          <div className="report-wizard__summary-list">
            {summaryEntries.map((entry) => (
              <div key={entry.id} className="report-wizard__summary-item">
                <span className="report-wizard__summary-label">{entry.question.summaryLabel || entry.id}</span>
                <span className="report-wizard__summary-value">{entry.displayValue}</span>
              </div>
            ))}
          </div>

          <div className="report-wizard__summary-recommendation">
            <span>Tasarım profili durumu:</span>

            {templatesLoading ? <span>Tasarım altyapısı hazırlanıyor...</span> : null}
            {templatesError ? <span>Altyapı servisine erişilemedi, varsayılan profil kullanılacak.</span> : null}

            {profileApplyState.status === 'loading' ? (
              <InlineNotification
                kind="info"
                lowContrast
                title="Profil uygulanıyor"
                subtitle={profileApplyState.message || 'Cevaplarınıza göre en uygun tasarım profili hesaplanıyor.'}
              />
            ) : null}

            {profileApplyState.status === 'applied' ? (
              <InlineNotification
                kind="success"
                lowContrast
                title="Profil hazır"
                subtitle={profileApplyState.message || 'PDF için önerilen profil başarıyla uygulandı.'}
              />
            ) : null}

            {profileApplyState.status === 'error' ? (
              <InlineNotification
                kind="warning"
                lowContrast
                title="Varsayılan profil kullanıldı"
                subtitle={profileApplyState.message || 'Öneri alınamadı; sistem güvenli varsayılanlarla devam edecek.'}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="report-wizard__navigation">
        <div className="report-wizard__nav-left">
          <Button
            kind="ghost"
            renderIcon={Restart}
            onClick={handleRestart}
            size="md"
          >
            Yeniden Başla
          </Button>
        </div>

        <div className="report-wizard__nav-right">
          {currentQuestionIndex > 0 ? (
            <Button
              kind="secondary"
              renderIcon={ArrowLeft}
              onClick={handlePrevious}
              disabled={isTyping}
            >
              Geri
            </Button>
          ) : null}

          {!showSummary ? (
            <Button
              kind="primary"
              renderIcon={ArrowRight}
              onClick={handleNext}
              disabled={!canProceed || isTyping}
            >
              Devam
            </Button>
          ) : (
            <>
              <Button
                kind="secondary"
                renderIcon={ArrowLeft}
                onClick={() => {
                  setShowSummary(false);
                  setCurrentQuestionIndex(Math.max(questionFlow.length - 1, 0));
                }}
                disabled={isTyping || isFinalizing}
              >
                Seçimleri Düzenle
              </Button>
              <Button
                kind="primary"
                renderIcon={ArrowRight}
                onClick={() => {
                  handleContinue().catch(() => null);
                }}
                disabled={
                  isTyping
                  || isFinalizing
                  || profileApplyState.status === 'loading'
                }
              >
                {isFinalizing ? 'Hazırlanıyor...' : 'Editöre Geç'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="report-wizard__advanced">
        <Accordion align="start">
          <AccordionItem title="Gelişmiş Ayarlar">
            <div className="report-wizard__advanced-grid">
              <Dropdown
                id="wizard-layout-profile"
                titleText="Yerleşim Profili"
                items={layoutProfileOptions}
                selectedItem={resolvedLayoutProfile}
                label="Seçin"
                itemToString={(item) => item?.label || item?.text || ''}
                onChange={({ selectedItem }) => setLayoutProfile(selectedItem.id)}
              />
              <Dropdown
                id="wizard-print-profile"
                titleText="Baskı Profili"
                items={printProfileOptions}
                selectedItem={resolvedPrintProfile}
                label="Seçin"
                itemToString={(item) => item?.label || item?.text || ''}
                onChange={({ selectedItem }) => setPrintProfile(selectedItem.id)}
              />
              <Dropdown
                id="wizard-theme"
                titleText="Tema"
                items={themeOptions}
                selectedItem={resolvedTheme}
                label="Seçin"
                itemToString={(item) => item?.label || item?.text || ''}
                onChange={({ selectedItem }) => setTheme(selectedItem.id)}
              />
              <Dropdown
                id="wizard-color-mode"
                titleText="PDF Renk Modu"
                items={pdfColorModeOptions}
                selectedItem={resolvedPdfColorMode}
                label="Seçin"
                itemToString={(item) => item?.label || item?.text || ''}
                onChange={({ selectedItem }) => updateReportSettings({
                  colorMode: selectedItem?.id || 'color',
                })}
              />
            </div>

            <div className="report-wizard__advanced-toggles">
              <ClickableTile
                className={`report-wizard__option ${(reportSettings.includeCover ?? true) ? 'report-wizard__option--selected' : ''}`}
                onClick={() => updateReportSettings({
                  includeCover: !(reportSettings.includeCover ?? true),
                })}
              >
                <div className="report-wizard__option-text">
                  <span className="report-wizard__option-label">Kapak Sayfası</span>
                  <span className="report-wizard__option-description">PDF başlangıcında kapak göster/gizle</span>
                </div>
                {(reportSettings.includeCover ?? true) ? (
                  <Checkmark size={20} className="report-wizard__option-check" />
                ) : null}
              </ClickableTile>

              <ClickableTile
                className={`report-wizard__option ${(reportSettings.includeToc ?? true) ? 'report-wizard__option--selected' : ''}`}
                onClick={() => updateReportSettings({
                  includeToc: !(reportSettings.includeToc ?? true),
                })}
              >
                <div className="report-wizard__option-text">
                  <span className="report-wizard__option-label">İçindekiler Sayfası</span>
                  <span className="report-wizard__option-description">Başlıklardan otomatik içindekiler üret</span>
                </div>
                {(reportSettings.includeToc ?? true) ? (
                  <Checkmark size={20} className="report-wizard__option-check" />
                ) : null}
              </ClickableTile>

              <ClickableTile
                className={`report-wizard__option ${(reportSettings.includeBackCover ?? true) ? 'report-wizard__option--selected' : ''}`}
                onClick={() => updateReportSettings({
                  includeBackCover: !(reportSettings.includeBackCover ?? true),
                })}
              >
                <div className="report-wizard__option-text">
                  <span className="report-wizard__option-label">Arka Kapak Sayfası</span>
                  <span className="report-wizard__option-description">Rapor sonunda marka imzalı kapanış sayfası ekle</span>
                </div>
                {(reportSettings.includeBackCover ?? true) ? (
                  <Checkmark size={20} className="report-wizard__option-check" />
                ) : null}
              </ClickableTile>

              <ClickableTile
                className={`report-wizard__option ${(reportSettings.showPageNumbers ?? true) ? 'report-wizard__option--selected' : ''}`}
                onClick={() => updateReportSettings({
                  showPageNumbers: !(reportSettings.showPageNumbers ?? true),
                })}
              >
                <div className="report-wizard__option-text">
                  <span className="report-wizard__option-label">Sayfa Numaraları</span>
                  <span className="report-wizard__option-description">Alt bilgi sayfa numaralarını aç/kapat</span>
                </div>
                {(reportSettings.showPageNumbers ?? true) ? (
                  <Checkmark size={20} className="report-wizard__option-check" />
                ) : null}
              </ClickableTile>

              <ClickableTile
                className={`report-wizard__option ${(reportSettings.printBackground ?? true) ? 'report-wizard__option--selected' : ''}`}
                onClick={() => updateReportSettings({
                  printBackground: !(reportSettings.printBackground ?? true),
                })}
              >
                <div className="report-wizard__option-text">
                  <span className="report-wizard__option-label">Arka Plan / Dolgu</span>
                  <span className="report-wizard__option-description">Arka plan renklerini PDF’e dahil et</span>
                </div>
                {(reportSettings.printBackground ?? true) ? (
                  <Checkmark size={20} className="report-wizard__option-check" />
                ) : null}
              </ClickableTile>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Summary Sidebar */}
      {summaryEntries.length > 0 ? (
        <aside className="report-wizard__summary">
          <h4>Seçimleriniz</h4>
          <div className="report-wizard__summary-list">
            {summaryEntries.map((entry) => (
              <div key={`sidebar-${entry.id}`} className="report-wizard__summary-item">
                <span className="report-wizard__summary-label">{entry.question.summaryLabel || entry.id}</span>
                <span className="report-wizard__summary-value">{entry.displayValue}</span>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

export default ReportWizard;
