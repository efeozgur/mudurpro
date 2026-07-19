import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/users');
      return res.data.data;
    },
  });

  const columns: Column<User>[] = [
    { key: 'name', header: 'Ad Soyad', sortable: true },
    { key: 'email', header: 'E-posta', sortable: true },
    {
      key: 'role',
      header: 'Rol',
      render: (item) => <StatusBadge status={item.role} />,
    },
    {
      key: 'active',
      header: 'Durum',
      render: (item) => <StatusBadge status={item.active ? 'ACTIVE' : 'ARCHIVED'} />,
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground mt-1">Kullanıcı yönetimi ve mahkeme atamaları</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Yeni Kullanıcı
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        searchPlaceholder="Kullanıcı ara..."
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı</DialogTitle>
          </DialogHeader>
          <UserCreateForm
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserCreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MUDUR' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/auth/users', form);
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
        <Label htmlFor="upass">Şifre *</Label>
        <Input id="upass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Rol *</Label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
        >
          <option value="MUDUR">Müdür</option>
          <option value="ADLIYE_ADMIN">Adliye Yöneticisi</option>
          <option value="SUPER_ADMIN">Sistem Yöneticisi</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
