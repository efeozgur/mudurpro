import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SuggestionBox } from '@/components/dashboard/suggestion-box';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle,
  Send,
  CheckCircle,
  Banknote,
  Undo2,
  FolderOpen,
  Gavel,
  Filter,
  Activity,
  ArrowRightLeft,
  FileWarning,
  CalendarClock,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface FeeSummary {
  totalCount: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  byStatus: Record<string, number>;
  overdueItems: Array<{
    id: string;
    caseId: string;
    esasNo: string;
    type: string;
    amount: number;
    debtorName: string;
    paymentDueDate: string | null;
    status: string;
    courtName?: string;
    courtId?: string;
    muzekkereRemainingDays: number;
  }>;
}

interface ServiceTrackingItem {
  id: string;
  caseFileId: string;
  esasNo: string;
  courtName: string;
  courtId: string;
  partyName: string;
  partyRole: string;
  type: string;
  status: string;
  sentDate: string | null;
  servedDate: string | null;
}

interface ServiceTrackingWidget {
  items: ServiceTrackingItem[];
  byStatus: Record<string, number>;
  totalCount: number;
}

function getServiceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    APPEAL_ISTINAF: 'İstinaf Başvurusu',
    APPEAL_TEMYIZ: 'Temyiz Başvurusu',
  };
  return map[type] || type;
}

interface DashboardWidget {
  count: number;
  items: Array<{
    id: string;
    caseId: string;
    esasNo: string;
    title?: string;
    remainingDays?: number;
    courtName?: string;
    courtId?: string;
    date?: string;
  }>;
}

