import React, { useState, useCallback } from 'react';
import { useApiKeys }       from '../hooks/useApiKeys';
import { Button }           from '../../../shared/components/ui/Button';
import { Input }            from '../../../shared/components/ui/Input';
import { Modal }            from '../../../shared/components/ui/Modal';
import { Skeleton }         from '../../../shared/components/ui/Skeleton';
import { ConfirmDialog }    from '../../../shared/components/ui/ConfirmDialog';
import { formatRelative }   from '../../../shared/lib/formatDate';

export function ApiKeysSection() {
  const { keys, loading, newKey, setNewKey, createKey, revokeKey } = useApiKeys();
  const [showCreate,   setShowCreate]   = useState(false);
  const [name,         setName]         = useState('');
  const [creating,     setCreating]     = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<{ id: string; name: string } | null>(null);

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
    <>
    {confirmRevoke && (
      <ConfirmDialog
        title={`Révoquer « ${confirmRevoke.name} » ?`}
        description="Cette clé sera immédiatement invalidée. Les intégrations qui l'utilisent cesseront de fonctionner."
        confirmLabel="Révoquer"
        variant="danger"
        onConfirm={() => { revokeKey(confirmRevoke.id); setConfirmRevoke(null); }}
        onCancel={() => setConfirmRevoke(null)}
      />
    )}
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
        <Modal
          title="Nouvelle clé API"
          onClose={() => setShowCreate(false)}
          asForm
          onSubmit={handleCreate}
          footer={
            <>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="md" loading={creating} disabled={!name.trim()}>
                Créer
              </Button>
            </>
          }
        >
          <Input
            id="key-name"
            type="text"
            label="Nom de la clé"
            placeholder="ex. Intégration Hubicus"
            helperText="Donnez un nom descriptif pour identifier cette clé."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </Modal>
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
    onClick={() => setConfirmRevoke({ id: key.id, name: key.name })}
  >
    Révoquer
  </Button>
</li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
}
