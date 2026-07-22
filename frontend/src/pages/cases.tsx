import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { DataTable } from '@/components/shared/data-table';
import type { Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CaseFileForm } from '@/components/case-file/case-file-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CaseFile {
  cf_id: string;
  cf_esas_no: string;
  cf_karar_no: string | null;
  cf_karar_tarihi: string | null;
  cf_kanun_yolu: string | null;
  cf_durum: string;
  cf_court_id: string;
  cf_created_at: string;
  cf_updated_at: string;
  court_name: string | null;
  party_count: string;
  fee_total: string;
}

export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const isArchive = location.pathname === '/archived';
  const durumFilter = isArchive ? 'ARCHIVED' : (new URLSearchParams(location.search).get('durum') || undefined);

  const { data, isLoading } = useQuery<{ data: CaseFile[]; total: number; page: number; totalPages: number }>({
    queryKey: ['cases', page, durumFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (durumFilter) params.durum = durumFilter;
      const res = await apiClient.get('/cases', { params });
      return res.data.data;
    },
  });

  const columns: Column<CaseFile>[] = [
    { key: 'cf_esas_no', header: 'Esas No', sortable: true },
    { key: 'court_name', header: 'Mahkeme', render: (item) => item.court_name || '-' },
    {
      key: 'cf_karar_no',
      header: 'Karar No',
      render: (item) => item.cf_karar_no || '-',
    },
    {
      key: 'cf_karar_tarihi',
      header: 'Karar Tarihi',
      render: (item) => item.cf_karar_tarihi
        ? new Date(item.cf_karar_tarihi).toLocaleDateString('tr-TR')
        : '-',
    },
    {
      key: 'party_count',
      header: 'Taraf',
      render: (item) => {
        const count = parseInt(item.party_count, 10) || 0;
        return <span className="text-[12px] text-muted-foreground">{count}</span>;
      },
    },
    {
      key: 'fee_total',
      header: 'Harç Toplamı',
      render: (item) => {
        const amount = parseFloat(item.fee_total) || 0;
        return (
          <span className="text-[12px] font-medium">
            {amount > 0
              ? amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
              : '-'}
          </span>
        );
      },
    },
    {
      key: 'cf_kanun_yolu',
      header: 'Kanun Yolu',
      render: (item) => item.cf_kanun_yolu || '-',
    },
    {
      key: 'cf_durum',
      header: 'Durum',
      render: (item) => <StatusBadge status={item.cf_durum} />,
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">{durumFilter === 'ARCHIVED' ? 'Arşivlenen Dosyalar' : 'Dosyalar'}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{durumFilter === 'ARCHIVED' ? 'Arşive kaldırılmış dosyaları görüntüleyin' : 'Mahkeme dosyalarını görüntüleyin ve yönetin'}</p>
        </div>
        {durumFilter !== 'ARCHIVED' && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-[6px] bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-[#BE4E37] active:bg-[#A33F2B] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Yeni Dosya
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchPlaceholder="Esas no ile ara..."
        onRowClick={(item) => navigate(`/cases/${item.cf_id}`)}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Dosya</DialogTitle>
          </DialogHeader>
          <CaseFileForm
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['cases'] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
