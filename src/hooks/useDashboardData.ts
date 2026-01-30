'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
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

// Batch size for pagination (Supabase default limit is 1000)
const BATCH_SIZE = 1000;

// Helper to fetch all rows with pagination loop (bypasses Supabase 1000 row limit)
async function fetchAllWithPagination<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  filters: {
    channels?: string[];
    sentiments?: string[];
    contentTypes?: string[];
    categories?: string[];
    tiers?: string[];
    startDate?: string;
    endDate?: string;
  }
): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(columns);

    // Apply filters
    if (filters.channels && filters.channels.length > 0) {
      query = query.in('channel', filters.channels);
    }
    if (filters.sentiments && filters.sentiments.length > 0) {
      query = query.in('sentiment', filters.sentiments);
    }
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      query = query.in('content_type', filters.contentTypes);
    }
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }
    if (filters.tiers && filters.tiers.length > 0) {
      query = query.in('tier', filters.tiers);
    }
    if (filters.startDate) {
      query = query.gte('published_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('published_date', filters.endDate);
    }

    // Apply pagination
    query = query.range(from, from + BATCH_SIZE - 1);

    const { data: batch, error } = await query;
    if (error) throw error;

    if (batch && batch.length > 0) {
      allData = allData.concat(batch as T[]);
      from += BATCH_SIZE;
      hasMore = batch.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

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
  availableTiers: string[];
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
    availableTiers: [],
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
      // Build date filters
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (filters.year !== null && filters.month !== null) {
        const filterDate = new Date(filters.year, filters.month - 1, 1);
        startDate = format(startOfMonth(filterDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(filterDate), 'yyyy-MM-dd');
      } else if (filters.year !== null) {
        startDate = `${filters.year}-01-01`;
        endDate = `${filters.year}-12-31`;
      }

      // Fetch ALL mentions with pagination loop (bypasses 1000 row limit)
      const mentions = await withTimeout(
        fetchAllWithPagination<Mention>(supabase, 'mentions', '*', {
          channels: filters.channels.length > 0 ? filters.channels : undefined,
          sentiments: filters.sentiments.length > 0 ? filters.sentiments : undefined,
          contentTypes: filters.contentTypes.length > 0 ? filters.contentTypes : undefined,
          categories: filters.categories.length > 0 ? filters.categories : undefined,
          tiers: filters.tiers.length > 0 ? filters.tiers : undefined,
          startDate,
          endDate,
        })
      );

      const totalArticles = mentions.length;

      // Fetch all data for available years (without filters) - with pagination
      const allYearData = await fetchAllWithPagination<{ published_date: string }>(
        supabase, 'mentions', 'published_date', {}
      );
      const yearsSet = new Set<number>();
      allYearData.forEach((m) => {
        const year = new Date(m.published_date).getFullYear();
        if (!isNaN(year)) yearsSet.add(year);
      });
      const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

      // Fetch available tiers from data (without filters)
      const allTierData = await fetchAllWithPagination<{ tier: string | null }>(
        supabase, 'mentions', 'tier', {}
      );
      const tiersSet = new Set<string>();
      allTierData.forEach((m) => {
        if (m.tier) tiersSet.add(m.tier);
      });
      const availableTiers = Array.from(tiersSet).sort();

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

        // Fetch previous month data with pagination
        const prevMentions = await fetchAllWithPagination<Mention>(
          supabase, 'mentions', '*', {
            channels: filters.channels.length > 0 ? filters.channels : undefined,
            sentiments: filters.sentiments.length > 0 ? filters.sentiments : undefined,
            contentTypes: filters.contentTypes.length > 0 ? filters.contentTypes : undefined,
            categories: filters.categories.length > 0 ? filters.categories : undefined,
            tiers: filters.tiers.length > 0 ? filters.tiers : undefined,
            startDate: prevStartDate,
            endDate: prevEndDate,
          }
        );

        if (prevMentions.length > 0) {
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
        const prevCatStartDate = format(startOfMonth(prevDate), 'yyyy-MM-dd');
        const prevCatEndDate = format(endOfMonth(prevDate), 'yyyy-MM-dd');

        // Fetch previous month categories with pagination
        const prevCatMentions = await fetchAllWithPagination<{ category: string }>(
          supabase, 'mentions', 'category', {
            channels: filters.channels.length > 0 ? filters.channels : undefined,
            sentiments: filters.sentiments.length > 0 ? filters.sentiments : undefined,
            contentTypes: filters.contentTypes.length > 0 ? filters.contentTypes : undefined,
            categories: filters.categories.length > 0 ? filters.categories : undefined,
            tiers: filters.tiers.length > 0 ? filters.tiers : undefined,
            startDate: prevCatStartDate,
            endDate: prevCatEndDate,
          }
        );

        if (prevCatMentions.length > 0) {
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
        availableTiers,
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
