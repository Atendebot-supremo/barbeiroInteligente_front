import React from 'react';
import Button from './ui/Button';
import { WhatsAppQRCode } from './WhatsAppQRCode';
import { useWhatsAppConnection } from '../hooks/useWhatsAppConnection';
import { 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface WhatsAppConnectionProps {
  barbershopId: string;
  className?: string;
}

export const WhatsAppConnection: React.FC<WhatsAppConnectionProps> = ({ 
  barbershopId,
  className = ''
}) => {
  const { 
    whatsappStatus, 
    isWebSocketConnected, 
    error, 
    requestConnection, 
    disconnect,
    reconnect 
  } = useWhatsAppConnection(barbershopId);

  return (
    <div className={`whatsapp-connection ${className}`}>
      {/* Status do WebSocket */}
      <div className="websocket-status mb-4">
        {isWebSocketConnected ? (
          <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Wifi className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">WebSocket Conectado</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">WebSocket Desconectado</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={reconnect}
              className="ml-auto"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reconectar
            </Button>
          </div>
        )}
      </div>

      {/* Status do WhatsApp */}
      <div className="whatsapp-status">
        {whatsappStatus.status === 'disconnected' && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              WhatsApp Desconectado
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Conecte seu WhatsApp para receber notificações e mensagens
            </p>
            <Button 
              onClick={requestConnection}
              disabled={!isWebSocketConnected}
              className="flex items-center mx-auto"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
          </div>
        )}

        {whatsappStatus.status === 'connecting' && (
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="qr-code-wrapper mb-4">
              {whatsappStatus.qrCode && (
                <WhatsAppQRCode 
                  qrCodeData={whatsappStatus.qrCode}
                  size={200}
                  className="mx-auto"
                />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Escaneie o QR Code
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Vá em Configurações → Aparelhos conectados</p>
              <p>3. Toque em "Conectar um aparelho"</p>
              <p>4. Escaneie o código acima</p>
            </div>
            <div className="mt-4 flex justify-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={requestConnection}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Novo QR Code
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnect}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {whatsappStatus.status === 'connected' && (
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              WhatsApp Conectado!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Seu WhatsApp está conectado e pronto para receber mensagens
            </p>
            <div className="text-xs text-gray-500 mb-4">
              Última atualização: {whatsappStatus.lastUpdate?.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              onClick={disconnect}
              className="flex items-center mx-auto"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Desconectar
            </Button>
          </div>
        )}

        {whatsappStatus.status === 'error' && (
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro de Conexão
            </h3>
            <p className="text-sm text-red-600 mb-4">
              {whatsappStatus.error || 'Erro desconhecido'}
            </p>
            <div className="flex justify-center space-x-2">
              <Button 
                onClick={requestConnection}
                disabled={!isWebSocketConnected}
              >
                Tentar Novamente
              </Button>
              <Button 
                variant="outline"
                onClick={reconnect}
              >
                Reconectar WebSocket
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mensagem de erro geral */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
