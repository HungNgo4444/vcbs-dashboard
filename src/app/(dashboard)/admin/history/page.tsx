'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileSpreadsheet, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface UploadRecord {
  id: string;
  file_name: string;
  file_size: number | null;
  records_count: number;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

export default function UploadHistoryPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UploadRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/upload/history');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.details || 'Unknown error');
        }

        setHistory(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAdmin) {
      fetchHistory();
    } else if (!authLoading && !isAdmin) {
      setIsLoading(false);
    }
  }, [isAdmin, authLoading]);

  const handleDelete = async (record: UploadRecord) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/upload/${record.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Delete failed');
      }

      // Remove from local state
      setHistory((prev) => prev.filter((h) => h.id !== record.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
            <CheckCircle className="w-3 h-3" />
            Hoàn thành
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
            <XCircle className="w-3 h-3" />
            Thất bại
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
            <Clock className="w-3 h-3" />
            Đang xử lý
          </Badge>
        );
    }
  };

  if (authLoading) {
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
        <h1 className="text-2xl font-bold text-forest-800">Lịch sử Upload</h1>
        <p className="text-gray-500 text-sm mt-1">
          Xem lại các file Excel đã được upload vào hệ thống
        </p>
      </div>

      <ChartCard title="Danh sách Upload" subtitle={`${history.length} bản ghi`}>
        {isLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có file nào được upload</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-100">
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">File</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">Kích thước</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">Records</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">Người upload</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-700">Thời gian</th>
                  <th className="text-center py-3 px-4 font-semibold text-forest-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-forest-50 hover:bg-forest-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-forest-800">{record.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatFileSize(record.file_size)}
                    </td>
                    <td className="py-3 px-4 text-forest-800 font-medium">
                      {record.records_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(record.status)}
                      {record.error_message && (
                        <p className="text-xs text-red-500 mt-1">{record.error_message}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {record.profiles?.full_name || record.profiles?.email || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setDeleteConfirm(record)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa upload này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-forest-800 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn xóa file <strong>{deleteConfirm.file_name}</strong>?
            </p>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
              Hành động này sẽ xóa <strong>{deleteConfirm.records_count.toLocaleString()} records</strong> khỏi
              database và không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
