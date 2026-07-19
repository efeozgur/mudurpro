import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-50 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
