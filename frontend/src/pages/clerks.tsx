import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderOpen, KeyRound, Plus, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react';

const permissionOptions = [
  { value: 'CASES', label: 'Dosyalar' },
  { value: 'PARTIES', label: 'Taraflar' },
  { value: 'SERVICES', label: 'Tebligat / Hizmet Kayıtları' },
  { value: 'FEES', label: 'Harç Takibi' },
  { value: 'APPEALS', label: 'Kanun Yolları' },
  { value: 'TEMPLATES', label: 'Şablonlar' },
  { value: 'REPORTS', label: 'Raporlar / Dashboard' },
];

interface Clerk {
  id: string;
  name: string;
  email: string;
  active: boolean;
  permissions: string[];
}

interface CaseFile {
  id: string;
  esas_no: string;
  court_id: string;
  court_name?: string;
  durum: string;
}

interface Assignment {
  case_file_id: string;
  court_id: string;
}

interface CaseListResponse {
  data: CaseFile[];
}

const emptyForm = { name: '', email: '', password: '', permissions: [] as string[] };

export default function Clerks() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingClerk, setEditingClerk] = useState<Clerk | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [allCourtFiles, setAllCourtFiles] = useState(false);
  const [allCourtId, setAllCourtId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const clerksQuery = useQuery<Clerk[]>({
    queryKey: ['clerks'],
    queryFn: async () => (await apiClient.get('/auth/clerks')).data.data,
  });

  const casesQuery = useQuery<CaseListResponse>({
    queryKey: ['clerk-case-options'],
    queryFn: async () => (await apiClient.get('/cases?limit=1000')).data.data,
  });

  const assignmentQuery = useQuery<Assignment[]>({
    queryKey: ['clerk-assignments', editingClerk?.id],
    enabled: Boolean(editingClerk),
    queryFn: async () => (await apiClient.get(`/auth/clerks/${editingClerk?.id}/assignments`)).data.data,
  });

  useEffect(() => {
    if (!editingClerk) return;
    setForm({
      name: editingClerk.name,
      email: editingClerk.email,
      password: '',
      permissions: editingClerk.permissions || [],
    });
  }, [editingClerk]);

  useEffect(() => {
    if (!editingClerk || !assignmentQuery.data) return;
    setSelectedCaseIds(assignmentQuery.data.map((assignment) => assignment.case_file_id));
  }, [assignmentQuery.data, editingClerk]);

  const cases = casesQuery.data?.data || [];
  const courtOptions = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    cases.forEach((caseFile) => {
      if (!byId.has(caseFile.court_id)) {
        byId.set(caseFile.court_id, {
          id: caseFile.court_id,
          label: caseFile.court_name || caseFile.court_id,
        });
      }
    });
    return [...byId.values()];
  }, [cases]);

  const openCreate = () => {
    setEditingClerk(null);
    setForm(emptyForm);
    setSelectedCaseIds([]);
    setAllCourtFiles(false);
    setAllCourtId('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (clerk: Clerk) => {
    setEditingClerk(clerk);
    setSelectedCaseIds([]);
    setAllCourtFiles(false);
    setAllCourtId('');
    setError('');
    setShowForm(true);
  };

  const togglePermission = (permission: string) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const toggleCase = (caseId: string) => {
    setSelectedCaseIds((current) => current.includes(caseId)
      ? current.filter((id) => id !== caseId)
      : [...current, caseId]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
        permissions: form.permissions,
      };
      const response = editingClerk
        ? await apiClient.put(`/auth/clerks/${editingClerk.id}`, payload)
        : await apiClient.post('/auth/clerks', { ...payload, password: form.password });
      if (!response.data.success) throw new Error('Katip kaydedilemedi.');

      const clerkId = editingClerk?.id || response.data.data.id;
      await apiClient.put(`/auth/clerks/${clerkId}/assignments`, {
        case_file_ids: allCourtFiles ? [] : selectedCaseIds,
        all_court_files: allCourtFiles,
        ...(allCourtFiles && allCourtId ? { court_id: allCourtId } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ['clerks'] });
      setShowForm(false);
      setEditingClerk(null);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err.response && typeof err.response === 'object' && 'data' in err.response
          ? err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
            ? err.response.data.message
            : undefined
          : undefined)
        : undefined;
      setError(Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : 'Katip kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const deleteClerk = async (clerk: Clerk) => {
    if (!window.confirm(`${clerk.name} adlı katibi pasifleştirmek/silmek istiyor musunuz?`)) return;
    await apiClient.delete(`/auth/clerks/${clerk.id}`);
    await queryClient.invalidateQueries({ queryKey: ['clerks'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Katiplerim</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Katip ekleyin, modül yetkilerini belirleyin ve dosyalarınızı görevlendirin.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />Katip Ekle</Button>
      </div>

      {clerksQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Katipler yükleniyor...</p>
      ) : (clerksQuery.data || []).length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz katip eklenmemiş.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(clerksQuery.data || []).map((clerk) => (
            <Card key={clerk.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[14px]"><UserRound className="h-4 w-4" />{clerk.name}</CardTitle>
                  <p className="mt-1 text-[11px] text-muted-foreground">{clerk.email}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] ${clerk.active ? 'bg-success-bg text-success-text' : 'bg-muted text-muted-foreground'}`}>
                  {clerk.active ? 'Aktif' : 'Pasif'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {(clerk.permissions || []).length > 0 ? clerk.permissions.map((permission) => (
                    <span key={permission} className="rounded bg-normal-bg px-2 py-1 text-[10px] text-normal-text">
                      {permissionOptions.find((item) => item.value === permission)?.label || permission}
                    </span>
                  )) : <span className="text-[11px] text-muted-foreground">Henüz modül yetkisi verilmedi.</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(clerk)}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Yetkileri ve Dosyaları Yönet</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void deleteClerk(clerk)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[92vh] w-[92vw] !max-w-[1000px] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingClerk ? 'Katip Yetkileri ve Dosya Görevlendirmesi' : 'Yeni Katip'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded bg-critical-bg p-3 text-[12px] text-critical-text">{error}</div>}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Ad Soyad *</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
              <div className="space-y-2"><Label>E-posta *</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
              <div className="space-y-2"><Label>{editingClerk ? 'Yeni Şifre' : 'Şifre *'}</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingClerk} /></div>
            </div>

            <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4" />Modül Yetkileri</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {permissionOptions.map((permission) => {
                const selected = form.permissions.includes(permission.value);
                return <button type="button" key={permission.value} onClick={() => togglePermission(permission.value)} className={`rounded border px-3 py-2 text-left text-[11px] ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}><span className="font-medium">{selected ? '✓ ' : ''}{permission.label}</span></button>;
              })}
            </div></section>

            <section className="space-y-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FolderOpen className="h-4 w-4" />Dosya Görevlendirmesi</h2>
              <div className="flex flex-wrap items-center gap-3 rounded border border-border p-3 text-[11px]">
                <button type="button" onClick={() => setAllCourtFiles((current) => { const next = !current; if (next && !allCourtId && courtOptions.length === 1) setAllCourtId(courtOptions[0].id); return next; })} className={`rounded border px-3 py-2 ${allCourtFiles ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>{allCourtFiles ? '✓ ' : ''}Bağlı mahkemenin tüm dosyaları</button>
                <span className="text-muted-foreground">Bir dosyada birden fazla katip görevlendirilebilir.</span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded border border-border">{cases.map((caseFile) => <button type="button" key={caseFile.id} onClick={() => toggleCase(caseFile.id)} className={`flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-[11px] last:border-0 ${selectedCaseIds.includes(caseFile.id) ? 'bg-primary/10' : 'hover:bg-muted'}`}><span><strong>{caseFile.esas_no}</strong><span className="ml-2 text-muted-foreground">{caseFile.court_name || caseFile.court_id}</span></span><span>{selectedCaseIds.includes(caseFile.id) ? '✓ Atandı' : 'Ata'}</span></button>)}{cases.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">Bağlı mahkemelerde dosya bulunamadı.</p>}</div>
            </section>

            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button><Button type="submit" disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
