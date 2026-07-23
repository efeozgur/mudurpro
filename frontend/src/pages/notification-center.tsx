import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, CheckCheck, Eye, Check, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  message: string;
  case_file_id: string | null;
  created_at: string;
}

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications', { params: { limit: 50 } });
      return res.data.data.data || res.data.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markComplete = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const deleteRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const items = notifications || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground font-[family-name:Georgia,serif]">Bildirimler</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Tüm bildirimlerinizi görüntüleyin ve yönetin</p>
      </div>

      {items.length === 0 ? (
        <EmptyState message="Henüz bildirim yok." icon={<Bell className="h-12 w-12" />} />
      ) : (
        <div className="rounded-[6px] border border-border bg-card overflow-hidden shadow-sm">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bildirim</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((n) => (
              <TableRow
                key={n.id}
                className={n.status === 'UNREAD' ? 'bg-muted/30' : ''}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </TableCell>
                <TableCell><span className="text-xs">{n.type}</span></TableCell>
                <TableCell><StatusBadge status={n.priority} /></TableCell>
                <TableCell><StatusBadge status={n.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {n.status === 'CREATED' && (
                      <Button variant="ghost" size="xs" onClick={() => markRead.mutate(n.id)} title="Okundu">
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {n.status !== 'COMPLETED' && (
                      <Button variant="ghost" size="xs" onClick={() => markComplete.mutate(n.id)} title="Tamamlandı">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {n.status === 'READ' && (
                      <Button variant="ghost" size="xs" onClick={() => deleteRead.mutate(n.id)} title="Bildirimi sil">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                    {n.case_file_id && (
                      <Button variant="ghost" size="xs" onClick={() => navigate(`/cases/${n.case_file_id}`)} title="Dosyaya git">
                        <CheckCheck className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  );
}
