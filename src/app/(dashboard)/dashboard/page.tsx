'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFilters } from '@/hooks/useFilters';
import { useDashboardData } from '@/hooks/useDashboardData';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { SOVLineChart } from '@/components/dashboard/SOVLineChart';
import { ChannelDonutChart } from '@/components/dashboard/ChannelDonutChart';
import { ContentTypeStackChart } from '@/components/dashboard/ContentTypeStackChart';
import { CategoryBarChart } from '@/components/dashboard/CategoryBarChart';
import { ArticlesTable } from '@/components/dashboard/ArticlesTable';
import { MonthlyReportSection } from '@/components/dashboard/MonthlyReportSection';
import { AdminBar } from '@/components/admin/AdminBar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { MessageSquare, TrendingUp, X, Search } from 'lucide-react';

type ViewMode = 'mentions' | 'engagement';

// Cross-filter state interface
interface CrossFilter {
  date: string | null;        // "dd/MM" from Line Chart
  channel: string | null;     // Channel name from Donut Chart
  category: string | null;    // Category from Bar Chart
  contentType: string | null; // Content Type from Stack Chart
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { filters, appliedFilters, updateFilters, applyFilters, resetFilters } = useFilters();
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('mentions');
  const [contentSearch, setContentSearch] = useState('');

  // Cross-filter state for Power BI-like filtering
  const [crossFilter, setCrossFilter] = useState<CrossFilter>({
    date: null,
    channel: null,
    category: null,
    contentType: null,
  });

  // Cross-filter handlers
  const handleDateClick = (date: string) => {
    setCrossFilter(prev => ({
      ...prev,
      date: prev.date === date ? null : date,
    }));
  };

  const handleChannelClick = (channel: string) => {
    setCrossFilter(prev => ({
      ...prev,
      channel: prev.channel === channel ? null : channel,
    }));
  };

  const handleCategoryClick = (category: string) => {
    setCrossFilter(prev => ({
      ...prev,
      category: prev.category === category ? null : category,
    }));
  };

  const handleContentTypeClick = (contentType: string) => {
    setCrossFilter(prev => ({
      ...prev,
      contentType: prev.contentType === contentType ? null : contentType,
    }));
  };

  const clearCrossFilter = () => {
    setCrossFilter({ date: null, channel: null, category: null, contentType: null });
  };

  const hasCrossFilter = crossFilter.date || crossFilter.channel || crossFilter.category || crossFilter.contentType;

