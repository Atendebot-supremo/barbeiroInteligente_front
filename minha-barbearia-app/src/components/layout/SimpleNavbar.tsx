import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SimpleNavbar: React.FC = () => {
  const location = useLocation();
  const barbershopName = 'Minha Barbearia';

  const linkClass = (path: string) =>
    `${location.pathname.startsWith(path) ? 'text-primary font-medium' : 'text-text-secondary'} hover:text-primary`;

  return (
    <nav className="bg-bg-secondary border-b border-border">
      <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/servicos" className="flex items-center gap-2">
          <img
            src="/src/assets/Logo - Barbeiro Inteligente - Sem Fundo.png"
            alt="Logo"
            className="h-7 w-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-sm text-text-muted">{barbershopName}</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/agenda" className={linkClass('/agenda')}>Agenda</Link>
          <Link to="/servicos" className={linkClass('/servicos')}>Serviços</Link>
          <Link to="/barbeiros" className={linkClass('/barbeiros')}>Barbeiros</Link>
          <Link to="/test-api" className={linkClass('/test-api')}>Teste API</Link>
          <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavbar;


