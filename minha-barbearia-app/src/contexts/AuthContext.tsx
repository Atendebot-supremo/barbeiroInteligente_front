import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Barbearia } from '../types';

// Preferir API real; manter mock como fallback opcional
import { authApi, barbershopService } from '../services/realApiService';

interface AuthContextType {
  user: Barbearia | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Barbearia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restaurar sessão
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedToken) {
      // Token será anexado por interceptor se configurado
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { token, user } = await authApi.login(email, password);
      
      // Debug: ver todos os dados retornados pela API
      console.log('🔍 Dados completos retornados pela API de login:', { token, user });
      console.log('🆔 ClientId extraído:', (user as any)?.ClientId);
      console.log('📋 SubscriptionId extraído:', (user as any)?.SubscriptionId);
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('token', token);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const refreshUserData = async () => {
    try {
      if (!user?.idBarbershop) {
        console.warn('⚠️ refreshUserData: Sem idBarbershop para atualizar');
        return;
      }

      console.log('🔄 Atualizando dados do usuário após upgrade...');
      const response = await barbershopService.getById(user.idBarbershop);
      const updatedData = (response as any).data || response;
      
      console.log('✅ Dados atualizados recebidos:', updatedData);
      
      // Normalizar dados como no login
      const normalizedUser = {
        ...updatedData,
        idBarbershop: updatedData.idBarbershop || updatedData.id || user.idBarbershop,
        clientId: updatedData.ClientId || updatedData.clientId || updatedData.client_id || updatedData.customerId || updatedData.customer_id,
        subscriptionId: updatedData.SubscriptionId || updatedData.subscriptionId || updatedData.subscription_id || null,
      };

      console.log('🔄 Usuário normalizado:', normalizedUser);
      
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      console.log('✅ Contexto de usuário atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error);
    }
  };

  const value: AuthContextType = {
    // Normalizar o user para conter idBarbershop, clientId e subscriptionId sempre
    user: user
      ? {
          ...user,
          // Suportar formatos "id" ou "idBarbershop" do backend
          idBarbershop: (user as any).idBarbershop || (user as any).id || user.idBarbershop,
          // Extrair ClientId (com C maiúsculo) da resposta da API
          clientId: (user as any).ClientId || (user as any).clientId || (user as any).client_id || (user as any).customerId || (user as any).customer_id,
          // Extrair SubscriptionId (pode ser vazio)
          subscriptionId: (user as any).SubscriptionId || (user as any).subscriptionId || (user as any).subscription_id || null,
        }
      : null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUserData,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
