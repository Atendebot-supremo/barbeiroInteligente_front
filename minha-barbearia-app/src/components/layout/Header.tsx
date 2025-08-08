import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/servicos" className="flex items-center">
                             <img 
                 src="/src/assets/Logo - Barbeiro Inteligente.jpeg" 
                 alt="Logo" 
                 className="h-8 w-auto mr-3"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                 }}
               />
              <span className="text-xl font-bold text-gray-900">
                Barbeiro Inteligente
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/servicos" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Serviços
            </Link>
            <Link 
              to="/agenda" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Agenda
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.barbershop}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
