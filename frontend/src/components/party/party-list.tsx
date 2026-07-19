import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Users } from 'lucide-react';

interface Party {
  id: string;
  type: string;
  name: string;
  role: string;
  status: string;
  duplicate_warning: boolean;
}

interface PartyListProps {
  caseFileId: string;
}

export function PartyList({ caseFileId }: PartyListProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Party[]>({
    queryKey: ['parties', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/parties`);
      return res.data.data;
    },
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
              <TableHead>Ad</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.map((party) => (
              <TableRow key={party.id}>
                <TableCell className="font-medium">
                  {party.name}
                  {party.duplicate_warning && (
                    <span className="ml-2 text-xs text-amber-600">(Muhtemel mükerrer)</span>
                  )}
                </TableCell>
                <TableCell>{party.type === 'PERSON' ? 'Gerçek Kişi' : 'Tüzel Kişi'}</TableCell>
                <TableCell>{party.role}</TableCell>
                <TableCell><StatusBadge status={party.status} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="xs" onClick={() => { setEditingId(party.id); setShowForm(true); }}>
                    Düzenle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
    </div>
  );
}
