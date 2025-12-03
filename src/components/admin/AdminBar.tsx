'use client';

import { useRef } from 'react';
import { Upload, History, FileSpreadsheet, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AdminBarProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function AdminBar({ onUpload, isUploading = false }: AdminBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="px-10 py-3.5 flex items-center justify-between"
      style={{
        background: 'linear-gradient(90deg, #2D6A4F 0%, #40916C 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center gap-3 text-white">
        <FileSpreadsheet className="w-5 h-5" />
        <span className="font-medium text-sm">
          Admin Panel: Upload file Excel để cập nhật dữ liệu dashboard
        </span>
      </div>

      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center gap-2 bg-white text-forest-800 px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang upload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Chọn File Excel
            </>
          )}
        </button>

        <Link
          href="/admin/history"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[13px] text-white transition-colors hover:bg-white/20"
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <History className="w-4 h-4" />
          Xem lịch sử upload
        </Link>
      </div>
    </div>
  );
}
