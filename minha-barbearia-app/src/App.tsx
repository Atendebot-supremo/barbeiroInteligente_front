// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './pages/routes';
import { SimpleNavbar } from './components/layout';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <SimpleNavbar />
        <div className="flex-1">
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;