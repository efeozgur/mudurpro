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
    applicant_party_id: '',
    type: '',
    application_date: '',
    aciklama: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: parties } = useQuery<Array<{ id: string; first_name?: string; last_name?: string; organization_name?: string; role: string }>>({
    queryKey: ['parties', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/parties`);
      return res.data.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.applicant_party_id) {
      setError('Lütfen başvuran tarafı seçin.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/cases/${caseFileId}/appeals`, {
        applicant_party_id: form.applicant_party_id,
        type: form.type,
        application_date: form.application_date || undefined,
        aciklama: form.aciklama || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const partyList = parties || [];

  function partyLabel(p: { first_name?: string; last_name?: string; organization_name?: string; role: string }) {
    const name = p.organization_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'İsimsiz';
    return `${name} (${p.role})`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="appeal-party">Başvuran Taraf *</Label>
        <select
          id="appeal-party"
          value={form.applicant_party_id}
          onChange={(e) => setForm({ ...form, applicant_party_id: e.target.value })}
          className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm"
          required
        >
          <option value="">Seçiniz</option>
          {partyList.map((p) => (
            <option key={p.id} value={p.id}>{partyLabel(p)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appeal-type">Tür *</Label>
        <Input id="appeal-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="İstinaf, Temyiz..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="application-date">Başvuru Tarihi *</Label>
        <Input id="application-date" type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="appeal-aciklama">Açıklama</Label>
        <Input id="appeal-aciklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Açıklama..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
