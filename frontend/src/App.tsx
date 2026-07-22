import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { AppLayout } from './components/layout/app-layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Cases from './pages/cases';
import CaseDetail from './pages/case-detail';
import CourthouseManagement from './pages/courthouse-management';
import CourtManagement from './pages/court-management';
import UserManagement from './pages/user-management';
import NotificationCenter from './pages/notification-center';
import AuditLogViewer from './pages/audit-log-viewer';
import SystemSettings from './pages/system-settings';
import Templates from './pages/templates';
import Clerks from './pages/clerks';
import Profile from './pages/profile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/courthouses" replace />;
  if (user?.role === 'KATIP') return <Navigate to={user.permissions?.includes('REPORTS') ? '/dashboard' : '/cases'} replace />;
  if (user?.role === 'ADLIYE_ADMIN') return <Navigate to="/courts" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/archived" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/courthouses" element={<CourthouseManagement />} />
              <Route path="/courts" element={<CourtManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/audit" element={<AuditLogViewer />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/clerks" element={<Clerks />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
