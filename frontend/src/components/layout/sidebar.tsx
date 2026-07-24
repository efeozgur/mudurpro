import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Users,
  FileSearch,
  Scale,
  Settings,
  Archive,
  FileText,
  X,
  ChevronDown,
  History,
  CalendarDays,
} from 'lucide-react';
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['MUDUR', 'KATIP'], permission: 'REPORTS' },
  { label: 'Dosyalar', path: '/cases', icon: <FolderOpen className="h-4 w-4" />, roles: ['MUDUR', 'KATIP'], permission: 'CASES' },
  { label: 'Arşiv', path: '/archived', icon: <Archive className="h-4 w-4" />, roles: ['MUDUR', 'KATIP'], permission: 'CASES' },
  { label: 'Katiplerim', path: '/clerks', icon: <Users className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Şablonlar', path: '/templates', icon: <FileText className="h-4 w-4" />, roles: ['MUDUR', 'KATIP'], permission: 'TEMPLATES' },
  { label: 'Hatırlatmalar', path: '/reminders', icon: <CalendarDays className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Denetim Kayıtları', path: '/audit', icon: <FileSearch className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Adliyeler', path: '/courthouses', icon: <Building2 className="h-4 w-4" />, roles: ['SUPER_ADMIN', 'ADLIYE_ADMIN'] },
  { label: 'Mahkemeler', path: '/courts', icon: <Scale className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Kullanıcılar', path: '/users', icon: <Users className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Sistem Ayarları', path: '/settings', icon: <Settings className="h-4 w-4" />, roles: ['SUPER_ADMIN'] },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const [showVersions, setShowVersions] = useState(false);
  const role = user?.role || '';
  const { data: versions = [] } = useQuery<Array<{ version: string; release_date: string; is_current: boolean; changes: Array<{ id: string; description: string }> }>>({
    queryKey: ['version-history'],
    queryFn: async () => (await apiClient.get('/version-history')).data.data,
    staleTime: 300_000,
  });
  const filtered = navItems.filter((item) =>
    item.roles.includes(role) && (role !== 'KATIP' || !item.permission || user?.permissions?.includes(item.permission)),
  );

  return (
    <aside className={`
      fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-[#191615] border-r border-[#2D2724]
      transition-transform duration-200 ease-in-out
      md:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between border-b border-[#2D2724] px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#D1634B]">{String.fromCharCode(9878)}</span>
          <div>
            <span className="text-sm font-bold tracking-wide text-[#F9F6F0]">MudurPro</span>
            <p className="text-[12px] text-[#C8C2B8] font-medium mt-0.5">Yazı İşleri Müdürü</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#A0988E] hover:text-[#F9F6F0] md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#D1634B]/10 text-[#D1634B] font-semibold'
                  : 'text-[#D4CFC6] hover:bg-[#2D2724] hover:text-[#F9F6F0]'
              )}
            >
              <span className={cn('shrink-0', isActive ? 'text-[#D1634B]' : 'text-[#A0988E]')}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="relative border-t border-[#2D2724] px-3 pt-3">
        <button type="button" onClick={() => setShowVersions((current) => !current)} className="flex w-full items-center justify-between rounded-[6px] px-2 py-2 text-left text-[#D4CFC6] hover:bg-[#2D2724]" aria-expanded={showVersions}>
          <span className="flex items-center gap-2"><History className="h-3.5 w-3.5 text-[#A0988E]" /><span><span className="block text-[10px] uppercase tracking-wider text-[#A0988E]">Sürüm</span><span className="block text-[12px] font-semibold text-[#F9F6F0]">{versions[0]?.version || '—'}</span></span></span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', showVersions && 'rotate-180')} />
        </button>
        {showVersions && (
          <div className="absolute bottom-full left-3 right-3 z-50 mb-2 max-h-80 overflow-y-auto rounded-lg border border-[#443934] bg-[#241f1d] p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-semibold text-[#F9F6F0]">Sürüm Geçmişi</span><span className="rounded-full bg-[#D1634B]/15 px-2 py-0.5 text-[9px] font-semibold text-[#E88770]">Güncel</span></div>
            <div className="space-y-3 text-[10px] leading-relaxed text-[#C8C2B8]">
              {versions.map((release) => (
                <div key={release.version}><p className="font-semibold text-[#F9F6F0]">{release.version} <span className="font-normal text-[#A0988E]">— {release.release_date}</span></p><ul className="mt-1 list-disc space-y-0.5 pl-4">{release.changes.map((change) => <li key={change.id}>{change.description}</li>)}</ul></div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-[#2D2724] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D2724] text-[12px] font-semibold text-[#D1634B]">
            {user?.name ? getInitials(user.name) : '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-[#F9F6F0]">{user?.name}</p>
            <p className="truncate text-[11px] text-[#A0988E]">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
