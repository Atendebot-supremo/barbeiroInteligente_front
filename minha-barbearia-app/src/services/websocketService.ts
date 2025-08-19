import type { WhatsAppWebSocketMessage } from '../types/whatsapp';

export class WhatsAppWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback: ((data: WhatsAppWebSocketMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private isMockMode = true; // Para desenvolvimento sem backend
  private mockInterval: number | null = null;

  constructor(url: string) {
    this.url = url;
  }

  // Conectar ao WebSocket
  connect() {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    console.log('🔌 Tentando conectar WebSocket...');

    if (this.isMockMode) {
      this.connectMock();
      return;
    }

    try {
      // Criar conexão WebSocket real
      this.ws = new WebSocket(this.url);

      // Evento: Conexão estabelecida
      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso!');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      // Evento: Receber mensagem do servidor
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensagem recebida:', data);
          
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
        }
      };

      // Evento: Conexão fechada
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.isConnecting = false;
        
        // Tentar reconectar automaticamente
        this.handleReconnect();
      };

      // Evento: Erro na conexão
      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
      this.isConnecting = false;
    }
  }

  // Mock para desenvolvimento
  private connectMock() {
    console.log('🎭 Usando modo mock para desenvolvimento');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Simular conexão bem-sucedida
    setTimeout(() => {
      if (this.onMessageCallback) {
        this.onMessageCallback({
          type: 'connection_status',
          data: { status: 'connected' }
        });
      }
    }, 1000);
  }

  // Enviar mensagem para o servidor
  send(message: WhatsAppWebSocketMessage) {
    if (this.isMockMode) {
      this.handleMockMessage(message);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      console.log('📤 Enviando mensagem:', messageString);
      this.ws.send(messageString);
    } else {
      console.warn('⚠️ WebSocket não está conectado');
    }
  }

  // Mock para mensagens
  private handleMockMessage(message: WhatsAppWebSocketMessage) {
    console.log('🎭 Mock: Processando mensagem:', message);

    switch (message.type) {
      case 'request_connection':
        // Simular QR Code após 2 segundos
        setTimeout(() => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'qr_code_updated',
              data: {
                qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp-mock-qr-code',
                instanceId: 'mock-instance-123'
              }
            });
          }
        }, 2000);
        
        // Simular conexão bem-sucedida após 30 segundos (para dar tempo de ver o QR Code)
        setTimeout(() => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'instance_connected',
              data: {
                instanceId: 'mock-instance-123',
                status: 'connected'
              }
            });
          }
        }, 30000);
        break;

      case 'disconnect':
        // Simular desconexão
        setTimeout(() => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'instance_disconnected',
              data: { reason: 'Desconexão manual' }
            });
          }
        }, 1000);
        break;
    }
  }

  // Configurar callback para receber mensagens
  onMessage(callback: (data: WhatsAppWebSocketMessage) => void) {
    this.onMessageCallback = callback;
  }

  // Reconexão automática
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Backoff exponencial, max 30s
      
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido');
    }
  }

  // Desconectar manualmente
  disconnect() {
    console.log('🔌 Desconectando WebSocket...');
    
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexão manual');
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Verificar se está conectado
  isConnected(): boolean {
    if (this.isMockMode) {
      return true; // Mock sempre "conectado"
    }
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Ativar/desativar modo mock
  setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
    console.log(`🎭 Modo mock ${enabled ? 'ativado' : 'desativado'}`);
  }
}
