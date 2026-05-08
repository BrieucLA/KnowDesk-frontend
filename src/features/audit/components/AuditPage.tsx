import React, { useEffect, useMemo, useState } from 'react';
import { Skeleton }   from '../../../shared/components/ui/Skeleton';
import { Modal }      from '../../../shared/components/ui/Modal';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pager }      from '../../../shared/components/ui/Pager';
import { PageHeader }  from '../../../shared/components/layout/PageHeader';
import { PageToolbar } from '../../../shared/components/layout/PageToolbar';
import { useToast } from '../../../shared/lib/useToast';
import { formatRelative } from '../../../shared/lib/formatDate';
import { auditApi, type AuditAction, type AuditLogItem } from '../api/auditApi';
import '../audit.css';

const PER_PAGE = 30;

// Labels lisibles pour les actions, regroupés par domaine.
const ACTION_LABEL: Record<AuditAction, string> = {
  'article.published':        'Article — publié',
  'article.deleted':          'Article — supprimé',
  'article.restored':         'Article — restauré',
  'article.archived':         'Article — archivé',
  'member.invited':           'Membre — invité',
  'member.role_changed':      'Membre — rôle modifié',
  'member.disabled':          'Membre — désactivé',
  'org.settings_updated':     'Org — paramètres modifiés',
  'org.general_updated':      'Org — informations modifiées',
  'org.chat_settings_updated':'Org — chatbot modifié',
  'org.chat_model.changed':   'Org — modèle chatbot changé',
  'org.ai_settings_updated':  'Org — IA modifiée',
  'account.password_changed': 'Compte — mot de passe modifié',
  'account.email_change_requested': 'Compte — changement email demandé',
  'account.email_change_confirmed': 'Compte — changement email confirmé',
  'apikey.created':           'Clé API — créée',
  'apikey.revoked':           'Clé API — révoquée',
  'tag.deleted':              'Tag — supprimé',
  'synonym.deleted':          'Synonyme — supprimé',
  'faq.created':              'FAQ — créée',
  'faq.updated':              'FAQ — modifiée',
  'faq.deleted':              'FAQ — supprimée',
  'tree.created':             'Processus — créé',
  'tree.deleted':              'Processus — supprimé',
  'tree.archived':             'Processus — archivé',
  'category.created':         'Catégorie — créée',
  'category.deleted':         'Catégorie — supprimée',
  'category.moved':           'Catégorie — modifiée',
  'superadmin.impersonate.start': 'Superadmin — impersonation',
  'superadmin.impersonate.stop':  'Superadmin — fin impersonation',
};

const ACTION_OPTIONS: AuditAction[] = Object.keys(ACTION_LABEL) as AuditAction[];

function userLabel(item: AuditLogItem): string {
  // Impersonation : action exécutée par un superadmin en peau d'un admin.
  // user_id = admin (cohérent DB), metadata.impersonatedByEmail = superadmin.
  const meta = (item.metadata ?? {}) as {
    superadminEmail?:    string;
    impersonatedByEmail?: string;
  };

  if (!item.user) {
    // user_id NULL → action superadmin pure (ex: impersonate.start).
    const email = meta.superadminEmail;
    if (email) return `${email} (superadmin)`;
    return '—';
  }
  const { firstName, lastName, email } = item.user;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const base = fullName.length > 0 ? `${fullName} (${email})` : email;

  if (meta.impersonatedByEmail) {
    return `${base} — via ${meta.impersonatedByEmail} (superadmin)`;
  }
  return base;
}

export function AuditPage() {
  const toast = useToast();
  const [items,    setItems]    = useState<AuditLogItem[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [action,   setAction]   = useState<AuditAction | ''>('');
  const [since,    setSince]    = useState('');
  const [until,    setUntil]    = useState('');
  const [page,     setPage]     = useState(1);
  const [detail,   setDetail]   = useState<AuditLogItem | null>(null);

  useEffect(() => {
    setLoading(true);
    auditApi.list({
      action:  action || undefined,
      since:   since  || undefined,
      until:   until  || undefined,
      page,
      perPage: PER_PAGE,
    })
      .then(res => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(err => toast.error(err?.message ?? 'Impossible de charger les logs.'))
      .finally(() => setLoading(false));
  }, [action, since, until, page, toast]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  const resetFilters = () => {
    setAction('');
    setSince('');
    setUntil('');
    setPage(1);
  };

  return (
    <section className="audit-page">
      <PageHeader
        title="Journal d'activité"
        subtitle={`Trace des actions sensibles effectuées sur cet espace : modifications de paramètres, gestion des membres, suppressions, impersonation. Conservé 1 an.`}
      />

      <PageToolbar
        left={(
          <>
            <select
              className="audit-page__filter-select"
              value={action}
              onChange={e => { setAction(e.target.value as AuditAction | ''); setPage(1); }}
              aria-label="Filtrer par action"
            >
              <option value="">Toutes les actions</option>
              {ACTION_OPTIONS.map(a => (
                <option key={a} value={a}>{ACTION_LABEL[a]}</option>
              ))}
            </select>

            <label className="audit-page__filter-date">
              <span>Depuis</span>
              <input
                type="date"
                value={since}
                onChange={e => { setSince(e.target.value); setPage(1); }}
              />
            </label>
            <label className="audit-page__filter-date">
              <span>Jusqu'à</span>
              <input
                type="date"
                value={until}
                onChange={e => { setUntil(e.target.value); setPage(1); }}
              />
            </label>

            {(action || since || until) && (
              <button
                type="button"
                className="audit-page__filter-reset"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            )}
          </>
        )}
        right={<span className="audit-page__count">{total} entrée{total > 1 ? 's' : ''}</span>}
      />

      {loading ? (
        <div className="audit-page__skeletons">
          <Skeleton className="audit-page__skeleton-row" />
          <Skeleton className="audit-page__skeleton-row" />
          <Skeleton className="audit-page__skeleton-row" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune entrée pour ces filtres"
          description={(action || since || until)
            ? 'Élargis la période ou réinitialise les filtres.'
            : 'Les actions sensibles apparaîtront ici dès qu\'elles auront été effectuées.'}
        />
      ) : (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Quand</th>
              <th>Qui</th>
              <th>Action</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td title={item.createdAt}>{formatRelative(item.createdAt)}</td>
                <td>{userLabel(item)}</td>
                <td><span className="audit-table__action">{ACTION_LABEL[item.action] ?? item.action}</span></td>
                <td>
                  <button
                    type="button"
                    className="audit-table__detail-btn"
                    onClick={() => setDetail(item)}
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />

      {detail && (
        <Modal
          title={ACTION_LABEL[detail.action] ?? detail.action}
          size="md"
          onClose={() => setDetail(null)}
        >
          <dl className="audit-detail">
            <div>
              <dt>Quand</dt>
              <dd>{new Date(detail.createdAt).toLocaleString('fr-FR')}</dd>
            </div>
            <div>
              <dt>Qui</dt>
              <dd>{userLabel(detail)}</dd>
            </div>
            {detail.resourceId && (
              <div>
                <dt>Ressource</dt>
                <dd><code>{detail.resourceId}</code></dd>
              </div>
            )}
            {detail.metadata && Object.keys(detail.metadata).length > 0 && (
              <div>
                <dt>Métadonnées</dt>
                <dd>
                  <pre className="audit-detail__json">
                    {JSON.stringify(detail.metadata, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
          </dl>
        </Modal>
      )}
    </section>
  );
}
