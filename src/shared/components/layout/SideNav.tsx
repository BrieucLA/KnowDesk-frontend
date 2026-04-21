import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/cn';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { useNotifications } from '../../../features/notifications/hooks/useNotifications';
import { NotificationPanel } from '../../../features/notifications/components/NotificationPanel';

export type NavRoute = 'dashboard' | 'search' | 'knowledge' | 'team' | 'settings';

interface NavItem {
  id:        NavRoute;
  label:     string;
  href:      string;
  icon:      React.ReactNode;
  adminOnly?: boolean;
}

interface SideNavProps {
  active:     NavRoute;
  onNavigate: (route: NavRoute) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Accueil',   href: '/',          icon: <HomeIcon /> },
  { id: 'search',     label: 'Recherche', href: '/search',    icon: <SearchIcon /> },
  { id: 'knowledge',  label: 'Base',      href: '/knowledge', icon: <BookIcon /> },
  { id: 'team',       label: 'Équipe',    href: '/team',      icon: <TeamIcon />, adminOnly: true },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Paramètres', href: '/settings', icon: <SettingsIcon /> },
];

export function SideNav({ active, onNavigate }: SideNavProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';

  const [showNotifs, setShowNotifs] = useState(false);
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, refetch,
  } = useNotifications();

  const handleNotifOpen = useCallback(() => {
    setShowNotifs(true);
    refetch();
  }, [refetch]);

  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;
    const isActive = item.id === active;

    return (
      <li key={item.id}>
        <button
          className={cn('sidenav__item', isActive && 'sidenav__item--active')}
          onClick={() => onNavigate(item.id)}
          aria-current={isActive ? 'page' : undefined}
          title={item.label}
          aria-label={item.label}
        >
          <span className="sidenav__icon" aria-hidden="true">{item.icon}</span>
          <span className="sidenav__label">{item.label}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      <nav className="sidenav" aria-label="Navigation principale">
        {/* Logo */}
        <div className="sidenav__logo" aria-label="KnowDesk">
          <span className="sidenav__logo-mark">K</span>
        </div>

        {/* Main nav */}
        <ul className="sidenav__list" role="list">
          {NAV_ITEMS.map(renderItem)}
        </ul>

        {/* Bottom nav */}
        <ul className="sidenav__list sidenav__list--bottom" role="list">
          {/* Bouton notifications */}
          <li>
            <button
              className="sidenav__item sidenav__item--notif"
              onClick={handleNotifOpen}
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ''}`}
            >
              <span className="sidenav__icon" aria-hidden="true">
                <BellIcon />
              </span>
              {unreadCount > 0 && (
                <span className="sidenav__badge" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sidenav__label">Notifications</span>
            </button>
          </li>

          {BOTTOM_ITEMS.map(renderItem)}

          <li>
            <UserAvatar />
          </li>
        </ul>
      </nav>

      {/* Panneau notifications */}
      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </>
  );
}

function UserAvatar() {
  const user         = useAuthStore(s => s.session?.user);
  const clearSession = useAuthStore(s => s.clearSession);

  if (!user) return null;

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <button
      className="sidenav__avatar"
      onClick={clearSession}
      title={`${user.email} — Se déconnecter`}
      aria-label="Se déconnecter"
    >
      {initials}
    </button>
  );
}

// ─── Icons ─────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 7.5L9 2l7 5.5V16a.5.5 0 01-.5.5h-4V12h-5v4.5H2.5A.5.5 0 012 16V7.5z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="12.5" y1="12.5" x2="16" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 3h5a3 3 0 013 3v10a2 2 0 00-2-2H3V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
      <path d="M15 3h-5a3 3 0 00-3 3v10a2 2 0 012-2h6V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9"  cy="6"  r="3" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <circle cx="14" cy="7"  r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <circle cx="4"  cy="7"  r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <path d="M1 16c0-2.5 3.5-4 8-4s8 1.5 8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
      <path d="M7 14.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
