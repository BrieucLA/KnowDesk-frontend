import React, { useState, useMemo, useCallback } from 'react';
import { MemberRow }     from './MemberRow';
import { InviteModal }   from './InviteModal';
import { EmptyState }    from '../../../shared/components/ui/EmptyState';
import { Skeleton }      from '../../../shared/components/ui/Skeleton';
import { useMembers }    from '../hooks/useMembers';
import { useAuthStore }  from '../../../store/authStore';
import type { Member }   from '../types';
import type { UserRole } from '../../../shared/types';

type FilterTab = 'all' | 'active' | 'pending' | 'disabled';

const PLAN_LIMIT = 3; // free plan limit

/**
 * MembersPage — team management for admins.
 *
 * Features:
 *   - Member list with status filters
 *   - Role change inline (select)
 *   - Disable / resend invite actions
 *   - Invite modal with email + role picker
 *   - Plan limit warning for Free plan
 */
export function MembersPage() {
  const session      = useAuthStore(s => s.session);
  const plan         = session?.organization.plan ?? 'free';
  const currentUserId = session?.user.id ?? '';

  const { members, loading, error, mutating, invite, changeRole, disable, resend } = useMembers();

  const [filter,      setFilter]      = useState<FilterTab>('all');
  const [showInvite,  setShowInvite]  = useState(false);
  const [isInviting,  setIsInviting]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount  = members.filter(m => m.status === 'active').length;
  const atLimit      = plan === 'free' && activeCount >= PLAN_LIMIT;

  const filteredMembers = useMemo(() => {
    let list = members;

    // Tab filter
    if (filter === 'active')   list = list.filter(m => m.status === 'active');
    if (filter === 'pending')  list = list.filter(m => m.status === 'invited' || m.status === 'expired');
    if (filter === 'disabled') list = list.filter(m => m.status === 'disabled');

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)  ||
        m.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [members, filter, searchQuery]);

  const handleInvite = useCallback(async (form: Parameters<typeof invite>[0]) => {
    setIsInviting(true);
    try {
      await invite(form);
    } finally {
      setIsInviting(false);
    }
  }, [invite]);

  return (
    <div className="members-page">

      {/* Page header */}
      <div className="members-page__header">
        <div>
          <h1 className="members-page__title">Équipe</h1>
          <p className="members-page__subtitle">
            {activeCount} membre{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''}
            {plan === 'free' && ` · ${activeCount} / ${PLAN_LIMIT} (plan gratuit)`}
          </p>
        </div>

        <button
          type="button"
          className="members-page__invite-btn"
          onClick={() => setShowInvite(true)}
          disabled={atLimit}
          aria-disabled={atLimit}
          title={atLimit ? `Limite de ${PLAN_LIMIT} membres atteinte — passez au plan Pro` : undefined}
        >
          + Inviter un membre
        </button>
      </div>

      {/* Plan limit banner */}
      {atLimit && (
        <div className="members-page__limit-banner" role="alert">
          <span>
            Vous avez atteint la limite de <strong>{PLAN_LIMIT} membres</strong> du plan gratuit.
          </span>
          <a href="/settings/billing" className="members-page__upgrade-link">
            Passer au plan Pro →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="members-page__error" role="alert">
          Impossible de charger l'équipe. {error}
        </div>
      )}

      {/* Toolbar: search + filter tabs */}
      {!loading && members.length > 0 && (
        <div className="members-page__toolbar">
          <input
            type="search"
            className="members-page__search"
            placeholder="Rechercher un membre…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Rechercher dans l'équipe"
          />
          <div className="members-page__tabs" role="tablist" aria-label="Filtrer les membres">
            {(['all', 'active', 'pending', 'disabled'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={filter === tab}
                className={`members-tab ${filter === tab ? 'members-tab--active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all'      ? 'Tous'
                : tab === 'active'  ? 'Actifs'
                : tab === 'pending' ? 'En attente'
                : 'Désactivés'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="members-table-wrap" aria-busy="true" aria-label="Chargement des membres">
          <table className="members-table">
            <thead><tr>
              <th className="members-th">Membre</th>
              <th className="members-th">Rôle</th>
              <th className="members-th">Statut</th>
              <th className="members-th">Rejoint</th>
              <th className="members-th"></th>
            </tr></thead>
            <tbody>
              {[1,2,3,4].map(i => (
                <tr key={i} className="member-row">
                  <td className="member-row__cell member-row__identity">
                    <Skeleton className="member-sk-avatar" />
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <Skeleton className="member-sk-name" />
                      <Skeleton className="member-sk-email" />
                    </div>
                  </td>
                  <td><Skeleton className="member-sk-role" /></td>
                  <td><Skeleton className="member-sk-status" /></td>
                  <td><Skeleton className="member-sk-date" /></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredMembers.length === 0 && (
        <EmptyState
          title={searchQuery ? 'Aucun résultat' : 'Aucun membre dans cette catégorie'}
          description={searchQuery
            ? `Aucun membre ne correspond à "${searchQuery}".`
            : 'Invitez des collègues pour qu\'ils rejoignent votre espace.'}
          ctaLabel={!searchQuery ? '+ Inviter un membre' : undefined}
          ctaHref={undefined}
        />
      )}

      {/* Member table */}
      {!loading && filteredMembers.length > 0 && (
        <div className="members-table-wrap">
          <table className="members-table" aria-label="Liste des membres">
            <thead>
              <tr>
                <th className="members-th" scope="col">Membre</th>
                <th className="members-th" scope="col">Rôle</th>
                <th className="members-th" scope="col">Statut</th>
                <th className="members-th" scope="col">Rejoint</th>
                <th className="members-th" scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isMutating={mutating === member.id}
                  currentUserId={currentUserId}
                  onChangeRole={changeRole}
                  onDisable={disable}
                  onResend={resend}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          onInvite={handleInvite}
          onClose={() => setShowInvite(false)}
          isLoading={isInviting}
        />
      )}

    </div>
  );
}
