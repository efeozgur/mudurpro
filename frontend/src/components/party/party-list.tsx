import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { PartyForm } from './party-form';
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
import { Plus, Users, Trash } from 'lucide-react';

interface Party {
  id: string;
  case_file_id: string;
  party_type: 'PERSON' | 'ORGANIZATION';
  role: 'PLAINTIFF' | 'DEFENDANT';
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  national_id: string | null;
  tax_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  duplicate_warning?: boolean;
}

interface PartyListProps {
  caseFileId: string;
}

export function PartyList({ caseFileId }: PartyListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmParty, setDeleteConfirmParty] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Party[]>({
    queryKey: ['parties', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/parties`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/parties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parties', caseFileId] }),
  });

  if (isLoading) return <LoadingSpinner />;

  const parties = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Taraflar</h3>
        <Button size="sm" onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Taraf Ekle
        </Button>
      </div>

      {parties.length === 0 ? (
        <EmptyState message="Henüz taraf eklenmemiş." icon={<Users className="h-12 w-12" />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad / Kurum Ünvanı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.map((party) => {
              const name = party.party_type === 'PERSON' 
                ? `${party.first_name || ''} ${party.last_name || ''}`.trim() 
                : party.organization_name || 'Ünvansız Kurum';

              return (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">
                    {name}
                    {party.duplicate_warning && (
                      <span className="ml-2 text-xs text-amber-600">(Muhtemel mükerrer)</span>
                    )}
                  </TableCell>
                  <TableCell>{party.party_type === 'PERSON' ? 'Gerçek Kişi' : 'Tüzel Kişi'}</TableCell>
                  <TableCell>
                    {party.role === 'PLAINTIFF' ? 'Davacı' : party.role === 'DEFENDANT' ? 'Davalı' : party.role}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={party.is_active ? 'ACTIVE' : 'ARCHIVED'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="ghost" size="xs" onClick={() => { setEditingId(party.id); setShowForm(true); }}>
                        Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="xs" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteConfirmParty(party.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash className="h-3 w-3 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Taraf Düzenle' : 'Yeni Taraf'}</DialogTitle>
          </DialogHeader>
          <PartyForm
            caseFileId={caseFileId}
            partyId={editingId || undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingId(null);
              queryClient.invalidateQueries({ queryKey: ['parties', caseFileId] });
            }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmParty} onOpenChange={() => setDeleteConfirmParty(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tarafı Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu tarafı silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmParty(null)}>İptal</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteConfirmParty) deleteMutation.mutate(deleteConfirmParty, { onSuccess: () => setDeleteConfirmParty(null) });
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
