import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Users,
  Bell,
  FileSearch,
  Scale,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Dosyalar', path: '/cases', icon: <FolderOpen className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Bildirimler', path: '/notifications', icon: <Bell className="h-4 w-4" />, roles: ['MUDUR', 'ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Denetim Kayıtları', path: '/audit', icon: <FileSearch className="h-4 w-4" />, roles: ['MUDUR', 'ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Adliyeler', path: '/courthouses', icon: <Building2 className="h-4 w-4" />, roles: ['SUPER_ADMIN'] },
  { label: 'Mahkemeler', path: '/courts', icon: <Scale className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Kullanıcılar', path: '/users', icon: <Users className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || '';

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-50 flex-col bg-navy">
      <div className="flex items-center gap-2 border-b border-navy-light px-4 py-4">
        <span className="text-lg text-gold">{String.fromCharCode(9878)}</span>
        <div>
          <span className="text-sm font-bold text-white font-[family-name:Georgia,serif]">MudurPro</span>
          <p className="text-[10px] text-sidebar-text">Yazı İşleri Müdürü</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 rounded-[4px] px-3 py-[7px] text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-gold/12 text-gold'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-gray-200'
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-navy-light px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-light text-[10px] font-semibold text-gold">
            {user?.name ? getInitials(user.name) : '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-gray-200">{user?.name}</p>
            <p className="truncate text-[9px] text-sidebar-text">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
