/**
 * EditorPanel Component
 * 
 * Markdown editor panel with syntax highlighting support.
 */

import React, { memo, useState } from 'react';
import { Button, Select, SelectItem, TextArea } from '@carbon/react';
import { Code } from '@carbon/icons-react';
import directiveTemplates from '../../utils/directiveTemplates';

function EditorPanel({
  value,
  onChange,
  placeholder = 'Markdown içeriğinizi buraya yazın...',
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    directiveTemplates[0]?.id || ''
  );

  const handleInsert = () => {
    const template = directiveTemplates.find((item) => item.id === selectedTemplate);
    if (!template) {
      return;
    }
    const current = value || '';
    const needsBreak = current && !current.endsWith('\n');
    const nextValue = `${current}${needsBreak ? '\n\n' : ''}${template.snippet}\n`;
    onChange?.(nextValue);
  };

  return (
    <div className="editor-panel panel">
      <div className="panel__header">
        <h3>
          <Code size={16} className="panel__header-icon" aria-hidden="true" />
          Markdown Editör
        </h3>
        <p>Dokümanınızı düzenleyin</p>
      </div>

      <div className="editor-panel__actions">
        <Select
          id="directive-template"
          labelText="Directive ekle"
          hideLabel
          value={selectedTemplate}
          onChange={(event) => setSelectedTemplate(event.target.value)}
        >
          {directiveTemplates.map((template) => (
            <SelectItem key={template.id} value={template.id} text={template.label} />
          ))}
        </Select>
        <Button size="sm" kind="secondary" onClick={handleInsert}>
          Insert
        </Button>
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
