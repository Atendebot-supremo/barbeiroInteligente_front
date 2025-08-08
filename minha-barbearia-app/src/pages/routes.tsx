// src/routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Páginas
import LoginPage from '../pages/LoginPage';
import CadastroPage from '../pages/CadastroPage';
import ServicosPage from '../pages/ServicosPage';
import AgendaPage from '../pages/AgendaPage';
import BarbeirosPage from '../pages/BarbeirosPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas (sem proteção por enquanto) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/servicos" element={<ServicosPage />} />
        <Route path="/barbeiros" element={<BarbeirosPage />} />
        <Route path="/agenda" element={<AgendaPage />} />

        {/* Rota inicial */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
};