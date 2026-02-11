/**
 * PreviewPanel Component
 * 
 * PDF preview panel with markdown rendering.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Button, InlineNotification, Loading, ProgressBar } from '@carbon/react';
import { DocumentPdf, Download, Play } from '@carbon/icons-react';
import { useThrottle } from '../../hooks';
import { useDocument } from '../../contexts/DocumentContext';
import CarbonChartWrapper from '../charts/CarbonChartWrapper';

function stripFrontmatter(markdown) {
  return String(markdown || '').replace(/^---[\s\S]*?---/m, '').trim();
}

function markdownToPreviewHtml(markdown) {
  if (!markdown) return '';

  // Simple markdown to HTML conversion for preview
  return String(markdown)
    // Headers
    .replace(/^# (.+)$/gm, '<h1 class="preview-h1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="preview-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="preview-h3">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="preview-code">$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="preview-blockquote">$1</blockquote>')
    // List items
    .replace(/^- (.+)$/gm, '<li class="preview-li">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

function parseDirectiveAttributes(raw = '') {
  const attributes = {};
  if (!raw) return attributes;
  const regex = /([a-zA-Z0-9_-]+)\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s\"]+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1];
    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    attributes[key] = value;
  }
  return attributes;
}

function parseJsonFence(lines) {
  const start = lines.findIndex((line) => /^\s*```/.test(line));
  if (start === -1) {
    return { value: null, error: 'JSON code block bulunamadi.' };
  }

  let end = -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*```\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const raw = lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
  if (!raw) {
    return { value: null, error: 'JSON bos.' };
  }

  try {
    return { value: JSON.parse(raw), error: null };
  } catch (err) {
    return { value: null, error: `JSON parse hatasi: ${err?.message || String(err)}` };
  }
}

function splitPreviewBlocks(markdown) {
  const content = stripFrontmatter(markdown);
  if (!content) return [];

  const lines = content.split('\n');
  const blocks = [];
  let buffer = [];

  const flushBuffer = () => {
    const text = buffer.join('\n').trimEnd();
    if (text.trim()) {
      blocks.push({ kind: 'markdown', markdown: text });
    }
    buffer = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const startMatch = line.match(/^\s*:::+\s*chart\s*(\{[^}]*\})?\s*$/i);
    if (!startMatch) {
      buffer.push(line);
      continue;
    }

    flushBuffer();

    const rawAttrs = startMatch[1] ? startMatch[1].slice(1, -1) : '';
    const attrs = parseDirectiveAttributes(rawAttrs);

    const blockLines = [];
    for (i = i + 1; i < lines.length; i += 1) {
      const inner = lines[i];
      if (/^\s*:::+\s*$/.test(inner)) {
        break;
      }
      blockLines.push(inner);
    }

    const parsed = parseJsonFence(blockLines);
    blocks.push({
      kind: 'chart',
      attrs,
      payload: parsed.value,
      error: parsed.error,
      raw: blockLines.join('\n'),
    });
  }

  flushBuffer();
  return blocks;
}

function PreviewPanel() {
  const {
    markdownContent,
    isGeneratingPdf,
    outputPath,
    downloadError,
    pdfJobProgress,
    pdfJobStage,
    pdfJobTelemetry,
    generatePdf,
    isConverting,
    setDownloadError,
    livePreviewEnabled,
    selectedTheme,
  } = useDocument();

  const throttledMarkdown = useThrottle(markdownContent, 200);
  const effectiveMarkdown = livePreviewEnabled ? throttledMarkdown : '';

  const previewBlocks = useMemo(
    () => splitPreviewBlocks(effectiveMarkdown),
    [effectiveMarkdown]
  );

  const handleDownload = useCallback(() => {
    if (!outputPath) return;
    const link = document.createElement('a');
    link.href = outputPath;
    link.download = 'document.pdf';
    link.click();
  }, [outputPath]);

  return (
    <div className="preview-panel panel">
      <div className="panel__header">
        <h3>
          <DocumentPdf size={16} className="panel__header-icon" aria-hidden="true" />
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
            {isGeneratingPdf ? (
              <div className="pdf-preview__loading">
                <Loading withOverlay={false} description="PDF oluşturuluyor..." />
                {(pdfJobProgress > 0 || pdfJobTelemetry?.progress) && (
                  <div className="pdf-preview__progress">
                    <ProgressBar
                      value={pdfJobTelemetry?.progress ?? pdfJobProgress}
                      max={100}
                      label="PDF işleme"
                      helperText={`Aşama: ${pdfJobTelemetry?.stage || pdfJobStage || '-'}`}
                    />
                  </div>
                )}
              </div>
            ) : outputPath ? (
              <iframe
                className="pdf-preview__iframe"
                title="PDF Önizleme"
                src={outputPath}
              />
            ) : !markdownContent ? (
              <div className="pdf-preview__empty">
                <h4>Önizleme için içerik gerekli</h4>
                <p>Markdown ekleyerek veya dosya yükleyerek ilerleyin.</p>
              </div>
            ) : !livePreviewEnabled ? (
              <div className="pdf-preview__empty">
                <h4>Canlı önizleme kapalı</h4>
                <p>Ayarlar menüsü üzerinden canlı önizlemeyi açabilirsiniz.</p>
              </div>
            ) : (
              <div className="pdf-preview__content">
                {previewBlocks.map((block, index) => {
                  if (block.kind === 'chart') {
                    const attrs = block.attrs || {};
                    const caption = attrs.caption || attrs.question || '';
                    const chartType = attrs.type || 'bar';
                    if (block.error) {
                      return (
                        <div key={`chart-${index}`} className="carbonac-chart carbonac-chart--error">
                          <div className="carbonac-chart__error" role="alert">
                            {block.error}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <CarbonChartWrapper
                        key={`chart-${index}`}
                        type={chartType}
                        data={block.payload}
                        caption={caption}
                        question={attrs.question}
                        source={attrs.source}
                        sampleSize={attrs.sampleSize}
                        methodology={attrs.methodology}
                        notes={attrs.notes}
                        highlight={attrs.highlight}
                        themeOverride={selectedTheme}
                      />
                    );
                  }

                  const html = markdownToPreviewHtml(block.markdown);
                  if (!html) return null;
                  return (
                    <div
                      key={`md-${index}`}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                })}
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
          disabled={isConverting || isGeneratingPdf || !markdownContent}
        >
          {isGeneratingPdf ? 'Oluşturuluyor...' : 'PDF Oluştur'}
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

export default memo(PreviewPanel);
