// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './pages/routes';
import { Header } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">
            <AppRoutes />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;