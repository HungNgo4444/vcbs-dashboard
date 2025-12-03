'use client';

/* eslint-disable @next/next/no-img-element */

export function DashboardFooter() {
  return (
    <footer className="py-6 px-10 border-t border-forest-100 bg-white/50">
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-gray-500">Powered by</span>
        <img
          src="/images/monitaz.png"
          alt="Monitaz Logo"
          width={120}
          height={32}
          className="object-contain"
        />
      </div>
    </footer>
  );
}
