import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2 } from 'lucide-react';

interface Courthouse {
  id: string;
  name: string;
  city: string;
  district: string;
}

export default function CourthouseManagement() {
  const { user } = useAuth();
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu adliyeyi silmek istediğinize emin misiniz?')) return;
    try {
      await apiClient.delete(`/courthouses/${id}`);
      queryClient.invalidateQueries({ queryKey: ['courthouses'] });
    } catch { /* error handled by interceptor */ }
  };

  const columns: Column<Courthouse>[] = [
    { key: 'name', header: 'Ad', sortable: true },
    { key: 'city', header: 'İl', sortable: true },
    { key: 'district', header: 'İlçe', sortable: true },
    ...(user?.role !== 'MUDUR' ? [{
      key: 'id' as keyof Courthouse,
      header: 'İşlemler',
      render: (item: Courthouse) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    }] : []),
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Adliyeler</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Adliye yönetimi</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-[6px] bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-[#BE4E37] active:bg-[#A33F2B] transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
          Yeni Adliye
        </button>
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
  const [error, setError] = useState('');
  const [merkezList, setMerkezList] = useState<any[]>([]);
  const [ilceList, setIlceList] = useState<any[]>([]);
  const [selectedMerkez, setSelectedMerkez] = useState('');
  const [selectedIlce, setSelectedIlce] = useState('');

  // Load Merkez Adliye listesi (ACM)
  useEffect(() => {
    apiClient.get('/courthouses/hierarchy').then(res => {
      const list = res.data.data || [];
      setMerkezList(list);
      if (list.length === 0) setError('Merkez adliye listesi boş. HSK verisi yüklenmemiş olabilir.');
    }).catch((err) => {
      setError('Merkez adliye listesi yüklenemedi: ' + (err?.response?.data?.message || err.message));
    });
  }, []);

  // Düzenleme modunda: courthouse verisini yükle, combobox'ları eşle
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/courthouses/${id}`).then((res) => {
      const c = res.data.data;
      setForm({ name: c.name || '', city: c.city || '', district: c.district || '' });
      // Hierarchy'de eşleşen merkez bul
      if (merkezList.length > 0) {
        const match = merkezList.find((m: any) => m.name === c.name || m.il === c.city);
        if (match) {
          setSelectedMerkez(match.name);
        }
      }
    }).catch(() => setError('Adliye bilgisi yüklenemedi.')).finally(() => setLoading(false));
  }, [id]); // only on id change, not on merkezList (to avoid loops)

  // MerkezList yüklendikten sonra düzenleme için tekrar dene
  useEffect(() => {
    if (id && merkezList.length > 0 && !selectedMerkez) {
      apiClient.get(`/courthouses/${id}`).then((res) => {
        const c = res.data.data;
        const match = merkezList.find((m: any) => m.name === c.name || m.il === c.city);
        if (match) setSelectedMerkez(match.name);
      }).catch(() => {});
    }
  }, [merkezList]); // eslint-disable-line

  // Merkez seçilince ilçe adliyelerini yükle
  useEffect(() => {
    if (selectedMerkez === '__TEST__') {
      setIlceList([]);
      setSelectedIlce('');
      setForm({ name: 'Test Adliyesi', city: 'Test İli', district: 'Test İlçesi' });
      return;
    }
    if (selectedMerkez) {
      apiClient.get(`/courthouses/hierarchy/${encodeURIComponent(selectedMerkez)}`).then(res => {
        setIlceList(res.data.data || []);
      }).catch(() => setIlceList([]));
      setSelectedIlce('');
    } else {
      setIlceList([]);
    }
  }, [selectedMerkez]);

  // İlçe seçilince veya düzenlemede ilçeyi eşle
  useEffect(() => {
    if (selectedIlce) {
      const ilce = ilceList.find((i: any) => i.name === selectedIlce);
      if (ilce) {
        setForm({ name: ilce.name, city: ilce.il || '', district: ilce.name });
      }
    } else if (selectedMerkez) {
      const merkez = merkezList.find((m: any) => m.name === selectedMerkez);
      if (merkez) {
        setForm({ name: selectedMerkez, city: merkez.il || '', district: '' });
      }
    }
  }, [selectedMerkez, selectedIlce, merkezList, ilceList]);

  // Düzenlemede: ilçe listesi yüklendikten sonra courthouse ilçe adıyla eşle
  useEffect(() => {
    if (id && ilceList.length > 0 && form.name) {
      const match = ilceList.find((i: any) => i.name === form.name);
      if (match) setSelectedIlce(match.name);
    }
  }, [ilceList]); // eslint-disable-line

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
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-[12px] text-red-700">{error}</div>
      )}

      {merkezList.length > 0 && (
        <div className="space-y-2">
          <Label>Merkez Adliye</Label>
          <select
            value={selectedMerkez}
            onChange={(e) => setSelectedMerkez(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Seçiniz --</option>
            <option value="__TEST__">Test Adliyesi (Test İli)</option>
            {merkezList.map((m: any) => (
              <option key={m.name} value={m.name}>{m.name} ({m.il})</option>
            ))}
          </select>
        </div>
      )}

      {selectedMerkez && selectedMerkez !== '__TEST__' && (
        <div className="space-y-2">
          <Label>İlçe Adliyesi <span className="text-muted-foreground text-[11px]">(isteğe bağlı)</span></Label>
          <select
            value={selectedIlce}
            onChange={(e) => setSelectedIlce(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- İlçe seçilmezse merkez adliye kaydedilir --</option>
            {ilceList.map((i: any) => (
              <option key={i.name} value={i.name}>{i.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-md bg-muted/50 border p-3 text-[13px] space-y-1">
        <div className="flex gap-2">
          <span className="text-muted-foreground">İl:</span>
          <span className="font-medium">{form.city || '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground">İlçe:</span>
          <span className="font-medium">{form.district || '—'}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving || !selectedMerkez}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
