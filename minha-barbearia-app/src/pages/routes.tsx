// src/routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importe as novas páginas que você criou
import LoginPage from '../pages/LoginPage';
import CadastroPage from '../pages/CadastroPage'; // <-- NOVA
import ServicosPage from '../pages/ServicosPage'; // <-- NOVA
import AgendaPage from '../pages/AgendaPage';   // <-- NOVA

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} /> {/* <-- NOVA */}

        {/* Rotas da Área Logada (vamos proteger depois) */}
        {/* O ideal é ter um layout para a área logada, mas por enquanto vamos simplificar */}
        <Route path="/servicos" element={<ServicosPage />} /> {/* <-- NOVA */}
        <Route path="/agenda" element={<AgendaPage />} />   {/* <-- NOVA */}

        {/* Rota inicial (pode redirecionar para o login ou para o dashboard) */}
        <Route path="/" element={<LoginPage />} />

      </Routes>
    </BrowserRouter>
  );
};