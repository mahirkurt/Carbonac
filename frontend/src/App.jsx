/**
 * Carbonac - Carbon Design System PDF Converter
 * Main Application with Document Workflow
 */

import React, { useState, useCallback, useEffect, Suspense, lazy, useRef } from 'react';
import {
  Theme,
  SideNav,
  SideNavItems,
  SideNavLink,
  Button,
  TextInput,
  Tile,
  InlineNotification,
  ToastNotification,
  Loading,
} from '@carbon/react';

import {
  Document,
  Home,
  MagicWand,
  Template,
  Checkmark,
} from '@carbon/icons-react';

import './styles/index.scss';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import CarbonacAiChat from './components/ai/CarbonacAiChat';
import { useLocalStorage } from './hooks';

import DocumentsPanel from './components/workspace/DocumentsPanel';
import JobsPanel from './components/workspace/JobsPanel';
import QualityPanel from './components/workspace/QualityPanel';
import ErrorBoundary from './components/ErrorBoundary';
import WorkflowSteps from './components/workflow/WorkflowSteps';
import EditorPanel from './components/layout/EditorPanel';
import SettingsSidebar from './components/layout/SettingsSidebar';

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
const LandingPage = lazy(() => import('./components/landing/LandingPage'));

const PASSWORD_GATE_MODE = import.meta.env.VITE_PASSWORD_GATE === 'true';
const GUEST_MODE = import.meta.env.VITE_GUEST_MODE === 'true';


// Main App Content
function AppContent() {
  const { theme } = useTheme();
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
    conversionProgress,
  } = useDocument();

  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showSideNav, setShowSideNav] = useState(true);
  const [notification, setNotification] = useState(null);
  const userPanelRef = useRef(null);
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
          <ErrorBoundary>
            <Suspense fallback={<Loading withOverlay={false} description="Template galerisi yükleniyor..." />}>
              <TemplateGallery />
            </Suspense>
          </ErrorBoundary>
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

      case WORKFLOW_STEPS.PROCESSING: {
        const stages = [
          { label: 'Yükleme', threshold: 10 },
          { label: 'Analiz', threshold: 30 },
          { label: 'Dönüşüm', threshold: 60 },
          { label: 'Tamamlandı', threshold: 100 },
        ];
        const progress = conversionProgress || 0;
        return (
          <div className="processing-screen">
            <div className="processing-screen__card">
              <div className="processing-screen__ring">
                <svg viewBox="0 0 80 80" className="processing-screen__svg">
                  <defs>
                    <linearGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--carbonac-blue-light, #1a5cff)" />
                      <stop offset="100%" stopColor="var(--carbonac-pink-light, #e8528a)" />
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="40" r="34" className="processing-screen__track" />
                  <circle cx="40" cy="40" r="34" className="processing-screen__fill" stroke="url(#processingGradient)"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  />
                </svg>
                <span className="processing-screen__percent">{progress}%</span>
              </div>
              <h3 className="processing-screen__title">Doküman İşleniyor</h3>
              <div className="processing-screen__stages">
                {stages.map((stage) => (
                  <div key={stage.label}
                    className={`processing-screen__stage${progress >= stage.threshold ? ' processing-screen__stage--done' : ''}`}
                  >
                    <span className="processing-screen__dot" />
                    <span>{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case WORKFLOW_STEPS.WIZARD:
        return (
          <ErrorBoundary>
            <Suspense fallback={<Loading withOverlay description="Yükleniyor..." />}>
              <ReportWizard onRequestLogin={() => setShowAuth(true)} />
            </Suspense>
          </ErrorBoundary>
        );

      case WORKFLOW_STEPS.EDITOR:
        return (
          <div className="editor-canvas-layout">
            <SettingsSidebar />
            <div className="editor-canvas-body">
              <div className="editor-canvas-main">
                <ErrorBoundary>
                  <EditorPanel />
                </ErrorBoundary>
              </div>
              <aside className="editor-canvas-rail" aria-label="AI düzenleme ve kalite paneli">
                <ErrorBoundary>
                  <CarbonacAiChat
                    embedded
                    embeddedClassName="carbonac-ai-chat--editor-canvas"
                    isAuthenticated={isAuthenticated}
                    onRequestLogin={() => setShowAuth(true)}
                  />
                </ErrorBoundary>
                <div className="editor-canvas-rail-quality">
                  <ErrorBoundary>
                    <QualityPanel compact />
                  </ErrorBoundary>
                </div>
              </aside>
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
        {/* Header — extracted to AppHeader component */}
        <AppHeader
          canAccessWorkspace={canAccessWorkspace}
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
          onReset={reset}
          showSideNav={showSideNav}
          onToggleSideNav={() => setShowSideNav((prev) => !prev)}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogin={() => setShowAuth(true)}
          onLogout={logout}
          showUserPanel={showUserPanel}
          onToggleUserPanel={() => setShowUserPanel(!showUserPanel)}
          onCloseUserPanel={() => setShowUserPanel(false)}
          userPanelRef={userPanelRef}
          onOpenSettings={() => setShowSettings(true)}
          credits={credits}
          subscription={subscription}
          onOpenPricing={() => setShowPricing(true)}
          passwordGateMode={passwordGateMode}
        />

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
            <div key={activeWorkspace} className="app-workspace workspace-transition">
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
                  <ErrorBoundary>
                    {renderContent()}
                  </ErrorBoundary>
                </>
              ) : (
                <Suspense fallback={null}>
                  <LandingPage onLogin={() => setShowAuth(true)} />
                </Suspense>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <AppFooter withGradient={!canAccessWorkspace} />

        {/* Toast Notifications */}
        {notification && (
          <div className="app-notification">
            <ToastNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.subtitle}
              timeout={5000}
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
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </DocumentProvider>
        </PricingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
