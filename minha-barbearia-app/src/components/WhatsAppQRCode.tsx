import React from 'react';
import QRCode from 'qrcode';

interface WhatsAppQRCodeProps {
  qrCodeData: string;
  size?: number;
  className?: string;
}

export const WhatsAppQRCode: React.FC<WhatsAppQRCodeProps> = ({ 
  qrCodeData, 
  size = 256,
  className = ''
}) => {
  // Se o QR Code for uma URL de imagem, renderizar como img
  if (qrCodeData.startsWith('data:image/') || qrCodeData.startsWith('http')) {
    return (
      <div className={`qr-code-container ${className}`}>
        <img 
          src={qrCodeData} 
          alt="QR Code WhatsApp"
          className="mx-auto border rounded-lg shadow-lg"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  // Se for uma string de dados, renderizar como QR Code
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(qrCodeData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    if (qrCodeData && !qrCodeData.startsWith('data:image/') && !qrCodeData.startsWith('http')) {
      generateQRCode();
    }
  }, [qrCodeData, size]);

  if (qrCodeUrl) {
    return (
      <div className={`qr-code-container ${className}`}>
        <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
          <img 
            src={qrCodeUrl} 
            alt="QR Code WhatsApp"
            className="mx-auto"
            style={{ width: size, height: size }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-code-container ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
        <div 
          className="animate-pulse bg-gray-200 rounded"
          style={{ width: size, height: size }}
        />
      </div>
    </div>
  );
};
