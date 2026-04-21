import React, { useState, useCallback } from 'react';
import { cn }             from '../../../shared/lib/cn';
import { formatRelative } from '../../../shared/lib/formatDate';
import type { Member }    from '../types';
import type { UserRole }  from '../../../shared/types';

interface MemberRowProps {
  member:     Member;
  isMutating: boolean;
  currentUserId: string;
  onChangeRole: (id: string, role: UserRole) => void;
  onDisable:    (id: string) => void;
  onResend:     (id: string) => void;
}

const STATUS_CONFIG = {
  active:   { label: 'Actif',             className: 'member-status member-status--active'   },
  invited:  { label: 'Invitation envoyée', className: 'member-status member-status--invited'  },
  expired:  { label: 'Invitation expirée', className: 'member-status member-status--expired'  },
  disabled: { label: 'Désactivé',          className: 'member-status member-status--disabled' },
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin:   'Admin',
  manager: 'Manager',
  advisor: 'Conseiller',
};

export function MemberRow({
  member, isMutating, currentUserId,
  onChangeRole, onDisable, onResend,
}: MemberRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrentUser = member.id === currentUserId;
  const statusCfg     = STATUS_CONFIG[member.status];
  const initials      = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeRole(member.id, e.target.value as UserRole);
  }, [member.id, onChangeRole]);

  return (
    <tr className={cn('member-row', isMutating && 'member-row--mutating', member.status === 'disabled' && 'member-row--disabled')}>

      {/* Identity */}
      <td className="member-row__cell member-row__identity">
        <div
          className="member-avatar"
          aria-hidden="true"
          style={{ opacity: member.status === 'disabled' ? 0.4 : 1 }}
        >
          {initials}
        </div>
        <div className="member-row__name-wrap">
          <span className="member-row__name">
            {member.firstName} {member.lastName}
            {isCurrentUser && (
              <span className="member-row__you" aria-label="Vous"> (vous)</span>
            )}
          </span>
          <span className="member-row__email">{member.email}</span>
        </div>
      </td>

      {/* Role selector */}
      <td className="member-row__cell">
        {isCurrentUser || member.status === 'disabled' ? (
          <span className="member-row__role-static">
            {ROLE_LABELS[member.role]}
          </span>
        ) : (
          <select
            className="member-row__role-select"
            value={member.role}
            onChange={handleRoleChange}
            disabled={isMutating}
            aria-label={`Rôle de ${member.firstName}`}
          >
            <option value="advisor">Conseiller</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </td>

      {/* Status */}
      <td className="member-row__cell">
        <span className={statusCfg.className}>
          {statusCfg.label}
        </span>
      </td>

      {/* Joined / Invited date */}
      <td className="member-row__cell member-row__date">
        {member.status === 'active' && member.joinedAt ? (
          <time dateTime={member.joinedAt}>
            {formatRelative(member.joinedAt)}
          </time>
        ) : (
          <time dateTime={member.invitedAt} className="member-row__invited-at">
            Invité {formatRelative(member.invitedAt)}
          </time>
        )}
      </td>

      {/* Actions */}
      <td className="member-row__cell member-row__actions">
        {isMutating ? (
          <span className="member-row__spinner" aria-label="En cours…" />
        ) : (
          <>
            {(member.status === 'invited' || member.status === 'expired') && (
              <button
                type="button"
                className="member-action member-action--resend"
                onClick={() => onResend(member.id)}
                aria-label={`Renvoyer l'invitation à ${member.firstName}`}
              >
                Renvoyer
              </button>
            )}
            {member.status === 'active' && !isCurrentUser && (
              <button
                type="button"
                className="member-action member-action--danger"
                onClick={() => onDisable(member.id)}
                aria-label={`Désactiver le compte de ${member.firstName} ${member.lastName}`}
              >
                Désactiver
              </button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
