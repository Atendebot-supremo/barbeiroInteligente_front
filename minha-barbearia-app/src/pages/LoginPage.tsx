// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center pt-10 pb-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/src/assets/background-simples.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundColor: 'hsl(var(--color-bg-primary))',
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
                     <img 
             className="mx-auto h-24 w-auto"
             src="/src/assets/Logo - Barbeiro Inteligente - Sem Fundo.png" 
             alt="Logo" 
             onError={(e) => {
               e.currentTarget.style.display = 'none';
             }}
           />
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Ou{' '}
            <Link to="/cadastro" className="font-medium text-primary hover:text-primary/80">
              crie uma nova conta
            </Link>
          </p>
        </div>

        <Card className="bg-bg-secondary text-text-secondary border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : null}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              required
              id="email"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              required
              id="password"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;