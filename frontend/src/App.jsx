/**
 * Carbonac - Carbon Design System PDF Converter
 * Main Application with Document Workflow
 */

import React, { useState, useCallback, useEffect, Suspense, lazy, useMemo, useRef } from 'react';
import {
  Theme,
  Header,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  HeaderMenuButton,
  SideNav,
  SideNavItems,
  SideNavLink,
  Switcher,
  SwitcherItem,
  SwitcherDivider,
  Button,
  TextInput,
  Dropdown,
  TextArea,
  Tag,
  InlineNotification,
  Loading,
  ProgressIndicator,
  ProgressStep,
  Tile,
} from '@carbon/react';

import {
  Document,
  DocumentPdf,
  Chat,
  Settings,
  Light,
  Asleep,
  Upload,
  Play,
  Help,
  Download,
  Code,
  Template,
  ChartBar,
  ColorPalette,
  TextFont,
  Grid as GridIcon,
  User,
  Login,
  Logout,
  Currency,
  Checkmark,
  Close,
  Home,
  Edit,
  View,
  MagicWand,
} from '@carbon/icons-react';

import './styles/index.scss';
import PreviewPanel from './components/layout/PreviewPanel';
import AppFooter from './components/layout/AppFooter';
import { focusEditorLocation } from './utils/editorFocus';
import directiveTemplates from './utils/directiveTemplates';
import { useLocalStorage } from './hooks';

import DocumentsPanel from './components/workspace/DocumentsPanel';
import JobsPanel from './components/workspace/JobsPanel';
import QualityPanel from './components/workspace/QualityPanel';

// Contexts
import { 
  ThemeProvider, 
  useTheme,
  AuthProvider, 
  useAuth,
  PricingProvider, 
  usePricing,
  DocumentProvider,
  useDocument,
  WORKFLOW_STEPS,
} from './contexts';
import { AuthCallback, AuthResetPassword } from './components/auth';

// Lazy loaded components
const SettingsModal = lazy(() => import('./components/layout/SettingsModal'));
const AuthModal = lazy(() => import('./components/auth/AuthModal'));
const PricingModal = lazy(() => import('./components/pricing/PricingModal'));
const DocumentUploader = lazy(() => import('./components/document/DocumentUploader'));
const ReportWizard = lazy(() => import('./components/wizard/ReportWizard'));
const TemplateGallery = lazy(() => import('./components/templates/TemplateGallery'));
const CarbonacAiChat = lazy(() => import('./components/ai/CarbonacAiChat'));

const PASSWORD_GATE_MODE = import.meta.env.VITE_PASSWORD_GATE === 'true';
const GUEST_MODE = import.meta.env.VITE_GUEST_MODE === 'true';

// Layout profile options
const layoutProfileOptions = [
  { id: 'symmetric', label: 'Symmetric (Dengeli)' },
  { id: 'asymmetric', label: 'Asymmetric (Vurgu)' },
  { id: 'dashboard', label: 'Dashboard (Yoğun)' },
];

// Print profile options
const printProfileOptions = [
  { id: 'pagedjs-a4', label: 'Paged.js A4' },
  { id: 'pagedjs-a3', label: 'Paged.js A3' },
];

// Workflow step configuration
const WORKFLOW_STEP_CONFIG = {
  [WORKFLOW_STEPS.UPLOAD]: { 
    label: 'Doküman Yükle', 
    icon: Upload, 
    description: 'PDF, Word veya metin dosyası yükleyin' 
  },
  [WORKFLOW_STEPS.PROCESSING]: { 
    label: 'İşleniyor', 
    icon: MagicWand, 
    description: 'Markdown\'a dönüştürülüyor ve önizleme hazırlanıyor' 
  },
  [WORKFLOW_STEPS.WIZARD]: { 
    label: 'Stil Sihirbazı', 
    icon: ColorPalette, 
    description: 'Rapor tasarımını belirleyin ve özet onayı verin' 
  },
  [WORKFLOW_STEPS.EDITOR]: { 
    label: 'Düzenle', 
    icon: Edit, 
    description: 'Markdown içeriği düzenleyin ve QA kontrolü yapın' 
  },
  [WORKFLOW_STEPS.PREVIEW]: { 
    label: 'Önizleme', 
    icon: View, 
    description: 'PDF önizleme, job durumu ve indirme' 
  },
};

