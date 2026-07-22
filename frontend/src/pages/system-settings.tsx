import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

export default function SystemSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/system-settings');
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (value: string) => apiClient.put('/system-settings/admin_scope', { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
  });

  if (isLoading) return <p className="p-6 text-xs text-muted-foreground">Yükleniyor...</p>;

  const adminScope = data?.find((s) => s.key === 'admin_scope')?.value || 'city_only';

  return (
    <div className="space-y-8 p-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Sistem Ayarları</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Uygulama davranışını etkileyen genel ayarlar</p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm premium-shadow">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Settings className="h-4 w-4 text-gold" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adliye Admin Yetki Kapsamı
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Adliye Yönetim Admin'inin yetkisi sadece bağlı olduğu il için mi, yoksa o ile bağlı tüm ilçe adliyeleri için de geçerli mi olsun?
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="admin_scope"
                value="city_only"
                checked={adminScope === 'city_only'}
                onChange={() => mutation.mutate('city_only')}
                className="h-4 w-4 text-gold"
              />
              <span className="text-[12px] font-medium text-foreground">Sadece Bağlı Olduğu İl</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="admin_scope"
                value="city_and_districts"
                checked={adminScope === 'city_and_districts'}
                onChange={() => mutation.mutate('city_and_districts')}
                className="h-4 w-4 text-gold"
              />
              <span className="text-[12px] font-medium text-foreground">İl ve İlçeler</span>
            </label>
          </div>
          {mutation.isPending && (
            <p className="text-[11px] text-muted-foreground">Kaydediliyor...</p>
          )}
          {mutation.isSuccess && (
            <p className="text-[11px] text-success-text">Ayar güncellendi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
