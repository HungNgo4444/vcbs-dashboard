'use client';

import { useState, useEffect } from 'react';
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
import { AdminBar } from '@/components/admin/AdminBar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { ArrowRight, MessageSquare, TrendingUp } from 'lucide-react';

type ViewMode = 'mentions' | 'engagement';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { filters, appliedFilters, updateFilters, applyFilters, resetFilters } = useFilters();
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('mentions');

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

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
  } = useDashboardData(appliedFilters, !authLoading && !!user);

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
                />
              </ChartCard>

              {/* SOV Line Chart */}
              <ChartCard
                title="Share of Voice theo Kênh"
                subtitle={`Xu hướng ${viewMode === 'mentions' ? 'đề cập' : 'tương tác'} - ${getFilterPeriodText()}`}
              >
                <SOVLineChart data={viewMode === 'mentions' ? sovData : engagementSovData} />
              </ChartCard>

              {/* Content Type Stacked Chart */}
              <ChartCard
                title="Phân bổ Nội dung theo Thể loại"
                subtitle="Tỷ lệ % theo từng tháng"
              >
                <ContentTypeStackChart data={contentTypeData} />
              </ChartCard>
            </div>

            {/* Charts Row 2: Category + Articles Table */}
            <div className="grid grid-cols-[1fr_1.5fr] gap-5 mb-5">
              {/* Category Bar Chart */}
              <ChartCard
                title="Đề cập theo Category"
                subtitle="Top categories & thay đổi xếp hạng"
              >
                <CategoryBarChart data={categoryData} />
              </ChartCard>

              {/* Articles Table */}
              <ChartCard
                title="Bảng tin Chi tiết"
                subtitle="Danh sách bài viết mới nhất"
                action={
                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-forest-800 font-semibold text-xs bg-forest-50 border border-forest-200 hover:bg-forest-100 transition-colors">
                    Xem tất cả
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              >
                <ArticlesTable
                  articles={articles}
                  maxHeight={600}
                />
              </ChartCard>
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
