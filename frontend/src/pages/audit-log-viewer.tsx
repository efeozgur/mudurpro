import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { DataTable } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';
import type { Column } from '@/components/shared/data-table';

interface AuditLog {
  id: string;
  module: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
}

export default function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ module: '', start_date: '', end_date: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useQuery<{ data: AuditLog[]; total: number; page: number; totalPages: number }>({
    queryKey: ['audit', page, appliedFilters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (appliedFilters.module) params.module = appliedFilters.module;
      if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
      if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;
      const res = await apiClient.get('/audit', { params });
      return res.data.data;
    },
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'module',
      header: 'Modül',
      render: (item) => <span className="font-medium">{item.module}</span>,
      sortable: true,
    },
    { key: 'action', header: 'İşlem', sortable: true },
    { key: 'entity', header: 'Varlık' },
    {
      key: 'created_at',
      header: 'Tarih',
      render: (item) => new Date(item.created_at).toLocaleString('tr-TR'),
      sortable: true,
    },
  ];

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Denetim Kayıtları</h1>
        <p className="text-sm text-muted-foreground mt-1">Sistem genelindeki işlem kayıtları</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="mod">Modül</Label>
          <Input id="mod" value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })} placeholder="CaseFile, Party..." className="w-40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sd">Başlangıç</Label>
          <Input id="sd" type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ed">Bitiş</Label>
          <Input id="ed" type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
        </div>
        <Button onClick={handleApplyFilters} size="sm">
          <FileSearch className="h-4 w-4 mr-1" />
          Filtrele
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          searchPlaceholder="İşlem ara..."
          page={data?.page || 1}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
