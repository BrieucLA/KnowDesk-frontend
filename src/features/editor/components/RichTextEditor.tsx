import React, { useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value:       string;
  onChange:    (html: string) => void;
  placeholder?: string;
  readOnly?:    boolean;
  labelledBy?:  string;
}

export function RichTextEditor({
  value, onChange, placeholder, readOnly, labelledBy,
}: RichTextEditorProps) {
  const editorRef      = useRef<HTMLDivElement>(null);
  const isTypingRef    = useRef(false);
  const prevValueRef   = useRef('');

  // Sync value → DOM quand la valeur change depuis l'extérieur (chargement article)
  useEffect(() => {
    if (!editorRef.current) return;
    // Ne pas écraser si l'utilisateur est en train de taper
    if (isTypingRef.current) return;
    // Ne pas re-render si la valeur n'a pas changé
    if (value === prevValueRef.current) return;

    prevValueRef.current = value;
    editorRef.current.innerHTML = value;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      prevValueRef.current = html;
      onChange(html);
    }
  }, [onChange]);

  const handleFocus = () => { isTypingRef.current = true; };
  const handleBlur  = () => { isTypingRef.current = false; };

  const execCmd = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  return (
    <div className="rte">
      {!readOnly && (
        <div className="rte__toolbar" role="toolbar" aria-label="Outils de mise en forme">
          <ToolButton onClick={() => execCmd('bold')}                label="Gras"            shortcut="⌘B">B</ToolButton>
          <ToolButton onClick={() => execCmd('italic')}              label="Italique"        shortcut="⌘I"><em>I</em></ToolButton>
          <div className="rte__separator" aria-hidden="true" />
          <ToolButton onClick={() => execCmd('formatBlock', 'h2')}   label="Titre 2"         shortcut="">H2</ToolButton>
          <ToolButton onClick={() => execCmd('formatBlock', 'h3')}   label="Titre 3"         shortcut="">H3</ToolButton>
          <div className="rte__separator" aria-hidden="true" />
          <ToolButton onClick={() => execCmd('insertUnorderedList')} label="Liste à puces"   shortcut="">≡</ToolButton>
          <ToolButton onClick={() => execCmd('insertOrderedList')}   label="Liste numérotée" shortcut="">1.</ToolButton>
          <div className="rte__separator" aria-hidden="true" />
          <ToolButton onClick={() => execCmd('removeFormat')}        label="Effacer le formatage" shortcut="">Tx</ToolButton>
        </div>
      )}

      <div
        ref={editorRef}
        className={`rte__content article-content ${readOnly ? 'rte__content--readonly' : ''}`}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        aria-placeholder={placeholder}
        data-placeholder={placeholder}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}

function ToolButton({
  children, onClick, label, shortcut,
}: { children: React.ReactNode; onClick: () => void; label: string; shortcut: string }) {
  return (
    <button
      type="button"
      className="rte__tool"
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
