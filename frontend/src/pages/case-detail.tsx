import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CaseFileForm } from '@/components/case-file/case-file-form';
import { PartyList } from '@/components/party/party-list';
import { ServiceRecordList } from '@/components/service-record/service-record-list';
import { AppealList } from '@/components/appeal/appeal-list';
import { FeeList } from '@/components/fee/fee-list';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusDonut, DonutLegend, createSegment } from '@/components/shared/status-donut';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Archive, 
  RotateCcw, 
  ArrowLeft, 
  FileText, 
  Users, 
  Send, 
  Scale,
  Banknote,
  Calendar,
  Edit3,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';

function formatEventTitle(entry: AuditLog): string {
  const action = entry.action;
  const module = entry.module;

  if (action === 'POST') {
    if (module === 'appeals') return 'Kanun yolu başvurusu eklendi';
    if (module === 'fees' || module === 'fee-tracking') return 'Harç kaydı eklendi';
    if (module === 'parties') return 'Taraf eklendi';
    if (module === 'services' || module === 'service-record') return 'Tebligat kaydı eklendi';
    if (module === 'cases') return 'Dosya oluşturuldu';
    return 'Kayıt oluşturuldu';
  }
  if (action === 'PUT' || action === 'PATCH') {
    if (module === 'appeals') return 'Kanun yolu başvurusu güncellendi';
    if (module === 'fees' || module === 'fee-tracking') return 'Harç kaydı güncellendi';
    if (module === 'parties') return 'Taraf bilgileri güncellendi';
    if (module === 'services' || module === 'service-record') return 'Tebligat durumu güncellendi';
    if (module === 'cases') return 'Dosya bilgileri güncellendi';
    return 'Kayıt güncellendi';
  }
  if (action === 'DELETE') {
    if (module === 'appeals') return 'Kanun yolu başvurusu silindi';
    if (module === 'fees' || module === 'fee-tracking') return 'Harç kaydı silindi';
    if (module === 'parties') return 'Taraf silindi';
    if (module === 'services' || module === 'service-record') return 'Tebligat kaydı silindi';
    return 'Kayıt silindi';
  }
  return `${action} işlemi yapıldı`;
}
function statusDescription(durum: string, engineStatus?: string): string {
  if (durum === 'FINALIZED') return 'Dava dosyası kesinleşmiştir.';
  if (durum === 'UST_MAHKEMEDE') return 'Dosya üst mahkemeye gönderilmiştir.';
  if (durum === 'ARCHIVED') return 'Dosya arşivlenmiştir.';
  if (engineStatus === 'READY_FOR_FINALIZATION') return 'Tebligat süreleri tamamlanmış, kesinleştirmeye hazırdır.';
  if (engineStatus === 'READY_FOR_APPEAL_TRANSFER') return 'Tebligat süreleri tamamlanmış, üst mahkemeye gönderime hazırdır.';
  if (engineStatus === 'PENDING_SERVICES' || engineStatus === 'RETURNED_SERVICES') return 'Tebligat süreçleri devam etmektedir.';
  if (durum === 'SERVICE_IN_PROGRESS') return 'Tebligat süreçleri devam etmektedir.';
  if (durum === 'WAITING_LEGAL_PERIOD') return 'Kanun yolu başvuru süresi beklenmektedir.';
  return 'Dava dosyası aktif durumda takip edilmektedir.';
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  module: string;
  entity: string;
  entity_id: string | null;
  new_value: any;
  created_at: string;
}

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
  finalized_at: string | null;
  _engineStatus?: string;
  _canFinalize?: boolean;
  _canSendToUpperCourt?: boolean;
}

