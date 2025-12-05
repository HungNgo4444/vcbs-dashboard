'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyReports } from '@/hooks/useMonthlyReports';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { MarkdownEditor } from '@/components/admin/MarkdownEditor';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import type { MonthlyReport, ReportType } from '@/types';
import { REPORT_TYPES } from '@/types';

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

// Generate years from 2024 to current year + 1
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2024 + i);

interface FormData {
  month: number;
  year: number;
  title: string;
  content: string;
  report_type: ReportType;
}

export default function AdminReportsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportType>('nhan_dinh');
  const { reports, isLoading, error, createReport, updateReport, deleteReport } = useMonthlyReports({
    reportType: activeTab,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingReport, setEditingReport] = useState<MonthlyReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    month: new Date().getMonth() + 1,
    year: currentYear,
    title: '',
    content: '',
    report_type: activeTab,
  });

  const activeTabLabel = REPORT_TYPES.find(t => t.value === activeTab)?.label || 'Báo cáo';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  const handleNewReport = () => {
    setEditingReport(null);
    setFormData({
      month: new Date().getMonth() + 1,
      year: currentYear,
      title: '',
      content: '',
      report_type: activeTab,
    });
    setFormError(null);
    setIsEditing(true);
  };

  const handleEditReport = (report: MonthlyReport) => {
    setEditingReport(report);
    setFormData({
      month: report.month,
      year: report.year,
      title: report.title,
      content: report.content,
      report_type: report.report_type,
    });
    setFormError(null);
    setIsEditing(true);
  };

  const handleDeleteReport = async (report: MonthlyReport) => {
    if (!confirm(`Bạn có chắc muốn xóa nhận định tháng ${report.month}/${report.year}?`)) {
      return;
    }

    try {
      await deleteReport(report.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingReport(null);
    setFormError(null);
  };

  const handleSave = async () => {
    // Validate
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Vui lòng nhập nội dung');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingReport) {
        await updateReport(editingReport.id, formData);
      } else {
        await createReport(formData);
      }
      setIsEditing(false);
      setEditingReport(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="px-10 py-7">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-forest-800">Quản lý Báo cáo</h1>
            <p className="text-gray-500 text-sm mt-1">
              Tạo và chỉnh sửa báo cáo hàng tháng
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleNewReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo {activeTabLabel.toLowerCase()} mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isEditing && (
        <div className="flex border-b border-forest-200 mb-6">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveTab(type.value)}
              className={`px-5 py-3 font-medium text-sm transition-colors relative
                ${activeTab === type.value
                  ? 'text-forest-700'
                  : 'text-gray-500 hover:text-forest-600'
                }`}
            >
              {type.label}
              {activeTab === type.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-600 rounded-t" />
              )}
            </button>
          ))}
        </div>
      )}

      {isEditing ? (
        /* Edit/Create Form */
        <ChartCard
          title={editingReport ? `Chỉnh sửa nhận định ${editingReport.month}/${editingReport.year}` : 'Tạo nhận định mới'}
          subtitle="Sử dụng Markdown để định dạng nội dung"
        >
          <div className="space-y-5">
            {/* Month/Year/Title row */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-forest-700 font-bold uppercase tracking-wider mb-1.5">
                  Tháng
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-forest-200 text-forest-800 text-sm font-medium focus:border-forest-500 outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-forest-700 font-bold uppercase tracking-wider mb-1.5">
                  Năm
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-forest-200 text-forest-800 text-sm font-medium focus:border-forest-500 outline-none"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-forest-700 font-bold uppercase tracking-wider mb-1.5">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề nhận định..."
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-forest-200 text-forest-800 text-sm font-medium focus:border-forest-500 outline-none"
                />
              </div>
            </div>

            {/* Markdown Editor */}
            <div>
              <label className="block text-xs text-forest-700 font-bold uppercase tracking-wider mb-1.5">
                Nội dung
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Nhập nội dung nhận định... (hỗ trợ Markdown)"
              />
            </div>

            {/* Error message */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-forest-200 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu & Xuất bản
                  </>
                )}
              </button>
            </div>
          </div>
        </ChartCard>
      ) : (
        /* Reports List */
        <ChartCard title={`Danh sách ${activeTabLabel}`} subtitle={`${reports.length} báo cáo đã tạo`}>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">{error}</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Chưa có {activeTabLabel.toLowerCase()} nào</p>
              <button
                onClick={handleNewReport}
                className="mt-4 text-forest-600 hover:text-forest-800 font-medium text-sm"
              >
                + Tạo báo cáo đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y divide-forest-100">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="py-4 flex items-center justify-between hover:bg-forest-50/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-forest-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-forest-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest-800">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        Tháng {report.month}/{report.year} • Cập nhật:{' '}
                        {new Date(report.updated_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditReport(report)}
                      className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      )}
    </main>
  );
}
