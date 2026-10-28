import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DemoGuideDrawer } from './components/DemoGuideDrawer';
import { LoginPage } from './pages/LoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { OfficialWorkspace } from './pages/OfficialWorkspace';
import { Institution360 } from './pages/Institution360';
import { VisualAnalyticsStudio } from './pages/VisualAnalyticsStudio';
import { ConnectedCaseNetwork } from './pages/ConnectedCaseNetwork';
import { RootCauseDashboard } from './pages/RootCauseDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEscalationsPage } from './pages/AdminEscalationsPage';
import { SettingsPage } from './pages/SettingsPage';
import './i18n';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">Authenticating...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Home Redirect Dispatcher
const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/official" replace />;
};

export const AppContent: React.FC = () => {
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        onOpenDemoGuide={() => setDemoGuideOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex-1 flex min-h-0">
        {!isLoginPage && user && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpenDemoGuide={() => setDemoGuideOpen(true)}
          />
        )}
        
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Student Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'official']}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />

          {/* Official Workspace */}
          <Route
            path="/official"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']}>
                <OfficialWorkspace />
              </ProtectedRoute>
            }
          />

          {/* Institution 360 */}
          <Route
            path="/institutions"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']}>
                <Institution360 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/:id"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']}>
                <Institution360 />
              </ProtectedRoute>
            }
          />

          {/* Report Analysis Visualisation Studio */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']}>
                <VisualAnalyticsStudio />
              </ProtectedRoute>
            }
          />

          {/* Connected Case Network */}
          <Route
            path="/network"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']}>
                <ConnectedCaseNetwork />
              </ProtectedRoute>
            }
          />

          {/* Admin National Leadership Dashboard (Section 1) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Root-Cause Insights (Section 2) */}
          <Route
            path="/admin/insights"
            element={
              <ProtectedRoute allowedRoles={['admin', 'official']}>
                <RootCauseDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Escalations & Conflicts (Section 5) */}
          <Route
            path="/admin/escalations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEscalationsPage />
              </ProtectedRoute>
            }
          />

          {/* Root-Cause Insight Dashboard */}
          <Route
            path="/root-cause"
            element={
              <ProtectedRoute allowedRoles={['admin', 'official']}>
                <RootCauseDashboard />
              </ProtectedRoute>
            }
          />

          {/* Settings & Audit */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'official']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </main>
      </div>

      {/* Floating Demo Guide Drawer */}
      <DemoGuideDrawer
        isOpen={demoGuideOpen}
        onClose={() => setDemoGuideOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
