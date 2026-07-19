import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CaseFileForm } from '@/components/case-file/case-file-form';
import { PartyList } from '@/components/party/party-list';
import { ServiceRecordList } from '@/components/service-record/service-record-list';
import { AppealList } from '@/components/appeal/appeal-list';
import { FeeList } from '@/components/fee/fee-list';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Archive, RotateCcw } from 'lucide-react';

interface CaseFileDetail {
  id: string;
  court_id: string;
  esas_no: string;
  karar_no: string | null;
  karar_tarihi: string | null;
  karar_sonucu: string | null;
  kanun_yolu: string | null;
  durum: string;
  aciklama: string | null;
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const { data, isLoading } = useQuery<CaseFileDetail>({
    queryKey: ['case', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/cases/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowArchiveConfirm(false);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => apiClient.patch(`/cases/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowRestoreConfirm(false);
    },
  });

  if (isLoading || !data) return <LoadingSpinner />;

  const isArchived = data.durum === 'ARCHIVED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.esas_no}</h1>
            <p className="text-sm text-muted-foreground">Dosya Detayı</p>
          </div>
          <StatusBadge status={data.durum} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} disabled={isArchived}>
            Düzenle
          </Button>
          {isArchived ? (
            <Button variant="outline" size="sm" onClick={() => setShowRestoreConfirm(true)}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Arşivden Çıkar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowArchiveConfirm(true)}>
              <Archive className="h-4 w-4 mr-1" />
              Arşivle
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="parties">Taraflar</TabsTrigger>
          <TabsTrigger value="services">Tebligatlar</TabsTrigger>
          <TabsTrigger value="appeals">Kanun Yolu</TabsTrigger>
          <TabsTrigger value="fees">Harç</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dosya Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Esas No</span><span className="font-medium">{data.esas_no}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar No</span><span className="font-medium">{data.karar_no || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar Tarihi</span><span className="font-medium">{data.karar_tarihi ? new Date(data.karar_tarihi).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar Sonucu</span><span className="font-medium">{data.karar_sonucu || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kanun Yolu</span><span className="font-medium">{data.kanun_yolu || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Durum</span><StatusBadge status={data.durum} /></div>
              </CardContent>
            </Card>
            {data.aciklama && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Açıklama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{data.aciklama}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="parties">
          <PartyList caseFileId={id!} />
        </TabsContent>

        <TabsContent value="services">
          <ServiceRecordList caseFileId={id!} />
        </TabsContent>

        <TabsContent value="appeals">
          <AppealList caseFileId={id!} />
        </TabsContent>

        <TabsContent value="fees">
          <FeeList caseFileId={id!} />
        </TabsContent>
      </Tabs>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dosya Düzenle</DialogTitle>
          </DialogHeader>
          <CaseFileForm
            defaultValues={{
              id: data.id,
              court_id: data.court_id,
              esas_no: data.esas_no,
              karar_no: data.karar_no || '',
              karar_tarihi: data.karar_tarihi || '',
              karar_sonucu: data.karar_sonucu || '',
              kanun_yolu: data.kanun_yolu || '',
              aciklama: data.aciklama || '',
            }}
            onSuccess={() => {
              setShowEdit(false);
              queryClient.invalidateQueries({ queryKey: ['case', id] });
            }}
            onCancel={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Dosyayı Arşivle"
        description="Bu dosya arşivlenecek. Arşivlenen dosyalar listede görünmez. Devam etmek istiyor musunuz?"
        confirmLabel="Arşivle"
        variant="destructive"
        onConfirm={() => archiveMutation.mutate()}
        loading={archiveMutation.isPending}
      />

      <ConfirmDialog
        open={showRestoreConfirm}
        onOpenChange={setShowRestoreConfirm}
        title="Arşivden Çıkar"
        description="Bu dosya arşivden çıkarılacak. Devam etmek istiyor musunuz?"
        confirmLabel="Arşivden Çıkar"
        onConfirm={() => restoreMutation.mutate()}
        loading={restoreMutation.isPending}
      />
    </div>
  );
}
