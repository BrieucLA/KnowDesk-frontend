import { apiClient } from './apiClient';

export interface BulkDeleteResponse {
  deleted: string[];
  blocked: Array<{ id: string; title: string; pathNames: string[] }>;
}

const CHUNK_SIZE = 100;

/**
 * Appelle un endpoint bulk-delete en plusieurs lots quand on dépasse la
 * limite serveur (100 ids par appel). Les résultats sont agrégés
 * transparent à l'appelant — le toast récap utilise le total cumulé.
 *
 * Pas de parallélisation : on enchaîne séquentiellement pour ne pas
 * saturer la DB sur un cleanup de plusieurs centaines d'items.
 */
export async function bulkDeleteInChunks(
  endpoint: string,
  ids: string[],
): Promise<BulkDeleteResponse> {
  const aggregated: BulkDeleteResponse = { deleted: [], blocked: [] };
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const res = await apiClient.post<BulkDeleteResponse>(endpoint, { ids: chunk });
    aggregated.deleted.push(...res.deleted);
    aggregated.blocked.push(...res.blocked);
  }
  return aggregated;
}
