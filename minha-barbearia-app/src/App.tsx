// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './pages/routes';
import { Header } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { GlobalLoading, NotificationContainer } from './components/ui';

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <NotificationProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-1">
                <AppRoutes />
              </div>
              
              {/* Componentes globais */}
              <GlobalLoading />
              <NotificationContainer />
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;