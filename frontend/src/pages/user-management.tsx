import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/shared/data-table';
import type { Column } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  courthouse_id: string | null;
  active: boolean;
}

interface Courthouse {
  id: string;
  name: string;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/auth/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const { data: me, isLoading: meLoading } = useQuery<{ role: string; courthouse_id?: string | null }>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data.data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/users');
      return res.data.data;
    },
  });

  const { data: courthouses, isLoading: courthousesLoading } = useQuery<Courthouse[]>({
    queryKey: ['courthouses'],
    queryFn: async () => {
      const res = await apiClient.get('/courthouses');
      return res.data.data || [];
    },
    enabled: me?.role === 'SUPER_ADMIN',
  });

  if (usersLoading || meLoading || (me?.role === 'SUPER_ADMIN' && courthousesLoading)) {
    return <LoadingSpinner />;
  }

  const getCourthouseName = (courthouseId: string | null) => {
    if (!courthouseId) return 'Genel (Sistem)';
    const c = courthouses?.find(item => item.id === courthouseId);
    return c ? c.name : 'Adliye Tanımlı';
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Ad Soyad', sortable: true },
    { key: 'email', header: 'E-posta', sortable: true },
    {
      key: 'role',
      header: 'Rol',
      render: (item) => <StatusBadge status={item.role} />,
    },
    {
      key: 'courthouse_id',
      header: 'Adliye',
      render: (item) => getCourthouseName(item.courthouse_id),
    },
    {
      key: 'active',
      header: 'Durum',
      render: (item) => <StatusBadge status={item.active ? 'ACTIVE' : 'ARCHIVED'} />,
    },
    {
      key: 'id',
      header: 'İşlemler',
      render: (item) => {
        const isEditable = me?.role === 'SUPER_ADMIN' || 
          (me?.role === 'ADLIYE_ADMIN' && item.role === 'MUDUR' && item.courthouse_id === me?.courthouse_id);
        
        if (!isEditable) return <span className="text-xs text-muted-foreground">-</span>;

        const canDelete = me?.role === 'SUPER_ADMIN' ||
          (me?.role === 'ADLIYE_ADMIN' && item.role === 'MUDUR' && item.courthouse_id === me?.courthouse_id);

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setEditingUser(item);
                setShowForm(true);
              }}
            >
              Düzenle
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteConfirm(item)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3" />
                Sil
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground font-[family-name:Georgia,serif]">Kullanıcılar</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Kullanıcı yönetimi ve mahkeme atamaları</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }} 
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Yeni Kullanıcı
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users || []}
        searchPlaceholder="Kullanıcı ara..."
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          </DialogHeader>
          <UserForm
            me={me}
            user={editingUser}
            courthouses={courthouses || []}
            onSuccess={() => {
              setShowForm(false);
              setEditingUser(null);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">
              <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.email}) kullanıcısını silmek istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                İptal
              </Button>
              <Button
                size="sm"
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirm) {
                    deleteMutation.mutate(deleteConfirm.id, {
                      onSuccess: () => setDeleteConfirm(null),
                    });
                  }
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

function UserForm({ me, user, courthouses, onSuccess, onCancel }: {
  me: any;
  user: User | null;
  courthouses: Courthouse[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'MUDUR', 
    courthouse_id: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        courthouse_id: user.courthouse_id || '',
        active: user.active
      });
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'MUDUR',
        courthouse_id: '',
        active: true
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        // Edit User
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: me?.role === 'SUPER_ADMIN' ? form.role : undefined,
          courthouse_id: me?.role === 'SUPER_ADMIN' ? (form.courthouse_id || undefined) : undefined,
          active: form.active
        };
        await apiClient.put(`/auth/users/${user.id}`, payload);
      } else {
        // Create User
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          courthouse_id: me?.role === 'SUPER_ADMIN' ? (form.courthouse_id || undefined) : undefined
        };
        await apiClient.post('/auth/users', payload);
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="uname">Ad Soyad *</Label>
        <Input id="uname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="uemail">E-posta *</Label>
        <Input id="uemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="upass">{user ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre *'}</Label>
        <Input 
          id="upass" 
          type="password" 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          required={!user} 
        />
      </div>

      {(!user || me?.role === 'SUPER_ADMIN') && (
        <div className="space-y-2">
          <Label>Rol *</Label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="MUDUR">Müdür</option>
            <option value="ADLIYE_ADMIN">Adliye Yöneticisi</option>
            <option value="SUPER_ADMIN">Sistem Yöneticisi</option>
          </select>
        </div>
      )}

      {me?.role === 'SUPER_ADMIN' && (
        <div className="space-y-2">
          <Label htmlFor="ucourthouse">Adliye *</Label>
          <select
            id="ucourthouse"
            value={form.courthouse_id}
            onChange={(e) => setForm({ ...form, courthouse_id: e.target.value })}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
            required
          >
            <option value="">Seçiniz</option>
            {courthouses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {user && (
        <div className="space-y-2">
          <Label>Durum *</Label>
          <select
            value={form.active ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
