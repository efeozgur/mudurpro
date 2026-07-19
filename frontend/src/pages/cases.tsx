import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
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
  id: string;
  esas_no: string;
  karar_no: string | null;
  durum: string;
  court_id: string;
}

export default function Cases() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: CaseFile[]; total: number; page: number; totalPages: number }>({
    queryKey: ['cases', page],
    queryFn: async () => {
      const res = await apiClient.get('/cases', { params: { page, limit: 20 } });
      return res.data.data;
    },
  });

  const columns: Column<CaseFile>[] = [
    { key: 'esas_no', header: 'Esas No', sortable: true },
    {
      key: 'karar_no',
      header: 'Karar No',
      render: (item) => item.karar_no || '-',
    },
    {
      key: 'durum',
      header: 'Durum',
      render: (item) => <StatusBadge status={item.durum} />,
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dosyalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Mahkeme dosyalarını görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Yeni Dosya
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchPlaceholder="Esas no ile ara..."
        onRowClick={(item) => navigate(`/cases/${item.id}`)}
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