// Workflow Step Indicator Component
function WorkflowSteps() {
  const { currentStep, completedSteps, setStep } = useDocument();
  
  const steps = Object.entries(WORKFLOW_STEP_CONFIG);
  const currentIndex = steps.findIndex(([key]) => key === currentStep);

  return (
    <div className="workflow-steps">
      <ProgressIndicator currentIndex={currentIndex} spaceEqually>
        {steps.map(([key, config], index) => {
          const isComplete = completedSteps.includes(key) || index < currentIndex;
          const isCurrent = key === currentStep;
          
          return (
            <ProgressStep
              key={key}
              label={config.label}
              description={config.description}
              complete={isComplete}
              current={isCurrent}
              onClick={() => isComplete && setStep(key)}
              disabled={!isComplete && !isCurrent}
            />
          );
        })}
      </ProgressIndicator>
    </div>
  );
}

// Editor Panel Component
function EditorPanel() {
  const { markdownContent, setMarkdown, lintIssues } = useDocument();
  const [selectedSeverityId, setSelectedSeverityId] = useState('all');
  const [selectedRuleId, setSelectedRuleId] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    directiveTemplates[0]?.id || ''
  );
  const textAreaRef = useRef(null);

  const severityOptions = useMemo(() => ([
    { id: 'all', label: 'Tüm Seviyeler' },
    { id: 'warning', label: 'Uyarı' },
    { id: 'info', label: 'Bilgi' },
  ]), []);

  const ruleOptions = useMemo(() => {
    const base = [{ id: 'all', label: 'Tüm Kurallar' }];
    const uniqueRules = Array.from(new Set(lintIssues.map((issue) => issue.ruleId)));
    uniqueRules.forEach((ruleId) => {
      base.push({ id: ruleId, label: ruleId });
    });
    return base;
  }, [lintIssues]);

  const outlineItems = useMemo(() => {
    if (!markdownContent) return [];
    const lines = markdownContent.split('\n');
    return lines.reduce((acc, line, index) => {
      const match = line.match(/^(#{1,2})\s+(.+)/);
      if (!match) return acc;
      acc.push({
        level: match[1].length,
        title: match[2].trim(),
        line: index + 1,
      });
      return acc;
    }, []);
  }, [markdownContent]);

  const selectedTemplate = useMemo(
    () => directiveTemplates.find((item) => item.id === selectedTemplateId) || directiveTemplates[0],
    [selectedTemplateId]
  );

  const selectedSeverity = severityOptions.find((option) => option.id === selectedSeverityId) || severityOptions[0];
  const selectedRule = ruleOptions.find((option) => option.id === selectedRuleId) || ruleOptions[0];

  const filteredIssues = useMemo(() => {
    const severityFilter = selectedSeverity?.id || 'all';
    const ruleFilter = selectedRule?.id || 'all';
    return lintIssues.filter((issue) => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }
      if (ruleFilter !== 'all' && issue.ruleId !== ruleFilter) {
        return false;
      }
      return true;
    });
  }, [lintIssues, selectedSeverity, selectedRule]);

  const focusLintLocation = useCallback((issue) => {
    focusEditorLocation({
      line: issue?.line,
      column: issue?.column,
      markdown: markdownContent,
      textArea: textAreaRef.current,
    });
  }, [markdownContent]);

  const insertDirective = useCallback(() => {
    const template = selectedTemplate;
    if (!template) return;
    const textArea = textAreaRef.current || document.getElementById('markdown-editor');
    const current = markdownContent || '';
    const start = textArea?.selectionStart ?? current.length;
    const end = textArea?.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const needsLeadingBreak = before && !before.endsWith('\n');
    const needsTrailingBreak = after && !after.startsWith('\n');
    const snippet = `${needsLeadingBreak ? '\n\n' : ''}${template.snippet}${needsTrailingBreak ? '\n' : ''}`;
    const nextValue = `${before}${snippet}${after}`;
    setMarkdown(nextValue);
    if (textArea) {
      const nextPosition = before.length + snippet.length;
      textArea.focus();
      try {
        textArea.setSelectionRange(nextPosition, nextPosition);
      } catch (error) {
        // ignore selection errors for unsupported inputs
      }
    }
  }, [markdownContent, selectedTemplate, setMarkdown]);

  return (
    <div className="editor-panel panel">
      <div className="panel__header">
        <h3>
          <Code size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Markdown Editör
        </h3>
        <p>Dokümanınızı düzenleyin</p>
      </div>
      <div className="editor-panel__tools">
        <div className="editor-panel__actions">
          <Dropdown
            id="directive-template-select"
            items={directiveTemplates}
            selectedItem={selectedTemplate}
            itemToString={(item) => item?.label || ''}
            label="Directive seç"
            onChange={({ selectedItem }) => {
              if (selectedItem?.id) {
                setSelectedTemplateId(selectedItem.id);
              }
            }}
          />
          <Button size="sm" kind="secondary" onClick={insertDirective} disabled={!selectedTemplate}>
            Ekle
          </Button>
        </div>
        <div className="editor-panel__outline">
          <div className="editor-panel__outline-header">
            <h4>Outline</h4>
            <span>{outlineItems.length} başlık</span>
          </div>
          {outlineItems.length === 0 ? (
            <p className="editor-panel__outline-empty">Başlık bulunamadı.</p>
          ) : (
            <ul className="editor-panel__outline-list">
              {outlineItems.map((item) => (
                <li key={`${item.line}-${item.title}`} className={`editor-panel__outline-item level-${item.level}`}>
                  <button
                    type="button"
                    onClick={() => focusEditorLocation({
                      line: item.line,
                      column: 1,
                      markdown: markdownContent,
                      textArea: textAreaRef.current,
                    })}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="panel__content markdown-editor">
        <TextArea
          id="markdown-editor"
          labelText="Markdown İçeriği"
          hideLabel
          value={markdownContent}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Markdown içeriğinizi buraya yazın..."
          rows={30}
          ref={textAreaRef}
          style={{ 
            height: '100%', 
            fontFamily: 'IBM Plex Mono',
            resize: 'none'
          }}
        />
      </div>
      <div className="editor-panel__lint">
        <div className="editor-panel__lint-header">
          <div>
            <h4>Lint Uyarıları</h4>
            <span>{lintIssues.length} bulgu</span>
          </div>
          <div className="editor-panel__lint-filters">
            <Dropdown
              id="lint-severity-filter"
              items={severityOptions}
              label="Seviye"
              selectedItem={selectedSeverity}
              onChange={({ selectedItem }) => setSelectedSeverityId(selectedItem.id)}
            />
            <Dropdown
              id="lint-rule-filter"
              items={ruleOptions}
              label="Kural"
              selectedItem={selectedRule}
              onChange={({ selectedItem }) => setSelectedRuleId(selectedItem.id)}
            />
          </div>
        </div>
        {filteredIssues.length === 0 ? (
          <p className="editor-panel__lint-empty">Lint bulgusu yok.</p>
        ) : (
          <ul className="editor-panel__lint-list">
            {filteredIssues.map((issue, index) => (
              <li
                key={`${issue.ruleId}-${index}`}
                className="editor-panel__lint-item"
                role="button"
                tabIndex={0}
                onClick={() => focusLintLocation(issue)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    focusLintLocation(issue);
                  }
                }}
                title={`Satır ${issue.line}, Kolon ${issue.column}`}
              >
                <span className={`lint-tag lint-tag--${issue.severity}`}>{issue.severity}</span>
                <div>
                  <strong>{issue.ruleId}</strong>
                  <div>{issue.message}</div>
                </div>
                <span className="lint-meta">L{issue.line}:{issue.column}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Preview Panel Component now lives in components/layout/PreviewPanel

// Settings Sidebar Component
function SettingsSidebar() {
  const {
    selectedLayoutProfile,
    selectedPrintProfile,
    setLayoutProfile,
    setPrintProfile,
    reportSettings,
  } = useDocument();
  
  const resolvedLayoutProfile = layoutProfileOptions.find(
    (option) => option.id === selectedLayoutProfile
  );
  const resolvedPrintProfile = printProfileOptions.find(
    (option) => option.id === selectedPrintProfile
  );

  return (
    <aside className="settings-sidebar">
      <div className="settings-section">
        <div className="settings-section__title">Yerleşim Profili</div>
        <Dropdown
          id="layout-profile-select"
          items={layoutProfileOptions}
          selectedItem={resolvedLayoutProfile}
          onChange={({ selectedItem }) => setLayoutProfile(selectedItem.id)}
          label="Profil Seçin"
          titleText=""
        />
      </div>

      <div className="settings-section">
        <div className="settings-section__title">Baskı Profili</div>
        <Dropdown
          id="print-profile-select"
          items={printProfileOptions}
          selectedItem={resolvedPrintProfile}
          onChange={({ selectedItem }) => setPrintProfile(selectedItem.id)}
          label="Profil Seçin"
          titleText=""
        />
      </div>

      {/* Report Settings Summary */}
      {Object.keys(reportSettings).some(k => reportSettings[k]) && (
        <div className="settings-section">
          <div className="settings-section__title">Rapor Ayarları</div>
          <div className="settings-summary">
            {reportSettings.documentType && (
              <Tag type="blue" size="sm">{reportSettings.documentType}</Tag>
            )}
            {reportSettings.audience && (
              <Tag type="purple" size="sm">{reportSettings.audience}</Tag>
            )}
            {reportSettings.colorScheme && (
              <Tag type="cyan" size="sm">{reportSettings.colorScheme}</Tag>
            )}
            {reportSettings.layoutStyle && (
              <Tag type="teal" size="sm">{reportSettings.layoutStyle}</Tag>
            )}
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="settings-section__title">Hızlı Erişim</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Tag type="blue" renderIcon={ColorPalette}>Renkler</Tag>
          <Tag type="purple" renderIcon={TextFont}>Tipografi</Tag>
          <Tag type="cyan" renderIcon={ChartBar}>Grafikler</Tag>
          <Tag type="teal" renderIcon={GridIcon}>Grid</Tag>
          <Tag type="green" renderIcon={Template}>Bileşenler</Tag>
        </div>
      </div>
    </aside>
  );
}

// Main App Content
function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { credits, subscription } = usePricing();
  const {
    currentStep,
    reset,
    setStep,
    setMarkdown,
    selectedLayoutProfile,
    selectedPrintProfile,
    setLayoutProfile,
    setPrintProfile,
    autoSaveEnabled,
    setAutoSaveEnabled,
    livePreviewEnabled,
    setLivePreviewEnabled,
  } = useDocument();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showSideNav, setShowSideNav] = useState(true);
  const [notification, setNotification] = useState(null);
  const [aiChatEnabled, setAiChatEnabled] = useLocalStorage('carbonac-ai-chat-enabled', true);
  const [aiChatMounted, setAiChatMounted] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const userPanelRef = useRef(null);
  const aiChatInstanceRef = useRef(null);
  const aiChatPendingOpenRef = useRef(false);
  const aiChatWiredInstanceRef = useRef(null);
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    if (typeof window === 'undefined') return 'workflow';
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';
    if (path === '/templates') return 'templates';
    if (hash === '#templates') return 'templates';
    if (hash === '#documents') return 'documents';
    if (hash === '#jobs') return 'jobs';
    if (hash === '#quality') return 'quality';
    if (hash === '#workflow') return 'workflow';
    return 'workflow';
  });
  const passwordGateMode = PASSWORD_GATE_MODE;
  const isGuestMode = GUEST_MODE;
  const canAccessWorkspace = isAuthenticated || isGuestMode;

  const handleAiChatInstanceReady = useCallback((instance) => {
    if (!instance) return;

    aiChatInstanceRef.current = instance;
    const initialOpen = Boolean(instance.getState?.().viewState?.mainWindow);
    setIsAiChatOpen(initialOpen);

    // Attach a single view-state listener per instance (avoid duplicate listeners).
    if (aiChatWiredInstanceRef.current !== instance) {
      aiChatWiredInstanceRef.current = instance;
      instance.on({
        type: 'view:change',
        handler: (event) => {
          setIsAiChatOpen(Boolean(event?.newViewState?.mainWindow));
        },
      });
    }

    if (aiChatPendingOpenRef.current) {
      aiChatPendingOpenRef.current = false;
      void instance.changeView('mainWindow');
      try {
        instance.requestFocus?.();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleAiChat = useCallback(() => {
    const instance = aiChatInstanceRef.current;
    if (!instance) {
      aiChatPendingOpenRef.current = true;
      setAiChatMounted(true);
      return;
    }

    const nextOpen = !Boolean(instance.getState?.().viewState?.mainWindow);
    void instance.changeView(nextOpen ? 'mainWindow' : 'launcher');
    if (nextOpen) {
      try {
        instance.requestFocus?.();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleToggleAiChatEnabled = useCallback((checked) => {
    setAiChatEnabled(Boolean(checked));
    if (!checked) {
      const instance = aiChatInstanceRef.current;
      if (instance) {
        void instance.changeView('launcher');
      }
      aiChatPendingOpenRef.current = false;
      aiChatInstanceRef.current = null;
      aiChatWiredInstanceRef.current = null;
      setAiChatMounted(false);
      setIsAiChatOpen(false);
    }
  }, [setAiChatEnabled]);

  // Close user panel on outside click / Escape
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (!showUserPanel) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Don't treat clicks on the toggle button as outside clicks.
      if (target.closest('[data-user-panel-toggle="true"]')) return;

      // Don't close if the click is inside the panel.
      if (userPanelRef.current?.contains?.(target)) return;

      setShowUserPanel(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowUserPanel(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserPanel]);

  const handleWorkspaceChange = useCallback((nextWorkspace) => {
    setActiveWorkspace(nextWorkspace);
    if (typeof window !== 'undefined') {
      if (nextWorkspace === 'templates') {
        window.history.pushState({}, '', '/templates#templates');
        return;
      }
      window.history.pushState({}, '', `/#${nextWorkspace}`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPopStateOrHash = () => {
      const path = window.location.pathname || '';
      const hash = window.location.hash || '';
      if (hash === '#templates' || (path === '/templates' && (!hash || hash === '#templates'))) {
        setActiveWorkspace('templates');
        return;
      }
      if (hash === '#documents') {
        setActiveWorkspace('documents');
        return;
      }
      if (hash === '#jobs') {
        setActiveWorkspace('jobs');
        return;
      }
      if (hash === '#quality') {
        setActiveWorkspace('quality');
        return;
      }
      if (hash === '#workflow') {
        setActiveWorkspace('workflow');
        return;
      }
    };

    window.addEventListener('hashchange', onPopStateOrHash);
    window.addEventListener('popstate', onPopStateOrHash);
    return () => {
      window.removeEventListener('hashchange', onPopStateOrHash);
      window.removeEventListener('popstate', onPopStateOrHash);
    };
  }, []);

  const handleOpenDocument = useCallback((doc) => {
    if (doc?.markdown_content) {
      setMarkdown(doc.markdown_content);
    }
    setStep(WORKFLOW_STEPS.EDITOR);
    setActiveWorkspace('workflow');
  }, [setMarkdown, setStep]);

  // Render content based on workflow step
  const renderContent = () => {
    if (activeWorkspace === 'templates') {
      return (
        <div className="workspace-panel">
          <Suspense fallback={<Loading withOverlay={false} description="Template galerisi yükleniyor..." />}>
            <TemplateGallery />
          </Suspense>
        </div>
      );
    }
    if (activeWorkspace === 'documents') {
      return (
        <DocumentsPanel
          onOpenDocument={handleOpenDocument}
          onStartWorkflow={() => {
            setStep(WORKFLOW_STEPS.UPLOAD);
            handleWorkspaceChange('workflow');
          }}
        />
      );
    }
    if (activeWorkspace === 'jobs') {
      return <JobsPanel />;
    }
    if (activeWorkspace === 'quality') {
      return (
        <div className="workspace-panel">
          <QualityPanel />
        </div>
      );
    }

    switch (currentStep) {
      case WORKFLOW_STEPS.UPLOAD:
        return (
          <Suspense fallback={<Loading withOverlay description="Yükleniyor..." />}>
            <DocumentUploader />
          </Suspense>
        );
      
      case WORKFLOW_STEPS.PROCESSING:
        return (
          <div className="processing-screen">
            <Loading withOverlay={false} description="Doküman işleniyor..." />
          </div>
        );
      
      case WORKFLOW_STEPS.WIZARD:
        return (
          <Suspense fallback={<Loading withOverlay description="Yükleniyor..." />}>
            <ReportWizard />
          </Suspense>
        );
      
      case WORKFLOW_STEPS.EDITOR:
      case WORKFLOW_STEPS.PREVIEW:
        return (
          <div className="editor-preview-layout">
            <SettingsSidebar />
            <div className="editor-preview-body">
              <Suspense fallback={<Loading withOverlay={false} description="Template galerisi yükleniyor..." />}>
                <TemplateGallery />
              </Suspense>
              <div className="editor-preview-panels">
                <EditorPanel />
                <div className="editor-preview-stack">
                  <PreviewPanel />
                  <QualityPanel compact />
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <Suspense fallback={<Loading withOverlay description="Yükleniyor..." />}>
            <DocumentUploader />
          </Suspense>
        );
    }
  };

  return (
    <Theme theme={theme}>
      <div className="app-container">
        {/* Header */}
        <Header aria-label="Carbonac">
          {canAccessWorkspace && (
            <HeaderMenuButton
              aria-label={showSideNav ? 'Yan menüyü kapat' : 'Yan menüyü aç'}
              onClick={() => setShowSideNav((prev) => !prev)}
              isActive={showSideNav}
              isCollapsible
            />
          )}

          <a
            href="/"
            className="app-header__logo-link"
            onClick={(e) => {
              e.preventDefault();
              reset();
              handleWorkspaceChange('workflow');
            }}
          >
            <img 
              src={theme === 'white' ? '/logos/Carbonac-Dark-Wide.png' : '/logos/Carbonac-Light-Wide.png'} 
              alt="Carbonac" 
              className="header-logo"
            />
          </a>
           
          <HeaderNavigation aria-label="Main navigation" className="app-header__nav">
            <HeaderMenuItem
              href="#"
              onClick={(e) => {
                e.preventDefault();
                reset();
                handleWorkspaceChange('workflow');
              }}
            >
              <Home size={16} style={{ marginRight: '0.5rem' }} />
              Ana Sayfa
            </HeaderMenuItem>
            <HeaderMenuItem
              href="#templates"
              onClick={(e) => {
                e.preventDefault();
                handleWorkspaceChange('templates');
              }}
            >
              Şablonlar
            </HeaderMenuItem>
            <HeaderMenuItem
              href="#documents"
              onClick={(e) => {
                e.preventDefault();
                handleWorkspaceChange('documents');
              }}
            >
              Dokümanlarım
            </HeaderMenuItem>
          </HeaderNavigation>

          <HeaderGlobalBar>
            {/* Credits Display */}
            {!passwordGateMode && isAuthenticated && (
              <div className="app-header__credits" onClick={() => setShowPricing(true)}>
                <Tag type="blue" size="sm">
                  <Currency size={14} style={{ marginRight: '0.25rem' }} />
                  {credits} Kredi
                </Tag>
              </div>
            )}

            {aiChatEnabled && canAccessWorkspace && (
              <HeaderGlobalAction
                aria-label={isAiChatOpen ? 'AI Danışmanı kapat' : 'AI Danışmanı aç'}
                onClick={toggleAiChat}
                tooltipAlignment="end"
                isActive={isAiChatOpen}
              >
                <Chat size={20} />
              </HeaderGlobalAction>
            )}
            
            <HeaderGlobalAction
              aria-label="Tema Değiştir"
              onClick={toggleTheme}
              tooltipAlignment="end"
            >
              {theme === 'white' ? <Asleep size={20} /> : <Light size={20} />}
            </HeaderGlobalAction>
            
            <HeaderGlobalAction
              aria-label="Ayarlar"
              onClick={() => setShowSettings(true)}
              tooltipAlignment="end"
            >
              <Settings size={20} />
            </HeaderGlobalAction>
            
            {!passwordGateMode && (
              <HeaderGlobalAction
                aria-label={isAuthenticated ? 'Hesap' : 'Giriş Yap'}
                onClick={() => isAuthenticated ? setShowUserPanel(!showUserPanel) : setShowAuth(true)}
                isActive={showUserPanel}
                aria-expanded={showUserPanel}
                aria-controls="user-panel"
                data-user-panel-toggle="true"
                tooltipAlignment="end"
              >
                {isAuthenticated ? <User size={20} /> : <Login size={20} />}
              </HeaderGlobalAction>
            )}
          </HeaderGlobalBar>

          {/* User Panel */}
          <HeaderPanel
            id="user-panel"
            aria-label="User panel"
            expanded={showUserPanel}
            onHeaderPanelFocus={() => {}}
          >
            {isAuthenticated && user && (
              <div className="app-header__user-panel" ref={userPanelRef}>
                <div className="app-header__user-panel-header">
                  <Button
                    kind="ghost"
                    size="sm"
                    hasIconOnly
                    renderIcon={Close}
                    iconDescription="Kapat"
                    onClick={() => setShowUserPanel(false)}
                  />
                </div>
                <div className="app-header__user-info">
                  <div className="app-header__user-avatar">
                    <User size={32} />
                  </div>
                  <div className="app-header__user-details">
                    <span className="app-header__user-name">{user.name}</span>
                    <span className="app-header__user-email">{user.email}</span>
                  </div>
                </div>
                <Switcher aria-label="User menu">
                  <SwitcherItem
                    aria-label="Hesabım"
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setShowUserPanel(false);
                    }}
                  >
                    Hesabım
                  </SwitcherItem>
                  <SwitcherItem aria-label="Abonelik" onClick={() => { setShowPricing(true); setShowUserPanel(false); }}>
                    Abonelik ({subscription?.tier || 'Free'})
                  </SwitcherItem>
                  <SwitcherItem aria-label="Kredi Satın Al" onClick={() => { setShowPricing(true); setShowUserPanel(false); }}>
                    Kredi Satın Al
                  </SwitcherItem>
                  <SwitcherDivider />
                  <SwitcherItem aria-label="Çıkış Yap" onClick={() => { logout(); setShowUserPanel(false); }}>
                    <Logout size={16} style={{ marginRight: '0.5rem' }} />
                    Çıkış Yap
                  </SwitcherItem>
                </Switcher>
              </div>
            )}
          </HeaderPanel>
        </Header>

        {/* Main Content */}
        <main className="app-main">
          {/* Workflow Steps - Show only when logged in */}
          {canAccessWorkspace && activeWorkspace === 'workflow' && (
            <div className="workflow-header">
              <WorkflowSteps />
            </div>
          )}

          {/* Content Area */}
          <div className="app-body">
            {canAccessWorkspace && showSideNav && (
              <SideNav
                aria-label="Yan menü"
                className="app-sidenav"
                expanded
              >
                <SideNavItems>
                  <SideNavLink
                    href="#workflow"
                    renderIcon={Home}
                    isActive={activeWorkspace === 'workflow'}
                    onClick={(event) => {
                      event.preventDefault();
                      handleWorkspaceChange('workflow');
                    }}
                  >
                    Workflow
                  </SideNavLink>
                  <SideNavLink
                    href="#templates"
                    renderIcon={Template}
                    isActive={activeWorkspace === 'templates'}
                    onClick={(event) => {
                      event.preventDefault();
                      handleWorkspaceChange('templates');
                    }}
                  >
                    Şablonlar
                  </SideNavLink>
                  <SideNavLink
                    href="#documents"
                    renderIcon={Document}
                    isActive={activeWorkspace === 'documents'}
                    onClick={(event) => {
                      event.preventDefault();
                      handleWorkspaceChange('documents');
                    }}
                  >
                    Dokümanlar
                  </SideNavLink>
                  <SideNavLink
                    href="#jobs"
                    renderIcon={MagicWand}
                    isActive={activeWorkspace === 'jobs'}
                    onClick={(event) => {
                      event.preventDefault();
                      handleWorkspaceChange('jobs');
                    }}
                  >
                    Jobs & Activity
                  </SideNavLink>
                  <SideNavLink
                    href="#quality"
                    renderIcon={Checkmark}
                    isActive={activeWorkspace === 'quality'}
                    onClick={(event) => {
                      event.preventDefault();
                      handleWorkspaceChange('quality');
                    }}
                  >
                    Quality
                  </SideNavLink>
                </SideNavItems>
              </SideNav>
            )}
            <div className="app-workspace">
            {canAccessWorkspace ? (
                <>
                  {!isAuthenticated && passwordGateMode && (
                    <InlineNotification
                      kind="info"
                      title="Geçici erişim modu"
                      subtitle="Parola ile giriş yaptınız. Bu mod geçicidir; kullanıcı hesabı/Google login daha sonra yeniden açılacaktır."
                      lowContrast
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  {!isAuthenticated && !passwordGateMode && (
                    <InlineNotification
                      kind="info"
                      title="Misafir modundasınız"
                      subtitle="Tüm arayüzü görebilirsiniz. Kaydetme ve hesap özellikleri için giriş yapın."
                      lowContrast
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  {renderContent()}
                </>
              ) : (
                <div className="login-prompt">
                  <Tile className="login-prompt__card">
                    <User size={64} className="login-prompt__icon" />
                    <h2>Carbonac'a Hoş Geldiniz</h2>
                    <p>Dokümanlarınızı profesyonel PDF'lere dönüştürmek için giriş yapın.</p>
                    <Button
                      kind="primary"
                      size="lg"
                      renderIcon={Login}
                      onClick={() => setShowAuth(true)}
                    >
                      Giriş Yap / Kayıt Ol
                    </Button>
                    <div className="login-prompt__features">
                      <div className="feature-item">
                        <Checkmark size={20} />
                        <span>PDF, Word, Google Docs desteği</span>
                      </div>
                      <div className="feature-item">
                        <Checkmark size={20} />
                        <span>AI destekli tasarım önerileri</span>
                      </div>
                      <div className="feature-item">
                        <Checkmark size={20} />
                        <span>Carbon Design System entegrasyonu</span>
                      </div>
                      <div className="feature-item">
                        <Checkmark size={20} />
                        <span>10 sayfa ücretsiz her ay</span>
                      </div>
                    </div>
                  </Tile>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <AppFooter />

        {/* Notifications */}
        {notification && (
          <div className="app-notification">
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.subtitle}
              onCloseButtonClick={() => setNotification(null)}
            />
          </div>
        )}

        {/* Modals */}
        <Suspense fallback={null}>
          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              selectedLayoutProfile={selectedLayoutProfile}
              onLayoutProfileChange={setLayoutProfile}
              selectedPrintProfile={selectedPrintProfile}
              onPrintProfileChange={setPrintProfile}
              showAdvisor={aiChatEnabled}
              onToggleAdvisor={handleToggleAiChatEnabled}
              autoSave={autoSaveEnabled}
              onAutoSaveChange={setAutoSaveEnabled}
              livePreview={livePreviewEnabled}
              onLivePreviewChange={setLivePreviewEnabled}
            />
          )}
          {!passwordGateMode && showAuth && (
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
            />
          )}
          {showPricing && (
            <PricingModal
              isOpen={showPricing}
              onClose={() => setShowPricing(false)}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {aiChatEnabled && aiChatMounted && canAccessWorkspace && (
            <CarbonacAiChat
              enabled={aiChatEnabled}
              isAuthenticated={isAuthenticated}
              onRequestLogin={() => setShowAuth(true)}
              onInstanceReady={handleAiChatInstanceReady}
            />
          )}
        </Suspense>
      </div>
    </Theme>
  );
}

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = useCallback(() => {
    const ok = (password || '').trim().toUpperCase() === 'CARBON';
    if (!ok) {
      setError('Parola hatalı.');
      return;
    }
    try {
      window.localStorage.setItem('carbonac_gate_unlocked', '1');
    } catch (e) {
      // ignore
    }
    onUnlock();
  }, [password, onUnlock]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Tile style={{ width: 'min(520px, 100%)' }}>
        <h2 style={{ marginTop: 0 }}>Giriş</h2>
        <p>Geçici erişim için parolayı girin.</p>

        {error && (
          <InlineNotification
            kind="error"
            title="Giriş başarısız"
            subtitle={error}
            lowContrast
            style={{ marginBottom: '1rem' }}
            onCloseButtonClick={() => setError(null)}
          />
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <TextInput
            id="password-gate"
            type="password"
            labelText="Parola"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            style={{ flex: 1 }}
          />
          <Button kind="primary" onClick={submit}>
            Devam Et
          </Button>
        </div>
      </Tile>
    </div>
  );
}

// Root App with Providers
function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAuthRoute = pathname.startsWith('/auth/');

  const [unlocked, setUnlocked] = useState(() => {
    if (!PASSWORD_GATE_MODE) return true;
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem('carbonac_gate_unlocked') === '1';
    } catch (e) {
      return false;
    }
  });

  // Sadece auth route'larını gate dışında bırakıyoruz (reset/callback gibi akışlar bozulmasın).
  if (PASSWORD_GATE_MODE && !unlocked && !isAuthRoute) {
    return (
      <ThemeProvider>
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </ThemeProvider>
    );
  }

  if (isAuthRoute) {
    return (
      <ThemeProvider>
        <AuthProvider>
          {pathname.startsWith('/auth/reset-password') ? (
            <AuthResetPassword />
          ) : (
            <AuthCallback />
          )}
        </AuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <PricingProvider>
          <DocumentProvider>
            <AppContent />
          </DocumentProvider>
        </PricingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
