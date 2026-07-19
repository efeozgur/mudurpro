import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Send } from 'lucide-react';

interface ServiceRecord {
  id: string;
  party_name: string;
  type: string;
  status: string;
  sent_date: string | null;
  result_date: string | null;
}

interface ServiceRecordListProps {
  caseFileId: string;
}

export function ServiceRecordList({ caseFileId }: ServiceRecordListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ['services', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/services`);
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/services/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services', caseFileId] }),
  });

  if (isLoading) return <LoadingSpinner />;

  const records = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tebligatlar</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Tebligat Ekle
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState message="Henüz tebligat kaydı yok." icon={<Send className="h-12 w-12" />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Taraf</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Gönderim Tarihi</TableHead>
              <TableHead>Sonuç Tarihi</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.party_name}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{r.sent_date ? new Date(r.sent_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{r.result_date ? new Date(r.result_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => statusMutation.mutate({ id: r.id, status: r.status === 'SERVED' ? 'RETURNED' : 'SERVED' })}
                    disabled={statusMutation.isPending}
                  >
                    {r.status === 'SERVED' ? 'İade Et' : 'Tebliğ Edildi'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Tebligat</DialogTitle>
          </DialogHeader>
          <ServiceRecordAddForm
            caseFileId={caseFileId}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceRecordAddForm({ caseFileId, onSuccess, onCancel }: {
  caseFileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    party_id: '',
    type: '',
    sent_date: '',
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
    if (!form.party_id) {
      setError('Lütfen bir taraf seçin.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/services', {
        case_file_id: caseFileId,
        party_id: form.party_id,
        type: form.type,
        sent_date: form.sent_date || undefined,
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
        <Label htmlFor="sr-party">Taraf *</Label>
        <select
          id="sr-party"
          value={form.party_id}
          onChange={(e) => setForm({ ...form, party_id: e.target.value })}
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
        <Label htmlFor="sr-type">Tür *</Label>
        <Input id="sr-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Tebligat, Müzekkere..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sr-sent-date">Gönderim Tarihi</Label>
        <Input id="sr-sent-date" type="date" value={form.sent_date} onChange={(e) => setForm({ ...form, sent_date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
