import { Routes, Route, Navigate } from "react-router-dom";
import { App as AntApp } from "antd";
import { useAuthStore } from "./stores/auth";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TemplatesPage from "./pages/admin/TemplatesPage";
import PartsPage from "./pages/admin/PartsPage";
import StockPage from "./pages/admin/StockPage";
import SmtpSettingsPage from "./pages/admin/SmtpSettingsPage";
import SmsSettingsPage from "./pages/admin/SmsSettingsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import TechnicianDashboard from "./pages/technician/Dashboard";
import CustomerDashboard from "./pages/customer/Dashboard";
import ServiceListPage from "./pages/services/ServiceListPage";
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import CreateServicePage from "./pages/services/CreateServicePage";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AntApp>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRouter />} />
          <Route path="services" element={<ServiceListPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route
            path="services/new"
            element={
              <ProtectedRoute roles={["ADMIN", "TECHNICIAN"]}>
                <CreateServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/templates"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/parts"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <PartsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/stock"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <StockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/smtp"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <SmtpSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/sms"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <SmsSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reports"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AntApp>
  );
}

function DashboardRouter() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "TECHNICIAN":
      return <TechnicianDashboard />;
    case "CUSTOMER":
      return <CustomerDashboard />;
    default:
      return <Navigate to="/login" />;
  }
}
