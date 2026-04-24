import React, { useState, useCallback } from 'react';
import { useApiKeys }  from '../hooks/useApiKeys';
import { Button }      from '../../../shared/components/ui/Button';
import { Skeleton }    from '../../../shared/components/ui/Skeleton';
import { formatRelative } from '../../../shared/lib/formatDate';

export function ApiKeysSection() {
  const { keys, loading, newKey, setNewKey, createKey, revokeKey } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [name,       setName]       = useState('');
  const [creating,   setCreating]   = useState(false);
  const [copied,     setCopied]     = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createKey(name.trim());
      setName('');
      setShowCreate(false);
    } catch { /* silencieux */ } finally {
      setCreating(false);
    }
  }, [name, createKey]);

  const handleCopy = useCallback(() => {
    if (!newKey) return;
    navigator.clipboard?.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [newKey]);

  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Clés API</h2>
          <p className="settings-section__desc">
            Utilisez ces clés pour accéder à vos données KnowDesk depuis vos applications.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Créer une clé
        </Button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">Nouvelle clé API</h2>
              <button type="button" className="modal__close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label htmlFor="key-name" className="field-label">Nom de la clé</label>
                <input
                  id="key-name" type="text" className="field-input"
                  placeholder="ex. Intégration Hubicus"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                  autoFocus
                />
                <p className="field-hint">Donnez un nom descriptif pour identifier cette clé.</p>
              </div>
              <div className="modal__actions">
                <Button variant="ghost"   size="md" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button variant="primary" size="md" loading={creating} onClick={handleCreate} disabled={!name.trim()}>
                  Créer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newKey && (
        <div className="api-key-reveal">
          <div className="api-key-reveal__header">
            <span className="api-key-reveal__title">⚠️ Copiez cette clé maintenant</span>
            <button type="button" className="api-key-reveal__dismiss" onClick={() => setNewKey(null)}>×</button>
          </div>
          <p className="api-key-reveal__desc">
            Cette clé ne sera plus affichée après la fermeture de cette fenêtre.
          </p>
          <div className="api-key-reveal__key">
            <code className="api-key-reveal__code">{newKey}</code>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? '✓ Copié' : 'Copier'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="api-keys-list">
          {[1,2].map(i => <Skeleton key={i} className="sk-card" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="api-keys-empty">
          <p>Aucune clé API. Créez-en une pour intégrer KnowDesk à vos outils.</p>
        </div>
      ) : (
        <ul className="api-keys-list">
          {keys.map(key => (
<li key={key.id} className="api-key-item">
  <span className="api-key-item__name">{key.name}</span>
  <code className="api-key-item__prefix">{key.key_prefix}••••••••</code>
  <span className="api-key-item__meta">
    Créée {formatRelative(key.created_at)}
    {key.last_used_at && ` · Utilisée ${formatRelative(key.last_used_at)}`}
  </span>
  <Button
    variant="ghost" size="sm"
    onClick={() => {
      if (confirm(`Révoquer la clé "${key.name}" ? Cette action est irréversible.`)) {
        revokeKey(key.id);
      }
    }}
  >
    Révoquer
  </Button>
</li>
          ))}
        </ul>
      )}
    </div>
  );
}
