import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import type { Notification, NotificationMeta } from '../types';

interface UseNotificationsReturn {
  notifications:  Notification[];
  unreadCount:    number;
  loading:        boolean;
  markAsRead:     (id: string) => Promise<void>;
  markAllAsRead:  () => Promise<void>;
  refetch:        () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000; // polling toutes les 30s

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Notification[]>('/notifications?perPage=20');
      setNotifications(res);
    } catch {
      // Silencieux — ne pas bloquer l'UI si les notifs échouent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(res.count);
    } catch {
      // Silencieux
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Chargement initial + polling
  useEffect(() => {
    refetch();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {});
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silencieux
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // Silencieux
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch };
}
