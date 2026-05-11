import { LearningAdminPage } from './LearningAdminPage';
import { MyLearningPage }    from './MyLearningPage';
import { useAuthStore, selectUserRole } from '../../../store/authStore';

interface LearningPageProps {
  onEditPath:    (id: string) => void;
  onOpenModule:  (moduleId: string, pathId: string) => void;
}

/**
 * Routeur de la page /learning :
 *   - admin / manager → liste des parcours (LearningAdminPage)
 *   - advisor         → "Mes formations" (MyLearningPage)
 *
 * L'édition d'un parcours (modules, ressources, quiz, assignations)
 * vit sur /learning/:id/edit (gérée par App.tsx via onEditPath).
 * Le player conseiller vit sur /learning/play/:moduleId (via onOpenModule).
 */
export function LearningPage({ onEditPath, onOpenModule }: LearningPageProps) {
  const role = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';

  if (isAdmin) return <LearningAdminPage onEditPath={onEditPath} />;
  return <MyLearningPage onOpenModule={onOpenModule} />;
}
