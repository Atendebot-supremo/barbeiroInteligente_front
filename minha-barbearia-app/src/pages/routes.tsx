// src/routes.tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Páginas
import LoginPage from '../pages/LoginPage';
import CadastroPage from '../pages/CadastroPage';
import DashboardPage from '../pages/DashboardPage';
import ServicosPage from '../pages/ServicosPage';
import AgendaPage from '../pages/AgendaPage';
import BarbeirosPage from '../pages/BarbeirosPage';
import ConfiguracoesPage from '../pages/ConfiguracoesPage';
import TestApiPage from '../pages/TestApiPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      
      {/* Rotas Protegidas */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/servicos" element={<ProtectedRoute><ServicosPage /></ProtectedRoute>} />
      <Route path="/barbeiros" element={<ProtectedRoute><BarbeirosPage /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
      <Route path="/test-api" element={<TestApiPage />} />

      {/* Rota inicial */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
};