  // Debug logging
  console.log('[Dashboard] Auth state:', { authLoading, user: user?.id, isAdmin });

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Dashboard] No user, redirecting to login');
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const dataEnabled = !authLoading && !!user;
  console.log('[Dashboard] Data fetch enabled:', dataEnabled);

  // Only fetch data when user is authenticated
  const {
    metrics,
    metricsComparison,
    sovData,
    engagementSovData,
    channelDistribution,
    contentTypeData,
    categoryData,
    articles,
    availableYears,
    isLoading,
    error,
    refetch,
  } = useDashboardData(appliedFilters, dataEnabled);

  // Filter articles client-side based on cross-filter (Power BI-like) and content search
  const filteredArticles = useMemo(() => {
    let result = articles;

    // Apply cross-filter
    if (hasCrossFilter) {
      result = result.filter(article => {
        // Date filter (format: "dd/MM")
        if (crossFilter.date) {
          const articleDate = format(parseISO(article.published_date), 'dd/MM');
          if (articleDate !== crossFilter.date) return false;
        }
        // Channel filter
        if (crossFilter.channel && article.channel !== crossFilter.channel) return false;
        // Category filter
        if (crossFilter.category && article.category !== crossFilter.category) return false;
        // Content type filter
        if (crossFilter.contentType && article.content_type !== crossFilter.contentType) return false;

        return true;
      });
    }

    // Apply content search
    if (contentSearch.trim()) {
      const searchLower = contentSearch.toLowerCase().trim();
      result = result.filter(article =>
        article.content?.toLowerCase().includes(searchLower) ||
        article.title?.toLowerCase().includes(searchLower) ||
        article.ai_summary?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [articles, crossFilter, hasCrossFilter, contentSearch]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Upload failed: ${result.error}\n${result.errors?.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join('\n') || ''}`);
      } else {
        alert(`Upload thành công! Đã import ${result.successCount} records.`);
        refetch();
      }
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  // Get display text for current filter period
  const getFilterPeriodText = () => {
    if (appliedFilters.month !== null && appliedFilters.year !== null) {
      return `Tháng ${appliedFilters.month}/${appliedFilters.year}`;
    }
    if (appliedFilters.year !== null) {
      return `Năm ${appliedFilters.year}`;
    }
    return 'Tất cả thời gian';
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect is in progress)
  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-red-600 bg-red-50 px-6 py-4 rounded-lg border border-red-200">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin Bar */}
      {isAdmin && <AdminBar onUpload={handleUpload} isUploading={isUploading} />}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={updateFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        availableYears={availableYears}
      />

      {/* Main Content */}
      <main className="px-10 py-7">
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-5 gap-4 mb-7">
              <MetricCard
                title="Tổng đề cập"
                value={metrics?.total_mentions || 0}
                change={metricsComparison.mentions}
                icon="📢"
              />
              <MetricCard
                title="Tổng tương tác"
                value={metrics?.total_engagement || 0}
                change={metricsComparison.engagement}
                icon="💬"
              />
              <MetricCard
                title="Tích cực"
                value={metrics?.positive_count || 0}
                change={metricsComparison.positive}
                icon="😊"
              />
              <MetricCard
                title="Tiêu cực"
                value={metrics?.negative_count || 0}
                change={metricsComparison.negative}
                icon="😞"
                isNegativeMetric
              />
              <MetricCard
                title="NSR Score"
                value={metrics?.nsr_score || 0}
                change={metricsComparison.nsr}
                icon="📈"
                suffix="%"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setViewMode('mentions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[13px] transition-all ${
                  viewMode === 'mentions'
                    ? 'bg-forest-700 text-white shadow-md'
                    : 'bg-white text-forest-700 border-2 border-forest-200 hover:bg-forest-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Đề cập
              </button>
              <button
                onClick={() => setViewMode('engagement')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[13px] transition-all ${
                  viewMode === 'engagement'
                    ? 'bg-forest-700 text-white shadow-md'
                    : 'bg-white text-forest-700 border-2 border-forest-200 hover:bg-forest-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Tương tác
              </button>
            </div>

            {/* Cross-Filter Indicator */}
            {hasCrossFilter && (
              <div className="flex items-center gap-2 mb-5 px-4 py-2.5 bg-forest-50 rounded-lg border border-forest-200">
                <span className="text-xs text-forest-700 font-medium">Đang lọc:</span>
                {crossFilter.date && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-forest-800 border border-forest-200">
                    Ngày: {crossFilter.date}
                    <button onClick={() => setCrossFilter(prev => ({ ...prev, date: null }))} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {crossFilter.channel && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-forest-800 border border-forest-200">
                    {crossFilter.channel}
                    <button onClick={() => setCrossFilter(prev => ({ ...prev, channel: null }))} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {crossFilter.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-forest-800 border border-forest-200">
                    {crossFilter.category}
                    <button onClick={() => setCrossFilter(prev => ({ ...prev, category: null }))} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {crossFilter.contentType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-forest-800 border border-forest-200">
                    {crossFilter.contentType}
                    <button onClick={() => setCrossFilter(prev => ({ ...prev, contentType: null }))} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearCrossFilter}
                  className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Charts Row 1: Donut + Line Chart + Content Type */}
            <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-5 mb-5">
              {/* Channel Donut Chart */}
              <ChartCard
                title="Cơ cấu đề cập theo Kênh"
                subtitle={viewMode === 'mentions' ? 'Tỷ lệ % đề cập' : 'Tỷ lệ % tương tác'}
              >
                <ChannelDonutChart
                  data={channelDistribution}
                  dataKey={viewMode === 'mentions' ? 'mentions' : 'engagement'}
                  onChannelClick={handleChannelClick}
                  selectedChannel={crossFilter.channel}
                />
              </ChartCard>

              {/* SOV Line Chart */}
              <ChartCard
                title="Share of Voice theo Kênh"
                subtitle={`Xu hướng ${viewMode === 'mentions' ? 'đề cập' : 'tương tác'} - ${getFilterPeriodText()}`}
              >
                <SOVLineChart
                  data={viewMode === 'mentions' ? sovData : engagementSovData}
                  onDateClick={handleDateClick}
                  selectedDate={crossFilter.date}
                />
              </ChartCard>

              {/* Content Type Stacked Chart */}
              <ChartCard
                title="Phân bổ Nội dung theo Thể loại"
                subtitle="Tỷ lệ % theo từng tháng"
              >
                <ContentTypeStackChart
                  data={contentTypeData}
                  onContentTypeClick={handleContentTypeClick}
                  selectedContentType={crossFilter.contentType}
                />
              </ChartCard>
            </div>

            {/* Charts Row 2: Category + Articles Table */}
            <div className="grid grid-cols-[1fr_1.5fr] gap-5 mb-5">
              {/* Category Bar Chart */}
              <ChartCard
                title="Đề cập theo Category"
                subtitle="Top categories & thay đổi xếp hạng"
              >
                <CategoryBarChart
                  data={categoryData}
                  onCategoryClick={handleCategoryClick}
                  selectedCategory={crossFilter.category}
                />
              </ChartCard>

              {/* Articles Table */}
              <ChartCard
                title={`Bảng tin Chi tiết${hasCrossFilter || contentSearch ? ` (${filteredArticles.length}/${articles.length})` : ''}`}
                subtitle="Danh sách bài viết mới nhất"
                action={
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nội dung..."
                      value={contentSearch}
                      onChange={(e) => setContentSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 w-[200px] rounded-md text-xs bg-forest-50 border border-forest-200 focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-300 placeholder-gray-400"
                    />
                  </div>
                }
              >
                <ArticlesTable
                  articles={filteredArticles}
                  maxHeight={600}
                />
              </ChartCard>
            </div>

            {/* Monthly Report Section */}
            <div className="mb-5">
              <MonthlyReportSection
                month={appliedFilters.month}
                year={appliedFilters.year}
                isAdmin={isAdmin}
              />
            </div>

            {/* Footer Info */}
            <div
              className="mt-6 px-6 py-4 bg-white rounded-xl flex justify-center items-center gap-6"
              style={{
                border: '1px solid #D8F3DC',
                boxShadow: '0 2px 10px rgba(27, 67, 50, 0.04)',
              }}
            >
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="text-forest-800 font-semibold">📅 Cập nhật:</span>
                {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="w-px h-4 bg-forest-100" />
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="text-forest-800 font-semibold">📊 Khoảng thời gian:</span>
                {getFilterPeriodText()}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
