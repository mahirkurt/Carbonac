import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  TextArea,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import {
  Code,
  Play,
  Download,
} from '@carbon/icons-react';
import { useDocument } from '../../contexts';
import {
  AI_APPLY_COMMAND_EVENT,
  AI_COMMAND_RESULT_EVENT,
  EDITOR_PREVIEW_MODES,
  markdownToRichPreviewHtml,
} from '../../constants/editorConstants';
import AiCanvasSidebar from '../canvas/AiCanvasSidebar';

function EditorPanel() {
  const {
    markdownContent,
    setMarkdown,
    setEditorSelection,
    editorSelection,
    reportSettings,
    lintIssues,
    generatePdf,
    outputPath,
    downloadError,
    setDownloadError,
    isConverting,
    isGeneratingPdf,
    pdfJobTelemetry,
    pdfJobProgress,
  } = useDocument();
  const [editorPreviewMode, setEditorPreviewMode] = useState(EDITOR_PREVIEW_MODES[0]?.id || 'markdown');
  const [aiCommandState, setAiCommandState] = useState({ pending: false, message: '' });
  const textAreaRef = useRef(null);
  const activeAiCommandRequestRef = useRef(null);

  const richPreviewHtml = useMemo(
    () => markdownToRichPreviewHtml(markdownContent),
    [markdownContent]
  );

  const contextualSuggestions = useMemo(() => {
    const md = String(markdownContent || '');
    const suggestions = [];

    if (!md.trim()) {
      suggestions.push({
        label: 'Örnek markdown iskeleti oluştur',
        prompt: 'Carbon standartlarında örnek bir rapor markdown iskeleti oluştur. Çıktıyı markdown code block olarak ver.',
        expectMarkdown: true,
        applyTarget: 'document',
      });
      suggestions.push({
        label: 'Doküman yapısı öner',
        prompt: 'Bu doküman için kapak, içindekiler ve bölüm akışını kısa maddelerle öner.',
        expectMarkdown: false,
      });
      return suggestions;
    }

    const hasCover = /^#\s/m.test(md) && /kapak|cover|title\s*page/i.test(md.slice(0, 500));
    const hasToc = /içindekiler|table\s+of\s+contents/i.test(md);
    const isLong = md.split('\n').filter(l => /^#{1,2}\s/.test(l)).length >= 5;

    if (!hasCover) {
      suggestions.push({
        label: 'Kapak sayfası ekle',
        prompt: 'Mevcut markdown için Carbon uyumlu bir kapak sayfası ekle. Çıktıyı tam markdown olarak ver.',
        expectMarkdown: true,
        applyTarget: 'document',
      });
    }
    if (!hasToc && isLong) {
      suggestions.push({
        label: 'İçindekiler tablosu ekle',
        prompt: 'Başlıklara göre içindekiler bölümü oluştur ve markdown akışına uygun noktaya ekle. Çıktıyı markdown code block olarak ver.',
        expectMarkdown: true,
        applyTarget: 'document',
      });
    }

    suggestions.push({
      label: 'Tüm metni Carbon uyumlu revize et',
      prompt: 'Markdown içeriğini Carbon tasarım ilkelerine göre baştan sona revize et. Çıktıyı yalnızca markdown code block olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    });
    suggestions.push({
      label: 'Tablo/grafik noktalarını öner',
      prompt: 'Bu dokümanda tablo ve grafik eklenebilecek bölümleri kısa gerekçelerle listele.',
      expectMarkdown: false,
    });

    const selectedText = String(editorSelection?.text || '').trim();
    if (selectedText) {
      suggestions.unshift({
        label: 'Seçili metni revize et',
        prompt: 'Seçili metni daha açık, kısa ve profesyonel olacak şekilde revize et. Çıktıyı sadece seçili bölüm markdown olarak ver.',
        expectMarkdown: true,
        applyTarget: 'selection',
      });
    }

    return suggestions.slice(0, 6);
  }, [markdownContent, editorSelection]);

  const updateSelectionFromTarget = useCallback((target) => {
    if (!target) return;
    const start = Number(target.selectionStart) || 0;
    const end = Number(target.selectionEnd) || 0;
    const selectedText = start === end
      ? ''
      : String(target.value || '').slice(start, end);
    setEditorSelection({
      start,
      end,
      text: selectedText,
    });
  }, [setEditorSelection]);

  const handleDownload = useCallback(() => {
    if (!outputPath) return;
    const link = document.createElement('a');
    link.href = outputPath;
    link.download = 'document.pdf';
    link.click();
  }, [outputPath]);

  const dispatchAiCommand = useCallback((detail, fallback = null) => {
    if (typeof window === 'undefined') {
      if (typeof fallback === 'function') fallback();
      return;
    }
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeAiCommandRequestRef.current = requestId;
    setAiCommandState({
      pending: true,
      message: detail?.loadingMessage || 'AI komutu işleniyor...',
    });
    window.dispatchEvent(new CustomEvent(AI_APPLY_COMMAND_EVENT, {
      detail: {
        ...(detail || {}),
        requestId,
      },
    }));
  }, []);

  const applySuggestion = useCallback((prompt, options = {}) => {
    const cleanPrompt = String(prompt || '').trim();
    if (!cleanPrompt) return;
    const expectMarkdown = options?.expectMarkdown === true;
    const applyTarget = options?.applyTarget === 'selection' ? 'selection' : 'document';
    const loadingMessage = String(options?.loadingMessage || '').trim();
    dispatchAiCommand({
      kind: 'quick-action',
      prompt: cleanPrompt,
      expectMarkdown,
      applyTarget,
      loadingMessage: loadingMessage || (expectMarkdown
        ? 'AI önerisi markdown içeriğine uygulanıyor...'
        : 'Seçili öneri AI ile işleniyor...'),
    });
  }, [dispatchAiCommand]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onAiCommandResult = (event) => {
      const detail = event?.detail || {};
      const expectedRequest = activeAiCommandRequestRef.current;
      if (!expectedRequest) {
        return;
      }
      if (detail.requestId && detail.requestId !== expectedRequest) {
        return;
      }
      activeAiCommandRequestRef.current = null;
      setAiCommandState({
        pending: false,
        message: detail.message || (detail.ok ? 'AI işlemi tamamlandı.' : 'AI işlemi tamamlanamadı.'),
      });
    };

    window.addEventListener(AI_COMMAND_RESULT_EVENT, onAiCommandResult);
    return () => {
      window.removeEventListener(AI_COMMAND_RESULT_EVENT, onAiCommandResult);
    };
  }, []);

  useEffect(() => {
    if (aiCommandState.pending || !aiCommandState.message) return undefined;
    const timeout = setTimeout(() => {
      setAiCommandState((prev) => ({ ...prev, message: '' }));
    }, 5000);
    return () => clearTimeout(timeout);
  }, [aiCommandState.pending, aiCommandState.message]);

  return (
    <div className="editor-panel panel editor-panel--canvas">
      <div className="panel__header">
        <div>
          <h3>
            <Code size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            AI Canvas
          </h3>
        </div>
        <div className="editor-panel__export-actions">
          <div className="editor-panel__preview-mode-actions">
            {EDITOR_PREVIEW_MODES.map((mode) => (
              <Button
                key={mode.id}
                size="sm"
                kind={editorPreviewMode === mode.id ? 'primary' : 'ghost'}
                renderIcon={mode.icon}
                onClick={() => setEditorPreviewMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
          <Button
            kind="primary"
            size="sm"
            renderIcon={Play}
            onClick={generatePdf}
            disabled={isConverting || isGeneratingPdf || !markdownContent}
          >
            {isGeneratingPdf
              ? `PDF (%${Math.round(pdfJobTelemetry?.progress ?? pdfJobProgress ?? 0)})`
              : 'PDF Oluştur'}
          </Button>
          {outputPath ? (
            <Button
              kind="secondary"
              size="sm"
              renderIcon={Download}
              onClick={handleDownload}
            >
              İndir
            </Button>
          ) : null}
        </div>
      </div>

      {downloadError ? (
        <InlineNotification
          kind="error"
          title="PDF indirilemedi"
          subtitle={downloadError}
          onCloseButtonClick={() => setDownloadError(null)}
          lowContrast
        />
      ) : null}

      {aiCommandState.pending ? (
        <div className="editor-panel__ai-status">
          <InlineLoading status="active" description={aiCommandState.message || 'AI komutu çalışıyor...'} />
        </div>
      ) : null}
      {!aiCommandState.pending && aiCommandState.message ? (
        <p className="editor-panel__ai-feedback">{aiCommandState.message}</p>
      ) : null}

      <div className="editor-panel__canvas-grid">
        <div className="editor-panel__editor-area">
          {editorPreviewMode === 'markdown' ? (
            <div className="panel__content markdown-editor">
              <TextArea
                id="markdown-editor"
                labelText="Markdown İçeriği"
                hideLabel
                value={markdownContent}
                onChange={(e) => {
                  setMarkdown(e.target.value);
                  updateSelectionFromTarget(e.target);
                }}
                onSelect={(e) => updateSelectionFromTarget(e.target)}
                onClick={(e) => updateSelectionFromTarget(e.target)}
                onKeyUp={(e) => updateSelectionFromTarget(e.target)}
                placeholder="Markdown içeriğinizi buraya yazın..."
                rows={30}
                ref={textAreaRef}
                style={{
                  height: '100%',
                  fontFamily: 'IBM Plex Mono',
                  resize: 'none',
                }}
              />
            </div>
          ) : (
            <div className="panel__content markdown-editor markdown-editor--preview">
              {markdownContent ? (
                <div
                  className="markdown-editor__rich-preview"
                  dangerouslySetInnerHTML={{ __html: richPreviewHtml }}
                />
              ) : (
                <p className="markdown-editor__preview-empty">Önizleme için markdown içeriği gerekli.</p>
              )}
            </div>
          )}
        </div>

        <AiCanvasSidebar
          reportSettings={reportSettings}
          enabledPatterns={reportSettings?.enabledPatterns}
          contextualSuggestions={contextualSuggestions}
          lintIssues={lintIssues}
          onPatternAction={(prompt) => applySuggestion(prompt.prompt, {
            expectMarkdown: prompt.expectMarkdown,
            applyTarget: 'document',
            loadingMessage: `${prompt.label} AI ile uygulanıyor...`,
          })}
          onSuggestionAction={(item) => applySuggestion(item.prompt, item)}
          onLintFix={() => dispatchAiCommand({
            kind: 'lint-fix',
            loadingMessage: 'Lint düzeltmeleri uygulanıyor...',
          })}
          disabled={aiCommandState.pending}
        />
      </div>

      <div className="editor-panel__status-bar">
        <span>{String(markdownContent || '').split(/\s+/).filter(Boolean).length} kelime</span>
        <span>{lintIssues.length} lint</span>
      </div>
    </div>
  );
}

export default EditorPanel;
