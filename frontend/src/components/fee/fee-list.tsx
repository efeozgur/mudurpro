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
import { Plus, Banknote } from 'lucide-react';

interface Fee {
  id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string | null;
  payment_date: string | null;
}

interface FeeListProps {
  caseFileId: string;
}

export function FeeList({ caseFileId }: FeeListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useQuery<Fee[]>({
    queryKey: ['fees', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/fees`);
      return res.data.data;
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      apiClient.patch(`/fees/${id}/payment`, { payment_date: date }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fees', caseFileId] }),
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    const errMsg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    const msg = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg || 'Harçlar yüklenirken hata oluştu.';
    return (
      <div className="rounded-[6px] border border-border bg-card p-6 text-center">
        <p className="text-sm text-critical-text">{msg}</p>
      </div>
    );
  }

  const fees = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Harçlar</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Harç Ekle
        </Button>
      </div>

      {fees.length === 0 ? (
        <EmptyState message="Henüz harç kaydı yok." icon={<Banknote className="h-12 w-12" />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tür</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Son Ödeme</TableHead>
              <TableHead>Ödeme Tarihi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.type}</TableCell>
                <TableCell className="text-right">{f.amount.toLocaleString('tr-TR')} TL</TableCell>
                <TableCell>{f.due_date ? new Date(f.due_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{f.payment_date ? new Date(f.payment_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell><StatusBadge status={f.status} /></TableCell>
                <TableCell>
                  {f.status !== 'PAID' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        paymentMutation.mutate({ id: f.id, date: today });
                      }}
                      disabled={paymentMutation.isPending}
                    >
                      Ödendi
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Harç</DialogTitle>
          </DialogHeader>
          <FeeAddForm
            caseFileId={caseFileId}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['fees', caseFileId] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeAddForm({ caseFileId, onSuccess, onCancel }: {
  caseFileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    debtor_party_id: '',
    type: '',
    amount: '',
    payment_due_date: '',
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
    if (!form.debtor_party_id) {
      setError('Lütfen borçlu tarafı seçin.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/cases/${caseFileId}/fees`, {
        debtor_party_id: form.debtor_party_id,
        type: form.type,
        amount: parseFloat(form.amount),
        payment_due_date: form.payment_due_date || undefined,
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
        <Label htmlFor="debtor-party">Borçlu Taraf *</Label>
        <select
          id="debtor-party"
          value={form.debtor_party_id}
          onChange={(e) => setForm({ ...form, debtor_party_id: e.target.value })}
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
        <Label htmlFor="fee-type">Tür *</Label>
        <Input id="fee-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Başvuru, Karar, Temyiz..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Tutar (TL) *</Label>
        <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment-due-date">Son Ödeme Tarihi</Label>
        <Input id="payment-due-date" type="date" value={form.payment_due_date} onChange={(e) => setForm({ ...form, payment_due_date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
