'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChartCard } from './ChartCard';
import { ReportTypeSidebar } from './ReportTypeSidebar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useMonthlyReports } from '@/hooks/useMonthlyReports';
import { FileText, Edit2, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { MonthlyReport, ReportType } from '@/types';
import { REPORT_TYPES } from '@/types';

interface MonthlyReportSectionProps {
  month: number | null;
  year: number | null;
  isAdmin: boolean;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function MonthlyReportSection({ month, year, isAdmin }: MonthlyReportSectionProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('nhan_dinh');
  const isSpecificMonthYear = month !== null && year !== null;

  const { report, reports, isLoading, error } = useMonthlyReports({
    month: isSpecificMonthYear ? month : undefined,
    year: isSpecificMonthYear ? year : undefined,
    reportType: selectedReportType,
  });

  const reportTypeLabel = REPORT_TYPES.find(t => t.value === selectedReportType)?.label || 'Báo cáo';

  const title = useMemo(() => {
    if (isSpecificMonthYear) {
      return `${reportTypeLabel} - ${MONTH_NAMES[month - 1]} ${year}`;
    }
    return reportTypeLabel;
  }, [month, year, isSpecificMonthYear, reportTypeLabel]);

  const subtitle = useMemo(() => {
    if (isSpecificMonthYear) {
      return report ? 'Tổng hợp phân tích tháng' : 'Chưa có báo cáo cho thời gian này';
    }
    return `${reports.length} báo cáo`;
  }, [isSpecificMonthYear, report, reports.length]);

  if (isLoading) {
    return (
      <ChartCard title={title} subtitle="Đang tải...">
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard title={title} subtitle="Lỗi">
        <div className="py-8 text-center text-red-600 text-sm">{error}</div>
      </ChartCard>
    );
  }

  // Specific month/year view - show single report or empty state with sidebar
  if (isSpecificMonthYear) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        centeredTitle
        largeTitle
        action={
          isAdmin ? (
            <Link
              href="/admin/reports"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-forest-800 font-semibold text-xs bg-forest-50 border border-forest-200 hover:bg-forest-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {report ? 'Chỉnh sửa' : 'Tạo mới'}
            </Link>
          ) : undefined
        }
      >
        <div className="flex gap-6">
          {/* Sidebar */}
          <ReportTypeSidebar
            selectedType={selectedReportType}
            onTypeChange={setSelectedReportType}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {report ? (
              <div className="max-w-4xl">
                <div className="prose prose-sm max-w-none
                  prose-headings:text-forest-800 prose-headings:font-bold
                  prose-h1:text-xl prose-h1:border-b prose-h1:border-forest-200 prose-h1:pb-2 prose-h1:mb-4
                  prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-forest-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-forest-800 prose-strong:font-semibold
                  prose-ul:my-2 prose-ol:my-2
                  prose-li:text-gray-700 prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-forest-400 prose-blockquote:bg-forest-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-forest-800
                  prose-table:border-collapse prose-table:w-full prose-table:my-4
                  prose-th:bg-forest-100 prose-th:text-forest-800 prose-th:font-semibold prose-th:text-left prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-forest-200
                  prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-forest-200 prose-td:text-gray-700
                  prose-hr:border-forest-200
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.content}
                  </ReactMarkdown>
                </div>
                <div className="mt-6 pt-4 border-t border-forest-100 text-xs text-gray-500 flex items-center gap-4">
                  <span>Cập nhật: {new Date(report.updated_at).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Chưa có {reportTypeLabel.toLowerCase()} cho {MONTH_NAMES[month - 1]} {year}</p>
                {isAdmin && (
                  <Link
                    href="/admin/reports"
                    className="inline-block mt-3 text-forest-600 hover:text-forest-800 font-medium text-sm"
                  >
                    + Tạo báo cáo
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </ChartCard>
    );
  }

  // "All time" view - show list of reports with sidebar
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={
        isAdmin ? (
          <Link
            href="/admin/reports"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-forest-800 font-semibold text-xs bg-forest-50 border border-forest-200 hover:bg-forest-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Quản lý
          </Link>
        ) : undefined
      }
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <ReportTypeSidebar
          selectedType={selectedReportType}
          onTypeChange={setSelectedReportType}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {reports.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">Chưa có {reportTypeLabel.toLowerCase()} nào</p>
              {isAdmin && (
                <Link
                  href="/admin/reports"
                  className="inline-block mt-3 text-forest-600 hover:text-forest-800 font-medium text-sm"
                >
                  + Tạo báo cáo đầu tiên
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {reports.map((r) => (
                <ReportListItem key={r.id} report={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}

function ReportListItem({ report }: { report: MonthlyReport }) {
  return (
    <div className="p-4 bg-forest-50/50 rounded-xl border border-forest-100 hover:bg-forest-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-forest-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-forest-600 bg-forest-100 px-2 py-0.5 rounded">
              {MONTH_NAMES[report.month - 1]} {report.year}
            </span>
          </div>
          <h4 className="font-semibold text-forest-800 text-sm truncate">{report.title}</h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {report.content.substring(0, 150)}...
          </p>
        </div>
      </div>
    </div>
  );
}
