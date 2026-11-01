'use client';

import { usePathname } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { ROUTE_METADATA } from '@/lib/routes';

/**
 * Top Management Header for Admin Experience
 * Displays dynamic route title, system status, and administrator badge.
 */
export default function AdminHeader() {
  const pathname = usePathname();
  const currentMeta = ROUTE_METADATA[pathname] || { title: 'Administration' };

  return (
    <header className="md:sticky md:top-0 z-20 w-full bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
              {currentMeta.title}
            </h1>
            <span className="text-[11px] text-slate-600 hidden sm:inline-block mt-0.5">
              Looply Platform Administration
            </span>
          </div>
        </div>

        {/* Status Indicators & Admin Profile */}
        <div className="flex items-center gap-4">
          <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
            Admin Console
          </Badge>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <Avatar name="Sys Admin" size="sm" status="online" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">System Admin</p>
              <p className="text-[10px] text-slate-600 font-mono">admin@looply.internal</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

