'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  DashboardFilters,
  MetricsSummary,
  SOVDataPoint,
  ContentTypeDataPoint,
  CategoryDataPoint,
  Mention,
} from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Timeout for fetch requests (30 seconds)
const FETCH_TIMEOUT = 30000;

// Engagement SOV type for toggle feature
export interface EngagementSOVDataPoint {
  date: string;
  'Báo mạng': number;
  'Facebook': number;
  'Youtube': number;
  'Tiktok': number;
}

// Channel distribution for donut chart
export interface ChannelDistribution {
  name: string;
  mentions: number;
  engagement: number;
}

interface DashboardData {
  metrics: MetricsSummary | null;
  metricsComparison: {
    mentions: number;
    engagement: number;
    positive: number;
    negative: number;
    nsr: number;
  };
  sovData: SOVDataPoint[];
  engagementSovData: EngagementSOVDataPoint[];
  channelDistribution: ChannelDistribution[];
  contentTypeData: ContentTypeDataPoint[];
  categoryData: CategoryDataPoint[];
  articles: Mention[];
  totalArticles: number;
  availableYears: number[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(filters: DashboardFilters, enabled: boolean = true) {
  const [data, setData] = useState<DashboardData>({
    metrics: null,
    metricsComparison: { mentions: 0, engagement: 0, positive: 0, negative: 0, nsr: 0 },
    sovData: [],
    engagementSovData: [],
    channelDistribution: [],
    contentTypeData: [],
    categoryData: [],
    articles: [],
    totalArticles: 0,
    availableYears: [],
    isLoading: true,
    error: null,
  });

  const supabase = useMemo(() => createClient(), []);
  const requestIdRef = useRef<number>(0);

  // Serialize filters for stable dependency comparison
  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    // Increment request ID to invalidate previous requests
    const currentRequestId = ++requestIdRef.current;

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    // Helper to check if this request is still valid
    const isStale = () => requestIdRef.current !== currentRequestId;

    // Helper to add timeout to promises (accepts PromiseLike for Supabase compatibility)
    const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number = FETCH_TIMEOUT): Promise<T> => {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout - vui lòng thử lại')), timeoutMs)
        ),
      ]);
    };

    try {
      // Build base query with filters
      let baseQuery = supabase.from('mentions').select('*', { count: 'exact' });

      // Apply array filters using .in() for multiple values
      if (filters.channels.length > 0) {
        baseQuery = baseQuery.in('channel', filters.channels);
      }
      if (filters.sentiments.length > 0) {
        baseQuery = baseQuery.in('sentiment', filters.sentiments);
      }
      if (filters.contentTypes.length > 0) {
        baseQuery = baseQuery.in('content_type', filters.contentTypes);
      }
      if (filters.categories.length > 0) {
        baseQuery = baseQuery.in('category', filters.categories);
      }

      // Month/Year filter
      if (filters.year !== null && filters.month !== null) {
        const filterDate = new Date(filters.year, filters.month - 1, 1);
        const startDate = format(startOfMonth(filterDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(filterDate), 'yyyy-MM-dd');
        baseQuery = baseQuery.gte('published_date', startDate).lte('published_date', endDate);
      } else if (filters.year !== null) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        baseQuery = baseQuery.gte('published_date', startDate).lte('published_date', endDate);
      }

      // Fetch current period data with timeout
      const { data: allMentions, error: mentionsError, count } = await withTimeout(baseQuery);

      if (mentionsError) throw mentionsError;

      const mentions = allMentions || [];
      const totalArticles = count || 0;

      // Fetch all data for available years (without filters)
      const { data: allData } = await supabase.from('mentions').select('published_date');
      const yearsSet = new Set<number>();
      (allData || []).forEach((m) => {
        const year = new Date(m.published_date).getFullYear();
        if (!isNaN(year)) yearsSet.add(year);
      });
      const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

      // Calculate metrics
      const metrics: MetricsSummary = {
        total_mentions: mentions.length,
        total_engagement: mentions.reduce((sum, m) => sum + (m.engagement || 0), 0),
        total_likes: mentions.reduce((sum, m) => sum + (m.likes || 0), 0),
        total_shares: mentions.reduce((sum, m) => sum + (m.shares || 0), 0),
        total_comments: mentions.reduce((sum, m) => sum + (m.comments || 0), 0),
        positive_count: mentions.filter((m) => m.sentiment === 'Tích cực').length,
        negative_count: mentions.filter((m) => m.sentiment === 'Tiêu cực').length,
        neutral_count: mentions.filter((m) => m.sentiment === 'Trung tính').length,
        nsr_score: 0,
      };

      // Fix NSR formula: (positive - negative) / (positive + negative) * 100
      const sentimentTotal = metrics.positive_count + metrics.negative_count;
      if (sentimentTotal > 0) {
        metrics.nsr_score = Math.round(
          ((metrics.positive_count - metrics.negative_count) / sentimentTotal) * 100 * 10
        ) / 10;
      }

      // Calculate previous month metrics for comparison
      let metricsComparison = { mentions: 0, engagement: 0, positive: 0, negative: 0, nsr: 0 };

      if (filters.year !== null && filters.month !== null) {
        const prevDate = subMonths(new Date(filters.year, filters.month - 1, 1), 1);
        const prevStartDate = format(startOfMonth(prevDate), 'yyyy-MM-dd');
        const prevEndDate = format(endOfMonth(prevDate), 'yyyy-MM-dd');

        let prevQuery = supabase.from('mentions').select('*');
        prevQuery = prevQuery.gte('published_date', prevStartDate).lte('published_date', prevEndDate);

        // Apply same filters
        if (filters.channels.length > 0) {
          prevQuery = prevQuery.in('channel', filters.channels);
        }
        if (filters.sentiments.length > 0) {
          prevQuery = prevQuery.in('sentiment', filters.sentiments);
        }
        if (filters.contentTypes.length > 0) {
          prevQuery = prevQuery.in('content_type', filters.contentTypes);
        }
        if (filters.categories.length > 0) {
          prevQuery = prevQuery.in('category', filters.categories);
        }

        const { data: prevMentions } = await prevQuery;

        if (prevMentions && prevMentions.length > 0) {
          const prevTotal = prevMentions.length;
          const prevEngagement = prevMentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
          const prevPositive = prevMentions.filter((m) => m.sentiment === 'Tích cực').length;
          const prevNegative = prevMentions.filter((m) => m.sentiment === 'Tiêu cực').length;
          const prevSentimentTotal = prevPositive + prevNegative;
          const prevNsr = prevSentimentTotal > 0
            ? ((prevPositive - prevNegative) / prevSentimentTotal) * 100
            : 0;

          metricsComparison = {
            mentions: prevTotal > 0 ? Math.round(((metrics.total_mentions - prevTotal) / prevTotal) * 100 * 10) / 10 : 0,
            engagement: prevEngagement > 0 ? Math.round(((metrics.total_engagement - prevEngagement) / prevEngagement) * 100 * 10) / 10 : 0,
            positive: prevPositive > 0 ? Math.round(((metrics.positive_count - prevPositive) / prevPositive) * 100 * 10) / 10 : 0,
            negative: prevNegative > 0 ? Math.round(((metrics.negative_count - prevNegative) / prevNegative) * 100 * 10) / 10 : 0,
            nsr: Math.round((metrics.nsr_score - prevNsr) * 10) / 10,
          };
        }
      }

      // Calculate SOV data (by date and channel) - Mentions
      const sovMap = new Map<string, SOVDataPoint>();
      const engagementSovMap = new Map<string, EngagementSOVDataPoint>();

      mentions.forEach((m) => {
        const dateKey = format(parseISO(m.published_date), 'dd/MM');

        // Mentions SOV
        if (!sovMap.has(dateKey)) {
          sovMap.set(dateKey, {
            date: dateKey,
            'Báo mạng': 0,
            'Facebook': 0,
            'Youtube': 0,
            'Tiktok': 0,
          });
        }
        const point = sovMap.get(dateKey)!;
        const channel = m.channel as keyof Omit<SOVDataPoint, 'date'>;
        if (channel in point) {
          point[channel]++;
        }

        // Engagement SOV
        if (!engagementSovMap.has(dateKey)) {
          engagementSovMap.set(dateKey, {
            date: dateKey,
            'Báo mạng': 0,
            'Facebook': 0,
            'Youtube': 0,
            'Tiktok': 0,
          });
        }
        const engPoint = engagementSovMap.get(dateKey)!;
        if (channel in engPoint) {
          engPoint[channel] += m.engagement || 0;
        }
      });

      const sortByDate = (a: { date: string }, b: { date: string }) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA !== monthB ? monthA - monthB : dayA - dayB;
      };

      const sovData = Array.from(sovMap.values()).sort(sortByDate);
      const engagementSovData = Array.from(engagementSovMap.values()).sort(sortByDate);

      // Calculate channel distribution for donut chart
      const channelMap = new Map<string, { mentions: number; engagement: number }>();
      mentions.forEach((m) => {
        const channel = m.channel;
        if (!channelMap.has(channel)) {
          channelMap.set(channel, { mentions: 0, engagement: 0 });
        }
        const entry = channelMap.get(channel)!;
        entry.mentions++;
        entry.engagement += m.engagement || 0;
      });

      const channelDistribution: ChannelDistribution[] = Array.from(channelMap.entries()).map(
        ([name, data]) => ({
          name,
          mentions: data.mentions,
          engagement: data.engagement,
        })
      );

      // Calculate content type distribution by month
      const contentTypeMap = new Map<string, { total: number; types: Record<string, number> }>();
      mentions.forEach((m) => {
        const monthKey = format(parseISO(m.published_date), 'MMM');
        if (!contentTypeMap.has(monthKey)) {
          contentTypeMap.set(monthKey, {
            total: 0,
            types: {
              'Tin tức thị trường': 0,
              'Bán hàng/Môi giới': 0,
              'Tin trực tiếp về thương hiệu': 0,
            },
          });
        }
        const entry = contentTypeMap.get(monthKey)!;
        entry.total++;
        if (m.content_type in entry.types) {
          entry.types[m.content_type]++;
        }
      });

      const contentTypeData: ContentTypeDataPoint[] = Array.from(contentTypeMap.entries()).map(
        ([month, data]) => ({
          month,
          'Tin tức thị trường': Math.round((data.types['Tin tức thị trường'] / data.total) * 100) || 0,
          'Bán hàng/Môi giới': Math.round((data.types['Bán hàng/Môi giới'] / data.total) * 100) || 0,
          'Tin trực tiếp về thương hiệu':
            Math.round((data.types['Tin trực tiếp về thương hiệu'] / data.total) * 100) || 0,
        })
      );

      // Calculate category data with rank changes
      const categoryMap = new Map<string, number>();
      mentions.forEach((m) => {
        categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1);
      });

      // Get previous month category rankings for comparison
      const prevCategoryRanks = new Map<string, number>();
      if (filters.year !== null && filters.month !== null) {
        const prevDate = subMonths(new Date(filters.year, filters.month - 1, 1), 1);
        const prevStartDate = format(startOfMonth(prevDate), 'yyyy-MM-dd');
        const prevEndDate = format(endOfMonth(prevDate), 'yyyy-MM-dd');

        let prevCatQuery = supabase.from('mentions').select('category');
        prevCatQuery = prevCatQuery.gte('published_date', prevStartDate).lte('published_date', prevEndDate);

        // Apply same filters
        if (filters.channels.length > 0) {
          prevCatQuery = prevCatQuery.in('channel', filters.channels);
        }
        if (filters.sentiments.length > 0) {
          prevCatQuery = prevCatQuery.in('sentiment', filters.sentiments);
        }
        if (filters.contentTypes.length > 0) {
          prevCatQuery = prevCatQuery.in('content_type', filters.contentTypes);
        }
        if (filters.categories.length > 0) {
          prevCatQuery = prevCatQuery.in('category', filters.categories);
        }

        const { data: prevCatMentions } = await prevCatQuery;

        if (prevCatMentions && prevCatMentions.length > 0) {
          const prevCatMap = new Map<string, number>();
          prevCatMentions.forEach((m) => {
            prevCatMap.set(m.category, (prevCatMap.get(m.category) || 0) + 1);
          });

          // Sort and assign ranks
          const prevSorted = Array.from(prevCatMap.entries())
            .sort((a, b) => b[1] - a[1]);
          prevSorted.forEach(([name], idx) => {
            prevCategoryRanks.set(name, idx + 1);
          });
        }
      }

      const categoryData: CategoryDataPoint[] = Array.from(categoryMap.entries())
        .map(([name, mentions]) => ({
          name,
          mentions,
          change: null as number | null,
          rank: 0,
        }))
        .sort((a, b) => b.mentions - a.mentions)
        .map((item, idx) => {
          const currentRank = idx + 1;
          const prevRank = prevCategoryRanks.get(item.name);
          // change = previousRank - currentRank (positive = improved, negative = declined)
          // If prevRank is undefined, means no data from previous month -> show "-"
          const change = prevRank !== undefined ? prevRank - currentRank : null;
          return { ...item, rank: currentRank, change };
        });

      // Get all articles for scrolling (no pagination needed now)
      const sortedMentions = [...mentions].sort(
        (a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
      );

      // Only update if this request is still current
      if (isStale()) return;

      setData({
        metrics,
        metricsComparison,
        sovData,
        engagementSovData,
        channelDistribution,
        contentTypeData,
        categoryData,
        articles: sortedMentions,
        totalArticles,
        availableYears,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      // Ignore if this request is stale
      if (isStale()) return;

      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, filtersKey]);

  useEffect(() => {
    console.log('[useDashboardData] Effect triggered, enabled:', enabled);
    if (enabled) {
      console.log('[useDashboardData] Starting fetchData...');
      fetchData();
    }
  }, [fetchData, enabled]);

  return { ...data, refetch: fetchData };
}