type TabType = 'general' | 'parties' | 'services' | 'appeals' | 'fees';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = (searchParams.get('tab') as TabType) || 'general';

  const setActiveTab = (tab: TabType) => {
    setSearchParams(tab === 'general' ? {} : { tab });
  };
  const [showEdit, setShowEdit] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalizeDate, setFinalizeDate] = useState('');
  const [showUpperCourt, setShowUpperCourt] = useState(false);
  const [upperCourtDate, setUpperCourtDate] = useState('');

  const { data, isLoading } = useQuery<CaseFileDetail>({
    queryKey: ['case', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: 5000,
  });

  const upperCourtMutation = useMutation({
    mutationFn: (sentDate: string) => apiClient.patch(`/cases/${id}/send-to-upper-court`, { sent_date: sentDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowUpperCourt(false);
    },
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

  const { data: timeline } = useQuery<AuditLog[]>({
    queryKey: ['timeline', id],
    queryFn: async () => {
      const res = await apiClient.get(`/audit/cases/${id}/timeline`);
      return res.data.data || [];
    },
    enabled: !!id,
    refetchInterval: 5000,
  });

  const finalizeMutation = useMutation({
    mutationFn: (finalizedAt: string) => apiClient.patch(`/cases/${id}/finalize`, { finalized_at: finalizedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowFinalize(false);
    },
  });

  // Status summary queries
  const { data: servicesForStats } = useQuery<any[]>({
    queryKey: ["services", id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}/services`);
      return res.data.data || [];
    },
    enabled: !!id,
  });
  const { data: feesForStats } = useQuery<any[]>({
    queryKey: ["fees", id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}/fees`);
      return res.data.data || [];
    },
    enabled: !!id,
  });
  const { data: appealsForStats } = useQuery<any[]>({
    queryKey: ["appeals", id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}/appeals`);
      return res.data.data || [];
    },
    enabled: !!id,
  });

  const serviceStats = servicesForStats
    ? {
        total: servicesForStats.length,
        served: servicesForStats.filter((s) => s.status === "SERVED").length,
        returned: servicesForStats.filter((s) => s.status === "RETURNED").length,
        pending: servicesForStats.filter((s) => s.status !== "SERVED" && s.status !== "RETURNED").length,
      }
    : { total: 0, served: 0, returned: 0, pending: 0 };
  const feeStats = feesForStats
    ? {
        total: feesForStats.length,
        paid: feesForStats.filter((f) => f.status === "PAYMENT_COMPLETED").length,
        overdue: feesForStats.filter((f) => f.status === "MUZEKKERE_REQUIRED" || f.status === "OVERDUE").length,
        pending: feesForStats.filter((f) => f.status !== "PAYMENT_COMPLETED" && f.status !== "MUZEKKERE_REQUIRED" && f.status !== "OVERDUE").length,
      }
    : { total: 0, paid: 0, overdue: 0, pending: 0 };
  const appealStats = appealsForStats
    ? {
        total: appealsForStats.length,
        sentToUpperCourt: appealsForStats.filter((a) => a.is_sent_to_upper_court).length,
        pending: appealsForStats.filter((a) => !a.is_sent_to_upper_court).length,
      }
    : { total: 0, sentToUpperCourt: 0, pending: 0 };


  if (isLoading || !data) return <LoadingSpinner />;

  const isArchived = data.durum === 'ARCHIVED';

  // Workflow steps based on case state
  return (
    <div className="space-y-6">
      {/* Top Navigation & Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <button
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            onClick={() => navigate('/cases')}
          >
            <ArrowLeft className="h-3 w-3" /> Dosyalara Dön
          </button>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.esas_no}</h1>
            <StatusBadge status={data.durum} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} disabled={isArchived} className="h-9 gap-1.5 text-xs font-semibold px-4">
            <Edit3 className="h-3.5 w-3.5" /> Düzenle
          </Button>
          {isArchived ? (
            <Button variant="outline" size="sm" onClick={() => setShowRestoreConfirm(true)} className="h-9 gap-1.5 text-xs font-semibold px-4">
              <RotateCcw className="h-3.5 w-3.5" /> Arşivden Çıkar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowArchiveConfirm(true)} className="h-9 gap-1.5 text-xs font-semibold px-4 text-destructive hover:bg-destructive/5 hover:text-destructive">
              <Archive className="h-3.5 w-3.5" /> Arşivle
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Sticky Summary & Tracker */}
        <div className="space-y-5 lg:sticky lg:top-5">
          {/* Quick Info Card */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-5 premium-shadow glass-panel space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dosya Özeti</h3>
            
            <div className="divide-y divide-border text-[12px] space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Karar Numarası</span>
                <span className="font-medium text-foreground">{data.karar_no || 'Yazılmadı'}</span>
                </div>
              <div className="flex justify-between items-center pt-2.5 pb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Karar Tarihi
                </span>
                <span className="font-medium text-foreground">
                  {data.karar_tarihi ? new Date(data.karar_tarihi).toLocaleDateString('tr-TR') : '-'}
                </span>
                </div>
              <div className="flex justify-between items-center pt-2.5 pb-1">
                <span className="text-muted-foreground">Kanun Yolu</span>
                <span className="font-medium text-foreground uppercase tracking-wide">{data.kanun_yolu || 'Belirtilmedi'}</span>
                </div>
              <div className="flex justify-between items-center pt-2.5 pb-1">
                <span className="text-muted-foreground">Karar Sonucu</span>
                <span className="font-medium text-foreground">{data.karar_sonucu || '-'}</span>
                </div>
              <div className="flex justify-between items-center pt-2.5 pb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Kesinleşme
                </span>
                <span className="font-medium text-foreground">
                  {data.finalized_at
                    ? new Date(data.finalized_at).toLocaleDateString('tr-TR')
                    : 'Kesinleşmedi'}
              </span>
              </div>

              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">📊 Durum Özeti</h4>
              <div className="space-y-3">
                {/* Servis Progress — Donut Chart */}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <StatusDonut
                    segments={[
                      createSegment('Tebliğ Edildi', serviceStats.served, '#1E7E56'),
                      createSegment('İade', serviceStats.returned, '#BC3D2A'),
                      createSegment('Bekleyen', serviceStats.pending, '#E5DFD3'),
                    ]}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tebligat</p>
                    <DonutLegend segments={[
                      createSegment('Tebliğ Edildi', serviceStats.served, '#1E7E56'),
                      createSegment('İade', serviceStats.returned, '#BC3D2A'),
                      createSegment('Bekleyen', serviceStats.pending, '#E5DFD3'),
                    ]} />
                  </div>
                </div>
                {/* Fee Progress — Donut Chart */}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <StatusDonut
                    segments={[
                      createSegment('Tahsil Edildi', feeStats.paid, '#1E7E56'),
                      createSegment('Gecikmiş', feeStats.overdue, '#BC3D2A'),
                      createSegment('Bekleyen', feeStats.pending, '#C68113'),
                    ]}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Harç</p>
                    <DonutLegend segments={[
                      createSegment('Tahsil Edildi', feeStats.paid, '#1E7E56'),
                      createSegment('Gecikmiş', feeStats.overdue, '#BC3D2A'),
                      createSegment('Bekleyen', feeStats.pending, '#C68113'),
                    ]} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-muted/20 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Kanun Yolu</p>
                  <p className="text-sm font-bold">{appealStats.total}</p>
                  <p className="text-[9px] text-muted-foreground">{appealStats.sentToUpperCourt > 0 ? appealStats.sentToUpperCourt + " üst mahkemede" : "başvuru var"}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Durum</p>
                  <p className="text-sm font-bold"><StatusBadge status={data.durum} /></p>
                  <p className="text-[9px] text-muted-foreground">{data.durum === 'UST_MAHKEMEDE' ? "Üst mahkemeye gönderildi" : data.durum === 'FINALIZED' ? "Kesinleşti" : data.durum === 'ARCHIVED' ? "Arşivlendi" : data._engineStatus === "READY_FOR_APPEAL_TRANSFER" ? "Gönderilmeye hazır" : data._engineStatus === "READY_FOR_FINALIZATION" ? "Kesinleşmeye hazır" : "İşlem devam ediyor"}</p>
                </div>
              </div>
              </div>
            {!data.finalized_at && (data as any)._canFinalize && (
              <Button
                className="w-full mt-2"
                size="sm"
                onClick={() => {
                  setShowFinalize(true);
                  setFinalizeDate(new Date().toISOString().split('T')[0]);
                }}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Kesinleştir
              </Button>
            )}
            {(data as any)._canSendToUpperCourt && (
              <Button
                className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md"
                size="sm"
                onClick={() => {
                  setShowUpperCourt(true);
                  setUpperCourtDate(new Date().toISOString().split('T')[0]);
                }}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Üst Mahkemeye Gönder
              </Button>
            )}

            {data.aciklama && (
              <div className="border-t border-border pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Açıklama</span>
                <p className="text-[12px] leading-relaxed text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">{data.aciklama}</p>
                </div>
            )}
          </div>

          {/* Audit Log Timeline */}
          {timeline && timeline.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-sm p-5 premium-shadow glass-panel">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Zaman Çizelgesi</h3>
              <div className="space-y-3 relative pl-3 border-l-2 border-border ml-2">
                {timeline.map((entry) => (
                  <div key={entry.id} className="relative flex items-start gap-3">
                    <div className="absolute -left-[19px] top-2 h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-card flex items-center justify-center">
                      <span className={`h-1.5 w-1.5 rounded-full ${entry.action === 'POST' ? 'bg-success' : entry.action === 'PUT' || entry.action === 'PATCH' ? 'bg-gold' : 'bg-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground">{formatEventTitle(entry)}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(entry.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
          )}
        </div>

        {/* Right Column: Tabbed Content Area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Custom Card Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-center transition-all ${activeTab === 'general' ? 'bg-card border-border shadow-sm text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <FileText className="h-4 w-4" />
              <span className="text-[13px] font-medium tracking-tight">Genel</span>
            </button>
            <button
              onClick={() => setActiveTab('parties')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-center transition-all ${activeTab === 'parties' ? 'bg-card border-border shadow-sm text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[13px] font-medium tracking-tight">Taraflar</span>
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-center transition-all ${activeTab === 'services' ? 'bg-card border-border shadow-sm text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Send className="h-4 w-4" />
              <span className="text-[13px] font-medium tracking-tight">Tebligatlar</span>
            </button>
            <button
              onClick={() => setActiveTab('appeals')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-center transition-all ${activeTab === 'appeals' ? 'bg-card border-border shadow-sm text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Scale className="h-4 w-4" />
              <span className="text-[13px] font-medium tracking-tight">Kanun Yolu</span>
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border text-center transition-all ${activeTab === 'fees' ? 'bg-card border-border shadow-sm text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Banknote className="h-4 w-4" />
              <span className="text-[13px] font-medium tracking-tight">Harç</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 premium-shadow glass-panel min-h-[300px]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Dava Durumu Detayları</h3>
                  <p className="text-[12px] text-muted-foreground">Hesaplanan süreler, kısıtlar ve sistem bildirimleri</p>
                  </div>
                
                <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">Sistem Hesaplama Özeti</h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Dava dosyası üzerinde yapılan hesaplamalara göre tebligat ve kanun yolu süreleri otomatik işletilir. Kesinleşme durumu veya üst mahkeme gönderim önerisi için diğer sekmelerden tebligat girişlerini tamamlayınız.
                    </p>
                  </div>
                  </div>

                {/* Appeal Status Cards */}
                {appealStats.total > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Başvuru</span>
                      <span className="text-lg font-bold text-foreground mt-0.5">{appealStats.total}</span>
                      <span className="text-[9px] text-muted-foreground">toplam kanun yolu</span>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bekleyen</span>
                      <span className="text-lg font-bold text-amber-600 mt-0.5">{appealStats.pending}</span>
                      <span className="text-[9px] text-muted-foreground">işlem bekliyor</span>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Üst Mahkeme</span>
                      <span className="text-lg font-bold text-primary mt-0.5">{appealStats.sentToUpperCourt}</span>
                      <span className="text-[9px] text-muted-foreground">sevk edildi</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Durum Bilgisi</span>
                    <span className="text-xs font-medium text-foreground">{statusDescription(data.durum, data._engineStatus)}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Gerekçeli Karar</span>
                    <span className="text-xs font-medium text-foreground">{data.karar_no ? `${data.karar_no} sayılı karar yazıldı` : 'Karar henüz girilmedi'}</span>
                  </div>
                  </div>
                </div>
            )}

            {activeTab === 'parties' && (
              <PartyList caseFileId={id!} />
            )}

            {activeTab === 'services' && (
              <ServiceRecordList caseFileId={id!} />
            )}

            {activeTab === 'appeals' && (
              <AppealList caseFileId={id!} kanunYolu={data?.kanun_yolu || undefined} />
            )}

            {activeTab === 'fees' && (
              <FeeList caseFileId={id!} />
            )}
          </div>
        </div>

      </div>

      {/* Finalize Dialog */}
      <Dialog open={showFinalize} onOpenChange={setShowFinalize}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kesinleştirme Tarihi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Dosyanın kesinleşme tarihini girin:</p>
            <Input type="date" value={finalizeDate} onChange={(e) => setFinalizeDate(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFinalize(false)}>İptal</Button>
              <Button size="sm" disabled={finalizeMutation.isPending || !finalizeDate}
                onClick={() => finalizeDate && finalizeMutation.mutate(finalizeDate)}>
                {finalizeMutation.isPending ? 'Kesinleştiriliyor...' : 'Kesinleştir'}
              </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Üst Mahkeme Dialog */}
      <Dialog open={showUpperCourt} onOpenChange={setShowUpperCourt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Üst Mahkemeye Gönderme Tarihi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Dosyanın üst mahkemeye gönderilme tarihini girin:</p>
            <Input type="date" value={upperCourtDate} onChange={(e) => setUpperCourtDate(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowUpperCourt(false)}>İptal</Button>
              <Button size="sm" disabled={upperCourtMutation.isPending || !upperCourtDate}
                onClick={() => upperCourtDate && upperCourtMutation.mutate(upperCourtDate)}>
                {upperCourtMutation.isPending ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Case File Dialog */}
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

      {/* Confirmations */}
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
