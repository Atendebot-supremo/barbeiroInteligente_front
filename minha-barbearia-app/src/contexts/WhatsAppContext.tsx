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
  const whatsappHook = useWhatsAppConnection(user?.idBarbershop || '');

  return (
    <WhatsAppContext.Provider value={whatsappHook}>
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
