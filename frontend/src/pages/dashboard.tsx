import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CriticalTable } from '@/components/dashboard/critical-table';
import { SuggestionBox } from '@/components/dashboard/suggestion-box';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AlertTriangle, Send, CheckCircle, Banknote, Undo2 } from 'lucide-react';

interface DashboardData {
  criticalDeadlines: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; remainingDays?: number }> };
  pendingServices: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  readyForFinalization: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; remainingDays?: number }> };
  feeMuzekkereRequired: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  returnedServices: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  recentActivity: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; title?: string }> };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const d = data!;

  const suggestionMessages: string[] = [];
  if (d.criticalDeadlines.count > 0) suggestionMessages.push(`${d.criticalDeadlines.count} dosyada kritik süre aşımı var. Hemen işlem yapın.`);
  if (d.pendingServices.count > 0) suggestionMessages.push(`${d.pendingServices.count} dosyada bekleyen tebligat bulunuyor.`);
  if (d.returnedServices.count > 0) suggestionMessages.push(`${d.returnedServices.count} tebligat iade edildi. Adres kontrolü yapın.`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Genel durum özeti ve kritik bildirimler</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Kritik Süreler"
          count={d.criticalDeadlines.count}
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/cases')}
        />
        <StatsCard
          title="Bekleyen Tebligat"
          count={d.pendingServices.count}
          icon={Send}
          color="amber"
          onClick={() => navigate('/cases')}
        />
        <StatsCard
          title="Kesinleşmeye Hazır"
          count={d.readyForFinalization.count}
          icon={CheckCircle}
          color="green"
          onClick={() => navigate('/cases')}
        />
        <StatsCard
          title="Harç Gereken"
          count={d.feeMuzekkereRequired.count}
          icon={Banknote}
          color="blue"
          onClick={() => navigate('/cases')}
        />
      </div>

      {d.returnedServices.count > 0 && (
        <StatsCard
          title="İade Edilen Tebligat"
          count={d.returnedServices.count}
          icon={Undo2}
          color="red"
          onClick={() => navigate('/cases')}
        />
      )}

      {suggestionMessages.length > 0 && (
        <SuggestionBox message={suggestionMessages.join(' ')} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalTable items={d.criticalDeadlines.items} title="Kritik Süreler" />
        <CriticalTable items={d.pendingServices.items} title="Bekleyen Tebligatlar" />
      </div>

      {d.recentActivity.items.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Son İşlemler</h3>
          </div>
          <div className="divide-y">
            {d.recentActivity.items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/50"
                onClick={() => item.caseId && navigate(`/cases/${item.caseId}`)}
              >
                <span className="text-sm">{item.title}</span>
                {item.esasNo && <span className="text-xs text-muted-foreground">{item.esasNo}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
