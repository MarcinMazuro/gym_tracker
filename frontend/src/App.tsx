import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { GuestRoute } from '@/components/common/GuestRoute';
import { MainLayout } from '@/components/layout/MainLayout'; // <-- IMPORT

import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import ErrorPage from './pages/ErrorPage';
import EditProfilePage from './pages/EditProfilePage';
import ProfilesListPage from './pages/ProfilesListPage';
import PublicProfilePage from './pages/PublicProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Wrap all pages that should have the layout in MainLayout */}
          <Route path="/" element={<MainLayout />}>
            {/* Redirect from root to dashboard if logged in */}
            <Route index element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />

            {/* Guest routes */}
            <Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

            {/* Protected routes */}
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

            {/* Public profile routes */}
            <Route path="profiles" element={<ProfilesListPage />} />
            <Route path="profiles/:username" element={<PublicProfilePage />} />

            {/* 404 - Not found */}
            <Route path="*" element={<ErrorPage />} />
          </Route>

          {/* Routes WITHOUT the main layout (e.g., special confirmation pages) */}
          <Route path="/verify-email/:key" element={<VerifyEmailPage />} />
          <Route path="/reset-password/:key" element={<ResetPasswordPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
