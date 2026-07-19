import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileUp } from 'lucide-react';

interface Appeal {
  id: string;
  type: string;
  status: string;
  opposing_party: string;
  application_date: string | null;
  result: string | null;
}

interface AppealListProps {
  caseFileId: string;
}

export function AppealList({ caseFileId }: AppealListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<Appeal[]>({
    queryKey: ['appeals', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/appeals`);
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const appeals = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Kanun Yolu Başvuruları</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Başvuru Ekle
        </Button>
      </div>

      {appeals.length === 0 ? (
        <EmptyState message="Henüz kanun yolu başvurusu yok." icon={<FileUp className="h-12 w-12" />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tür</TableHead>
              <TableHead>Karşı Taraf</TableHead>
              <TableHead>Başvuru Tarihi</TableHead>
              <TableHead>Sonuç</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.type}</TableCell>
                <TableCell>{a.opposing_party}</TableCell>
                <TableCell>{a.application_date ? new Date(a.application_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{a.result || '-'}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kanun Yolu Başvurusu</DialogTitle>
          </DialogHeader>
          <AppealAddForm
            caseFileId={caseFileId}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['appeals', caseFileId] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppealAddForm({ caseFileId, onSuccess, onCancel }: {
  caseFileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    type: '',
    opposing_party: '',
    application_date: '',
    result: '',
    status: 'PENDING',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(`/cases/${caseFileId}/appeals`, {
        ...form,
        application_date: form.application_date || undefined,
      });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="appeal-type">Tür *</Label>
        <Input id="appeal-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="İstinaf, Temyiz..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="opposing-party">Karşı Taraf *</Label>
        <Input id="opposing-party" value={form.opposing_party} onChange={(e) => setForm({ ...form, opposing_party: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="application-date">Başvuru Tarihi</Label>
        <Input id="application-date" type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="result">Sonuç</Label>
        <Input id="result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Sonuç..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
