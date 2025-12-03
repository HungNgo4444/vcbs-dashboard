'use client';

/* eslint-disable @next/next/no-img-element */
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LogOut, Upload, History } from 'lucide-react';

export function DashboardHeader() {
  const { profile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        alert('Đăng xuất thất bại. Vui lòng thử lại.');
        return;
      }
      // Clear any cached data and redirect
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out exception:', err);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className="px-10 flex justify-between items-center h-[70px] sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #081C15 0%, #1B4332 40%, #2D6A4F 100%)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src="/images/vcbs.png"
          alt="VCBS Logo"
          className="h-11 w-auto object-contain"
        />
        <div>
          <h1 className="m-0 text-white text-lg font-bold tracking-tight">
            Social Listening Dashboard
          </h1>
          <p className="m-0 text-forest-300 text-xs">
            Báo cáo phân tích truyền thông xã hội
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Admin Links */}
        {isAdmin && (
          <div className="flex items-center gap-1 mr-4">
            <Link
              href="/admin/upload"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/90 hover:text-white text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link
              href="/admin/history"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/90 hover:text-white text-sm font-medium"
            >
              <History className="w-4 h-4" />
              Lịch sử
            </Link>
          </div>
        )}

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #52B788 0%, #74C69D 100%)',
          }}
        >
          {getInitials(profile?.full_name)}
        </div>
        <div className="text-white">
          <div className="text-sm font-semibold">
            {profile?.full_name || profile?.email || 'User'}
          </div>
          <div className="text-xs text-forest-300">
            {isAdmin ? 'Quản trị viên' : 'Người dùng'}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5 text-white/80" />
        </button>
      </div>
    </header>
  );
}
