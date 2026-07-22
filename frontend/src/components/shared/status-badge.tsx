import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  // Genel
  ACTIVE: { label: 'Aktif', className: 'bg-success-bg text-success-text' },
  PASSIVE: { label: 'Pasif', className: 'bg-muted text-muted-foreground' },
  ARCHIVED: { label: 'Arşiv', className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-success-bg text-success-text' },
  CLOSED: { label: 'Kapandı', className: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'İptal', className: 'bg-muted text-muted-foreground' },

  // Dava durumları
  ACTIVE_CASE: { label: 'Derdest', className: 'bg-normal-bg text-normal-text' },
  DECIDED: { label: 'Karara Çıkmış', className: 'bg-success-bg text-success-text' },
  WAITING_LEGAL_PERIOD: { label: 'Yasal Süre Bekleniyor', className: 'bg-warning-bg text-warning-text' },
  READY_FOR_FINALIZATION: { label: 'Kesinleşmeye Hazır', className: 'bg-warning-bg text-warning-text' },
  FINALIZED: { label: 'Kesinleşti', className: 'bg-muted text-muted-foreground' },

  // Süre takip
  CRITICAL: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  KRITIK: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  WARNING: { label: 'Uyarı', className: 'bg-warning-bg text-warning-text' },
  YAKLASIYOR: { label: 'Yaklaşıyor', className: 'bg-warning-bg text-warning-text' },
  TAKIP: { label: 'Takip', className: 'bg-warning-bg text-warning-text' },
  NORMAL: { label: 'Normal', className: 'bg-normal-bg text-normal-text' },

  // Tebligat
  DRAFT: { label: 'Taslak', className: 'bg-muted text-muted-foreground' },
  PREPARED: { label: 'Hazırlanıyor', className: 'bg-normal-bg text-normal-text' },
  SENT: { label: 'Gönderildi', className: 'bg-success-bg text-success-text' },
  SERVED: { label: 'Tebliğ Edildi', className: 'bg-success-bg text-success-text' },
  RETURNED: { label: 'İade', className: 'bg-critical-bg text-critical-text' },
  SERVICE_IN_PROGRESS: { label: 'Tebligat Sürecinde', className: 'bg-normal-bg text-normal-text' },

  // Harç
  UNPAID: { label: 'Ödenmedi', className: 'bg-critical-bg text-critical-text' },
  OVERDUE: { label: 'Gecikmiş', className: 'bg-critical-bg text-critical-text' },
  PAID: { label: 'Ödendi', className: 'bg-success-bg text-success-text' },
  PAYMENT_COMPLETED: { label: 'Ödeme Tamamlandı', className: 'bg-success-bg text-success-text' },
  MUZEKKERE_REQUIRED: { label: 'Müzekkere Gerekli', className: 'bg-warning-bg text-warning-text' },

  // Kanun yolu
  PENDING: { label: 'Beklemede', className: 'bg-normal-bg text-normal-text' },
  ACCEPTED: { label: 'Kabul', className: 'bg-success-bg text-success-text' },
  REJECTED: { label: 'Red', className: 'bg-critical-bg text-critical-text' },
  WITHDRAWN: { label: 'Geri Çekildi', className: 'bg-muted text-muted-foreground' },
  CEVAP_BEKLENIYOR: { label: 'Cevap Bekleniyor', className: 'bg-warning-bg text-warning-text' },
  UST_MAHKEMEDE: { label: 'Üst Mahkemede', className: 'bg-normal-bg text-normal-text' },

  // Diğer
  CREATED: { label: 'Oluşturuldu', className: 'bg-normal-bg text-normal-text' },
  BEKLIYOR: { label: 'Bekliyor', className: 'bg-normal-bg text-normal-text' },
  TRANSFERRED: { label: 'Gönderildi', className: 'bg-success-bg text-success-text' },
  UNREAD: { label: 'Okunmadı', className: 'bg-normal-bg text-normal-text' },
  READ: { label: 'Okundu', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10px] font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
