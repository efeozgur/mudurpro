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
import { Plus, Banknote, Trash, Pencil } from 'lucide-react';

interface Fee {
  id: string;
  case_file_id: string;
  debtor_party_id: string;
  type: string;
  amount: number;
  payment_due_date: string | null;
  payment_date: string | null;
  status: string;
}

interface Party {
  id: string;
  party_type: 'PERSON' | 'ORGANIZATION';
  role: 'PLAINTIFF' | 'DEFENDANT';
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
}

function getMuzekkereCountdown(dueDate: string | null, status: string): { remainingDays: number; isCritical: boolean } | null {
  if (status === 'PAID' || status === 'CLOSED' || !dueDate) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  if (due > now) return null;
  const daysSinceDue = Math.floor((now.getTime() - due.getTime()) / msPerDay);
  const remainingDays = 15 - daysSinceDue;
  return { remainingDays, isCritical: remainingDays <= 3 };
}

interface FeeListProps {
  caseFileId: string;
}

export function FeeList({ caseFileId }: FeeListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [payDate, setPayDate] = useState('');
  const [deleteConfirmFee, setDeleteConfirmFee] = useState<string | null>(null);

  const { data: feesData, isLoading: feesLoading, error } = useQuery<Fee[]>({
    queryKey: ['fees', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/fees`);
      return res.data.data;
    },
  });

  const { data: partiesData, isLoading: partiesLoading } = useQuery<Party[]>({
    queryKey: ['parties', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/parties`);
      return res.data.data;
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      apiClient.patch(`/fees/${id}/payment`, { payment_date: date }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fees', caseFileId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/fees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fees', caseFileId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.put(`/fees/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fees', caseFileId] }),
  });

  if (feesLoading || partiesLoading) return <LoadingSpinner />;

  if (error) {
    const errMsg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    const msg = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg || 'Harçlar yüklenirken hata oluştu.';
    return (
      <div className="rounded-[6px] border border-border bg-card p-6 text-center">
        <p className="text-sm text-critical-text">{msg}</p>
      </div>
    );
  }

  const fees = feesData || [];
  const parties = partiesData || [];

  const getPartyName = (partyId: string) => {
    const p = parties.find(item => item.id === partyId);
    if (!p) return 'Bilinmeyen Taraf';
    const name = p.party_type === 'PERSON'
      ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
      : p.organization_name || 'Ünvansız Kurum';
    const roleTr = p.role === 'PLAINTIFF' ? 'Davacı' : p.role === 'DEFENDANT' ? 'Davalı' : p.role;
    return `${name} (${roleTr})`;
  };

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
              <TableHead>Borçlu Taraf</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Son Ödeme</TableHead>
              <TableHead>Ödeme Tarihi</TableHead>
              <TableHead>Müzekkere</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.type}</TableCell>
                <TableCell>{getPartyName(f.debtor_party_id)}</TableCell>
                <TableCell className="text-right">{f.amount.toLocaleString('tr-TR')} TL</TableCell>
                <TableCell>{f.payment_due_date ? new Date(f.payment_due_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{f.payment_date ? new Date(f.payment_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>
                  {(() => {
                    const cd = getMuzekkereCountdown(f.payment_due_date, f.status);
                    if (!cd) return <span className="text-[11px] text-muted-foreground">-</span>;
                    if (cd.remainingDays <= 0) {
                      return (
                        <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                          Süre Doldu!
                        </span>
                      );
                    }
                    if (cd.isCritical) {
                      return (
                        <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                          {cd.remainingDays} gün
                        </span>
                      );
                    }
                    return (
                      <span className="text-[11px] text-muted-foreground">{cd.remainingDays} gün</span>
                    );
                  })()}
                </TableCell>
                <TableCell><StatusBadge status={f.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditingFee(f)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Düzenle
                    </Button>
                    {f.status !== 'PAID' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setPayingFee(f);
                          setPayDate(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        Ödendi
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmFee(f.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      Sil
                    </Button>
                  </div>
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

      <Dialog open={!!payingFee} onOpenChange={() => setPayingFee(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ödeme Tarihi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">
              "{payingFee?.type}" harcı için ödeme tarihini girin:
            </p>
            <Input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setPayingFee(null)}>
                İptal
              </Button>
              <Button
                size="sm"
                disabled={paymentMutation.isPending || !payDate}
                onClick={() => {
                  if (payingFee && payDate) {
                    paymentMutation.mutate(
                      { id: payingFee.id, date: payDate },
                      { onSuccess: () => setPayingFee(null) },
                    );
                  }
                }}
              >
                {paymentMutation.isPending ? 'Kaydediliyor...' : 'Ödemeyi Onayla'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFee} onOpenChange={() => setEditingFee(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Harç Düzenle</DialogTitle>
          </DialogHeader>
          {editingFee && (
            <FeeEditForm
              fee={editingFee}
              caseFileId={caseFileId}
              onSuccess={() => setEditingFee(null)}
              onCancel={() => setEditingFee(null)}
              isSaving={updateMutation.isPending}
              onSave={(data) => updateMutation.mutate({ id: editingFee.id, data })}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmFee} onOpenChange={() => setDeleteConfirmFee(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Harç Kaydını Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu harç kaydını silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmFee(null)}>İptal</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirmFee) deleteMutation.mutate(deleteConfirmFee, { onSuccess: () => setDeleteConfirmFee(null) });
                }}
              >
                {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            </div>
          </div>
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
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: parties } = useQuery<Array<{ id: string; first_name?: string; last_name?: string; organization_name?: string; role: string; party_type: string }>>({
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

  function partyLabel(p: { first_name?: string; last_name?: string; organization_name?: string; role: string; party_type: string }) {
    const name = p.party_type === 'PERSON'
      ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
      : p.organization_name || 'Ünvansız Kurum';
    const roleTr = p.role === 'PLAINTIFF' ? 'Davacı' : p.role === 'DEFENDANT' ? 'Davalı' : p.role;
    return `${name} (${roleTr})`;
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
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}

function FeeEditForm({ fee, caseFileId, onSuccess, onCancel, isSaving, onSave }: {
  fee: Fee;
  caseFileId: string;
  onSuccess: () => void;
  onCancel: () => void;
  isSaving: boolean;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    debtor_party_id: fee.debtor_party_id,
    type: fee.type,
    amount: String(fee.amount),
  });
  const [error, setError] = useState('');

  const { data: parties } = useQuery<Array<{ id: string; first_name?: string; last_name?: string; organization_name?: string; role: string; party_type: string }>>({
    queryKey: ['parties', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/parties`);
      return res.data.data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.debtor_party_id) {
      setError('Lütfen borçlu tarafı seçin.');
      return;
    }
    if (!form.type.trim()) {
      setError('Lütfen harç türünü girin.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }
    const data: Record<string, unknown> = {
      debtor_party_id: form.debtor_party_id,
      type: form.type,
      amount,
    };
    onSave(data);
    onSuccess();
  };

  const partyList = parties || [];

  function partyLabel(p: { first_name?: string; last_name?: string; organization_name?: string; role: string; party_type: string }) {
    const name = p.party_type === 'PERSON'
      ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
      : p.organization_name || 'Ünvansız Kurum';
    const roleTr = p.role === 'PLAINTIFF' ? 'Davacı' : p.role === 'DEFENDANT' ? 'Davalı' : p.role;
    return `${name} (${roleTr})`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="edit-debtor-party">Borçlu Taraf *</Label>
        <select
          id="edit-debtor-party"
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
        <Label htmlFor="edit-fee-type">Tür *</Label>
        <Input id="edit-fee-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Başvuru, Karar, Temyiz..." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-amount">Tutar (TL) *</Label>
        <Input id="edit-amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>İptal</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Kaydediliyor...' : 'Güncelle'}</Button>
      </div>
    </form>
  );
}
