'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/devices', label: '디바이스 관리', icon: '💻' },
  { href: '/assets', label: '자산 관리', icon: '📦' },
  { href: '/activities', label: '활동 이력', icon: '📅' },
  { href: '/sync', label: '동기화 관리', icon: '🔄' },
  { href: '/policies', label: '정책 관리', icon: '🛡️' },
];

const requestNavItems = [
  { href: '/requests/download-exception', label: '다운로드 예외 신청', icon: '📥' },
];

const adminNavItems = [
  { href: '/admin/exceptions', label: '예외 승인 관리', icon: '🛂' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin;

  const renderLink = (item: { href: string; label: string; icon: string }) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
      >
        <span className="text-lg">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-[#F3E8DE] flex flex-col z-50">
      <div className="px-6 py-5 border-b border-[#F3E8DE]">
        <Link href="/">
          <img src="/logo.png" alt="당근서비스 자산 및 보안 대시보드" className="h-10 w-auto object-contain cursor-pointer" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-[#999] uppercase tracking-wider">Main</p>
          <div className="space-y-1">
            {mainNavItems.map(renderLink)}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-[#999] uppercase tracking-wider">Requests</p>
          <div className="space-y-1">
            {requestNavItems.map(renderLink)}
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-[#999] uppercase tracking-wider">Admin Only</p>
            <div className="space-y-1">
              {adminNavItems.map(renderLink)}
            </div>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-[#F3E8DE]">
        <div className="flex items-center gap-3 px-3 mb-3">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6F00] to-[#FFB74D] flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{session?.user?.name || '사용자'}</p>
            <p className="text-[11px] text-[#999] truncate">{session?.user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E53E3E] hover:bg-[#FFF5F5] rounded-lg transition-colors font-medium"
        >
          <span>🚪</span>
          로그아웃
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FFF8F0]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        {children}
      </main>
    </div>
  );
}
