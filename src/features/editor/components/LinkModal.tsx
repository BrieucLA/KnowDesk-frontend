import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input }  from '../../../shared/components/ui/Input';

interface LinkModalProps {
  onInsert: (url: string, text: string, isInternal: boolean, articleId?: string) => void;
  onClose:  () => void;
  selectedText?: string;
}

interface ArticleResult {
  id:    string;
  title: string;
}

export function LinkModal({ onInsert, onClose, selectedText }: LinkModalProps) {
  const [tab,         setTab]         = useState<'external' | 'internal'>('external');
  const [url,         setUrl]         = useState('https://');
  const [text,        setText]        = useState(selectedText ?? '');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<ArticleResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [selectedArt, setSelectedArt] = useState<ArticleResult | null>(null);
  const [urlError,    setUrlError]    = useState('');

  // Recherche d'articles internes
  useEffect(() => {
    if (tab !== 'internal' || query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
        const token = (window as any).__knowdesk_token ?? '';
        const res = await fetch(`${base}/articles?status=published&q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults((data.data ?? []).slice(0, 8));
      } catch { setResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab]);

  const handleInsert = useCallback(() => {
    if (tab === 'external') {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setUrlError('L\'URL doit commencer par http:// ou https://');
        return;
      }
      onInsert(url, text || url, false);
    } else {
      if (!selectedArt) return;
      onInsert(`knowdesk://article/${selectedArt.id}`, text || selectedArt.title, true, selectedArt.id);
    }
  }, [tab, url, text, selectedArt, onInsert]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Insérer un lien</h2>
          <button type="button" className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {/* Tabs */}
          <div className="link-modal__tabs">
            <button
              type="button"
              className={`link-modal__tab ${tab === 'external' ? 'link-modal__tab--active' : ''}`}
              onClick={() => setTab('external')}
            >
              🔗 Lien externe
            </button>
            <button
              type="button"
              className={`link-modal__tab ${tab === 'internal' ? 'link-modal__tab--active' : ''}`}
              onClick={() => setTab('internal')}
            >
              📄 Article KnowDesk
            </button>
          </div>

          {tab === 'external' ? (
            <>
              <Input
                id="link-url"
                type="url"
                label="URL"
                placeholder="https://exemple.fr"
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlError(''); }}
                error={urlError}
                autoFocus
              />
              <Input
                id="link-text"
                type="text"
                label="Texte affiché (optionnel)"
                placeholder={url}
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="link-search" className="field-label">Rechercher un article</label>
                <input
                  id="link-search"
                  type="search"
                  className="field-input"
                  placeholder="Titre de l'article…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedArt(null); }}
                  autoFocus
                />
              </div>
              {searching && <p style={{ fontSize: 13, color: 'var(--neutral-400)' }}>Recherche…</p>}
              {results.length > 0 && (
                <ul className="link-modal__results">
                  {results.map(a => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`link-modal__result ${selectedArt?.id === a.id ? 'link-modal__result--selected' : ''}`}
                        onClick={() => { setSelectedArt(a); setText(text || a.title); }}
                      >
                        {a.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedArt && (
                <p className="link-modal__selected">✓ Sélectionné : <strong>{selectedArt.title}</strong></p>
              )}
              <Input
                id="link-text-internal"
                type="text"
                label="Texte affiché (optionnel)"
                placeholder={selectedArt?.title ?? 'Texte du lien'}
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </>
          )}

          <div className="modal__actions">
            <Button variant="ghost"   size="md" onClick={onClose}>Annuler</Button>
            <Button
              variant="primary" size="md"
              onClick={handleInsert}
              disabled={tab === 'external' ? !url || url === 'https://' : !selectedArt}
            >
              Insérer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
