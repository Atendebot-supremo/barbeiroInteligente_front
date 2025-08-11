import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';

const GlobalLoading: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner animado */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
          
          {/* Mensagem */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {loadingMessage}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aguarde um momento...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoading;
