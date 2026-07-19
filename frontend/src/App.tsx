import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/courthouses" element={<CourthouseManagement />} />
              <Route path="/courts" element={<CourtManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/audit" element={<AuditLogViewer />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
