import React, { useState, useCallback } from 'react';
import { Button }        from '../../../shared/components/ui/Button';
import { Skeleton }      from '../../../shared/components/ui/Skeleton';
import { ChipsInput }    from '../../../shared/components/ui/ChipsInput';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useSynonyms }   from '../hooks/useSynonyms';
import type { Synonym }  from '../types';

export function SearchSettingsSection() {
  const { items, loading, error, create, update, remove } = useSynonyms();
  const [showCreate,      setShowCreate]      = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState<Synonym | null>(null);

  return (
    <section className="settings-section" aria-labelledby="search-title">
      <div className="settings-section__header">
        <div>
          <h2 id="search-title" className="settings-section__title">Recherche</h2>
          <p className="settings-section__desc">
            Définissez des synonymes propres à votre organisation. Une recherche sur un terme
            remontera aussi les contenus contenant ses synonymes (et vice-versa).
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Ajouter un synonyme
        </Button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Supprimer « ${confirmDelete.term} » ?`}
          description="Ce synonyme sera supprimé de votre configuration de recherche. Cette action est irréversible."
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={() => { remove(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showCreate && (
        <CreateSynonymModal
          existingTerms={items.map(i => i.term.toLowerCase())}
          onClose={() => setShowCreate(false)}
          onCreate={async (term, synonyms) => {
            const ok = await create(term, synonyms);
            if (ok) setShowCreate(false);
          }}
        />
      )}

      {error && <p className="field-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <div className="api-keys-list">
          {[1, 2].map(i => <Skeleton key={i} className="sk-card" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="api-keys-empty">
          <p>
            Aucun synonyme configuré. Ajoutez-en un par exemple pour relier
            « annulation » et « résiliation ».
          </p>
        </div>
      ) : (
        <ul className="synonyms-list">
          {items.map(item => (
            <SynonymItem
              key={item.id}
              item={item}
              onSave={syn => update(item.id, syn)}
              onDelete={() => setConfirmDelete(item)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Item — affichage + édition inline ──────────────────────────

function SynonymItem({
  item, onSave, onDelete,
}: {
  item:     Synonym;
  onSave:   (synonyms: string[]) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<string[]>(item.synonyms);
  const [saving,  setSaving]  = useState(false);

  const startEdit = () => { setDraft(item.synonyms); setEditing(true); };
  const cancel    = () => { setDraft(item.synonyms); setEditing(false); };

  const save = useCallback(async () => {
    if (draft.length === 0) return;
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setEditing(false);
  }, [draft, onSave]);

  return (
    <li className="synonym-item">
      <div className="synonym-item__term">{item.term}</div>

      {editing ? (
        <div className="synonym-item__edit">
          <ChipsInput value={draft} onChange={setDraft} placeholder="Ajouter un synonyme" />
          <div className="synonym-item__actions">
            <Button variant="ghost"   size="sm" onClick={cancel}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={draft.length === 0}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="synonym-item__chips">
            {item.synonyms.map(s => <span key={s} className="chip chip--readonly">{s}</span>)}
          </div>
          <div className="synonym-item__actions">
            <Button variant="ghost" size="sm" onClick={startEdit}>Modifier</Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>Supprimer</Button>
          </div>
        </>
      )}
    </li>
  );
}

// ── Modal de création ──────────────────────────────────────────

function CreateSynonymModal({
  existingTerms, onClose, onCreate,
}: {
  existingTerms: string[];
  onClose:       () => void;
  onCreate:      (term: string, synonyms: string[]) => Promise<void>;
}) {
  const [term,     setTerm]     = useState('');
  const [chips,    setChips]    = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);

  const trimmed = term.trim();
  const duplicate = trimmed && existingTerms.includes(trimmed.toLowerCase());
  const canSubmit = trimmed.length > 0 && chips.length > 0 && !duplicate;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onCreate(trimmed, chips);
    setSaving(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="syn-modal-title"
    >
      <div className="modal">
        <div className="modal__header">
          <h2 id="syn-modal-title" className="modal__title">Nouveau synonyme</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="modal__body">
          <div className="field">
            <label htmlFor="syn-term" className="field-label">Terme</label>
            <input
              id="syn-term"
              type="text"
              className={`field-input ${duplicate ? 'field-input--error' : ''}`}
              placeholder="annulation"
              value={term}
              onChange={e => setTerm(e.target.value)}
              autoFocus
            />
            {duplicate && <p className="field-error">Un synonyme existe déjà pour ce terme.</p>}
          </div>

          <div className="field">
            <label className="field-label">Synonymes</label>
            <ChipsInput value={chips} onChange={setChips} placeholder="résiliation, clôture…" />
            <p className="field-hint">
              Tapez Entrée ou virgule après chaque synonyme. La relation est bidirectionnelle.
            </p>
          </div>

          <div className="modal__actions">
            <Button variant="ghost"   size="md" onClick={onClose}>Annuler</Button>
            <Button variant="primary" size="md" loading={saving} disabled={!canSubmit} onClick={submit}>
              Créer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

