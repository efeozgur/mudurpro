import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, UserPlus, Trash, MapPin } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import type { Column } from '@/components/shared/data-table';

interface Court {
  id: string;
  name: string;
  type: string;
  courthouse_id: string;
  courthouse_name: string;
  courthouse_city: string;
  courthouse_district: string;
  case_file_count: number;
  active: boolean;
  assigned_mudur_id: string | null;
  assigned_mudur_name: string | null;
  created_at: string;
}

const COURT_TYPE_LABELS: Record<string, string> = {
  HUKUK: 'Hukuk',
  CEZA: 'Ceza',
  IDARE: 'İdare',
  IS: 'İş',
  AİLE: 'Aile',
  TICARET: 'Ticaret',
  ICRA: 'İcra',
  SULH: 'Sulh Hukuk',
};


export default function CourtManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Court[]>({
    queryKey: ['courts'],
    queryFn: async () => {
      const res = await apiClient.get('/courts');
      return res.data.data;
    },
  });

  const [showAssign, setShowAssign] = useState(false);
  const [assignCourtId, setAssignCourtId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/courts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courts'] }),
  });

  const columns: Column<Court>[] = [
    { key: 'name', header: 'Mahkeme Adı', sortable: true },
    {
      key: 'type',
      header: 'Tür',
      sortable: true,
      render: (item) => COURT_TYPE_LABELS[item.type] || item.type,
    },
    {
      key: 'courthouse_name',
      header: 'Adliye',
      sortable: true,
      render: (item) => (
        <div>
          <div>{item.courthouse_name || '—'}</div>
          {item.courthouse_city && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {item.courthouse_city}{item.courthouse_district ? ` / ${item.courthouse_district}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'case_file_count',
      header: 'Dosya Sayısı',
      sortable: true,
      render: (item) => (
        <span className="tabular-nums">{item.case_file_count}</span>
      ),
    },
    {
      key: 'active',
      header: 'Durum',
      render: (item) => (
        <span className={item.active ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
          {item.active ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      key: 'assigned_mudur_name',
      header: 'Görevli Müdür',
      sortable: true,
      render: (item) => item.assigned_mudur_name || <span className="text-muted-foreground italic text-xs">Atanmadı</span>
    },
    {
      key: 'created_at',
      header: 'Oluşturulma',
      sortable: true,
      render: (item) => new Date(item.created_at).toLocaleDateString('tr-TR'),
    },
    {
      key: 'id',
      header: 'İşlemler',
      render: (item) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="outline" onClick={() => { setAssignCourtId(item.id); setShowAssign(true); }}>
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            {item.assigned_mudur_id ? 'Atamayı Değiştir' : 'Müdür Ata'}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirmId(item.id)}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Mahkemeler</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Mahkeme yönetimi</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-[6px] bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-[#BE4E37] active:bg-[#A33F2B] transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
          Yeni Mahkeme
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchPlaceholder="Mahkeme ara..."
        onRowClick={(item: Court) => { setEditingId(item.id); setShowForm(true); }}
        rowClassName={(item) => item.assigned_mudur_id ? 'bg-[#F2EAE1] hover:bg-[#E9DDD0] text-foreground font-medium' : ''}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Mahkeme Düzenle' : 'Yeni Mahkeme'}</DialogTitle>
          </DialogHeader>
          <CourtForm
            id={editingId || undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingId(null);
              queryClient.invalidateQueries({ queryKey: ['courts'] });
            }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Müdür Ata</DialogTitle>
          </DialogHeader>
          <MudurAssignForm
            courtId={assignCourtId!}
            onSuccess={() => {
              setShowAssign(false);
              setAssignCourtId(null);
              queryClient.invalidateQueries({ queryKey: ['courts'] });
            }}
            onCancel={() => { setShowAssign(false); setAssignCourtId(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mahkemeyi Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu mahkemeyi silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>İptal</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId, { onSuccess: () => setDeleteConfirmId(null) });
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

function MudurAssignForm({ courtId, onSuccess, onCancel }: { courtId: string; onSuccess: () => void; onCancel: () => void }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: mudurs } = useQuery<{ id: string; name: string; email: string; courthouse_id?: string; courthouse_name?: string }[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/users');
      return (res.data.data || []).filter((u: any) => u.role === 'MUDUR');
    },
  });

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await apiClient.post(`/courts/${courtId}/assign-mudur`, { userId: selectedUserId });
      onSuccess();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Label>Müdür Seçin</Label>
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
      >
        <option value="">Seçiniz</option>
        {(mudurs || []).map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} — {m.courthouse_name || 'Adliye belirtilmemiş'}
          </option>
        ))}
      </select>
      {mudurs?.length === 0 && <p className="text-sm text-muted-foreground">Henüz MUDUR rolünde kullanıcı yok. Önce Kullanıcılar sayfasından ekleyin.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button onClick={handleAssign} disabled={saving || !selectedUserId}>
          {saving ? 'Atanıyor...' : 'Ata'}
        </Button>
      </div>
    </div>
  );
}

function CourtForm({ id, onSuccess, onCancel }: { id?: string; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', type: '', courthouse_id: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: courthouses } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['courthouses'],
    queryFn: async () => {
      const res = await apiClient.get('/courthouses');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`/courts/${id}`).then((res) => {
        const c = res.data.data;
        setForm({ name: c.name || '', type: c.type || '', courthouse_id: c.courthouse_id || '' });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (courthouses && courthouses.length === 1 && !form.courthouse_id) {
      setForm(prev => ({ ...prev, courthouse_id: courthouses[0].id }));
    }
  }, [courthouses, form.courthouse_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await apiClient.put(`/courts/${id}`, form);
      } else {
        await apiClient.post('/courts', form);
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="court-name">Mahkeme Adı *</Label>
        <Input id="court-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="court-type">Tür *</Label>
        <select
          id="court-type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
          required
        >
          <option value="">Seçiniz</option>
          <option value="HUKUK">Hukuk Mahkemesi</option>
          <option value="CEZA">Ceza Mahkemesi</option>
          <option value="IDARE">İdare Mahkemesi</option>
          <option value="IS">İş Mahkemesi</option>
          <option value="AİLE">Aile Mahkemesi</option>
          <option value="TICARET">Ticaret Mahkemesi</option>
          <option value="ICRA">İcra Mahkemesi</option>
          <option value="SULH">Sulh Hukuk Mahkemesi</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="courthouse_id">Adliye *</Label>
        <select
          id="courthouse_id"
          value={form.courthouse_id}
          onChange={(e) => setForm({ ...form, courthouse_id: e.target.value })}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
          required
        >
          <option value="">Seçiniz</option>
          {(courthouses || []).map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
