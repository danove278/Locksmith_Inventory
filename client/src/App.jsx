import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import UsagePage from './pages/UsagePage';
import UserManagementPage from './pages/UserManagementPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/' : '/uso'} /> : <LoginPage />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={
          <ProtectedRoute requiredRole="admin">
            <InventoryPage />
          </ProtectedRoute>
        } />
        <Route path="/uso" element={<UsagePage />} />
        <Route path="/usuarios" element={
          <ProtectedRoute requiredRole="admin">
            <UserManagementPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/' : '/uso') : '/login'} />} />
    </Routes>
  );
}
