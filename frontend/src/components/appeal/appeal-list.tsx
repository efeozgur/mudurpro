import React, { useState } from 'react';
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
import { Plus, FileUp, Trash, Pencil, Eye, EyeOff } from 'lucide-react';
import { AppealNotificationSection } from './appeal-notification-section';
import { AppealResponseList } from './appeal-response-list';

interface Appeal {
  id: string;
  case_file_id: string;
  applicant_party_id: string;
  type: string;
  application_date: string | null;
  result: string | null;
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

interface AppealListProps {
  caseFileId: string;
  kanunYolu?: string;
}
export function AppealList({ caseFileId, kanunYolu }: AppealListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAppeal, setEditingAppeal] = useState<Appeal | null>(null);
  const [deleteConfirmAppeal, setDeleteConfirmAppeal] = useState<string | null>(null);
  const [detailAppeal, setDetailAppeal] = useState<string | null>(null);

  const { data: appealsData, isLoading: appealsLoading } = useQuery<Appeal[]>({
    queryKey: ['appeals', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/appeals`);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/appeals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.put(`/appeals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
    },
  });

  if (appealsLoading || partiesLoading) return <LoadingSpinner />;

  const appeals = appealsData || [];
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
              <TableHead>Başvuran Taraf</TableHead>
              <TableHead>Başvuru Tarihi</TableHead>
              <TableHead>Sonuç</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map((a) => (
              <React.Fragment key={a.id}>
              <TableRow>
                <TableCell className="font-medium">
                  {a.type === 'ISTINAF' ? 'İstinaf' : a.type === 'TEMYIZ' ? 'Temyiz' : a.type}
                </TableCell>
                <TableCell>{getPartyName(a.applicant_party_id)}</TableCell>
                <TableCell>{a.application_date ? new Date(a.application_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{a.result || '-'}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditingAppeal(a)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmAppeal(a.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      Sil
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => setDetailAppeal(detailAppeal === a.id ? null : a.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title={detailAppeal === a.id ? 'Detayı Gizle' : 'Tebligat ve Cevap Detayı'}
                  >
                    {detailAppeal === a.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{detailAppeal === a.id ? 'Gizle' : 'Takip'}
                  </button>
                </TableCell>
              </TableRow>
              {detailAppeal === a.id && (
                <TableRow key={`${a.id}-detail`}>
                  <TableCell colSpan={7} className="bg-muted/20 p-4">
                    <div className="space-y-6">
                      <AppealNotificationSection
                        caseFileId={caseFileId}
                        appealId={a.id}
                        applicantPartyId={a.applicant_party_id}
                        parties={parties}
                      />
                      <AppealResponseList
                        caseFileId={caseFileId}
                        appealId={a.id}
                        applicantPartyId={a.applicant_party_id}
                        parties={parties}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
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
            defaultType={kanunYolu}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['appeals', caseFileId] });
              queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppeal} onOpenChange={() => setEditingAppeal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kanun Yolu Başvurusu Düzenle</DialogTitle>
          </DialogHeader>
          {editingAppeal && (
            <AppealEditForm
              appeal={editingAppeal}
              caseFileId={caseFileId}
              onSuccess={() => {
                setEditingAppeal(null);
                queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
              }}
              onCancel={() => setEditingAppeal(null)}
              isSaving={updateMutation.isPending}
              onSave={(data) => updateMutation.mutate({ id: editingAppeal.id, data })}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmAppeal} onOpenChange={() => setDeleteConfirmAppeal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Başvuruyu Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu kanun yolu başvurusunu silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmAppeal(null)}>İptal</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirmAppeal) deleteMutation.mutate(deleteConfirmAppeal, { onSuccess: () => setDeleteConfirmAppeal(null) });
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
function kanunYoluToAppealType(kanunYolu?: string): string {
  const normalized = kanunYolu
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/İ/g, 'I');
  if (normalized?.includes('ISTINAF')) return 'ISTINAF';
  if (normalized?.includes('TEMYIZ')) return 'TEMYIZ';
  return '';
}

function AppealAddForm({ caseFileId, defaultType, onSuccess, onCancel }: {
  caseFileId: string;
  defaultType?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const preselectedType = kanunYoluToAppealType(defaultType);
  const [form, setForm] = useState({
    applicant_party_id: '',
    type: preselectedType,
    application_date: '',
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
        <select
          id="appeal-type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm"
          required
        >
          {preselectedType
            ? <option value={preselectedType}>{preselectedType === 'ISTINAF' ? 'İstinaf' : 'Temyiz'}</option>
            : <>
                <option value="">Seçiniz</option>
                <option value="ISTINAF">İstinaf</option>
                <option value="TEMYIZ">Temyiz</option>
              </>
          }
        </select>
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

function AppealEditForm({ appeal, caseFileId, onSuccess, onCancel, isSaving, onSave }: {
  appeal: Appeal;
  caseFileId: string;
  onSuccess: () => void;
  onCancel: () => void;
  isSaving: boolean;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    applicant_party_id: appeal.applicant_party_id,
    type: appeal.type,
    application_date: appeal.application_date ? appeal.application_date.split('T')[0] : '',
    result: appeal.result || '',
    status: appeal.status,
    aciklama: appeal.aciklama || '',
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
    if (!form.applicant_party_id) {
      setError('Lütfen başvuran tarafı seçin.');
      return;
    }
    const data: Record<string, unknown> = {
      applicant_party_id: form.applicant_party_id,
      type: form.type,
      status: form.status,
      aciklama: form.aciklama || undefined,
    };
    if (form.application_date) data.application_date = form.application_date;
    if (form.result) data.result = form.result;
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
        <Label htmlFor="edit-appeal-party">Başvuran Taraf *</Label>
        <select
          id="edit-appeal-party"
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
        <Label htmlFor="edit-appeal-type">Tür *</Label>
        <select
          id="edit-appeal-type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm"
          required
        >
          <option value="">Seçiniz</option>
          <option value="ISTINAF">İstinaf</option>
          <option value="TEMYIZ">Temyiz</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-application-date">Başvuru Tarihi</Label>
        <Input id="edit-application-date" type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-appeal-result">Sonuç</Label>
        <Input id="edit-appeal-result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Karar sonucu..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-appeal-status">Durum</Label>
        <select
          id="edit-appeal-status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm"
        >
          <option value="PENDING">Beklemede</option>
          <option value="ACCEPTED">Kabul</option>
          <option value="REJECTED">Red</option>
          <option value="WITHDRAWN">Geri Çekildi</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-appeal-aciklama">Açıklama</Label>
        <Input id="edit-appeal-aciklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Açıklama..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>İptal</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Kaydediliyor...' : 'Güncelle'}</Button>
      </div>
    </form>
  );
}
