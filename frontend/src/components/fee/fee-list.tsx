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

  const { data, isLoading } = useQuery<Fee[]>({
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
    type: '',
    amount: '',
    due_date: '',
    status: 'PENDING',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(`/cases/${caseFileId}/fees`, {
        ...form,
        amount: parseFloat(form.amount),
        due_date: form.due_date || undefined,
      });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fee-type">Tür *</Label>
        <Input id="fee-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Başvuru, Karar, Temyiz..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Tutar (TL) *</Label>
        <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="due-date">Son Ödeme Tarihi</Label>
        <Input id="due-date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
