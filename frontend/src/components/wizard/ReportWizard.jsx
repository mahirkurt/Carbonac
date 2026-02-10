/**
 * ReportWizard - AI-guided report style wizard
 * Asks questions to determine report styling and design preferences
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Accordion,
  AccordionItem,
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
  Template,
  Restart,
} from '@carbon/icons-react';

import { useDocument, WORKFLOW_STEPS } from '../../contexts/DocumentContext';
import './ReportWizard.scss';

// Wizard questions configuration
const WIZARD_QUESTIONS = [
  {
    id: 'documentType',
    question: 'Merhaba! Ben Carbon Design asistanınızım. Hangi tür bir doküman oluşturmak istiyorsunuz?',
    type: 'single-choice',
    options: [
      { value: 'report', label: 'İş Raporu', icon: Report, description: 'Profesyonel iş raporları' },
      { value: 'presentation', label: 'Sunum', icon: PresentationFile, description: 'Görsel sunumlar' },
      { value: 'article', label: 'Makale', icon: Document, description: 'Blog yazısı veya makale' },
      { value: 'documentation', label: 'Dokümantasyon', icon: Book, description: 'Teknik dokümantasyon' },
      { value: 'analytics', label: 'Analiz Raporu', icon: Analytics, description: 'Veri analizi raporları' },
      { value: 'academic', label: 'Akademik', icon: Education, description: 'Akademik makaleler' },
    ],
  },
  {
    id: 'audience',
    question: 'Bu doküman kimler için hazırlanıyor? Hedef kitlenizi belirleyelim.',
    type: 'single-choice',
    options: [
      { value: 'executive', label: 'Üst Yönetim', icon: Enterprise, description: 'C-level yöneticiler' },
      { value: 'technical', label: 'Teknik Ekip', icon: Analytics, description: 'Mühendisler, geliştiriciler' },
      { value: 'business', label: 'İş Birimi', icon: UserMultiple, description: 'Departman yöneticileri' },
      { value: 'general', label: 'Genel Kitle', icon: User, description: 'Tüm çalışanlar veya dış paydaşlar' },
      { value: 'academic', label: 'Akademik', icon: Education, description: 'Akademisyenler, araştırmacılar' },
    ],
  },
  {
    id: 'tone',
    question: 'Dokümanınızın tonu nasıl olmalı?',
    type: 'single-choice',
    options: [
      { value: 'formal', label: 'Resmi', description: 'Kurumsal ve profesyonel dil' },
      { value: 'semiformal', label: 'Yarı Resmi', description: 'Profesyonel ama erişilebilir' },
      { value: 'casual', label: 'Günlük', description: 'Samimi ve rahat bir üslup' },
      { value: 'technical', label: 'Teknik', description: 'Jargon ve teknik terimler içerir' },
    ],
  },
  {
    id: 'purpose',
    question: 'Dokümanınızın temel amacı nedir?',
    type: 'single-choice',
    options: [
      { value: 'inform', label: 'Bilgilendirmek', description: 'Bilgi aktarımı ve eğitim' },
      { value: 'persuade', label: 'İkna Etmek', description: 'Karar almayı desteklemek' },
      { value: 'document', label: 'Kayıt Altına Almak', description: 'Resmi dokümantasyon' },
      { value: 'analyze', label: 'Analiz Sunmak', description: 'Veri ve bulguları sunmak' },
      { value: 'instruct', label: 'Talimat Vermek', description: 'Adım adım rehberlik' },
    ],
  },
  {
    id: 'emphasis',
    question: 'Dokümanınızda hangi unsurlar öne çıkmalı?',
    type: 'multi-choice',
    options: [
      { value: 'data', label: 'Veri & Metrikler', icon: ChartBar, description: 'Sayılar ve istatistikler' },
      { value: 'tables', label: 'Tablolar', icon: DataTable, description: 'Karşılaştırmalı veriler' },
      { value: 'narrative', label: 'Anlatı', icon: TextLongParagraph, description: 'Açıklayıcı metinler' },
      { value: 'visuals', label: 'Görseller', icon: Image, description: 'Grafikler ve şemalar' },
    ],
  },
  {
    id: 'colorScheme',
    question: 'Hangi renk şeması size uygun?',
    type: 'single-choice',
    isColorChoice: true,
    options: [
      { value: 'professional', label: 'Profesyonel', colors: ['#0f62fe', '#393939', '#f4f4f4'], description: 'Mavi ve gri tonları' },
      { value: 'vibrant', label: 'Canlı', colors: ['#0f62fe', '#da1e28', '#198038'], description: 'Çeşitli renk paleti' },
      { value: 'minimal', label: 'Minimal', colors: ['#161616', '#525252', '#ffffff'], description: 'Siyah ve beyaz' },
      { value: 'warm', label: 'Sıcak', colors: ['#da1e28', '#ff832b', '#f1c21b'], description: 'Sıcak tonlar' },
      { value: 'cool', label: 'Soğuk', colors: ['#0f62fe', '#0072c3', '#009d9a'], description: 'Mavi ve yeşil tonları' },
    ],
  },
  {
    id: 'layoutStyle',
    question: 'Sayfa düzeni tercihiniz nedir?',
    type: 'single-choice',
    options: [
      { value: 'spacious', label: 'Ferah', icon: Grid, description: 'Geniş boşluklar, az içerik' },
      { value: 'balanced', label: 'Dengeli', icon: Template, description: 'Optimal içerik yoğunluğu' },
      { value: 'compact', label: 'Kompakt', icon: DataTable, description: 'Yoğun içerik, az boşluk' },
    ],
  },
  {
    id: 'components',
    question: 'Dokümanınızda hangi bileşenleri kullanmak istersiniz?',
    type: 'multi-choice',
    options: [
      { value: 'charts', label: 'Grafikler', description: 'Bar, çizgi, pasta grafikleri' },
      { value: 'tables', label: 'Tablolar', description: 'Veri tabloları' },
      { value: 'callouts', label: 'Vurgular', description: 'Önemli bilgi kutuları' },
      { value: 'quotes', label: 'Alıntılar', description: 'Alıntı blokları' },
      { value: 'stats', label: 'İstatistik Kartları', description: 'Metrik göstergeleri' },
      { value: 'timelines', label: 'Zaman Çizelgesi', description: 'Kronolojik gösterimler' },
      { value: 'comparisons', label: 'Karşılaştırma', description: 'Karşılaştırma tabloları' },
      { value: 'icons', label: 'İkonlar', description: 'Görsel semboller' },
    ],
  },
];

const layoutProfileOptions = [
  { id: 'symmetric', label: 'Symmetric (Dengeli)' },
  { id: 'asymmetric', label: 'Asymmetric (Vurgu)' },
  { id: 'dashboard', label: 'Dashboard (Yoğun)' },
];

const printProfileOptions = [
  { id: 'pagedjs-a4', label: 'Paged.js A4' },
  { id: 'pagedjs-a3', label: 'Paged.js A3' },
];

const themeOptions = [
  { id: 'white', label: 'White' },
  { id: 'g10', label: 'G10' },
  { id: 'g90', label: 'G90' },
  { id: 'g100', label: 'G100' },
];

// AI response generator based on answers
const generateAIResponse = (questionId, answer, allAnswers) => {
  const responses = {
    documentType: {
      report: 'Mükemmel seçim! İş raporları için Carbon Design\'ın stat-tile ve data-table bileşenlerini kullanacağız. 📊',
      presentation: 'Harika! Sunum formatı için büyük başlıklar ve görsel ağırlıklı tasarım uygulayacağız. 🎯',
      article: 'Güzel! Makale formatı için okunabilirliği artıran tipografi ayarları yapacağız. 📝',
      documentation: 'Anlaşıldı! Teknik dokümantasyon için kod blokları ve yapılandırılmış içerik kullanacağız. 📚',
      analytics: 'Tamam! Analiz raporu için veri görselleştirme bileşenlerini ön plana çıkaracağız. 📈',
      academic: 'Akademik format için kaynakça, dipnotlar ve resmi stil uygulayacağız. 🎓',
    },
    audience: {
      executive: 'Yönetim için özet odaklı, karar vermeyi destekleyen bir format hazırlayacağım. ✨',
      technical: 'Teknik detayları içeren, kod örnekleri ve şemalarla zenginleştirilmiş bir tasarım olacak. 💻',
      business: 'İş metrikleri ve eylem önerileri öne çıkan bir format oluşturacağım. 📋',
      general: 'Herkesin anlayabileceği, açık ve net bir dil kullanacağız. 👥',
      academic: 'Akademik standartlara uygun, referanslı bir format hazırlayacağım. 📖',
    },
    colorScheme: {
      professional: 'Profesyonel mavi-gri paleti, kurumsal raporlar için ideal! 🔵',
      vibrant: 'Canlı renkler dikkat çekici ve enerjik bir görünüm sağlayacak! 🌈',
      minimal: 'Minimalist siyah-beyaz, zamansız bir şıklık sunuyor. ⚪',
      warm: 'Sıcak tonlar, samimi ve davetkar bir atmosfer yaratacak. 🟠',
      cool: 'Soğuk tonlar, güven ve profesyonellik hissi verecek. 💙',
    },
  };

  return responses[questionId]?.[answer] || 'Tercihlerinizi kaydettim! Bir sonraki soruya geçelim. ✅';
};

function ReportWizard() {
  const {
    reportSettings,
    updateReportSettings,
    wizardMessages,
    addWizardMessage,
    wizardCurrentQuestion,
    wizardAnswers,
    setWizardAnswer,
    nextWizardQuestion,
    setStep,
    markdownContent,
    selectedLayoutProfile,
    selectedPrintProfile,
    selectedTheme,
    setLayoutProfile,
    setPrintProfile,
    setTheme,
  } = useDocument();

  const { isAuthenticated } = useDocument();

  // Wizard içerisinde Carbonac AI Chat (genel header widget ile aynı instance).
  // Burada sadece görünürlük için kullanıcıyı yönlendiriyoruz.
  const [showAiHint, setShowAiHint] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Merhaba! Ben Carbon Design asistanınızım. Dokümanınız için en uygun tasarımı belirlemek için birkaç soru soracağım. Hazır mısınız? 🎨',
    },
  ]);
  const messagesEndRef = useRef(null);

  const currentQuestion = WIZARD_QUESTIONS[currentQuestionIndex];
  const totalQuestions = WIZARD_QUESTIONS.length;
  const progress = ((currentQuestionIndex) / totalQuestions) * 100;
  const resolvedLayoutProfile = layoutProfileOptions.find(
    (option) => option.id === selectedLayoutProfile
  ) || layoutProfileOptions[0];
  const resolvedPrintProfile = printProfileOptions.find(
    (option) => option.id === selectedPrintProfile
  ) || printProfileOptions[0];
  const resolvedTheme = themeOptions.find(
    (option) => option.id === selectedTheme
  ) || themeOptions[0];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add question message when question changes
  useEffect(() => {
    if (currentQuestion && currentQuestionIndex > 0) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { type: 'ai', content: currentQuestion.question },
        ]);
        setIsTyping(false);
      }, 1000);
    }
  }, [currentQuestionIndex, currentQuestion]);

  useEffect(() => {
    setShowValidation(false);
  }, [currentQuestionIndex]);

  // Handle option selection
  const handleOptionSelect = useCallback((value) => {
    const questionId = currentQuestion.id;
    setShowValidation(false);
    
    if (currentQuestion.type === 'multi-choice') {
      const current = selectedOptions[questionId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setSelectedOptions(prev => ({ ...prev, [questionId]: updated }));
    } else {
      setSelectedOptions(prev => ({ ...prev, [questionId]: value }));
    }
  }, [currentQuestion, selectedOptions]);

  // Handle next question
  const handleNext = useCallback(() => {
    const questionId = currentQuestion.id;
    const answer = selectedOptions[questionId];

    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      setShowValidation(true);
      return;
    }

    // Add user's answer to messages
    const answerText = Array.isArray(answer)
      ? answer.map(v => currentQuestion.options.find(o => o.value === v)?.label).join(', ')
      : currentQuestion.options.find(o => o.value === answer)?.label;

    setMessages(prev => [
      ...prev,
      { type: 'user', content: answerText },
    ]);

    // Update report settings
    updateReportSettings({ [questionId]: answer });
    setWizardAnswer(questionId, answer);

    // Show typing indicator
    setIsTyping(true);

    // Add AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(questionId, Array.isArray(answer) ? answer[0] : answer, selectedOptions);
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: aiResponse },
      ]);
      setIsTyping(false);

      // Move to next question or finish
      if (currentQuestionIndex < totalQuestions - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setIsTyping(true);
        }, 500);
      } else {
        // Wizard complete
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              type: 'ai',
              content: 'Harika! Şimdi seçimlerinizi özetliyorum. Özet onayından sonra düzenleme ekranına geçebilirsiniz.',
            },
          ]);
          setShowSummary(true);
        }, 1000);
      }
    }, 1500);
  }, [currentQuestion, selectedOptions, currentQuestionIndex, totalQuestions, updateReportSettings, setWizardAnswer]);

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedOptions({});
    setMessages([
      {
        type: 'ai',
        content: 'Sihirbazı sıfırladım. Tekrar başlayalım! 🔄',
      },
      {
        type: 'ai',
        content: WIZARD_QUESTIONS[0].question,
      },
    ]);
  }, []);

  // Handle continue to editor
  const handleContinue = useCallback(() => {
    setStep(WORKFLOW_STEPS.EDITOR);
  }, [setStep]);

  const handleOpenAiAssistant = useCallback(() => {
    // Header’daki AI butonunu tıklamak için hash sinyali.
    // App.jsx içinde hash listener ile yakalanacak.
    try {
      window.location.hash = '#ai';
    } catch (e) {
      // ignore
    }
  }, []);

  const isWizardComplete = currentQuestionIndex >= totalQuestions - 1 && selectedOptions[currentQuestion?.id];
  const canProceed = selectedOptions[currentQuestion?.id] && (
    !Array.isArray(selectedOptions[currentQuestion?.id]) || 
    selectedOptions[currentQuestion?.id].length > 0
  );

  const recommendedTemplate = useMemo(() => {
    const documentType = selectedOptions.documentType || reportSettings.documentType;
    if (documentType === 'analytics') return 'carbon-dataviz';
    if (documentType === 'presentation') return 'carbon-advanced';
    if (documentType === 'documentation') return 'carbon-components';
    if (documentType === 'academic') return 'carbon-default';
    return 'carbon-default';
  }, [selectedOptions, reportSettings.documentType]);

  return (
    <div className="report-wizard">
      {/* Progress Header */}
      <div className="report-wizard__header">
        <div className="report-wizard__progress-info">
          <h2>Rapor Sihirbazı</h2>
          <span className="report-wizard__step-count">
            Adım {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="report-wizard__progress-bar">
          <div 
            className="report-wizard__progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Button
          kind="ghost"
          size="sm"
          onClick={() => setShowAiHint((prev) => !prev)}
        >
          AI ile yardım al
        </Button>

        {showAiHint && (
          <div style={{ marginTop: '0.75rem' }}>
            {!isAuthenticated ? (
              <InlineNotification
                kind="info"
                title="AI Danışmanı"
                subtitle="AI için giriş yapmanız gerekiyor. Sağ üstteki hesap ikonundan giriş yapın."
                lowContrast
              />
            ) : (
              <InlineNotification
                kind="info"
                title="AI Danışmanı"
                subtitle={(
                  <span>
                    Sağ üstteki <strong>AI Danışmanı</strong> butonuna basın. İsterseniz buradan da açabilirsiniz.
                  </span>
                )}
                lowContrast
              />
            )}

            {isAuthenticated && (
              <div style={{ marginTop: '0.5rem' }}>
                <Button kind="secondary" size="sm" onClick={handleOpenAiAssistant}>
                  AI Danışmanını aç
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="report-wizard__chat">
        <div className="report-wizard__messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`report-wizard__message report-wizard__message--${msg.type}`}
            >
              <div className={`report-wizard__avatar report-wizard__avatar--${msg.type}`}>
                {msg.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="report-wizard__message-content">
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="report-wizard__message report-wizard__message--ai">
              <div className="report-wizard__avatar report-wizard__avatar--ai">
                <Bot size={20} />
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
        {currentQuestion && !isTyping && !showSummary && (
          <div className="report-wizard__options">
            {showValidation && !canProceed && (
              <InlineNotification
                kind="warning"
                title="Seçim gerekli"
                subtitle="Devam etmek için bir seçenek işaretleyin."
                lowContrast
              />
            )}
            <div className={`report-wizard__options-grid ${currentQuestion.isColorChoice ? 'report-wizard__options-grid--colors' : ''}`}>
              {currentQuestion.options.map((option) => {
                const isSelected = currentQuestion.type === 'multi-choice'
                  ? (selectedOptions[currentQuestion.id] || []).includes(option.value)
                  : selectedOptions[currentQuestion.id] === option.value;

                return (
                  <ClickableTile
                    key={option.value}
                    className={`report-wizard__option ${isSelected ? 'report-wizard__option--selected' : ''}`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.icon && <option.icon size={24} className="report-wizard__option-icon" />}
                    
                    {option.colors && (
                      <div className="report-wizard__color-preview">
                        {option.colors.map((color, i) => (
                          <span key={i} style={{ background: color }} />
                        ))}
                      </div>
                    )}
                    
                    <div className="report-wizard__option-text">
                      <span className="report-wizard__option-label">{option.label}</span>
                      {option.description && (
                        <span className="report-wizard__option-description">{option.description}</span>
                      )}
                    </div>
                    
                    {isSelected && (
                      <Checkmark size={20} className="report-wizard__option-check" />
                    )}
                  </ClickableTile>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {showSummary && (
        <div className="report-wizard__summary-panel">
          <h3>Özet Onayı</h3>
          <p>Seçimleriniz aşağıdaki gibi. Dilerseniz geri dönüp güncelleyebilirsiniz.</p>
          <div className="report-wizard__summary-list">
            {Object.entries(selectedOptions).map(([key, value]) => {
              const question = WIZARD_QUESTIONS.find(q => q.id === key);
              if (!question) return null;
              const displayValue = Array.isArray(value)
                ? value.map(v => question.options.find(o => o.value === v)?.label).join(', ')
                : question.options.find(o => o.value === value)?.label;
              return (
                <div key={key} className="report-wizard__summary-item">
                  <span className="report-wizard__summary-label">
                    {key === 'documentType' && 'Doküman Tipi'}
                    {key === 'audience' && 'Hedef Kitle'}
                    {key === 'tone' && 'Ton'}
                    {key === 'purpose' && 'Amaç'}
                    {key === 'emphasis' && 'Vurgular'}
                    {key === 'colorScheme' && 'Renk Şeması'}
                    {key === 'layoutStyle' && 'Sayfa Düzeni'}
                    {key === 'components' && 'Bileşenler'}
                  </span>
                  <span className="report-wizard__summary-value">{displayValue}</span>
                </div>
              );
            })}
          </div>
          <div className="report-wizard__summary-recommendation">
            <Tag type="blue" size="sm">Önerilen template</Tag>
            <strong>{recommendedTemplate}</strong>
            <span>İsterseniz önizlemede template galerisine geçip değiştirebilirsiniz.</span>
          </div>
        </div>
      )}

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
          {currentQuestionIndex > 0 && (
            <Button
              kind="secondary"
              renderIcon={ArrowLeft}
              onClick={handlePrevious}
              disabled={isTyping}
            >
              Geri
            </Button>
          )}
          
          {!isWizardComplete ? (
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
                  setCurrentQuestionIndex(totalQuestions - 1);
                }}
                disabled={isTyping}
              >
                Seçimleri Düzenle
              </Button>
              <Button
                kind="primary"
                renderIcon={ArrowRight}
                onClick={handleContinue}
                disabled={isTyping || !showSummary}
              >
                Editöre Geç
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
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Summary Sidebar */}
      {Object.keys(selectedOptions).length > 0 && (
        <aside className="report-wizard__summary">
          <h4>Seçimleriniz</h4>
          <div className="report-wizard__summary-list">
            {Object.entries(selectedOptions).map(([key, value]) => {
              const question = WIZARD_QUESTIONS.find(q => q.id === key);
              if (!question) return null;
              
              const displayValue = Array.isArray(value)
                ? value.map(v => question.options.find(o => o.value === v)?.label).join(', ')
                : question.options.find(o => o.value === value)?.label;

              return (
                <div key={key} className="report-wizard__summary-item">
                  <span className="report-wizard__summary-label">
                    {key === 'documentType' && 'Doküman Tipi'}
                    {key === 'audience' && 'Hedef Kitle'}
                    {key === 'tone' && 'Ton'}
                    {key === 'purpose' && 'Amaç'}
                    {key === 'emphasis' && 'Vurgular'}
                    {key === 'colorScheme' && 'Renk Şeması'}
                    {key === 'layoutStyle' && 'Sayfa Düzeni'}
                    {key === 'components' && 'Bileşenler'}
                  </span>
                  <span className="report-wizard__summary-value">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}

export default ReportWizard;
