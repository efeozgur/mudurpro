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

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || '';

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold text-primary">MudurPro</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filtered.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>
    </aside>
  );
}
