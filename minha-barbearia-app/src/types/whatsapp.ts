// Tipos para integração com WhatsApp/Evolution API

export interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  instanceId?: string;
  error?: string;
  lastUpdate?: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  barbershopId?: string;
}

export interface WhatsAppWebSocketMessage {
  type: 'qr_code_updated' | 'connection_status' | 'instance_connected' | 'instance_disconnected' | 'connection_error' | 'request_connection' | 'disconnect';
  data: {
    qrCode?: string;
    instanceId?: string;
    status?: string;
    error?: string;
    reason?: string;
  };
  barbershopId?: string;
}

export interface WhatsAppConnectionConfig {
  barbershopId: string;
  instanceName?: string;
  webhookUrl?: string;
}

export interface QRCodeData {
  qrCode: string;
  instanceId: string;
  expiresAt?: Date;
}
