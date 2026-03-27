import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PatientsPage from './pages/patients/PatientsPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import VisitsPage from './pages/visits/VisitsPage';
import VisitDetailPage from './pages/visits/VisitDetailPage';
import PharmacyPage from './pages/pharmacy/PharmacyPage';
import LabPage from './pages/lab/LabPage';
import ImagingPage from './pages/imaging/ImagingPage';
import BillingPage from './pages/billing/BillingPage';
import RefundPage from './pages/billing/RefundPage';
import InsurancePage from './pages/insurance/InsurancePage';
import WardsPage from './pages/wards/WardsPage';
import UsersPage from './pages/users/UsersPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import DoctorQueuePage from './pages/queue/DoctorQueuePage';
import TriagePage from './pages/triage/TriagePage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import AuditPage from './pages/audit/AuditPage';
import ServicesPage from './pages/services/ServicesPage';
import HospitalsPage from './pages/hospitals/HospitalsPage';

// Blocks SUPER_ADMIN from tenant-only routes
function TenantOnly({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role === 'SUPER_ADMIN') return <Navigate to="/hospitals" replace />;
  return <>{children}</>;
}

// Blocks non-SUPER_ADMIN from admin routes
function AdminOnly({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── SUPER_ADMIN routes ── dark admin shell, no HMS nav */}
          <Route element={<ProtectedRoute><AdminOnly><AdminLayout /></AdminOnly></ProtectedRoute>}>
            <Route path="/hospitals" element={<HospitalsPage />} />
          </Route>

          {/* ── Tenant (hospital staff) routes ── */}
          <Route element={<ProtectedRoute><TenantOnly><Layout /></TenantOnly></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-queue" element={<DoctorQueuePage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/visits/:id" element={<VisitDetailPage />} />
            <Route path="/pharmacy" element={<PharmacyPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/imaging" element={<ImagingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/refunds" element={<RefundPage />} />
            <Route path="/insurance" element={<InsurancePage />} />
            <Route path="/wards" element={<WardsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