interface DashboardData {
  totalCasesCount: number;
  activeCasesCount: number;
  finalizedCasesCount: number;
  courts: Array<{ id: string; name: string }>;
  criticalDeadlines: DashboardWidget;
  pendingServices: DashboardWidget;
  readyForFinalization: DashboardWidget;
  readyForAppealTransfer: DashboardWidget;
  feeMuzekkereRequired: DashboardWidget;
  returnedServices: DashboardWidget;
  appealResponseDeadlines: DashboardWidget;
  recentActivity: DashboardWidget;
  feeSummary: FeeSummary;
  serviceTracking: ServiceTrackingWidget;
  appealStats: {
    totalCount: number;
    istinafCount: number;
    temyizCount: number;
    pendingCount: number;
    completedCount: number;
    sentToUpperCourtCount: number;
    items: Array<{
      id: string;
      caseId: string;
      esasNo: string;
      type: string;
      applicantName: string;
      status: string;
      courtName: string;
      courtId: string;
    }>;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCourtId, setSelectedCourtId] = useState<string>('ALL');
  const [detailTab, setDetailTab] = useState<'critical' | 'pending' | 'tracking'>('critical');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard');
      return res.data.data;
    },
  });
  if (user?.role === 'KATIP' && !user.permissions?.includes('REPORTS')) return <Navigate to="/cases" replace />;

  if (isLoading) return <LoadingSpinner />;

  const emptyWidget = { count: 0, items: [] };
  const d: DashboardData = {
    totalCasesCount: 0,
    activeCasesCount: 0,
    finalizedCasesCount: 0,
    courts: [],
    ...data,
    criticalDeadlines: { ...emptyWidget, ...data?.criticalDeadlines },
    pendingServices: { ...emptyWidget, ...data?.pendingServices },
    readyForFinalization: { ...emptyWidget, ...data?.readyForFinalization },
    readyForAppealTransfer: { ...emptyWidget, ...data?.readyForAppealTransfer },
    feeMuzekkereRequired: { ...emptyWidget, ...data?.feeMuzekkereRequired },
    returnedServices: { ...emptyWidget, ...data?.returnedServices },
    appealResponseDeadlines: { ...emptyWidget, ...data?.appealResponseDeadlines },
    recentActivity: { ...emptyWidget, ...data?.recentActivity },
    feeSummary: { totalCount: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, byStatus: {}, overdueItems: [], ...data?.feeSummary },
    serviceTracking: { items: [], byStatus: {}, totalCount: 0, ...data?.serviceTracking },
    appealStats: { totalCount: 0, istinafCount: 0, temyizCount: 0, pendingCount: 0, completedCount: 0, sentToUpperCourtCount: 0, items: [], ...data?.appealStats },
  };

  // Filter helper based on selected court
  const filterItems = <T extends { courtId?: string }>(items: T[]): T[] => {
    if (selectedCourtId === 'ALL') return items;
    return items.filter(item => item.courtId === selectedCourtId);
  };

  // Derive counts and lists based on current filter selection
  const criticalItems = filterItems(d.criticalDeadlines.items);
  const pendingItems = filterItems(d.pendingServices.items);
  const appealTransferItems = filterItems(d.readyForAppealTransfer.items);
  const feeItems = filterItems(d.feeMuzekkereRequired.items);
  const serviceTrackingItems = filterItems(d.serviceTracking.items);
  const filteredTrackingItems = searchQuery
    ? serviceTrackingItems.filter(
        (item) =>
          item.esasNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.partyName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : serviceTrackingItems;
  const returnedItems = filterItems(d.returnedServices.items);
  const appealDeadlineItems = filterItems(d.appealResponseDeadlines.items);
  const recentActivities = filterItems(d.recentActivity.items);

  const suggestionMessages: string[] = [];
  if (criticalItems.length > 0) suggestionMessages.push(`${criticalItems.length} dosyada kritik süre aşımı var. Hemen işlem yapın.`);
  if (pendingItems.length > 0) suggestionMessages.push(`${pendingItems.length} dosyada bekleyen tebligat bulunuyor.`);
  if (returnedItems.length > 0) suggestionMessages.push(`${returnedItems.length} tebligat iade edildi. Adres kontrolü yapın.`);
  if (d.feeSummary.overdueItems.length > 0) suggestionMessages.push(`${d.feeSummary.overdueItems.length} harç kaleminde son ödeme tarihi geçti.`);
  if (feeItems.length > 0) suggestionMessages.push(`${feeItems.length} dosyada harç müzekkeresi gerekli.`);
  if (appealDeadlineItems.length > 0) suggestionMessages.push(`${appealDeadlineItems.length} başvuruda cevap dilekçesi süresi yaklaşıyor.`);
  if (d.appealStats.totalCount > 0) {
    if (d.appealStats.pendingCount > 0) suggestionMessages.push(`${d.appealStats.pendingCount} kanun yolu başvurusu işlem bekliyor.`);
    if (d.appealStats.sentToUpperCourtCount > 0) suggestionMessages.push(`${d.appealStats.sentToUpperCourtCount} dosya üst mahkemede.`);
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ================================================================ */}
      {/* SECTION 1: HEADER                                                */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Genel Durum</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Genel durum özeti, süre takipleri ve kritik bildirimler</p>
        </div>

        {/* Court Filter Dropdown */}
        {d.courts && d.courts.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="flex w-full sm:w-[220px] min-h-[44px] sm:h-9 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="ALL">Tüm Mahkemeler</option>
              {d.courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: OVERVIEW ROW — 3 KPI stat cards                      */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Toplam Dosya"
          count={d.totalCasesCount}
          icon={FolderOpen}
          color="blue"
          onClick={() => navigate('/cases')}
        />
        <StatsCard
          title="Aktif Dosyalar"
          count={d.activeCasesCount}
          icon={Gavel}
          color="blue"
          onClick={() => navigate('/cases')}
        />
        <StatsCard
          title="Kesinleşen Dosyalar"
          count={d.finalizedCasesCount}
          icon={CheckCircle}
          color="green"
          onClick={() => navigate('/cases')}
        />
      </div>

      {/* ================================================================ */}
      {/* SECTION 3: KANUN YOLU DURUMU                                     */}
      {/* ================================================================ */}
      {d.appealStats.totalCount > 0 && (
        <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Kanun Yolu Durumu</h2>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {d.appealStats.totalCount} başvuru
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatsCard title="Toplam Başvuru" count={d.appealStats.totalCount} icon={Gavel} color="blue" />
            <StatsCard title="İstinaf" count={d.appealStats.istinafCount} icon={FileWarning} color="amber" />
            <StatsCard title="Temyiz" count={d.appealStats.temyizCount} icon={FileWarning} color="amber" />
            <StatsCard title="İşlem Bekleyen" count={d.appealStats.pendingCount} icon={AlertTriangle} color="red" />
            <StatsCard title="Üst Mahkemede" count={d.appealStats.sentToUpperCourtCount} icon={Send} color="blue" />
          </div>

          {d.appealStats.items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border bg-card/50 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Başvuran</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Mahkeme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.appealStats.items.slice(0, 10).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}?tab=appeals`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs">{item.type === 'ISTINAF' ? 'İstinaf' : 'Temyiz'}</TableCell>
                      <TableCell className="text-xs">{item.applicantName}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {/* ================================================================ */}
      {/* SECTION 4: İŞLEM BEKLEYENLER                                      */}
      {/* ================================================================ */}
      <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">İşlem Bekleyenler</h2>
        </div>

        {/* Suggestion Box */}
        {suggestionMessages.length > 0 && <SuggestionBox messages={suggestionMessages} />}

        {/* Quick Action Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between shadow-sm ${returnedItems.length > 0 ? 'border-l-[3px] border-l-destructive' : ''}`}>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">İade Edilen Tebligatlar</p>
              <h4 className={`text-lg font-bold mt-1 ${returnedItems.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {returnedItems.length} Adet
              </h4>
            </div>
            <div className={`p-2.5 rounded-full ${returnedItems.length > 0 ? 'bg-red-50 text-destructive' : 'bg-muted text-muted-foreground'}`}>
              <Undo2 className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Üst Mahkeme Sevk Bekleyen</p>
              <h4 className="text-lg font-bold text-foreground mt-1">{appealTransferItems.length} Başvuru</h4>
            </div>
            <div className="p-2.5 rounded-full bg-orange-50 text-orange-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Cevap Dilekçesi Bekleyenler — table (conditional) */}
        {appealDeadlineItems.length > 0 && (
          <div className="rounded-lg border border-border bg-card/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ArrowRightLeft className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cevap Dilekçesi Bekleyenler
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Mahkeme</TableHead>
                    <TableHead>Karşı Taraf</TableHead>
                    <TableHead className="text-right">Kalan Gün</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appealDeadlineItems.slice(0, 10).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}?tab=appeals`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                      <TableCell className="text-xs">{item.title || '-'}</TableCell>
                      <TableCell className="text-right">
                        {(item.remainingDays ?? 0) <= 0 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            Süre Doldu!
                          </span>
                        ) : (item.remainingDays ?? 0) <= 3 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            {item.remainingDays} gün
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            {item.remainingDays} gün
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SECTION 5: DETAYLI GÖRÜNÜM — 3-tab widget                       */}
      {/* ================================================================ */}
      <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Detaylı Görünüm</h2>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setDetailTab('critical')}
            className={`flex items-center gap-1.5 px-4 py-3 sm:py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              detailTab === 'critical'
                ? 'border-destructive text-destructive'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Kritik Süreler
          </button>
          <button
            onClick={() => setDetailTab('pending')}
            className={`flex items-center gap-1.5 px-4 py-3 sm:py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              detailTab === 'pending'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Bekleyen Tebligatlar
          </button>
          <button
            onClick={() => setDetailTab('tracking')}
            className={`flex items-center gap-1.5 px-4 py-3 sm:py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              detailTab === 'tracking'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Tebligat Takibi
          </button>
        </div>

        {/* Tab Content: Kritik Süreler */}
        {detailTab === 'critical' && (
          <div className="overflow-x-auto">
            {criticalItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Kritik süre takibinde dosya bulunmuyor.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Mahkeme</TableHead>
                    <TableHead>Bekleyen işlem</TableHead>
                    <TableHead className="text-right">Kalan Süre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalItems.slice(0, 5).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                      <TableCell className="max-w-[360px] text-xs text-muted-foreground">{item.title || 'Dosya durumunu kontrol edin.'}</TableCell>
                      <TableCell className="text-right text-xs">
                        {item.remainingDays != null ? (
                          <span className={item.remainingDays <= 0 ? 'text-destructive font-bold' : item.remainingDays <= 7 ? 'text-amber-600 font-medium' : 'text-success'}>
                            {item.remainingDays <= 0 ? 'Gecikti' : `${item.remainingDays} gün`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Tab Content: Bekleyen Tebligatlar */}
        {detailTab === 'pending' && (
          <div className="overflow-x-auto">
            {pendingItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Tebligatı eksik olan aktif dosya bulunmuyor.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Mahkeme</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingItems.slice(0, 5).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                      <TableCell className="max-w-[380px] text-right text-xs text-muted-foreground">
                        {item.title || 'Tebligat işlemini kontrol edin.'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Tab Content: Tebligat Takibi — status cards + full table */}
        {detailTab === 'tracking' && (
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dosya numarası veya taraf adı ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {/* Status mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-lg border border-border bg-card/50 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Hazırlanıyor</p>
                <p className="text-lg font-bold mt-1">{d.serviceTracking.byStatus['PREPARED'] || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gönderildi</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{d.serviceTracking.byStatus['SENT'] || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tebliğ Edildi</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{d.serviceTracking.byStatus['SERVED'] || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 shadow-sm border-l-[3px] border-l-red-500">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">İade Edildi</p>
                <p className="text-lg font-bold text-red-600 mt-1">{d.serviceTracking.byStatus['RETURNED'] || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">İptal</p>
                <p className="text-lg font-bold text-muted-foreground mt-1">{d.serviceTracking.byStatus['CANCELLED'] || 0}</p>
              </div>
            </div>

            {/* Service Status Bar Chart */}
            {d.serviceTracking.totalCount > 0 && (
              (() => {
                const barData = [
                  { name: 'Hazırlanıyor', count: d.serviceTracking.byStatus['PREPARED'] || 0, fill: '#6B645D' },
                  { name: 'Gönderildi', count: d.serviceTracking.byStatus['SENT'] || 0, fill: '#2B6CB0' },
                  { name: 'Tebliğ Edildi', count: d.serviceTracking.byStatus['SERVED'] || 0, fill: '#1E7E56' },
                  { name: 'İade Edildi', count: d.serviceTracking.byStatus['RETURNED'] || 0, fill: '#BC3D2A' },
                  { name: 'İptal', count: d.serviceTracking.byStatus['CANCELLED'] || 0, fill: '#A0988E' },
                ].filter(s => s.count > 0);
                if (barData.length === 0) return null;
                return (
                  <div className="rounded-lg border border-border bg-card/50 p-4">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tebligat Durum Dağılımı</p>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: unknown) => {
                              if (typeof value !== 'number') return [String(value), ''];
                              return [`${value} adet`, 'Sayı'];
                            }}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                            {barData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Service tracking table */}
            {filteredTrackingItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Tebligat kaydı bulunmuyor.</p>
            ) : (
              <div className="rounded-lg border border-border bg-card/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Esas No</TableHead>
                        <TableHead>Mahkeme</TableHead>
                        <TableHead>Taraf</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Gönderim</TableHead>
                        <TableHead>Tebliğ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrackingItems.slice(0, 20).map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => navigate(`/cases/${item.caseFileId}?tab=services`)}
                        >
                          <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                          <TableCell className="text-xs">{item.partyName}</TableCell>
                          <TableCell className="text-xs">{getServiceTypeLabel(item.type)}</TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                          <TableCell className="text-xs">{item.sentDate ? new Date(item.sentDate).toLocaleDateString('tr-TR') : '-'}</TableCell>
                          <TableCell className="text-xs">{item.servedDate ? new Date(item.servedDate).toLocaleDateString('tr-TR') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredTrackingItems.length > 20 && (
                  <div className="border-t border-border px-4 py-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground">Toplam {filteredTrackingItems.length} kayıttan ilk 20'si gösteriliyor.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SECTION 6: FİNANS — Fee Summary + Overdue/Müzekkere tables         */}
      {/* ================================================================ */}
      <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="h-4 w-4 text-gold shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Finans</h2>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {d.feeSummary.totalCount} harç kaydı
          </span>
        </div>

        {/* Fee Summary mini-cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card/50 p-3.5 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Toplam Harç</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {d.feeSummary.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{d.feeSummary.totalCount} kayıt</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3.5 shadow-sm border-l-[3px] border-l-success">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tahsil Edilen</p>
            <p className="text-lg font-bold text-success-text mt-1">
              {d.feeSummary.collectedAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{d.feeSummary.byStatus['PAYMENT_COMPLETED'] || 0} kayıt</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3.5 shadow-sm border-l-[3px] border-l-gold">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Bekleyen Harç</p>
            <p className="text-lg font-bold text-gold-dark mt-1">
              {d.feeSummary.pendingAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{(d.feeSummary.totalCount - (d.feeSummary.byStatus['PAYMENT_COMPLETED'] || 0) - (d.feeSummary.byStatus['CLOSED'] || 0))} kayıt</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3.5 shadow-sm border-l-[3px] border-l-destructive">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Müzekkere Gereken</p>
            <p className="text-lg font-bold text-destructive mt-1">
              {d.feeSummary.byStatus['MUZEKKERE_REQUIRED'] || 0} Kayıt
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{feeItems.length} dosya</p>
          </div>
        </div>

        {/* Fee Distribution Pie Chart */}
        {d.feeSummary.totalCount > 0 && (
          (() => {
            const pieData = [
              { name: 'Tahsil Edildi', value: d.feeSummary.collectedAmount, color: '#1E7E56' },
              { name: 'Bekleyen', value: d.feeSummary.pendingAmount, color: '#C68113' },
              { name: 'Müzekkere', value: (d.feeSummary.byStatus['MUZEKKERE_REQUIRED'] || 0) * 1000, color: '#BC3D2A' },
            ].filter(seg => seg.value > 0);
            if (pieData.length === 0) return null;
            return (
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Harç Dağılımı</p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div style={{ width: 160, height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: unknown) => {
                            if (typeof value !== 'number') return String(value);
                            return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
                          }}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {pieData.map(seg => (
                      <div key={seg.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-muted-foreground w-32">{seg.name}</span>
                        <span className="text-xs font-semibold text-foreground">
                          {seg.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Overdue Fees Table */}
        {d.feeSummary.overdueItems.length > 0 && (
          <div className="rounded-lg border border-border bg-card/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <FileWarning className="h-4 w-4 text-destructive" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Son Ödeme Tarihi Geçen Harçlar
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Harç Türü</TableHead>
                    <TableHead>Borçlu</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead>Son Ödeme</TableHead>
                    <TableHead>Müzekkere</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.feeSummary.overdueItems.slice(0, 10).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}?tab=fees`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs">{getServiceTypeLabel(item.type)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.debtorName}</TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {item.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.paymentDueDate ? (
                          <span className="text-destructive font-medium">
                            {new Date(item.paymentDueDate).toLocaleDateString('tr-TR')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.muzekkereRemainingDays <= 0 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            Süre Doldu!
                          </span>
                        ) : item.muzekkereRemainingDays <= 3 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            {item.muzekkereRemainingDays} gün
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            {item.muzekkereRemainingDays} gün
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Fee Müzekkere Required Table */}
        {feeItems.length > 0 && (
          <div className="rounded-lg border border-border bg-card/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Banknote className="h-4 w-4 text-gold" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Harç Müzekkeresi Gereken Dosyalar
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esas No</TableHead>
                    <TableHead>Mahkeme</TableHead>
                    <TableHead>Kalan Gün</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeItems.slice(0, 10).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/cases/${item.caseId}?tab=fees`)}
                    >
                      <TableCell className="font-semibold text-xs">{item.esasNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.courtName || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {(item.remainingDays ?? 0) <= 0 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            Süre Doldu!
                          </span>
                        ) : (item.remainingDays ?? 0) <= 3 ? (
                          <span className="inline-flex items-center rounded-full bg-critical-bg px-2 py-0.5 text-[10px] font-semibold text-critical-text">
                            {item.remainingDays} gün
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            {item.remainingDays} gün
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold-dark">
                          Müzekkere Çıkar
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SECTION 7: SON AKTİVİTELER — Recent Activity Timeline             */}
      {/* ================================================================ */}
      {recentActivities.length > 0 && (
        <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Son Aktiviteler</h2>
          </div>
          <div className="divide-y divide-muted">
            {recentActivities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-[#FDFBF7] transition-colors rounded-lg px-2 -mx-2"
                onClick={() => item.caseId && navigate(`/cases/${item.caseId}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground block truncate">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.esasNo}</span>
                  </div>
                </div>
                {item.date && (
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-3">
                    {new Date(item.date).toLocaleDateString('tr-TR')} {new Date(item.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
