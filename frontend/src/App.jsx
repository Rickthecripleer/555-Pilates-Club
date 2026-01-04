import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Reservaciones from './pages/Reservaciones';
import MisReservaciones from './pages/MisReservaciones';
import Pagos from './pages/Pagos';
import Nosotros from './pages/Nosotros';
import AdminPagos from './pages/AdminPagos';
import AdminAlumnas from './pages/AdminAlumnas';
import AdminReservaciones from './pages/AdminReservaciones';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" replace />} />
      
      {/* Página principal: Sobre Nosotros */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Nosotros />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Panel de Control (antes Dashboard/Inicio) */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reservaciones"
        element={
          <ProtectedRoute>
            <Layout>
              <Reservaciones />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/mis-reservaciones"
        element={
          <ProtectedRoute>
            <Layout>
              <MisReservaciones />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/pagos"
        element={
          <ProtectedRoute>
            <Layout>
              <Pagos />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/pagos"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminPagos />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/alumnas"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminAlumnas />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/reservaciones"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminReservaciones />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

