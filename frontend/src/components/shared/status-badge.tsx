import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-green-100 text-green-800 border-green-200' },
  ARCHIVED: { label: 'Arşiv', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  SERVED: { label: 'Tebliğ Edildi', className: 'bg-green-100 text-green-800 border-green-200' },
  RETURNED: { label: 'İade', className: 'bg-red-100 text-red-800 border-red-200' },
  CRITICAL: { label: 'Kritik', className: 'bg-red-100 text-red-800 border-red-200' },
  KRITIK: { label: 'Kritik', className: 'bg-red-100 text-red-800 border-red-200' },
  WARNING: { label: 'Uyarı', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  YAKLASIYOR: { label: 'Yaklaşıyor', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  TAKIP: { label: 'Takip', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  NORMAL: { label: 'Normal', className: 'bg-green-100 text-green-800 border-green-200' },
  CREATED: { label: 'Oluşturuldu', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  BEKLIYOR: { label: 'Bekliyor', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  MUZEKKERE_REQUIRED: { label: 'Müzekkere Gerekli', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  PAID: { label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200' },
  PENDING: { label: 'Beklemede', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  TRANSFERRED: { label: 'Gönderildi', className: 'bg-green-100 text-green-800 border-green-200' },
  UNREAD: { label: 'Okunmadı', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  READ: { label: 'Okundu', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-green-100 text-green-800 border-green-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
