'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChartCard } from './ChartCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useMonthlyReports } from '@/hooks/useMonthlyReports';
import { FileText, Edit2, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { MonthlyReport } from '@/types';

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
  const isSpecificMonthYear = month !== null && year !== null;

  const { report, reports, isLoading, error } = useMonthlyReports({
    month: isSpecificMonthYear ? month : undefined,
    year: isSpecificMonthYear ? year : undefined,
  });

  const title = useMemo(() => {
    if (isSpecificMonthYear) {
      return `Nhận định Báo cáo - ${MONTH_NAMES[month - 1]} ${year}`;
    }
    return 'Nhận định Báo cáo';
  }, [month, year, isSpecificMonthYear]);

  const subtitle = useMemo(() => {
    if (isSpecificMonthYear) {
      return report ? 'Tổng hợp phân tích tháng' : 'Chưa có nhận định cho thời gian này';
    }
    return `${reports.length} nhận định`;
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

  // Specific month/year view - show single report or empty state
  if (isSpecificMonthYear) {
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
              {report ? 'Chỉnh sửa' : 'Tạo mới'}
            </Link>
          ) : undefined
        }
      >
        {report ? (
          <div>
            <div className="prose prose-sm prose-forest max-w-none">
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
            <p className="text-gray-500 text-sm">Chưa có nhận định cho {MONTH_NAMES[month - 1]} {year}</p>
            {isAdmin && (
              <Link
                href="/admin/reports"
                className="inline-block mt-3 text-forest-600 hover:text-forest-800 font-medium text-sm"
              >
                + Tạo nhận định
              </Link>
            )}
          </div>
        )}
      </ChartCard>
    );
  }

  // "All time" view - show list of reports
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
      {reports.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Chưa có nhận định nào</p>
          {isAdmin && (
            <Link
              href="/admin/reports"
              className="inline-block mt-3 text-forest-600 hover:text-forest-800 font-medium text-sm"
            >
              + Tạo nhận định đầu tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {reports.map((report) => (
            <ReportListItem key={report.id} report={report} />
          ))}
        </div>
      )}
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
