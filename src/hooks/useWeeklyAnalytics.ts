import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import type { WeeklyAnalyticsData } from '../types';

export function useWeeklyAnalytics(storeId: string | undefined) {
  const [weeklyAnalyticsData, setWeeklyAnalyticsData] = useState<WeeklyAnalyticsData | null>(null);
  const [loadingWeeklyAnalytics, setLoadingWeeklyAnalytics] = useState(true);
  const [endDate] = useState(new Date());
  const [startDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date;
  });

  const fetchWeeklyAnalytics = useCallback(async (id: string, start: Date, end: Date) => {
    setLoadingWeeklyAnalytics(true);
    try {
      const rpcPromise = getSupabase().rpc('get_weekly_heatmap_analytics', {
        target_store_id: id,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });

      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching weekly analytics')), 6000)
      );

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as { data: WeeklyAnalyticsData | null; error?: Error };
      if (error) throw error;
      setWeeklyAnalyticsData(data);
    } catch (err: unknown) {
      console.warn('[useWeeklyAnalytics]', (err as Error).message);
    } finally {
      setLoadingWeeklyAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchWeeklyAnalytics(storeId, startDate, endDate);
    } else {
      setLoadingWeeklyAnalytics(false);
    }
  }, [storeId, startDate, endDate, fetchWeeklyAnalytics]);

  return { weeklyAnalyticsData, loadingWeeklyAnalytics, startDate, endDate };
}
