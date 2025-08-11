import React from 'react';
import { Card } from '../components/ui';

const ConfiguracoesPage: React.FC = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/src/assets/background-simples.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundColor: 'hsl(var(--color-bg-primary))',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-primary-light">Configurações</h1>
            <p className="text-text-secondary">Gerencie as configurações do seu sistema</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Perfil</h2>
            <p className="text-text-secondary mb-4">Configurações do seu perfil de usuário</p>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Barbearia</h2>
            <p className="text-text-secondary mb-4">Configurações da sua barbearia</p>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Notificações</h2>
            <p className="text-text-secondary mb-4">Configure como você recebe notificações</p>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Sistema</h2>
            <p className="text-text-secondary mb-4">Configurações gerais do sistema</p>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </Card>
        </div>

        {/* Placeholder for future sections */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Configurações Avançadas</h2>
          <p className="text-text-secondary mb-6">Em breve, mais opções de configuração estarão disponíveis aqui.</p>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Funcionalidades em desenvolvimento</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
