export function focusEditorLocation({ line = 1, column = 1, markdown, textArea } = {}) {
  const target = textArea || (typeof document !== 'undefined'
    ? document.getElementById('markdown-editor')
    : null);
  if (!target) return;

  const content = typeof markdown === 'string' ? markdown : target.value || '';
  const lines = content.split('\n');
  const safeLine = Math.max(1, Math.min(Number(line) || 1, lines.length || 1));
  const lineText = lines[safeLine - 1] || '';
  const safeColumn = Math.max(1, Number(column) || 1);

  let startOffset = 0;
  for (let i = 0; i < safeLine - 1; i += 1) {
    startOffset += lines[i].length + 1;
  }

  const columnOffset = Math.min(lineText.length, safeColumn - 1);
  const selectionStart = startOffset + columnOffset;
  const selectionEnd = startOffset + lineText.length;

  target.focus();
  try {
    target.setSelectionRange(selectionStart, selectionEnd);
  } catch (error) {
    // Selection not supported on this input.
  }
}
