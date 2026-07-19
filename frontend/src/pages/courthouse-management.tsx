import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Column } from '@/components/shared/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface Courthouse {
  id: string;
  name: string;
  city: string;
  district: string;
}

export default function CourthouseManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Courthouse[]>({
    queryKey: ['courthouses'],
    queryFn: async () => {
      const res = await apiClient.get('/courthouses');
      return res.data.data;
    },
  });

  const columns: Column<Courthouse>[] = [
    { key: 'name', header: 'Ad', sortable: true },
    { key: 'city', header: 'İl', sortable: true },
    { key: 'district', header: 'İlçe', sortable: true },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adliyeler</h1>
          <p className="text-sm text-muted-foreground mt-1">Adliye yönetimi</p>
        </div>
        <Button onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Yeni Adliye
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchPlaceholder="Adliye ara..."
        onRowClick={(item: Courthouse) => { setEditingId(item.id); setShowForm(true); }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Adliye Düzenle' : 'Yeni Adliye'}</DialogTitle>
          </DialogHeader>
          <CourthouseForm
            id={editingId || undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingId(null);
              queryClient.invalidateQueries({ queryKey: ['courthouses'] });
            }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourthouseForm({ id, onSuccess, onCancel }: { id?: string; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', city: '', district: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`/courthouses/${id}`).then((res) => {
        const c = res.data.data;
        setForm({ name: c.name || '', city: c.city || '', district: c.district || '' });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await apiClient.put(`/courthouses/${id}`, form);
      } else {
        await apiClient.post('/courthouses', form);
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
        <Label htmlFor="name">Ad *</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">İl *</Label>
          <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">İlçe *</Label>
          <Input id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
