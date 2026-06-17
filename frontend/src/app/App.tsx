import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthLayout } from "../components/layout/AuthLayout";
import { WorkspaceLayout } from "../components/layout/WorkspaceLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { LandingPage } from "../pages/public/LandingPage";
import { LoginPage } from "../pages/public/LoginPage";
import { RegisterPage } from "../pages/public/RegisterPage";
import { PricingPage } from "../pages/public/PricingPage";
import { AboutPage } from "../pages/public/AboutPage";
import { DashboardPage } from "../pages/user/DashboardPage";
import { ChatPage } from "../pages/user/ChatPage";
import { DocumentsPage } from "../pages/user/DocumentsPage";
import { DocumentDetailPage } from "../pages/user/DocumentDetailPage";
import { AgentsPage } from "../pages/user/AgentsPage";
import { AgentDetailPage } from "../pages/user/AgentDetailPage";
import { HistoryPage } from "../pages/user/HistoryPage";
import { SettingsPage } from "../pages/user/SettingsPage";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminChatsPage } from "../pages/admin/AdminChatsPage";
import { AdminDocumentsPage } from "../pages/admin/AdminDocumentsPage";
import { AdminUsagePage } from "../pages/admin/AdminUsagePage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:agentType" element={<AgentDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/chats" element={<AdminChatsPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/usage" element={<AdminUsagePage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
