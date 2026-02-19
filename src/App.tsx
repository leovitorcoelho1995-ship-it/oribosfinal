import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Agenda from "./pages/Agenda";
import Leads from "./pages/Leads";
import Financial from "./pages/Financial";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "./contexts/CompanyContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminGuard } from "./components/admin/AdminGuard";
import { SupportBanner } from "./components/admin/SupportBanner";
import AdminClients from "./pages/AdminClients";
import AdminMetrics from "./pages/AdminMetrics";
import AdminSupport from "./pages/admin/Support";
import HealthDashboard from "./pages/admin/Health";
import { NotificationProvider } from "./contexts/NotificationContext";
import Welcome from "./pages/Welcome";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import { AppLayout } from "./components/layout/AppLayout";

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <AdminProvider>
        <CompanyProvider>
          <NotificationProvider>
            <SupportBanner />
            <OnboardingGuard>
              <Routes>
                <Route path="/welcome" element={<Welcome />} />
                <Route
                  path="/*"
                  element={
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/leads" element={<Leads />} />
                        <Route path="/financial" element={<Financial />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route
                          path="/admin/clients"
                          element={
                            <AdminGuard>
                              <AdminClients />
                            </AdminGuard>
                          }
                        />
                        <Route
                          path="/admin/metrics"
                          element={
                            <AdminGuard>
                              <AdminMetrics />
                            </AdminGuard>
                          }
                        />
                        <Route
                          path="/admin/support"
                          element={
                            <AdminGuard>
                              <AdminSupport />
                            </AdminGuard>
                          }
                        />
                        <Route
                          path="/admin/health"
                          element={
                            <AdminGuard>
                              <HealthDashboard />
                            </AdminGuard>
                          }
                        />
                      </Routes>
                    </AppLayout>
                  }
                />
              </Routes>
            </OnboardingGuard>
          </NotificationProvider>
        </CompanyProvider>
      </AdminProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
