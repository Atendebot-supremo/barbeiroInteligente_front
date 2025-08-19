// src/routes.tsx
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';
import { Loading } from '../components/ui';

// Lazy loading das páginas
const LoginPage = lazy(() => import('../pages/LoginPage'));
const CadastroPage = lazy(() => import('../pages/CadastroPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ServicosPage = lazy(() => import('../pages/ServicosPage'));
const AgendaPage = lazy(() => import('../pages/AgendaPage'));
const BarbeirosPage = lazy(() => import('../pages/BarbeirosPage'));
const ConfiguracoesPage = lazy(() => import('../pages/ConfiguracoesPage'));
const HorariosPage = lazy(() => import('../pages/HorariosPage'));
const UpgradePage = lazy(() => import('../pages/UpgradePage'));


export const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Rotas Públicas - redirecionam para dashboard se já logado */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><CadastroPage /></PublicRoute>} />
        
        {/* Rotas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/servicos" element={<ProtectedRoute><ServicosPage /></ProtectedRoute>} />
        <Route path="/barbeiros" element={<ProtectedRoute><BarbeirosPage /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
        <Route path="/horarios" element={<ProtectedRoute><HorariosPage /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />

        {/* Rota inicial - abre dashboard por padrão */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
};