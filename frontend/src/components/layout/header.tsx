import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Bell, Plus, LogOut, User, Lightbulb } from 'lucide-react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread');
      return res.data.data;
    },
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const unreadCount = Array.isArray(unread) ? unread.length : unread?.count ?? 0;

  const roleLabel =
    user?.role === 'MUDUR' ? 'Müdür Paneli' : user?.role === 'ADLIYE_ADMIN' ? 'Adliye Yönetimi' : 'Sistem Yönetimi';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-serif font-semibold text-foreground tracking-tight">{roleLabel}</h2>
      </div>

      <div className="flex items-center gap-3">
        {user?.role === 'MUDUR' && (
          <button
            onClick={() => navigate('/cases?new=true')}
            className="inline-flex items-center gap-2 rounded-[6px] bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-[#BE4E37] active:bg-[#A33F2B] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni Dosya</span>
          </button>
        )}

        <Button variant="ghost" onClick={() => navigate('/feedback')} className="gap-2 text-muted-foreground hover:text-foreground"><Lightbulb className="h-4 w-4" /><span className="hidden lg:inline">Geliştirme Önerileri</span></Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted">
            <User className="h-[18px] w-[18px] text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-[13px] font-medium">{user?.name}</p>
              <p className="text-[12px] text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
