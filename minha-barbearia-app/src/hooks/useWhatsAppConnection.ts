import { useState, useEffect, useRef, useCallback } from 'react';
import { WhatsAppWebSocketService } from '../services/websocketService';
import type { WhatsAppStatus, WhatsAppWebSocketMessage } from '../types/whatsapp';

export const useWhatsAppConnection = (barbershopId: string) => {
  // Carregar status do localStorage
  const getStoredStatus = (): WhatsAppStatus => {
    try {
      const stored = localStorage.getItem(`whatsapp_status_${barbershopId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Converter lastUpdate string de volta para Date
        if (parsed.lastUpdate) {
          parsed.lastUpdate = new Date(parsed.lastUpdate);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar status do WhatsApp:', error);
    }
    return { status: 'disconnected' };
  };

  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>(getStoredStatus);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsServiceRef = useRef<WhatsAppWebSocketService | null>(null);

  // Salvar status no localStorage sempre que mudar
  const updateWhatsappStatus = useCallback((newStatus: WhatsAppStatus) => {
    console.log('📝 UPDATE STATUS:', newStatus);
    setWhatsappStatus(newStatus);
    try {
      localStorage.setItem(`whatsapp_status_${barbershopId}`, JSON.stringify(newStatus));
      console.log('💾 Status salvo no localStorage:', newStatus);
    } catch (error) {
      console.error('Erro ao salvar status do WhatsApp:', error);
    }
  }, [barbershopId]);

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    // Não conectar se barbershopId estiver vazio
    if (!barbershopId) {
      console.log('🚫 WhatsApp: barbershopId vazio, não conectando');
      return () => {}; // Retornar função de cleanup vazia
    }

    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }

    // URL do WebSocket (será substituída pelo backend real)
    const wsUrl = `ws://localhost:3000/ws/whatsapp/${barbershopId}`;
    wsServiceRef.current = new WhatsAppWebSocketService(wsUrl);
    
    // Configurar callback para receber mensagens
    wsServiceRef.current.onMessage((data: WhatsAppWebSocketMessage) => {
      console.log('📨 Mensagem WhatsApp recebida:', data);
      
      switch (data.type) {
        case 'qr_code_updated':
          updateWhatsappStatus({
            status: 'connecting',
            qrCode: data.data.qrCode,
            instanceId: data.data.instanceId,
            lastUpdate: new Date()
          });
          setError(null);
          break;

        case 'instance_connected':
          updateWhatsappStatus({
            status: 'connected',
            instanceId: data.data.instanceId,
            lastUpdate: new Date()
          });
          setError(null);
          break;

        case 'instance_disconnected':
          updateWhatsappStatus({
            status: 'disconnected',
            error: data.data.reason || 'Desconectado',
            lastUpdate: new Date()
          });
          break;

        case 'connection_error':
          updateWhatsappStatus({
            status: 'error',
            error: data.data.error || 'Erro de conexão',
            lastUpdate: new Date()
          });
          setError(data.data.error || 'Erro de conexão');
          break;

        case 'connection_status':
          setIsWebSocketConnected(data.data.status === 'connected');
          break;
      }
    });

    // Conectar
    wsServiceRef.current.connect();
    
    // Verificar status de conexão periodicamente
    const checkConnection = setInterval(() => {
      if (wsServiceRef.current) {
        setIsWebSocketConnected(wsServiceRef.current.isConnected());
      }
    }, 5000);

    return () => {
      clearInterval(checkConnection);
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [barbershopId, updateWhatsappStatus]);

  // Solicitar nova conexão WhatsApp
  const requestConnection = useCallback(() => {
    if (!barbershopId) {
      console.log('🚫 WhatsApp: barbershopId vazio, não solicitando conexão');
      return;
    }
    
    if (wsServiceRef.current) {
      console.log('📱 Solicitando conexão WhatsApp...');
      wsServiceRef.current.send({
        type: 'request_connection',
        data: {},
        barbershopId
      });
    }
  }, [barbershopId]);

  // Desconectar WhatsApp
  const disconnect = useCallback(() => {
    console.log('🔴 DISCONNECT: Iniciando desconexão...');
    
    if (!barbershopId) {
      console.log('🚫 WhatsApp: barbershopId vazio, não desconectando');
      return;
    }
    
    if (wsServiceRef.current) {
      console.log('📱 Enviando comando de desconexão para WebSocket...');
      wsServiceRef.current.send({
        type: 'disconnect',
        data: {},
        barbershopId
      });
    }
    
    // Atualizar status imediatamente para desconectado
    console.log('🔴 DISCONNECT: Atualizando status para desconectado');
    updateWhatsappStatus({
      status: 'disconnected',
      lastUpdate: new Date()
    });
    
    console.log('🔴 DISCONNECT: Desconexão concluída');
  }, [barbershopId, updateWhatsappStatus]);

  // Reconectar WebSocket
  const reconnect = useCallback(() => {
    setError(null);
    connect();
  }, [connect]);

  // Efeito para conectar automaticamente
  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    whatsappStatus,
    isWebSocketConnected,
    error,
    requestConnection,
    disconnect,
    reconnect
  };
};
