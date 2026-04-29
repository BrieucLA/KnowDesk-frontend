import React, { useRef, useCallback, useEffect, useState } from 'react';
import { LinkModal }    from './LinkModal';
import { useAuthStore } from '../../../store/authStore';

interface RichTextEditorProps {
  value:          string;
  onChange:       (html: string) => void;
  placeholder?:   string;
  readOnly?:      boolean;
  labelledBy?:    string;
  onViewArticle?: (articleId: string) => void;
  articleId?:     string;
  onBeforeImageUpload?: () => Promise<string | null>;
}

export function RichTextEditor({
  value, onChange, placeholder, readOnly, labelledBy, onViewArticle, articleId, onBeforeImageUpload,
}: RichTextEditorProps) {
  const editorRef     = useRef<HTMLDivElement>(null);
  const isTypingRef   = useRef(false);
  const prevValueRef  = useRef('');
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const session = useAuthStore(s => s.session);

  useEffect(() => {
    (window as any).__knowdesk_token = session?.accessToken ?? '';
  }, [session?.accessToken]);

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

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

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

  const handleInsertLink = useCallback((url: string, text: string, isInternal: boolean, artId?: string) => {
    setShowLinkModal(false);
    editorRef.current?.focus();
    restoreSelection();

    const sel          = window.getSelection();
    const hasSelection = sel && sel.toString().trim().length > 0;

    if (hasSelection) {
      document.execCommand('createLink', false, url);
      const link = editorRef.current?.querySelector(`a[href="${url}"]`) as HTMLAnchorElement;
      if (link) {
        if (!isInternal) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        if (isInternal)  { link.setAttribute('data-article-id', artId ?? ''); }
        link.className = isInternal ? 'article-link--internal' : 'article-link--external';
      }
    } else {
      const a = document.createElement('a');
      a.href        = url;
      a.textContent = text;
      if (!isInternal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      if (isInternal)  { a.setAttribute('data-article-id', artId ?? ''); }
      a.className = isInternal ? 'article-link--internal' : 'article-link--external';
      if (savedRangeRef.current) {
        savedRangeRef.current.insertNode(a);
        savedRangeRef.current.collapse(false);
      }
    }
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleImageUpload = useCallback(async (file: File) => {
    let id = articleId;
    if (!id && onBeforeImageUpload) {
      id = (await onBeforeImageUpload()) ?? undefined;
      }
      if (!id) return;
  const token    = session?.accessToken ?? '';
  const base     = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
    const formData = new FormData();
    formData.append('image', file);

    const placeholder = document.createElement('span');
    placeholder.className   = 'rte-img-placeholder';
    placeholder.textContent = '⏳ Chargement…';
    if (savedRangeRef.current) {
      savedRangeRef.current.insertNode(placeholder);
    } else {
      editorRef.current?.appendChild(placeholder);
    }

    try {
      const res  = await fetch(`${base}/articles/${id}/images`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Erreur upload');
      const img     = document.createElement('img');
      img.src       = data.data.public_url;
      img.alt       = data.data.filename;
      img.className = 'article-img';
      placeholder.replaceWith(img);
    } catch {
      placeholder.replaceWith(document.createTextNode('[Erreur chargement image]'));
    }
    handleInput();
  }, [articleId, session?.accessToken, handleInput, onBeforeImageUpload]);

  const handleImageClick = useCallback(() => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) { saveSelection(); handleImageUpload(file); }
    };
    input.click();
  }, [saveSelection, handleImageUpload]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link   = target.closest('a[data-article-id]') as HTMLAnchorElement | null;
    if (link && readOnly && onViewArticle) {
      e.preventDefault();
      const aid = link.getAttribute('data-article-id');
      if (aid) onViewArticle(aid);
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
            {(articleId || onBeforeImageUpload) && (
              <ToolButton onClick={handleImageClick} label="Image" shortcut="">🖼</ToolButton>
            )}
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
