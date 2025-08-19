import React from 'react';
import { Modal } from './ui';
import { WhatsAppQRCode } from './WhatsAppQRCode';
import Button from './ui/Button';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const { user } = useAuth();
  const { 
    whatsappStatus, 
    isWebSocketConnected, 
    error, 
    requestConnection, 
    disconnect,
    reconnect 
  } = useWhatsApp();

  const [qrExpired, setQrExpired] = React.useState(false);
  const [qrTimer, setQrTimer] = React.useState<number | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Efeito para controlar loading e expiração do QR Code
  React.useEffect(() => {
    if (whatsappStatus.status === 'connecting') {
      if (whatsappStatus.qrCode) {
        // QR Code apareceu, parar loading
        setIsConnecting(false);
        
        // Reset do estado de expiração
        setQrExpired(false);
        
        // Iniciar timer de 20 segundos
        const timer = window.setTimeout(() => {
          setQrExpired(true);
        }, 20000);
        
        setQrTimer(timer);
        
        // Cleanup
        return () => {
          if (timer) {
            clearTimeout(timer);
          }
        };
      }
    } else {
      // Não está conectando, parar loading
      setIsConnecting(false);
      
      // Limpar timer se não estiver conectando
      if (qrTimer) {
        clearTimeout(qrTimer);
        setQrTimer(null);
      }
      setQrExpired(false);
    }
  }, [whatsappStatus.status, whatsappStatus.qrCode]);

  // Cleanup ao fechar modal
  React.useEffect(() => {
    if (!isOpen && qrTimer) {
      clearTimeout(qrTimer);
      setQrTimer(null);
      setQrExpired(false);
    }
  }, [isOpen, qrTimer]);

  const handleClose = () => {
    // Se estiver conectando, desconectar antes de fechar
    if (whatsappStatus.status === 'connecting') {
      disconnect();
    }
    // Reset do estado de loading
    setIsConnecting(false);
    onClose();
  };

  const handleConnect = () => {
    console.log('🟢 CONNECT: Iniciando conexão...');
    setIsConnecting(true);
    requestConnection();
  };

  // Não renderizar modal para plano Free
  if (user?.planType === 'Free') {
    return null;
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Configuração do WhatsApp">
      <div className="space-y-6">
        {/* Status do WebSocket */}
        <div className="websocket-status">
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
                className="ml-auto border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 flex items-center"
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
              onClick={handleConnect}
              disabled={!isWebSocketConnected || isConnecting}
              className="flex items-center mx-auto bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
            </Button>
            </div>
          )}

          {whatsappStatus.status === 'connecting' && (
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              {!whatsappStatus.qrCode ? (
                // Loading enquanto aguarda QR Code
                <div className="py-8">
                  <div className="w-16 h-16 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gerando QR Code...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Aguarde enquanto preparamos seu código de conexão
                  </p>
                </div>
              ) : (
                <>
                  <div className="qr-code-wrapper mb-4 relative">
                    {whatsappStatus.qrCode && (
                  <>
                    <WhatsAppQRCode 
                      qrCodeData={whatsappStatus.qrCode}
                      size={200}
                      className="mx-auto"
                    />
                    {qrExpired && (
                      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-lg">
                        <div className="text-center p-4">
                          <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                          <p className="text-white text-sm font-medium mb-4">
                            QR Code Expirado
                          </p>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setQrExpired(false);
                              requestConnection();
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Gerar Novo QR Code
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {qrExpired ? 'QR Code Expirado' : 'Escaneie o QR Code'}
              </h3>
              {!qrExpired && (
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em Configurações → Aparelhos conectados</p>
                  <p>3. Toque em "Conectar um aparelho"</p>
                  <p>4. Escaneie o código acima</p>
                </div>
              )}
              {qrExpired ? (
                <p className="text-sm text-gray-600 mb-4">
                  O QR Code expirou por segurança. Clique no botão acima para gerar um novo.
                </p>
              ) : (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={disconnect}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex items-center"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
                </>
              )}
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
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={disconnect}
                  className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
                <Button 
                  onClick={handleClose}
                  className="bg-gray-600 text-white hover:bg-gray-700 flex items-center"
                >
                  Fechar
                </Button>
              </div>
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
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline"
                  onClick={reconnect}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 flex items-center"
                >
                  Reconectar WebSocket
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem de erro geral */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Como funciona?
          </h4>
          <div className="space-y-2 text-xs text-blue-700">
            <p>• <strong>Conecte:</strong> Escaneie o QR Code para conectar sua conta</p>
            <p>• <strong>Notificações:</strong> Receba agendamentos e mensagens automaticamente</p>
            <p>• <strong>Responda:</strong> Você pode responder diretamente pelo WhatsApp</p>
          </div>
        </div>

        {/* Avisos */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">
            Importante:
          </h4>
          <div className="text-xs text-yellow-800 space-y-1">
            <p>• Mantenha seu celular conectado à internet</p>
            <p>• Não desconecte o WhatsApp do celular</p>
            <p>• A conexão pode ser perdida se ficar offline por muito tempo</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
