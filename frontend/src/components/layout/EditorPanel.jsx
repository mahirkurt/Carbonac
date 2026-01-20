/**
 * EditorPanel Component
 * 
 * Markdown editor panel with syntax highlighting support.
 */

import React, { memo } from 'react';
import { TextArea } from '@carbon/react';
import { Code } from '@carbon/icons-react';

function EditorPanel({
  value,
  onChange,
  placeholder = 'Markdown içeriğinizi buraya yazın...',
}) {
  return (
    <div className="editor-panel panel">
      <div className="panel__header">
        <h3>
          <Code size={16} className="panel__header-icon" aria-hidden="true" />
          Markdown Editör
        </h3>
        <p>Dokümanınızı düzenleyin</p>
      </div>
      
      <div className="panel__content markdown-editor">
        <TextArea
          id="markdown-editor"
          labelText="Markdown İçeriği"
          hideLabel
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={30}
          className="markdown-editor__textarea"
        />
      </div>
    </div>
  );
}

export default memo(EditorPanel);
