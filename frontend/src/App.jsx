import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CitizenReportPage from './pages/CitizenReportPage';
import FieldFeedPage from './pages/FieldFeedPage';
import CommandCenterPage from './pages/CommandCenterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import { clearAuth, getAuth } from './services/auth';

const getHomeForRole = (role) => (
  role === 'admin' ? '/admin' : role === 'ngo' ? '/field-feed' : '/'
);

function ProtectedRoute({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.accessRole)) {
    return <Navigate to={getHomeForRole(user.accessRole)} replace />;
  }
  return children;
}

export default function App() {
  const [auth, setAuth] = useState(getAuth);

  useEffect(() => {
    const handleUnauthorized = () => setAuth(null);
    window.addEventListener('noor:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('noor:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
        <Navbar user={auth?.user} onLogout={handleLogout} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/login"
              element={
                <LoginPage
                  user={auth?.user}
                  onAuthenticated={(nextAuth) => setAuth(nextAuth)}
                />
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute user={auth?.user}>
                  <LandingPage user={auth?.user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute user={auth?.user} roles={['citizen', 'admin']}>
                  <CitizenReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/field-feed"
              element={
                <ProtectedRoute user={auth?.user} roles={['ngo', 'admin']}>
                  <FieldFeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/command-center"
              element={
                <ProtectedRoute user={auth?.user} roles={['admin']}>
                  <CommandCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={auth?.user} roles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={auth ? getHomeForRole(auth.user.accessRole) : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
