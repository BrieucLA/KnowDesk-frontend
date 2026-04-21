import { useEffect, useReducer, useCallback } from 'react';
import { apiClient }       from '../../../shared/lib/apiClient';
import type { DashboardData } from '../types';
import type { AsyncState }    from '../../../shared/types';

type State  = AsyncState<DashboardData>;
type Action =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: DashboardData }
  | { type: 'ERROR';   message: string };

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case 'LOADING': return { status: 'loading' };
    case 'SUCCESS': return { status: 'success', data: action.data };
    case 'ERROR':   return { status: 'error',   message: action.message };
  }
}

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const data = await apiClient.get<DashboardData>('/dashboard');
      dispatch({ type: 'SUCCESS', data });
    } catch (err) {
      dispatch({
        type:    'ERROR',
        message: err instanceof Error ? err.message : 'Erreur inconnue.',
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { state, refetch: load };
}
