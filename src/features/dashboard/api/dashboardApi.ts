import type { DashboardData } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export const dashboardApi = {
  get: async (token: string): Promise<DashboardData> => {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Impossible de charger le tableau de bord.');
    const body = await res.json();
    return body.data as DashboardData;
  },
};
