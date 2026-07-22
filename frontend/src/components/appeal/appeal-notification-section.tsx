import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { Send, Plus } from 'lucide-react';

interface ServiceRecord {
  id: string;
  party_id: string;
  type: string;
  sent_date: string | null;
  served_date: string | null;
  status: string;
}

interface Party {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string;
}

interface AppealNotificationSectionProps {
  caseFileId: string;
  appealId: string;
  applicantPartyId: string;
  parties: Party[];
}

export function AppealNotificationSection({ caseFileId, appealId, applicantPartyId, parties }: AppealNotificationSectionProps) {
  const queryClient = useQueryClient();
  const [createServiceFor, setCreateServiceFor] = useState<Party | null>(null);
  const [serveModal, setServeModal] = useState<{ serviceId: string; partyName: string } | null>(null);
  const [serveDate, setServeDate] = useState('');

  // Determine opposing parties (not the applicant)
  const opposingParties = parties.filter((p) => p.id !== applicantPartyId);

  // Fetch appeal notification services
  const { data: allServices, isLoading } = useQuery({
    queryKey: ['services', caseFileId],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseFileId}/services`);
      return res.data.data as ServiceRecord[];
    },
  });

  // Filter services that are for this appeal (type contains ISTINAF or TEMYIZ)
  const appealServices = allServices?.filter(
    (s) => s.type.toUpperCase().includes('ISTINAF') || s.type.toUpperCase().includes('TEMYIZ')
  ) || [];

  const getServiceForParty = (partyId: string) => appealServices.find((s) => s.party_id === partyId);

  const getPartyName = (party: Party) => {
    const name = party.organization_name || `${party.first_name || ''} ${party.last_name || ''}`.trim();
    const role = party.role === 'PLAINTIFF' ? 'Davacı' : 'Davalı';
    return `${name} (${role})`;
  };

  // Create service record
  const createServiceMutation = useMutation({
    mutationFn: (partyId: string) =>
      apiClient.post('/services', {
        case_file_id: caseFileId,
        party_id: partyId,
        type: `APPEAL_${appealId.includes('ISTINAF') ? 'ISTINAF' : 'TEMYIZ'}`,
        status: 'PREPARED',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
      setCreateServiceFor(null);
    },
  });

  // Update status to SERVED
  const statusMutation = useMutation({
    mutationFn: ({ id, servedDate: sd }: { id: string; servedDate: string }) =>
      apiClient.patch(`/services/${id}/status`, { status: 'SERVED', served_date: sd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', caseFileId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseFileId] });
      setServeModal(null);
    },
  });

  const getDeadlineInfo = (servedDate: string | null) => {
    if (!servedDate) return null;
    const served = new Date(servedDate);
    const deadline = new Date(served);
    deadline.setDate(deadline.getDate() + 14);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const remaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { deadline: deadline.toLocaleDateString('tr-TR'), remainingDays: remaining };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Tebligat Takibi</h4>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : opposingParties.length === 0 ? (
        <EmptyState message="Karşı taraf bulunamadı." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karşı Taraf</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tebliğ Tarihi</TableHead>
                <TableHead>Cevap Süresi</TableHead>
                <TableHead>Kalan Gün</TableHead>
                <TableHead className="w-[100px]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opposingParties.map((party) => {
                const svc = getServiceForParty(party.id);
                const deadline = svc ? getDeadlineInfo(svc.served_date) : null;

                return (
                  <TableRow key={party.id}>
                    <TableCell className="text-xs font-medium">{getPartyName(party)}</TableCell>
                    <TableCell>
                      {svc ? <StatusBadge status={svc.status} /> : <span className="text-[11px] text-muted-foreground">İşlem yapılmadı</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {svc?.served_date ? new Date(svc.served_date).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {deadline ? deadline.deadline : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {deadline ? (
                        deadline.remainingDays <= 0 ? (
                          <span className="text-destructive font-semibold">Süre Doldu</span>
                        ) : deadline.remainingDays <= 3 ? (
                          <span className="text-amber-600 font-semibold">{deadline.remainingDays} gün</span>
                        ) : (
                          <span className="text-muted-foreground">{deadline.remainingDays} gün</span>
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {!svc ? (
                        <Button size="sm" variant="outline" onClick={() => setCreateServiceFor(party)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Tebligat Çıkar
                        </Button>
                      ) : svc.status !== 'SERVED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setServeModal({ serviceId: svc.id, partyName: getPartyName(party) });
                            setServeDate(new Date().toISOString().split('T')[0]);
                          }}
                        >
                          Tebliğ Et
                        </Button>
                      ) : (
                        <span className="text-[11px] text-success font-medium">Tamamlandı</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tebligat Çıkar confirmation */}
      <Dialog open={!!createServiceFor} onOpenChange={() => setCreateServiceFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tebligat Çıkar</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            {createServiceFor && `"${getPartyName(createServiceFor)}" için kanun yolu tebligatı çıkarılacak.`}
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateServiceFor(null)}>İptal</Button>
            <Button size="sm" onClick={() => createServiceFor && createServiceMutation.mutate(createServiceFor.id)} disabled={createServiceMutation.isPending}>
              Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tebliğ Et dialog */}
      <Dialog open={!!serveModal} onOpenChange={() => setServeModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tebligat Tarihi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">
              "{serveModal?.partyName}" için tebliğ tarihini girin:
            </p>
            <Input
              type="date"
              value={serveDate}
              onChange={(e) => setServeDate(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setServeModal(null)}>İptal</Button>
              <Button
                size="sm"
                disabled={statusMutation.isPending || !serveDate}
                onClick={() => {
                  if (serveModal && serveDate) {
                    statusMutation.mutate({ id: serveModal.serviceId, servedDate: serveDate });
                  }
                }}
              >
                {statusMutation.isPending ? 'Kaydediliyor...' : 'Tebliğ Et'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
