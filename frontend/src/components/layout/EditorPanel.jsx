import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Dropdown,
  TextArea,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import {
  Code,
  Play,
  Download,
  Bullhorn,
  Ai,
  Document,
  Catalog,
  DataTable,
  ChartLine,
  Result,
  TextCreation,
} from '@carbon/icons-react';
import { useDocument } from '../../contexts';
import { focusEditorLocation } from '../../utils/editorFocus';
import {
  AI_APPLY_COMMAND_EVENT,
  AI_CHAT_PREFILL_EVENT,
  AI_CHAT_SUGGESTIONS_EVENT,
  AI_COMMAND_RESULT_EVENT,
  EDITOR_PREVIEW_MODES,
  markdownToRichPreviewHtml,
} from '../../constants/editorConstants';

function EditorPanel() {
  const {
    markdownContent,
    setMarkdown,
    setEditorSelection,
    editorSelection,
    reportSettings,
    selectedLayoutProfile,
    selectedPrintProfile,
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
  const [selectedSeverityId, setSelectedSeverityId] = useState('all');
  const [selectedRuleId, setSelectedRuleId] = useState('all');
  const [editorPreviewMode, setEditorPreviewMode] = useState(EDITOR_PREVIEW_MODES[0]?.id || 'markdown');
  const [aiCommandState, setAiCommandState] = useState({ pending: false, message: '' });
  const [chatSuggestions, setChatSuggestions] = useState([]);
  const textAreaRef = useRef(null);
  const activeAiCommandRequestRef = useRef(null);

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

  const richPreviewHtml = useMemo(
    () => markdownToRichPreviewHtml(markdownContent),
    [markdownContent]
  );

  const focusLintLocation = useCallback((issue) => {
    focusEditorLocation({
      line: issue?.line,
      column: issue?.column,
      markdown: markdownContent,
      textArea: textAreaRef.current,
    });
  }, [markdownContent]);

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

  const runDesignRewrite = useCallback(() => {
    if (!String(markdownContent || '').trim()) {
      setAiCommandState({ pending: false, message: 'Tasarım revizyonu için önce markdown içeriği gerekli.' });
      return;
    }
    dispatchAiCommand({
      kind: 'design-rewrite',
      wizardSettings: reportSettings,
      layoutProfile: selectedLayoutProfile,
      printProfile: selectedPrintProfile,
      loadingMessage: 'AI tüm markdown içeriğini tasarım kurallarına göre revize ediyor...',
    });
  }, [dispatchAiCommand, markdownContent, reportSettings, selectedLayoutProfile, selectedPrintProfile]);

  const requestDocStructurePack = useCallback(() => {
    dispatchAiCommand({
      kind: 'quick-action',
      prompt: 'Mevcut markdown için uygun bir doküman yapısı öner: kapak, içindekiler, tablo/grafik/callout/timeline kullanım planı. Yanıtı kısa madde listesi ver.',
      loadingMessage: 'Doküman yapısı önerileri hazırlanıyor...',
    });
  }, [dispatchAiCommand]);

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

  const pushSelectionContextToAi = useCallback(() => {
    const selectedText = String(editorSelection?.text || '').trim();
    if (!selectedText) {
      setAiCommandState({
        pending: false,
        message: 'Önce editörde bir metin seçin.',
      });
      return;
    }

    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AI_CHAT_PREFILL_EVENT, {
      detail: {
        selectionText: selectedText,
        prompt: 'Bu seçili metni bağlam olarak kullanarak revizyon öner.',
      },
    }));
    dispatchAiCommand({
      kind: 'selection-context',
      selectionText: selectedText,
      loadingMessage: 'Seçili metin AI bağlamına ekleniyor...',
    });
  }, [dispatchAiCommand, editorSelection]);

  const requestWizardTransform = useCallback(() => {
    if (!String(markdownContent || '').trim()) {
      setAiCommandState({
        pending: false,
        message: 'Sihirbaz dönüşümü için önce markdown içeriği gerekli.',
      });
      return;
    }

    dispatchAiCommand({
      kind: 'wizard-transform',
      wizardSettings: reportSettings,
      layoutProfile: selectedLayoutProfile,
      printProfile: selectedPrintProfile,
      loadingMessage: 'Sihirbaz tercihleri AI ile markdown\u2019a uygulanıyor...',
    });
  }, [dispatchAiCommand, markdownContent, reportSettings, selectedLayoutProfile, selectedPrintProfile]);

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
    if (typeof window === 'undefined') return undefined;
    const onSuggestions = (event) => {
      const list = Array.isArray(event?.detail?.suggestions)
        ? event.detail.suggestions
        : [];
      setChatSuggestions(
        list
          .map((item) => ({
            label: String(item?.label || '').trim(),
            prompt: String(item?.prompt || '').trim(),
            expectMarkdown: item?.expectMarkdown === true,
            applyTarget: item?.applyTarget === 'selection' ? 'selection' : 'document',
            loadingMessage: String(item?.loadingMessage || '').trim(),
          }))
          .filter((item) => item.label && item.prompt)
          .slice(0, 6)
      );
    };

    window.addEventListener(AI_CHAT_SUGGESTIONS_EVENT, onSuggestions);
    return () => {
      window.removeEventListener(AI_CHAT_SUGGESTIONS_EVENT, onSuggestions);
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
    <div className="editor-panel panel">
      <div className="panel__header">
        <div>
          <h3>
            <Code size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Markdown Editör (AI Canvas)
          </h3>
          <p>Canlı düzenleyin, AI ile tek tıkta revize edin, yapısal öneriler alın ve PDF üretin.</p>
        </div>
        <div className="editor-panel__export-actions">
          <Button
            kind="primary"
            size="sm"
            renderIcon={Play}
            onClick={generatePdf}
            disabled={isConverting || isGeneratingPdf || !markdownContent}
          >
            {isGeneratingPdf
              ? `PDF oluşturuluyor (%${Math.round(pdfJobTelemetry?.progress ?? pdfJobProgress ?? 0)})`
              : 'PDF Oluştur'}
          </Button>
          <Button
            kind="secondary"
            size="sm"
            renderIcon={Download}
            onClick={handleDownload}
            disabled={!outputPath}
          >
            PDF İndir
          </Button>
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
      <div className="editor-panel__tools">
        <div className="editor-panel__actions">
          <Button
            size="sm"
            kind="secondary"
            renderIcon={TextCreation}
            onClick={runDesignRewrite}
            disabled={!markdownContent || aiCommandState.pending}
          >
            Tüm Metni AI ile Revize Et
          </Button>
          <Button
            size="sm"
            kind="tertiary"
            renderIcon={Catalog}
            onClick={requestDocStructurePack}
            disabled={aiCommandState.pending}
          >
            Yapı Önerileri Al
          </Button>
          <Button
            size="sm"
            kind="ghost"
            renderIcon={Bullhorn}
            onClick={pushSelectionContextToAi}
            disabled={!String(editorSelection?.text || '').trim() || aiCommandState.pending}
          >
            Seçili Metni AI Bağlamına Ekle
          </Button>
            <Button
              size="sm"
              kind="ghost"
              renderIcon={Ai}
              onClick={requestWizardTransform}
              disabled={!markdownContent || aiCommandState.pending}
            >
            Sihirbaz Ayarını Uygula
          </Button>
        </div>

        <div className="editor-panel__macro-actions" aria-label="Doküman yapı araçları">
          <Button
            size="sm"
            kind="ghost"
            renderIcon={Document}
            onClick={() => applySuggestion('Mevcut markdown için Carbon uyumlu bir kapak sayfası ekle veya iyileştir.', {
              expectMarkdown: true,
              applyTarget: 'document',
              loadingMessage: 'Kapak bölümü AI ile ekleniyor veya iyileştiriliyor...',
            })}
            disabled={!markdownContent || aiCommandState.pending}
          >
            Kapak Oluştur/İyileştir
          </Button>
          <Button
            size="sm"
            kind="ghost"
            renderIcon={Catalog}
            onClick={() => applySuggestion('Başlıklara göre içindekiler bölümü oluştur ve markdown akışına uygun noktaya ekle.', {
              expectMarkdown: true,
              applyTarget: 'document',
              loadingMessage: 'İçindekiler bölümü AI ile güncelleniyor...',
            })}
            disabled={!markdownContent || aiCommandState.pending}
          >
            İçindekiler Ekle
          </Button>
          <Button
            size="sm"
            kind="ghost"
            renderIcon={DataTable}
            onClick={() => applySuggestion('Bu doküman için tablo, grafik ve karşılaştırma bloklarını öner ve gerekli yerlerde directive olarak ekle.', {
              expectMarkdown: true,
              applyTarget: 'document',
              loadingMessage: 'Tablo/grafik directive önerileri markdown içine uygulanıyor...',
            })}
            disabled={!markdownContent || aiCommandState.pending}
          >
            Tablo/Grafik Öner
          </Button>
          <Button
            size="sm"
            kind="ghost"
            renderIcon={ChartLine}
            onClick={() => applySuggestion('İçeriği bölüm bölüm analiz ederek hangi bölüme hangi görselleştirme türünün uygun olduğunu listele ve örnek directive ver.')}
            disabled={!markdownContent || aiCommandState.pending}
          >
            Veri Görselleştirme Planı
          </Button>
          <Button
            size="sm"
            kind="ghost"
            renderIcon={Result}
            onClick={() => applySuggestion('Rapor sonuna Carbon uyumlu bir arka kapak/kapanış bölümü ekle.', {
              expectMarkdown: true,
              applyTarget: 'document',
              loadingMessage: 'Arka kapak AI ile ekleniyor...',
            })}
            disabled={!markdownContent || aiCommandState.pending}
          >
            Arka Kapak Ekle
          </Button>
        </div>

        {chatSuggestions.length ? (
          <div className="editor-panel__chat-suggestions" aria-label="AI seçenekli cevaplar">
            <span className="editor-panel__chat-suggestions-label">AI cevap seçenekleri</span>
            <div className="editor-panel__chat-suggestions-actions">
              {chatSuggestions.map((item, idx) => (
                <Button
                  key={`${item.label}-${idx}`}
                  size="sm"
                  kind="tertiary"
                  onClick={() => applySuggestion(item.prompt, item)}
                  disabled={aiCommandState.pending}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="editor-panel__preview-mode">
          <span className="editor-panel__preview-mode-label">Editör Görünümü</span>
          <div className="editor-panel__preview-mode-actions">
            {EDITOR_PREVIEW_MODES.map((mode) => (
              <Button
                key={mode.id}
                size="sm"
                kind={editorPreviewMode === mode.id ? 'primary' : 'tertiary'}
                renderIcon={mode.icon}
                onClick={() => setEditorPreviewMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="editor-panel__outline">
          <div className="editor-panel__outline-header">
            <h4>İçindekiler</h4>
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
              resize: 'none'
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

export default EditorPanel;
