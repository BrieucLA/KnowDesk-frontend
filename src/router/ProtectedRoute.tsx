import React from 'react';
import { useAuthStore, selectIsLoggedIn } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect if not authenticated. Default: "/login" */
  redirectTo?: string;
}

/**
 * Wraps any route that requires authentication.
 * Shows a full-screen loader during store rehydration to prevent flash.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const isLoaded   = useAuthStore(s => s.isLoaded);

  if (!isLoaded) {
    return <FullScreenLoader />;
  }

  if (!isLoggedIn) {
    // In a real app with React Router: <Navigate to={redirectTo} replace />
    window.location.replace(redirectTo);
    return null;
  }

  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="loader-fullscreen" role="status" aria-label="Chargement…">
      <div className="loader-fullscreen__spinner" aria-hidden="true" />
    </div>
  );
}
