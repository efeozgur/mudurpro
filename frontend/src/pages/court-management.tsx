import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import type { Column } from '@/components/shared/data-table';

interface Court {
  id: string;
  name: string;
  type: string;
  courthouse_name: string;
}

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

  const columns: Column<Court>[] = [
    { key: 'name', header: 'Mahkeme Adı', sortable: true },
    { key: 'type', header: 'Tür', sortable: true },
    { key: 'courthouse_name', header: 'Adliye', sortable: true },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mahkemeler</h1>
          <p className="text-sm text-muted-foreground mt-1">Mahkeme yönetimi</p>
        </div>
        <Button onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Yeni Mahkeme
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchPlaceholder="Mahkeme ara..."
        onRowClick={(item: Court) => { setEditingId(item.id); setShowForm(true); }}
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
