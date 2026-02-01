/**
 * Carbonac - Carbon Design System PDF Converter
 * Main Application with Document Workflow
 */

import React, { useState, useCallback, Suspense, lazy, useMemo, useRef } from 'react';
import {
  Theme,
  Header,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
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
  Home,
  Edit,
  View,
  MagicWand,
} from '@carbon/icons-react';

import './styles/index.scss';
import { useThrottle } from './hooks';
import { focusEditorLocation } from './utils/editorFocus';
import directiveTemplates from './utils/directiveTemplates';

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

// Layout profile options
const layoutProfileOptions = [
  { id: 'symmetric', text: 'Symmetric (Dengeli)' },
  { id: 'asymmetric', text: 'Asymmetric (Vurgu)' },
  { id: 'dashboard', text: 'Dashboard (Yoğun)' },
];

// Print profile options
const printProfileOptions = [
  { id: 'pagedjs-a4', text: 'Paged.js A4' },
  { id: 'pagedjs-a3', text: 'Paged.js A3' },
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
    description: 'Markdown\'a dönüştürülüyor' 
  },
  [WORKFLOW_STEPS.WIZARD]: { 
    label: 'Stil Sihirbazı', 
    icon: ColorPalette, 
    description: 'Rapor tasarımını belirleyin' 
  },
  [WORKFLOW_STEPS.EDITOR]: { 
    label: 'Düzenle', 
    icon: Edit, 
    description: 'Markdown içeriği düzenleyin' 
  },
  [WORKFLOW_STEPS.PREVIEW]: { 
    label: 'Önizleme', 
    icon: View, 
    description: 'PDF önizleme ve indirme' 
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
    { id: 'all', label: 'Tum Seviyeler' },
    { id: 'warning', label: 'Uyari' },
    { id: 'info', label: 'Bilgi' },
  ]), []);

  const ruleOptions = useMemo(() => {
    const base = [{ id: 'all', label: 'Tum Kurallar' }];
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
            <h4>Lint Uyarilari</h4>
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
                title={`Satir ${issue.line}, Kolon ${issue.column}`}
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

// Preview Panel Component
function PreviewPanel() {
  const {
    markdownContent,
    isConverting,
    generatePdf,
    outputPath,
    downloadError,
    setDownloadError,
    livePreviewEnabled,
    selectedTheme,
  } = useDocument();
  const throttledMarkdown = useThrottle(markdownContent, 200);
  const effectiveMarkdown = livePreviewEnabled ? throttledMarkdown : '';

  const previewHtml = useMemo(() => {
    if (!effectiveMarkdown) {
      return '';
    }
    return effectiveMarkdown
      .replace(/^---[\s\S]*?---/m, '')
      .replace(/^# (.+)$/gm, '<h1 style="font-size: 2.5rem; font-weight: 300; margin-bottom: 1rem;">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 1rem;">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: var(--cds-layer-01); padding: 0.125rem 0.25rem; font-family: IBM Plex Mono;">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid var(--cds-interactive); padding-left: 1rem; color: var(--cds-text-secondary); margin: 1rem 0;">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem;">$1</li>')
      .replace(/\n/g, '<br/>');
  }, [effectiveMarkdown]);

  const handleDownload = useCallback(() => {
    if (outputPath) {
      const link = document.createElement('a');
      link.href = outputPath;
      link.download = 'document.pdf';
      link.click();
    }
  }, [outputPath]);

  return (
    <div className="preview-panel panel">
      <div className="panel__header">
        <h3>
          <DocumentPdf size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          PDF Önizleme
        </h3>
        <p>Çıktı önizlemesi</p>
      </div>
      <div className="pdf-preview">
        <div className="pdf-preview__container">
          <div
            className={`pdf-preview__document${outputPath ? ' pdf-preview__document--pdf' : ''}`}
            data-carbon-theme={selectedTheme}
          >
            {isConverting ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px'
              }}>
                <Loading withOverlay={false} description="PDF oluşturuluyor..." />
              </div>
            ) : outputPath ? (
              <iframe
                className="pdf-preview__iframe"
                title="PDF Önizleme"
                src={outputPath}
              />
            ) : !markdownContent ? (
              <div className="pdf-preview__empty">
                <h4>Preview hazir degil</h4>
                <p>Markdown ekleyerek veya dokuman yukleyerek preview olusturabilirsiniz.</p>
              </div>
            ) : !livePreviewEnabled ? (
              <div className="pdf-preview__empty">
                <h4>Canli onizleme kapali</h4>
                <p>Ayarlar menusu uzerinden canli onizlemeyi acabilirsiniz.</p>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'IBM Plex Sans' }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="preview-panel__actions">
        {downloadError && (
          <InlineNotification
            kind="error"
            title="PDF indirilemedi"
            subtitle={downloadError}
            onCloseButtonClick={() => setDownloadError(null)}
          />
        )}
        <Button
          kind="primary"
          renderIcon={Play}
          onClick={generatePdf}
          disabled={isConverting || !markdownContent}
        >
          {isConverting ? 'Oluşturuluyor...' : 'PDF Oluştur'}
        </Button>
        <Button
          kind="secondary"
          renderIcon={Download}
          onClick={handleDownload}
          disabled={!outputPath}
        >
          PDF İndir
        </Button>
      </div>
    </div>
  );
}

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
  const [notification, setNotification] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState('workflow');
  const passwordGateMode = true;
  const isGuestMode = true;
  const canAccessWorkspace = isAuthenticated || isGuestMode;

  const handleWorkspaceChange = useCallback((nextWorkspace) => {
    setActiveWorkspace(nextWorkspace);
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
              <Suspense fallback={<Loading withOverlay={false} description="Template galerisi yukleniyor..." />}>
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
                handleWorkspaceChange('workflow');
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
                tooltipAlignment="end"
              >
                {isAuthenticated ? <User size={20} /> : <Login size={20} />}
              </HeaderGlobalAction>
            )}
          </HeaderGlobalBar>

          {/* User Panel */}
          <HeaderPanel
            aria-label="User panel"
            expanded={showUserPanel}
            onHeaderPanelFocus={() => {}}
          >
            {isAuthenticated && user && (
              <div className="app-header__user-panel">
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
                  <SwitcherItem aria-label="Hesabım" href="#">
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
            {canAccessWorkspace && (
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
        <footer className="app-footer">
          <div className="app-footer__content">
            <div className="app-footer__brand">
              <span>© 2026 Cureonics LLC. Wyoming, USA</span>
            </div>
            <div className="app-footer__links">
              <a href="#">Gizlilik Politikası</a>
              <a href="#">Kullanım Şartları</a>
              <a href="#">İletişim</a>
            </div>
          </div>
        </footer>

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
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem('carbonac_gate_unlocked') === '1';
    } catch (e) {
      return false;
    }
  });

  // Sadece auth route'larını gate dışında bırakıyoruz (reset/callback gibi akışlar bozulmasın).
  if (!unlocked && !isAuthRoute) {
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
