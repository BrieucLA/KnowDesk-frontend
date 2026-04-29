import React, { useRef, useCallback, useEffect, useState } from 'react';
import { LinkModal } from './LinkModal';
import { useAuthStore } from '../../../store/authStore';

interface RichTextEditorProps {
  value:        string;
  onChange:     (html: string) => void;
  placeholder?: string;
  readOnly?:    boolean;
  labelledBy?:  string;
  onViewArticle?: (articleId: string) => void;
}

export function RichTextEditor({
  value, onChange, placeholder, readOnly, labelledBy, onViewArticle,
}: RichTextEditorProps) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const isTypingRef  = useRef(false);
  const prevValueRef = useRef('');
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const session = useAuthStore(s => s.session);

  // Expose le token pour la recherche d'articles internes
  useEffect(() => {
    (window as any).__knowdesk_token = session?.accessToken ?? '';
  }, [session?.accessToken]);

  // Sync value → DOM
  useEffect(() => {
    if (!editorRef.current) return;
    if (isTypingRef.current) return;
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

  // Sauvegarde la sélection avant d'ouvrir la modale
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restaure la sélection
  const restoreSelection = useCallback(() => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  const handleLinkClick = useCallback(() => {
    saveSelection();
    setShowLinkModal(true);
  }, [saveSelection]);

  const handleInsertLink = useCallback((url: string, text: string, isInternal: boolean, articleId?: string) => {
    setShowLinkModal(false);
    editorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    const hasSelection = sel && sel.toString().trim().length > 0;

    if (hasSelection) {
      // Wraps la sélection en lien
      document.execCommand('createLink', false, url);
      // Ajoute les attributs sur le lien créé
      const link = editorRef.current?.querySelector(`a[href="${url}"]`) as HTMLAnchorElement;
      if (link) {
        if (!isInternal) link.target = '_blank';
        if (!isInternal) link.rel = 'noopener noreferrer';
        if (isInternal) link.setAttribute('data-article-id', articleId ?? '');
        link.className = isInternal ? 'article-link--internal' : 'article-link--external';
      }
    } else {
      // Insère un nouveau lien avec le texte
      const a = document.createElement('a');
      a.href = url;
      a.textContent = text;
      if (!isInternal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      if (isInternal)  { a.setAttribute('data-article-id', articleId ?? ''); }
      a.className = isInternal ? 'article-link--internal' : 'article-link--external';

      if (savedRangeRef.current) {
        savedRangeRef.current.insertNode(a);
        savedRangeRef.current.collapse(false);
      }
    }

    handleInput();
  }, [restoreSelection, handleInput]);

  // Gestion du clic sur les liens internes dans l'éditeur
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-article-id]') as HTMLAnchorElement | null;
    if (link && readOnly && onViewArticle) {
      e.preventDefault();
      const articleId = link.getAttribute('data-article-id');
      if (articleId) onViewArticle(articleId);
    }
  }, [readOnly, onViewArticle]);

  const selectedText = () => window.getSelection()?.toString() ?? '';

  return (
    <>
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
            <ToolButton onClick={handleLinkClick}                      label="Lien"            shortcut="">🔗</ToolButton>
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
          onClick={handleClick}
        />
      </div>

      {showLinkModal && (
        <LinkModal
          onInsert={handleInsertLink}
          onClose={() => setShowLinkModal(false)}
          selectedText={selectedText()}
        />
      )}
    </>
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
