// src/routes.tsx
import { Routes, Route } from 'react-router-dom';

// Páginas
import LoginPage from '../pages/LoginPage';
import CadastroPage from '../pages/CadastroPage';
import ServicosPage from '../pages/ServicosPage';
import AgendaPage from '../pages/AgendaPage';
import BarbeirosPage from '../pages/BarbeirosPage';
import TestApiPage from '../pages/TestApiPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas Públicas (sem proteção por enquanto) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/servicos" element={<ServicosPage />} />
      <Route path="/barbeiros" element={<BarbeirosPage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/test-api" element={<TestApiPage />} />

      {/* Rota inicial */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
};