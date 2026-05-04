import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Démontre les composants React Testing Library entre tests pour éviter
// les fuites de DOM (sinon les `screen` queries voient les renders précédents).
afterEach(() => {
  cleanup();
  // Reset sessionStorage pour isoler chaque test du store persisté.
  sessionStorage.clear();
});
