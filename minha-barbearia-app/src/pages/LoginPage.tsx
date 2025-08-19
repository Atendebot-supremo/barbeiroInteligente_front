// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
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
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Effect para gerenciar o countdown do rate limit
  useEffect(() => {
    let timer: number;
    
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isRateLimited && countdown === 0) {
      // Quando o countdown chega a 0, reabilitar o formulário
      setIsRateLimited(false);
      setError(null);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isRateLimited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Falha no login';
      setError(errorMessage);
      
      // Verificar se é erro de rate limit
      if (errorMessage.includes('Muitas tentativas')) {
        console.warn('⚠️ Rate limit atingido no login');
        setIsRateLimited(true);
        setCountdown(120); // 2 minutos em segundos
      }
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
          <h2 className="mt-6 text-3xl font-extrabold text-primary-light">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-sm text-white-muted">
            Ou{' '}
            <Link to="/cadastro" className="font-medium text-primary hover:text-primary/80">
              crie uma nova conta
            </Link>
          </p>
        </div>

        <Card className="bg-bg-secondary text-text-secondary border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className={`p-4 rounded-lg border ${
                error.includes('Muitas tentativas') 
                  ? 'bg-orange-50 border-orange-200 text-orange-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-start">
                  {error.includes('Muitas tentativas') ? (
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${
                      error.includes('Muitas tentativas') ? 'text-orange-800' : 'text-red-800'
                    }`}>
                      {error.includes('Muitas tentativas') ? 'Limite de tentativas atingido' : 'Erro no login'}
                    </h3>
                    <p className={`mt-1 text-sm ${
                      error.includes('Muitas tentativas') ? 'text-orange-700' : 'text-red-700'
                    }`}>
                      {error}
                    </p>
                    {error.includes('Muitas tentativas') && (
                      <div className="mt-2 space-y-1">
                        {isRateLimited && countdown > 0 && (
                          <p className="text-sm text-orange-700 font-medium">
                            ⏱️ Tente novamente em: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                        <p className="text-xs text-orange-600">
                          💡 <strong>Dica:</strong> Aguarde alguns minutos antes de tentar fazer login novamente para evitar bloqueios de segurança.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
              disabled={loading || isRateLimited}
            >
              {loading 
                ? 'Entrando...' 
                : isRateLimited 
                  ? `Aguarde ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                  : 'Entrar'
              }
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;