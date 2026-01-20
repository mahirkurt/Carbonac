/**
 * DocumentContext - Document state management
 * Handles document upload, conversion, and workflow state
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE_URL.replace(/\/$/, '');

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!API_URL) {
    return path;
  }
  return path.startsWith('/') ? `${API_URL}${path}` : `${API_URL}/${path}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJobStatus(jobId, options = {}) {
  const maxAttempts = options.maxAttempts || 60;
  let intervalMs = options.intervalMs || 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(buildApiUrl(`/api/jobs/${jobId}`));
    if (!response.ok) {
      throw new Error('Job status request failed.');
    }

    const payload = await response.json();
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
  conversionProgress: 0,
  conversionError: null,
  
  // Content
  markdownContent: '',
  originalContent: '', // Keep original for reference
  
  // Report settings (from wizard)
  reportSettings: {
    documentType: '', // report, presentation, article, etc.
    tone: '',         // formal, casual, technical
    audience: '',     // executive, technical, general
    purpose: '',      // inform, persuade, document
    colorScheme: '',  // professional, vibrant, minimal
    layoutStyle: '',  // compact, spacious, balanced
    emphasis: [],     // data, narrative, visuals
    components: [],   // charts, tables, callouts, etc.
  },
  
  // AI Wizard
  wizardMessages: [],
  wizardCurrentQuestion: 0,
  wizardAnswers: {},
  
  // Output
  selectedLayoutProfile: 'symmetric',
  selectedPrintProfile: 'pagedjs-a4',
  generatedPdf: null,
  outputPath: null,
};

// Action types
const ActionTypes = {
  SET_STEP: 'SET_STEP',
  SET_FILE: 'SET_FILE',
  START_CONVERSION: 'START_CONVERSION',
  UPDATE_CONVERSION_PROGRESS: 'UPDATE_CONVERSION_PROGRESS',
  CONVERSION_SUCCESS: 'CONVERSION_SUCCESS',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  SET_MARKDOWN: 'SET_MARKDOWN',
  UPDATE_REPORT_SETTINGS: 'UPDATE_REPORT_SETTINGS',
  ADD_WIZARD_MESSAGE: 'ADD_WIZARD_MESSAGE',
  SET_WIZARD_ANSWER: 'SET_WIZARD_ANSWER',
  NEXT_WIZARD_QUESTION: 'NEXT_WIZARD_QUESTION',
  SET_LAYOUT_PROFILE: 'SET_LAYOUT_PROFILE',
  SET_PRINT_PROFILE: 'SET_PRINT_PROFILE',
  SET_OUTPUT: 'SET_OUTPUT',
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

    case ActionTypes.SET_OUTPUT:
      return {
        ...state,
        generatedPdf: action.payload.pdf,
        outputPath: action.payload.path,
      };

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

      const response = await fetch(buildApiUrl('/api/convert/to-markdown'), {
        method: 'POST',
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
    dispatch({ type: ActionTypes.UPDATE_REPORT_SETTINGS, payload: settings });
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

  const setOutput = useCallback((pdf, path) => {
    dispatch({ type: ActionTypes.SET_OUTPUT, payload: { pdf, path } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ActionTypes.RESET });
  }, []);

  // Generate PDF based on settings
  const generatePdf = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/convert/to-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: state.markdownContent,
          settings: {
            ...state.reportSettings,
            layoutProfile: state.selectedLayoutProfile,
            printProfile: state.selectedPrintProfile,
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

      const jobStatus = await pollJobStatus(jobId);
      const downloadPath =
        jobStatus.result?.signedUrl ||
        jobStatus.result?.downloadUrl ||
        `/api/jobs/${jobId}/download`;

      const downloadResponse = await fetch(buildApiUrl(downloadPath));
      if (!downloadResponse.ok) {
        throw new Error('PDF download failed');
      }

      const blob = await downloadResponse.blob();
      const url = URL.createObjectURL(blob);

      setOutput(blob, url);
      return url;
    } catch (error) {
      throw error;
    }
  }, [state.markdownContent, state.selectedLayoutProfile, state.selectedPrintProfile, state.reportSettings, setOutput]);

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
    setOutput,
    generatePdf,
    reset,
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
