import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Archive, RotateCcw } from 'lucide-react';

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
    <div className="space-y-5">
      <div>
        <span
          className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => navigate('/cases')}
        >
          ← Dosyalar
        </span>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold font-[family-name:Georgia,serif]">{data.esas_no}</h1>
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
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="border-b border-border">
          <TabsTrigger value="general" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-b-gold data-[state=active]:text-gold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="parties" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-b-gold data-[state=active]:text-gold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground">Taraflar</TabsTrigger>
          <TabsTrigger value="services" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-b-gold data-[state=active]:text-gold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground">Tebligatlar</TabsTrigger>
          <TabsTrigger value="appeals" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-b-gold data-[state=active]:text-gold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground">Kanun Yolu</TabsTrigger>
          <TabsTrigger value="fees" className="text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-b-gold data-[state=active]:text-gold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground">Harç</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[6px] border border-border bg-card shadow-sm p-4">
              <h3 className="text-xs font-semibold font-[family-name:Georgia,serif] mb-3">Dosya Bilgileri</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Esas No</span><span className="font-medium">{data.esas_no}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar No</span><span className="font-medium">{data.karar_no || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar Tarihi</span><span className="font-medium">{data.karar_tarihi ? new Date(data.karar_tarihi).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Karar Sonucu</span><span className="font-medium">{data.karar_sonucu || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kanun Yolu</span><span className="font-medium">{data.kanun_yolu || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Durum</span><StatusBadge status={data.durum} /></div>
              </div>
            </div>
            {data.aciklama && (
              <div className="rounded-[6px] border border-border bg-card shadow-sm p-4">
                <h3 className="text-xs font-semibold font-[family-name:Georgia,serif] mb-3">Açıklama</h3>
                <p className="text-[12px]">{data.aciklama}</p>
              </div>
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
