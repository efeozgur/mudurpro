import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-success-bg text-success-text' },
  ARCHIVED: { label: 'Arşiv', className: 'bg-muted text-muted-foreground' },
  SERVED: { label: 'Tebliğ Edildi', className: 'bg-success-bg text-success-text' },
  RETURNED: { label: 'İade', className: 'bg-critical-bg text-critical-text' },
  CRITICAL: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  KRITIK: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  WARNING: { label: 'Uyarı', className: 'bg-warning-bg text-warning-text' },
  YAKLASIYOR: { label: 'Yaklaşıyor', className: 'bg-warning-bg text-warning-text' },
  TAKIP: { label: 'Takip', className: 'bg-warning-bg text-warning-text' },
  NORMAL: { label: 'Normal', className: 'bg-normal-bg text-normal-text' },
  CREATED: { label: 'Oluşturuldu', className: 'bg-normal-bg text-normal-text' },
  BEKLIYOR: { label: 'Bekliyor', className: 'bg-normal-bg text-normal-text' },
  MUZEKKERE_REQUIRED: { label: 'Müzekkere Gerekli', className: 'bg-warning-bg text-warning-text' },
  PAID: { label: 'Ödendi', className: 'bg-success-bg text-success-text' },
  PENDING: { label: 'Beklemede', className: 'bg-normal-bg text-normal-text' },
  TRANSFERRED: { label: 'Gönderildi', className: 'bg-success-bg text-success-text' },
  UNREAD: { label: 'Okunmadı', className: 'bg-normal-bg text-normal-text' },
  READ: { label: 'Okundu', className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-success-bg text-success-text' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10px] font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
