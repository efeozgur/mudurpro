import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react';

interface AppealResponseItem {
  id: string;
  appeal_id: string;
  opposing_party_id: string;
  response_date: string;
  content: string | null;
  received_date: string | null;
  aciklama: string | null;
}

interface Party {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string;
}

interface AppealResponseListProps {
  caseFileId: string;
  appealId: string;
  applicantPartyId: string;
  parties: Party[];
}

export function AppealResponseList({ caseFileId, appealId, applicantPartyId, parties }: AppealResponseListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppealResponseItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: responses, isLoading } = useQuery({
    queryKey: ['appeal-responses', appealId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/appeals/${appealId}/responses`);
      return res.data.data as AppealResponseItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiClient.post(`/cases/${caseFileId}/appeals/${appealId}/responses`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeal-responses', appealId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId], refetchType: 'active' });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => apiClient.put(`/appeal-responses/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeal-responses', appealId] });
      queryClient.invalidateQueries();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/appeal-responses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeal-responses', appealId] });
      queryClient.invalidateQueries();
      setDeleteConfirm(null);
    },
  });

  const getPartyName = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return 'Bilinmeyen Taraf';
    const name = party.organization_name || `${party.first_name || ''} ${party.last_name || ''}`.trim();
    const role = party.role === 'PLAINTIFF' ? 'Davacı' : 'Davalı';
    return `${name} (${role})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Cevap Dilekçeleri</h4>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Cevap Ekle
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !responses || responses.length === 0 ? (
        <EmptyState message="Henüz cevap dilekçesi eklenmemiş." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karşı Taraf</TableHead>
                <TableHead>Cevap Tarihi</TableHead>
                <TableHead className="w-[80px]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{getPartyName(r.opposing_party_id)}</TableCell>
                  <TableCell className="text-xs">{new Date(r.response_date).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(r)} className="p-1 hover:bg-muted rounded">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(r.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <ResponseFormDialog
        open={showForm}
        title="Cevap Dilekçesi Ekle"
        parties={parties}
        applicantPartyId={applicantPartyId}
        onSubmit={(data) => createMutation.mutate(data)}
        onClose={() => setShowForm(false)}
        loading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editing && (
        <ResponseFormDialog
          open={!!editing}
          title="Cevap Dilekçesi Düzenle"
          parties={parties}
          applicantPartyId={applicantPartyId}
          initial={editing}
          onSubmit={(data) => updateMutation.mutate({ id: editing.id, ...data })}
          onClose={() => setEditing(null)}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cevap Dilekçesini Sil</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">Bu cevap dilekçesini silmek istediğinize emin misiniz?</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>Sil</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseFormDialog({
  open,
  title,
  parties,
  applicantPartyId,
  initial,
  onSubmit,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  parties: Party[];
  applicantPartyId: string;
  initial?: AppealResponseItem;
  onSubmit: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const opposingParties = parties.filter((p) => p.id !== applicantPartyId);
  const [opposingPartyId, setOpposingPartyId] = useState(initial?.opposing_party_id || '');
  const [responseDate, setResponseDate] = useState(initial?.response_date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opposingPartyId || !responseDate) return;
    onSubmit({
      opposing_party_id: opposingPartyId,
      response_date: responseDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Karşı Taraf</Label>
            <select
              value={opposingPartyId}
              onChange={(e) => setOpposingPartyId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Seçiniz</option>
              {opposingParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.organization_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()} ({p.role === 'PLAINTIFF' ? 'Davacı' : 'Davalı'})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Cevap Tarihi</Label>
            <Input type="date" value={responseDate} onChange={(e) => setResponseDate(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>İptal</Button>
            <Button size="sm" type="submit" disabled={loading}>Kaydet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
