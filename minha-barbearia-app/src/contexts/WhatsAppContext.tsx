import React, { createContext, useContext, ReactNode } from 'react';
import { useWhatsAppConnection } from '../hooks/useWhatsAppConnection';
import { useAuth } from './AuthContext';
import type { WhatsAppStatus } from '../types/whatsapp';

interface WhatsAppContextType {
  whatsappStatus: WhatsAppStatus;
  isWebSocketConnected: boolean;
  error: string | null;
  requestConnection: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

interface WhatsAppProviderProps {
  children: ReactNode;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Hook do WhatsApp só para planos Pro e quando user estiver disponível
  const whatsappHook = useWhatsAppConnection(
    (user?.planType === 'Pro' && user?.idBarbershop) ? user.idBarbershop : ''
  );

  // Para planos Free ou quando user não estiver disponível, retornar estado desconectado e funções vazias
  const freeContextValue: WhatsAppContextType = {
    whatsappStatus: { status: 'disconnected' },
    isWebSocketConnected: false,
    error: null,
    requestConnection: () => {},
    disconnect: () => {},
    reconnect: () => {}
  };

  // Se user não existe ou é Free, usar freeContextValue
  const contextValue = (user && user.planType === 'Pro') ? whatsappHook : freeContextValue;

  return (
    <WhatsAppContext.Provider value={contextValue}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};
