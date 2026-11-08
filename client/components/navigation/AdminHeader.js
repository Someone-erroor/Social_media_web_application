'use client';

import { usePathname } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { ROUTE_METADATA } from '@/lib/routes';

/**
 * Top Management Header for Admin Experience (Editorial Expression Theme)
 * Displays dynamic route title, system status, and live administrator profile.
 */
export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const currentMeta = ROUTE_METADATA[pathname] || { title: 'Administration' };

  const adminName = user?.fullName || 'Platform Admin';
  const adminEmail = user?.email || 'admin@looply.social';

  return (
    <header className="md:sticky md:top-0 z-20 w-full bg-[#17151D] border-b border-[#2D2938]">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#F6F2EA] font-display tracking-tight leading-none">
              {currentMeta.title}
            </h1>
            <span className="text-[11px] text-[#777580] hidden sm:inline-block mt-0.5">
              Looply Platform Administration
            </span>
          </div>
        </div>

        {/* Status Indicators & Admin Profile */}
        <div className="flex items-center gap-4">
          <Badge variant="lavender" size="sm" className="hidden sm:inline-flex">
            Admin Console
          </Badge>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#2D2938]">
            <Avatar
              name={adminName}
              src={user?.profile?.avatarUrl}
              size="sm"
              status="online"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#F6F2EA] leading-tight truncate max-w-[140px]">
                {adminName}
              </p>
              <p className="text-[10px] text-[#777580] font-mono truncate max-w-[140px]">
                {adminEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
