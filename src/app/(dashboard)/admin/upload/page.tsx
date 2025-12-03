'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
  totalRows?: number;
  successCount?: number;
  errorCount?: number;
  errors?: { row: number; message: string }[];
  uploadId?: string;
}

export default function AdminUploadPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isExcelFile(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isExcelFile(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
    }
  }, []);

  const isExcelFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.xls'];

    return (
      validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || 'Upload failed',
          errors: data.errors,
        });
      } else {
        setResult({
          success: true,
          message: data.message,
          totalRows: data.totalRows,
          successCount: data.successCount,
          errorCount: data.errorCount,
          errors: data.errors,
          uploadId: data.uploadId,
        });
        setFile(null);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <h1 className="text-2xl font-bold text-forest-800">Upload Dữ Liệu</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload file Excel chứa dữ liệu Social Listening
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <ChartCard title="Upload File Excel" subtitle="Định dạng .xlsx hoặc .xls">
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging
                ? 'border-forest-500 bg-forest-50'
                : 'border-gray-200 hover:border-forest-300 hover:bg-forest-50/50'
              }
              ${file ? 'border-forest-500 bg-forest-50' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-forest-400" />
                <p className="text-forest-700 font-medium mb-2">
                  Kéo thả file Excel vào đây
                </p>
                <p className="text-gray-500 text-sm mb-4">hoặc</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors text-sm font-medium">
                    Chọn file từ máy tính
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </>
            ) : (
              <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-forest-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-forest-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-forest-600 hover:bg-forest-700"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
              <Link href="/admin/history">
                <Button variant="outline" className="border-forest-200 text-forest-700">
                  Xem lịch sử
                </Button>
              </Link>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? result.message : result.error}
                  </p>
                  {result.success && (
                    <p className="text-sm text-green-600 mt-1">
                      Tổng: {result.totalRows} | Thành công: {result.successCount} | Lỗi: {result.errorCount}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-700 mb-2">Chi tiết lỗi:</p>
                      {result.errors.slice(0, 10).map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600 mb-1">
                          Row {err.row}: {err.message}
                        </p>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ...và {result.errors.length - 10} lỗi khác
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* Instructions */}
        <ChartCard title="Hướng dẫn Upload" subtitle="Định dạng file yêu cầu">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
                <p className="text-sm text-amber-700 mt-1">
                  Dữ liệu phải được chuẩn hóa TRƯỚC khi upload. Các giá trị phải khớp chính xác với danh sách cho phép.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-forest-800 mb-2">Các cột bắt buộc:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">Nội dung</code> - Nội dung bài viết</li>
                <li>• <code className="bg-gray-100 px-1 rounded">Phương tiện</code> - Báo mạng, Facebook, Youtube, Tiktok</li>
                <li>• <code className="bg-gray-100 px-1 rounded">Ngày phát hành</code> - Ngày đăng bài</li>
                <li>• <code className="bg-gray-100 px-1 rounded">AI_SACTHAI</code> - Tích cực, Tiêu cực, Trung tính</li>
                <li>• <code className="bg-gray-100 px-1 rounded">AI_THELOAINOIDUNG</code> - Loại nội dung</li>
                <li>• <code className="bg-gray-100 px-1 rounded">AI_CATEGORY</code> - Category chứng khoán</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-forest-800 mb-2">Giá trị Phương tiện hợp lệ:</h4>
              <div className="flex flex-wrap gap-2">
                {['Báo mạng', 'Facebook', 'Youtube', 'Tiktok'].map(ch => (
                  <span key={ch} className="px-2 py-1 bg-forest-100 text-forest-700 rounded text-xs font-medium">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-forest-800 mb-2">Giá trị Sắc thái hợp lệ:</h4>
              <div className="flex flex-wrap gap-2">
                {['Tích cực', 'Tiêu cực', 'Trung tính'].map(s => (
                  <span key={s} className="px-2 py-1 bg-forest-100 text-forest-700 rounded text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-forest-800 mb-2">Giá trị Thể loại nội dung:</h4>
              <div className="flex flex-wrap gap-2">
                {['Tin tức thị trường', 'Bán hàng/Môi giới', 'Tin trực tiếp về thương hiệu'].map(ct => (
                  <span key={ct} className="px-2 py-1 bg-forest-100 text-forest-700 rounded text-xs font-medium">
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}
