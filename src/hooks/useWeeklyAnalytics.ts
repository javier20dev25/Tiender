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
      const { data, error } = await getSupabase().rpc('get_weekly_heatmap_analytics', {
        target_store_id: id,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      if (error) throw error;
      setWeeklyAnalyticsData(data);
    } catch (err: unknown) {
      console.error((err as Error).message);
    } finally {
      setLoadingWeeklyAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchWeeklyAnalytics(storeId, startDate, endDate);
    }
  }, [storeId, startDate, endDate, fetchWeeklyAnalytics]);

  return { weeklyAnalyticsData, loadingWeeklyAnalytics, startDate, endDate };
}
