/**
 * PreviewPanel Component
 * 
 * PDF preview panel with markdown rendering.
 */

import React, { memo, useMemo } from 'react';
import { Loading } from '@carbon/react';
import { DocumentPdf } from '@carbon/icons-react';

function PreviewPanel({
  markdown,
  isLoading = false,
}) {
  // Simple markdown to HTML conversion for preview
  const previewHtml = useMemo(() => {
    if (!markdown) return '';
    
    return markdown
      // Remove frontmatter
      .replace(/^---[\s\S]*?---/m, '')
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
  }, [markdown]);

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
          <div className="pdf-preview__document">
            {isLoading ? (
              <div className="pdf-preview__loading">
                <Loading withOverlay={false} description="PDF oluşturuluyor..." />
              </div>
            ) : (
              <div 
                className="pdf-preview__content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PreviewPanel);
