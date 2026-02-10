/**
 * DocumentContext - Document state management
 * Handles document upload, conversion, and workflow state
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useDebounce, useLocalStorage } from '../hooks';
import { lintMarkdown, buildLintCacheKey } from '../utils/markdownLint';
import { buildApiUrl } from '../utils/apiBase';
import { supabase } from '../lib/supabase';

const AUTOSAVE_STORAGE_KEY = 'carbonac_autosave_v1';
const REVIEWER_EMAILS = (import.meta.env.VITE_TEMPLATE_REVIEWER_EMAILS || '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJobStatus(jobId, options = {}) {
  const maxAttempts = options.maxAttempts || 60;
  let intervalMs = options.intervalMs || 1000;
  const token = options.token || '';
  const onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(buildApiUrl(`/api/jobs/${jobId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error('Job status request failed.');
    }

    const payload = await response.json();
    if (onUpdate) {
      onUpdate(payload);
    }
    if (payload.status === 'completed') {
      return payload;
    }
    if (payload.status === 'failed' || payload.status === 'cancelled') {
      throw new Error(payload.error?.message || 'Job failed.');
    }

    await sleep(intervalMs);
    intervalMs = Math.min(Math.floor(intervalMs * 1.5), 5000);
  }

  throw new Error('Job polling timed out.');
}

// Document workflow steps
export const WORKFLOW_STEPS = {
  UPLOAD: 'upload',           // Step 1: Upload document
  PROCESSING: 'processing',   // Step 2: Converting to Markdown
  WIZARD: 'wizard',           // Step 3: AI-guided style wizard
  EDITOR: 'editor',           // Step 4: Review/Edit markdown
  PREVIEW: 'preview',         // Step 5: Preview and export
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { extension: '.pdf', name: 'PDF', icon: 'DocumentPdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    extension: '.docx', name: 'Word Document', icon: 'Document' 
  },
  'application/msword': { extension: '.doc', name: 'Word Document (Legacy)', icon: 'Document' },
  'application/vnd.google-apps.document': { extension: '', name: 'Google Docs', icon: 'Document' },
  'text/plain': { extension: '.txt', name: 'Text File', icon: 'Document' },
  'text/markdown': { extension: '.md', name: 'Markdown', icon: 'Code' },
  'application/rtf': { extension: '.rtf', name: 'Rich Text Format', icon: 'Document' },
  'application/vnd.oasis.opendocument.text': { extension: '.odt', name: 'OpenDocument', icon: 'Document' },
};

// Initial state
const initialState = {
  // Workflow
  currentStep: WORKFLOW_STEPS.UPLOAD,
  completedSteps: [],
  
  // Document
  originalFile: null,
  fileName: '',
  fileType: '',
  fileSize: 0,
  
  // Conversion
  isConverting: false,
  isGeneratingPdf: false,
  conversionProgress: 0,
  conversionError: null,
  pdfJobProgress: 0,
  pdfJobStage: null,
  pdfJobTelemetry: null,
  
  // Content
  markdownContent: '',
  originalContent: '', // Keep original for reference
  
  // Report settings (from wizard)
  reportSettings: {
    documentType: '', // report, presentation, article, etc.
    docType: '', // content schema alias
    tone: '',         // formal, casual, technical
    audience: '',     // executive, technical, general
    purpose: '',      // inform, persuade, document
    colorScheme: '',  // professional, vibrant, minimal
    layoutStyle: '',  // compact, spacious, balanced
    emphasis: [],     // data, narrative, visuals
    components: [],   // charts, tables, callouts, etc.
    locale: 'tr-TR',
    version: 1,
  },
  
  // AI Wizard
  wizardMessages: [],
  wizardCurrentQuestion: 0,
  wizardAnswers: {},
  
  // Output
  selectedLayoutProfile: 'symmetric',
  selectedPrintProfile: 'pagedjs-a4',
  selectedTheme: 'white',
  selectedTemplate: 'carbon-default',
  templates: [],
  templatesLoading: false,
  templatesError: null,
  generatedPdf: null,
  outputPath: null,
  downloadError: null,
  lintIssues: [],
  lastJob: null,
};

// Action types
const ActionTypes = {
  SET_STEP: 'SET_STEP',
  SET_FILE: 'SET_FILE',
  START_CONVERSION: 'START_CONVERSION',
  UPDATE_CONVERSION_PROGRESS: 'UPDATE_CONVERSION_PROGRESS',
  CONVERSION_SUCCESS: 'CONVERSION_SUCCESS',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  SET_PDF_GENERATION_STATUS: 'SET_PDF_GENERATION_STATUS',
  SET_PDF_JOB_STATUS: 'SET_PDF_JOB_STATUS',
  SET_MARKDOWN: 'SET_MARKDOWN',
  UPDATE_REPORT_SETTINGS: 'UPDATE_REPORT_SETTINGS',
  ADD_WIZARD_MESSAGE: 'ADD_WIZARD_MESSAGE',
  SET_WIZARD_ANSWER: 'SET_WIZARD_ANSWER',
  NEXT_WIZARD_QUESTION: 'NEXT_WIZARD_QUESTION',
  SET_LAYOUT_PROFILE: 'SET_LAYOUT_PROFILE',
  SET_PRINT_PROFILE: 'SET_PRINT_PROFILE',
  SET_THEME: 'SET_THEME',
  SET_TEMPLATES_STATUS: 'SET_TEMPLATES_STATUS',
  SET_TEMPLATES: 'SET_TEMPLATES',
  SET_TEMPLATE_SELECTION: 'SET_TEMPLATE_SELECTION',
  SET_OUTPUT: 'SET_OUTPUT',
  SET_DOWNLOAD_ERROR: 'SET_DOWNLOAD_ERROR',
  SET_LINT_ISSUES: 'SET_LINT_ISSUES',
  SET_LAST_JOB: 'SET_LAST_JOB',
  RESTORE_DRAFT: 'RESTORE_DRAFT',
  RESET: 'RESET',
};

// Reducer
function documentReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_STEP:
      return {
        ...state,
        currentStep: action.payload,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, state.currentStep],
      };

    case ActionTypes.SET_FILE:
      return {
        ...state,
        originalFile: action.payload.file,
        fileName: action.payload.name,
        fileType: action.payload.type,
        fileSize: action.payload.size,
      };

    case ActionTypes.START_CONVERSION:
      return {
        ...state,
        isConverting: true,
        conversionProgress: 0,
        conversionError: null,
      };

    case ActionTypes.UPDATE_CONVERSION_PROGRESS:
      return {
        ...state,
        conversionProgress: action.payload,
      };

    case ActionTypes.CONVERSION_SUCCESS:
      return {
        ...state,
        isConverting: false,
        conversionProgress: 100,
        markdownContent: action.payload.markdown,
        originalContent: action.payload.markdown,
        currentStep: WORKFLOW_STEPS.WIZARD,
      };

    case ActionTypes.CONVERSION_ERROR:
      return {
        ...state,
        isConverting: false,
        conversionError: action.payload,
      };

    case ActionTypes.SET_PDF_GENERATION_STATUS:
      return {
        ...state,
        isGeneratingPdf: Boolean(action.payload),
      };

    case ActionTypes.SET_PDF_JOB_STATUS:
      return {
        ...state,
        pdfJobProgress: action.payload?.progress ?? state.pdfJobProgress,
        pdfJobStage: action.payload?.stage ?? state.pdfJobStage,
        pdfJobTelemetry: action.payload?.telemetry ?? state.pdfJobTelemetry,
      };

    case ActionTypes.SET_MARKDOWN:
      return {
        ...state,
        markdownContent: action.payload,
      };

    case ActionTypes.UPDATE_REPORT_SETTINGS:
      return {
        ...state,
        reportSettings: {
          ...state.reportSettings,
          ...action.payload,
        },
      };

    case ActionTypes.ADD_WIZARD_MESSAGE:
      return {
        ...state,
        wizardMessages: [...state.wizardMessages, action.payload],
      };

    case ActionTypes.SET_WIZARD_ANSWER:
      return {
        ...state,
        wizardAnswers: {
          ...state.wizardAnswers,
          [action.payload.questionId]: action.payload.answer,
        },
      };

    case ActionTypes.NEXT_WIZARD_QUESTION:
      return {
        ...state,
        wizardCurrentQuestion: state.wizardCurrentQuestion + 1,
      };

    case ActionTypes.SET_LAYOUT_PROFILE:
      return {
        ...state,
        selectedLayoutProfile: action.payload,
      };

    case ActionTypes.SET_PRINT_PROFILE:
      return {
        ...state,
        selectedPrintProfile: action.payload,
      };

    case ActionTypes.SET_THEME:
      return {
        ...state,
        selectedTheme: action.payload,
      };

    case ActionTypes.SET_TEMPLATES_STATUS:
      return {
        ...state,
        templatesLoading: action.payload.loading,
        templatesError: action.payload.error,
      };

    case ActionTypes.SET_TEMPLATES:
      return {
        ...state,
        templates: action.payload || [],
      };

    case ActionTypes.SET_TEMPLATE_SELECTION:
      return {
        ...state,
        selectedTemplate: action.payload,
      };

    case ActionTypes.SET_OUTPUT:
      return {
        ...state,
        generatedPdf: action.payload.pdf,
        outputPath: action.payload.path,
        downloadError: null,
      };

    case ActionTypes.SET_DOWNLOAD_ERROR:
      return {
        ...state,
        downloadError: action.payload,
      };

    case ActionTypes.SET_LINT_ISSUES:
      return {
        ...state,
        lintIssues: action.payload,
      };

    case ActionTypes.SET_LAST_JOB:
      return {
        ...state,
        lastJob: action.payload,
      };

    case ActionTypes.RESTORE_DRAFT: {
      const payload = action.payload || {};
      const restoredMarkdown = payload.markdownContent ?? '';
      const restoredSettings = payload.reportSettings ?? {};
      const nextStep = restoredMarkdown ? WORKFLOW_STEPS.EDITOR : state.currentStep;
      const completedSteps = restoredMarkdown
        ? Array.from(new Set([
          ...state.completedSteps,
          WORKFLOW_STEPS.UPLOAD,
          WORKFLOW_STEPS.PROCESSING,
          WORKFLOW_STEPS.WIZARD,
        ]))
        : state.completedSteps;

      return {
        ...state,
        markdownContent: restoredMarkdown || state.markdownContent,
        originalContent: restoredMarkdown || state.originalContent,
        reportSettings: {
          ...state.reportSettings,
          ...restoredSettings,
        },
        selectedLayoutProfile: payload.selectedLayoutProfile || state.selectedLayoutProfile,
        selectedPrintProfile: payload.selectedPrintProfile || state.selectedPrintProfile,
        selectedTheme: payload.selectedTheme || state.selectedTheme,
        selectedTemplate: payload.selectedTemplate || state.selectedTemplate,
        currentStep: nextStep,
        completedSteps,
      };
    }

    case ActionTypes.RESET:
      return initialState;

    default:
      return state;
  }
}

// Context
const DocumentContext = createContext(null);

// Provider component
export function DocumentProvider({ children }) {
  const [state, dispatch] = useReducer(documentReducer, initialState);
  const lintCacheRef = useRef(new Map());
  const selectedTemplateRef = useRef(state.selectedTemplate);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useLocalStorage('carbonac_autosave_enabled', true);
  const [livePreviewEnabled, setLivePreviewEnabled] = useLocalStorage('carbonac_live_preview_enabled', true);
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState(null);
  const hasRestoredRef = useRef(false);
  const debouncedMarkdown = useDebounce(state.markdownContent, 400);

  useEffect(() => {
    selectedTemplateRef.current = state.selectedTemplate;
  }, [state.selectedTemplate]);

  useEffect(() => {
    let active = true;

    const updateUserEmail = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const email = data?.session?.user?.email || null;
        if (active) {
          setCurrentUserEmail(email ? email.toLowerCase() : null);
        }
      } catch (error) {
        if (active) {
          setCurrentUserEmail(null);
        }
      }
    };

    updateUserEmail();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const email = session?.user?.email || null;
      setCurrentUserEmail(email ? email.toLowerCase() : null);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const content = debouncedMarkdown || '';
    if (!content.trim()) {
      dispatch({ type: ActionTypes.SET_LINT_ISSUES, payload: [] });
      return;
    }

    const cacheKey = buildLintCacheKey(content);
    const cached = lintCacheRef.current.get(cacheKey);
    if (cached) {
      dispatch({ type: ActionTypes.SET_LINT_ISSUES, payload: cached });
      return;
    }

    const issues = lintMarkdown(content);
    lintCacheRef.current.set(cacheKey, issues);
    if (lintCacheRef.current.size > 50) {
      lintCacheRef.current.clear();
    }
    dispatch({ type: ActionTypes.SET_LINT_ISSUES, payload: issues });
  }, [debouncedMarkdown]);

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    if (!autoSaveEnabled || typeof window === 'undefined') {
      return;
    }
    const raw = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) {
      hasRestoredRef.current = true;
      return;
    }
    try {
      const payload = JSON.parse(raw);
      if (payload && typeof payload === 'object') {
        dispatch({ type: ActionTypes.RESTORE_DRAFT, payload });
        setLastAutoSaveAt(payload.savedAt || null);
      }
    } catch (error) {
      console.warn('Failed to restore autosave draft.', error);
    }
    hasRestoredRef.current = true;
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled || typeof window === 'undefined') {
      return;
    }
    const payload = {
      markdownContent: debouncedMarkdown || '',
      reportSettings: state.reportSettings,
      selectedLayoutProfile: state.selectedLayoutProfile,
      selectedPrintProfile: state.selectedPrintProfile,
      selectedTheme: state.selectedTheme,
      selectedTemplate: state.selectedTemplate,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
      setLastAutoSaveAt(payload.savedAt);
    } catch (error) {
      console.warn('Failed to persist autosave draft.', error);
    }
  }, [
    autoSaveEnabled,
    debouncedMarkdown,
    state.reportSettings,
    state.selectedLayoutProfile,
    state.selectedPrintProfile,
    state.selectedTheme,
    state.selectedTemplate,
  ]);

  // Actions
  const setStep = useCallback((step) => {
    dispatch({ type: ActionTypes.SET_STEP, payload: step });
  }, []);

  const setFile = useCallback((file) => {
    dispatch({
      type: ActionTypes.SET_FILE,
      payload: {
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  }, []);

  const convertDocument = useCallback(async (file) => {
    dispatch({ type: ActionTypes.START_CONVERSION });

    try {
      // Check if it's already markdown
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        const text = await file.text();
        dispatch({
          type: ActionTypes.CONVERSION_SUCCESS,
          payload: { markdown: text },
        });
        return;
      }

      // Check if it's plain text
      if (file.type === 'text/plain') {
        const text = await file.text();
        dispatch({
          type: ActionTypes.CONVERSION_SUCCESS,
          payload: { markdown: text },
        });
        return;
      }

      // For other formats, call the backend API (Marker)
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        dispatch({
          type: ActionTypes.UPDATE_CONVERSION_PROGRESS,
          payload: Math.min(state.conversionProgress + 10, 90),
        });
      }, 500);

      const authToken =
        (typeof window !== 'undefined' && window.localStorage.getItem('carbonac_token')) || '';
      const response = await fetch(buildApiUrl('/api/convert/to-markdown'), {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const data = await response.json();
      dispatch({
        type: ActionTypes.CONVERSION_SUCCESS,
        payload: { markdown: data.markdown },
      });
    } catch (error) {
      dispatch({
        type: ActionTypes.CONVERSION_ERROR,
        payload: error.message,
      });
    }
  }, [state.conversionProgress]);

  const setMarkdown = useCallback((content) => {
    dispatch({ type: ActionTypes.SET_MARKDOWN, payload: content });
  }, []);

  const updateReportSettings = useCallback((settings) => {
    const normalized = { ...settings };
    if (settings?.documentType && !settings?.docType) {
      normalized.docType = settings.documentType;
    }
    dispatch({ type: ActionTypes.UPDATE_REPORT_SETTINGS, payload: normalized });
  }, []);

  const addWizardMessage = useCallback((message) => {
    dispatch({ type: ActionTypes.ADD_WIZARD_MESSAGE, payload: message });
  }, []);

  const setWizardAnswer = useCallback((questionId, answer) => {
    dispatch({
      type: ActionTypes.SET_WIZARD_ANSWER,
      payload: { questionId, answer },
    });
  }, []);

  const nextWizardQuestion = useCallback(() => {
    dispatch({ type: ActionTypes.NEXT_WIZARD_QUESTION });
  }, []);

  const setLayoutProfile = useCallback((profile) => {
    dispatch({ type: ActionTypes.SET_LAYOUT_PROFILE, payload: profile });
  }, []);

  const setPrintProfile = useCallback((profile) => {
    dispatch({ type: ActionTypes.SET_PRINT_PROFILE, payload: profile });
  }, []);

  const setTheme = useCallback((theme) => {
    dispatch({ type: ActionTypes.SET_THEME, payload: theme });
  }, []);

  const loadTemplates = useCallback(async () => {
    dispatch({
      type: ActionTypes.SET_TEMPLATES_STATUS,
      payload: { loading: true, error: null },
    });

    try {
      const primaryUrl = buildApiUrl('/api/templates');
      let response;
      try {
        response = await fetch(primaryUrl);
      } catch (networkError) {
        // If VITE_API_URL is misconfigured (or backend is only reachable via Vite proxy),
        // try a relative fetch as a fallback.
        if (primaryUrl !== '/api/templates') {
          response = await fetch('/api/templates');
        } else {
          throw networkError;
        }
      }
      if (!response.ok) {
        throw new Error('Template listesi yüklenemedi.');
      }
      const rawPayload = await response.text();
      let payload;
      try {
        payload = rawPayload ? JSON.parse(rawPayload) : {};
      } catch (parseError) {
        const sample = rawPayload.trim().slice(0, 120);
        const contentType = response.headers.get('content-type') || '';
        const hint =
          sample.startsWith('<!DOCTYPE') || sample.startsWith('<html') || contentType.includes('text/html')
            ? 'API JSON yerine HTML döndürdü. VITE_API_URL ayarlı mı, ya da /api proxy çalışıyor mu?'
            : 'API JSON parse edilemedi.';
        throw new Error(`${hint} (url: ${response.url || primaryUrl})`);
      }
      const templates = Array.isArray(payload.templates) ? payload.templates : [];
      dispatch({ type: ActionTypes.SET_TEMPLATES, payload: templates });

      if (templates.length) {
        const currentKey = selectedTemplateRef.current;
        const selected = templates.find((item) => item.key === currentKey) || templates[0];
        if (selected.key !== currentKey) {
          dispatch({
            type: ActionTypes.SET_TEMPLATE_SELECTION,
            payload: selected.key,
          });
        }
        if (selected.activeVersion?.layoutProfile) {
          dispatch({
            type: ActionTypes.SET_LAYOUT_PROFILE,
            payload: selected.activeVersion.layoutProfile,
          });
        }
        if (selected.activeVersion?.printProfile) {
          dispatch({
            type: ActionTypes.SET_PRINT_PROFILE,
            payload: selected.activeVersion.printProfile,
          });
        }
        if (selected.activeVersion?.theme) {
          dispatch({
            type: ActionTypes.SET_THEME,
            payload: selected.activeVersion.theme,
          });
        }
      }

      dispatch({
        type: ActionTypes.SET_TEMPLATES_STATUS,
        payload: { loading: false, error: null },
      });
    } catch (error) {
      const message =
        error?.message === 'Failed to fetch'
          ? `Sunucuya bağlanılamadı. Backend çalışıyor mu? (API: ${buildApiUrl('/api/templates')})`
          : error.message;
      dispatch({
        type: ActionTypes.SET_TEMPLATES_STATUS,
        payload: { loading: false, error: message },
      });
    }
  }, []);

  const selectTemplate = useCallback((template) => {
    if (!template) return;
    dispatch({
      type: ActionTypes.SET_TEMPLATE_SELECTION,
      payload: template.key,
    });
    if (template.activeVersion?.layoutProfile) {
      dispatch({
        type: ActionTypes.SET_LAYOUT_PROFILE,
        payload: template.activeVersion.layoutProfile,
      });
    }
    if (template.activeVersion?.printProfile) {
      dispatch({
        type: ActionTypes.SET_PRINT_PROFILE,
        payload: template.activeVersion.printProfile,
      });
    }
    if (template.activeVersion?.theme) {
      dispatch({
        type: ActionTypes.SET_THEME,
        payload: template.activeVersion.theme,
      });
    }
  }, []);

  const updateTemplateVersionStatus = useCallback(async (versionId, status) => {
    if (!versionId) {
      throw new Error('Template version bulunamadı.');
    }
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const response = await fetch(buildApiUrl(`/api/template-versions/${versionId}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || 'Template güncellemesi başarısız.';
      throw new Error(message);
    }
    await loadTemplates();
    return payload;
  }, [loadTemplates]);

  const setOutput = useCallback((pdf, path) => {
    dispatch({ type: ActionTypes.SET_OUTPUT, payload: { pdf, path } });
  }, []);

  const setDownloadError = useCallback((message) => {
    dispatch({ type: ActionTypes.SET_DOWNLOAD_ERROR, payload: message });
  }, []);

  const setLastJob = useCallback((job) => {
    dispatch({ type: ActionTypes.SET_LAST_JOB, payload: job });
  }, []);

  const setPdfJobStatus = useCallback((status) => {
    dispatch({ type: ActionTypes.SET_PDF_JOB_STATUS, payload: status });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ActionTypes.RESET });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    }
  }, []);

  // Generate PDF based on settings
  const generatePdf = useCallback(async () => {
    setDownloadError(null);
    setPdfJobStatus({ progress: 0, stage: 'queued', telemetry: null });
    dispatch({ type: ActionTypes.SET_PDF_GENERATION_STATUS, payload: true });
    try {
      const resolvedDocType = state.reportSettings.docType || state.reportSettings.documentType;
      const resolvedLocale = state.reportSettings.locale || 'tr-TR';
      const resolvedVersion = state.reportSettings.version || 1;
      const resolvedTemplateKey = state.reportSettings.templateKey || state.selectedTemplate;
      const authToken =
        (typeof window !== 'undefined' && window.localStorage.getItem('carbonac_token')) || '';
      const response = await fetch(buildApiUrl('/api/convert/to-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          markdown: state.markdownContent,
          settings: {
            ...state.reportSettings,
            docType: resolvedDocType,
            templateKey: resolvedTemplateKey,
            locale: resolvedLocale,
            version: resolvedVersion,
            layoutProfile: state.selectedLayoutProfile,
            printProfile: state.selectedPrintProfile,
            theme: state.selectedTheme,
            template: state.selectedTemplate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('PDF job creation failed');
      }

      const jobPayload = await response.json();
      const jobId = jobPayload.jobId;
      if (!jobId) {
        throw new Error('Job id missing in response');
      }

      const jobStatus = await pollJobStatus(jobId, {
        token: authToken,
        onUpdate: (payload) => {
          setPdfJobStatus({
            progress: payload?.telemetry?.progress ?? null,
            stage: payload?.telemetry?.stage ?? null,
            telemetry: payload?.telemetry ?? null,
          });
        },
      });
      const qaReport = jobStatus.result?.qaReport || jobStatus.result?.outputManifest?.qa?.report || null;
      setPdfJobStatus({
        progress: 100,
        stage: 'complete',
        telemetry: jobStatus.telemetry || null,
      });
      setLastJob({
        id: jobId,
        status: jobStatus.status,
        result: jobStatus.result,
        events: jobStatus.events || [],
        qaReport,
        telemetry: jobStatus.telemetry || null,
      });
      const downloadPath =
        jobStatus.result?.signedUrl ||
        jobStatus.result?.downloadUrl ||
        `/api/jobs/${jobId}/download`;
      const fallbackPath = `/api/jobs/${jobId}/download`;

      let downloadResponse = await fetch(buildApiUrl(downloadPath), {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      if (!downloadResponse.ok && downloadPath !== fallbackPath) {
        downloadResponse = await fetch(buildApiUrl(fallbackPath), {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
      }

      if (!downloadResponse.ok) {
        throw new Error('PDF indirilemedi. Lütfen tekrar deneyin.');
      }

      const blob = await downloadResponse.blob();
      const url = URL.createObjectURL(blob);

      setOutput(blob, url);
      return url;
    } catch (error) {
      setDownloadError(error.message || 'PDF indirirken bir hata oluştu.');
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_PDF_GENERATION_STATUS, payload: false });
    }
  }, [
    state.markdownContent,
    state.selectedLayoutProfile,
    state.selectedPrintProfile,
    state.selectedTheme,
    state.selectedTemplate,
    state.reportSettings,
    setOutput,
    setDownloadError,
    setLastJob,
    setPdfJobStatus,
  ]);

  const value = {
    // State
    ...state,
    
    // Computed
    isFileUploaded: !!state.originalFile,
    canProceedToWizard: state.markdownContent.length > 0,
    canGeneratePdf: state.markdownContent.length > 0 && Object.keys(state.reportSettings).length > 0,
    
    // Actions
    setStep,
    setFile,
    convertDocument,
    setMarkdown,
    updateReportSettings,
    addWizardMessage,
    setWizardAnswer,
    nextWizardQuestion,
    setLayoutProfile,
    setPrintProfile,
    setTheme,
    setOutput,
    generatePdf,
    downloadError: state.downloadError,
    setDownloadError,
    lintIssues: state.lintIssues,
    lastJob: state.lastJob,
    pdfJobProgress: state.pdfJobProgress,
    pdfJobStage: state.pdfJobStage,
    pdfJobTelemetry: state.pdfJobTelemetry,
    loadTemplates,
    selectTemplate,
    updateTemplateVersionStatus,
    reset,
    reviewerEnabled: REVIEWER_EMAILS.length > 0,
    isReviewer: REVIEWER_EMAILS.length > 0
      ? REVIEWER_EMAILS.includes(currentUserEmail || '')
      : false,
    autoSaveEnabled,
    setAutoSaveEnabled,
    livePreviewEnabled,
    setLivePreviewEnabled,
    lastAutoSaveAt,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

// Hook
export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}

export default DocumentContext;
