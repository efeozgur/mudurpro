import { useState, useEffect } from 'react';
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
import { Plus, Send, Trash, Edit2 } from 'lucide-react';

interface ServiceRecord {
  id: string;
  case_file_id: string;
  party_id: string;
  type: string;
  sent_date: string | null;
  served_date: string | null;
  status: string;
  aciklama: string | null;
}

interface Party {
  id: string;
  party_type: 'PERSON' | 'ORGANIZATION';
  role: 'PLAINTIFF' | 'DEFENDANT';
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
}

interface ServiceRecordListProps {
  caseFileId: string;
}

function getServiceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    APPEAL_ISTINAF: 'İstinaf Başvurusu',
    APPEAL_TEMYIZ: 'Temyiz Başvurusu',
  };
  return map[type] || type;
}

export function ServiceRecordList({ caseFileId }: ServiceRecordListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [serveModal, setServeModal] = useState<ServiceRecord | null>(null);
  const [serveDate, setServeDate] = useState('');
  const [serveError, setServeError] = useState('');
  const [deleteConfirmService, setDeleteConfirmService] = useState<string | null>(null);

  const { data: servicesData, isLoading: servicesLoading } = useQuery<ServiceRecord[]>({
    queryKey: ['services', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/services`);
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

  const statusMutation = useMutation({
    mutationFn: ({ id, status, served_date }: { id: string; status: string; served_date?: string }) =>
      apiClient.patch(`/services/${id}/status`, { status, served_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
    },
  });

  if (servicesLoading || partiesLoading) return <LoadingSpinner />;

  const records = servicesData || [];
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

  const handleOpenCreate = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleOpenEdit = (service: ServiceRecord) => {
    setEditingService(service);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tebligatlar</h3>
        <Button size="sm" onClick={handleOpenCreate}>
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
              <TableHead>Sonuç/Tebliğ Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{getPartyName(r.party_id)}</TableCell>
                <TableCell>{getServiceTypeLabel(r.type)}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{r.sent_date ? new Date(r.sent_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{r.served_date ? new Date(r.served_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        if (r.status === 'SERVED') {
                          statusMutation.mutate({ id: r.id, status: 'RETURNED' });
                        } else {
                          setServeModal(r);
                          setServeDate(new Date().toISOString().split('T')[0]);
                          setServeError('');
                        }
                      }}
                      disabled={statusMutation.isPending}
                    >
                      {r.status === 'SERVED' ? 'İade Et' : 'Tebliğ Edildi'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      onClick={() => handleOpenEdit(r)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmService(r.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!serveModal} onOpenChange={() => { setServeModal(null); setServeError(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tebligat Tarihi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">
              "{serveModal?.type ? getServiceTypeLabel(serveModal.type) : ''}" tebligatı için tebliğ tarihini girin:
            </p>
            {serveError && (
              <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
                {serveError}
              </div>
            )}
            <Input
              type="date"
              value={serveDate}
              onChange={(e) => setServeDate(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => { setServeModal(null); setServeError(''); }}>
                İptal
              </Button>
              <Button
                size="sm"
                disabled={statusMutation.isPending || !serveDate}
                onClick={() => {
                  if (serveModal && serveDate) {
                    setServeError('');
                    statusMutation.mutate(
                      { id: serveModal.id, status: 'SERVED', served_date: serveDate },
                      {
                        onSuccess: () => setServeModal(null),
                        onError: (err: any) => {
                          const msg = err?.response?.data?.message;
                          const turkishMsg = msg === 'served_date cannot be before sent_date'
                            ? 'Tebliğ tarihi, gönderim tarihinden önce olamaz.'
                            : (Array.isArray(msg) ? msg[0] : msg || 'Bir hata oluştu');
                          setServeError(turkishMsg);
                        },
                      },
                    );
                  }
                }}
              >
                {statusMutation.isPending ? 'Kaydediliyor...' : 'Tebliğ Et'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Tebliğ Bilgilerini Düzenle' : 'Yeni Tebligat'}</DialogTitle>
          </DialogHeader>
          <ServiceRecordForm
            caseFileId={caseFileId}
            serviceRecord={editingService}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
              queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmService} onOpenChange={() => setDeleteConfirmService(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tebligatı Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu tebligat kaydını silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmService(null)}>İptal</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirmService) deleteMutation.mutate(deleteConfirmService, { onSuccess: () => setDeleteConfirmService(null) });
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

const formatDateForInput = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

function ServiceRecordForm({ caseFileId, serviceRecord, onSuccess, onCancel }: {
  caseFileId: string;
  serviceRecord: ServiceRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    party_id: '',
    type: '',
    sent_date: '',
    served_date: '',
    status: 'PREPARED',
    aciklama: '',
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

  useEffect(() => {
    if (serviceRecord) {
      setForm({
        party_id: serviceRecord.party_id,
        type: serviceRecord.type,
        sent_date: formatDateForInput(serviceRecord.sent_date),
        served_date: formatDateForInput(serviceRecord.served_date),
        status: serviceRecord.status || 'PREPARED',
        aciklama: serviceRecord.aciklama || '',
      });
    } else {
      setForm({
        party_id: '',
        type: '',
        sent_date: '',
        served_date: '',
        status: 'PREPARED',
        aciklama: '',
      });
    }
  }, [serviceRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.party_id) {
      setError('Lütfen bir taraf seçin.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        case_file_id: caseFileId,
        party_id: form.party_id,
        type: form.type,
        sent_date: form.sent_date || undefined,
        served_date: form.served_date || undefined,
        status: form.status,
        aciklama: form.aciklama || undefined,
      };

      if (serviceRecord) {
        await apiClient.put(`/services/${serviceRecord.id}`, payload);
      } else {
        await apiClient.post('/services', payload);
      }
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sr-sent-date">Gönderim Tarihi</Label>
          <Input id="sr-sent-date" type="date" value={form.sent_date} onChange={(e) => setForm({ ...form, sent_date: e.target.value })} />
        </div>

        {serviceRecord && (
          <div className="space-y-2">
            <Label htmlFor="sr-served-date">Tebliğ Tarihi</Label>
            <Input id="sr-served-date" type="date" value={form.served_date} onChange={(e) => setForm({ ...form, served_date: e.target.value })} />
          </div>
        )}
      </div>

      {serviceRecord && (
        <div className="space-y-2">
          <Label htmlFor="sr-status">Durum</Label>
          <select
            id="sr-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm"
          >
            <option value="PREPARED">Hazırlanıyor</option>
            <option value="SENT">Gönderildi</option>
            <option value="SERVED">Tebliğ Edildi</option>
            <option value="RETURNED">İade Edildi</option>
            <option value="CANCELLED">İptal</option>
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sr-aciklama">Açıklama</Label>
        <Input id="sr-aciklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Açıklama..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
