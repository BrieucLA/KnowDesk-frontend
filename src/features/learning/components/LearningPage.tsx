import { LearningAdminPage } from './LearningAdminPage';
import { useAuthStore, selectUserRole } from '../../../store/authStore';

interface LearningPageProps {
  onEditPath: (id: string) => void;
}

/**
 * Routeur de la page /learning :
 * - admin/manager → liste des parcours (LearningAdminPage)
 * - advisor       → "Mes formations" (commit C — pour l'instant placeholder)
 *
 * L'édition d'un parcours (modules, ressources, quiz, assignations) se
 * fait sur une route séparée gérée par App.tsx via onEditPath.
 */
export function LearningPage({ onEditPath }: LearningPageProps) {
  const role = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';

  if (!isAdmin) {
    return (
      <div className="learning-page" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Mes formations</h1>
        <p style={{ color: 'var(--neutral-500)' }}>
          Vue conseiller en cours de construction (commit suivant).
        </p>
      </div>
    );
  }

  return <LearningAdminPage onEditPath={onEditPath} />;
}
