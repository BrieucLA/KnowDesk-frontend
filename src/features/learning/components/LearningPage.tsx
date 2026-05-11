import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore, selectUserRole } from '../../../store/authStore';

/**
 * Placeholder Learning. Le vrai contenu (liste admin + édition,
 * vue conseiller + player) sera implémenté dans des commits suivants.
 * Affiché pour valider que la navigation et les routes fonctionnent.
 */
export function LearningPage() {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';

  return (
    <div className="learning-page">
      <PageHeader
        title="Formations"
        subtitle={isAdmin
          ? "Parcours de formation pour vos conseillers, basés sur votre base de connaissance."
          : "Vos formations en cours et à renouveler."}
      />
      <p style={{ color: 'var(--neutral-500)', padding: '24px 0' }}>
        {isAdmin
          ? 'Vue admin en cours de construction. L\'API backend est déjà disponible (cf docs/PRD-learning-v1.md).'
          : 'Vue conseiller en cours de construction.'}
      </p>
    </div>
  );
}
