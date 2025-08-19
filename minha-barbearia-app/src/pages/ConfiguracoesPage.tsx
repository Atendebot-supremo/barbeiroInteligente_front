import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal } from '../components/ui';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { barbershopService, subscriptionService } from '../services/realApiService';
import type { Barbearia } from '../types';
import { Bell, User, Store, AlertTriangle, Save, Edit3, Trash2, ArrowLeft, MessageCircle, MessageCircleOff, Settings } from 'lucide-react';

const ConfiguracoesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUserData } = useAuth();
  const { success: showSuccess, error: showError, warning: showWarning } = useNotification();
  const { whatsappStatus } = useWhatsApp();
  const [loading, setLoading] = useState(true);
  const [barbershopData, setBarbershopData] = useState<Barbearia | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    appointment: true,
    payment: true
  });
  
  // Estados para edição do perfil
  const [profileForm, setProfileForm] = useState({
    barbershop: '',
    email: '',
    phone: '',
    cnpj: ''
  });

  // Carregar dados da barbearia
  useEffect(() => {
    const loadBarbershopData = async () => {
      console.log('🔍 ConfiguracoesPage - Debug dados do usuário:', user);
      console.log('🔍 ConfiguracoesPage - idBarbershop:', user?.idBarbershop);
      console.log('🔍 ConfiguracoesPage - planType:', user?.planType);
      console.log('🔍 ConfiguracoesPage - subscriptionId:', user?.subscriptionId);
      console.log('🔍 ConfiguracoesPage - subscriptionId type:', typeof user?.subscriptionId);
      
      if (!user?.idBarbershop) {
        console.warn('⚠️ ConfiguracoesPage - Sem idBarbershop, usando dados do próprio user');
        
        // Se não tem idBarbershop mas tem dados do user, usar os dados do user mesmo
        if (user) {
          setBarbershopData(user as any);
          setProfileForm({
            barbershop: (user as any).barbershop || '',
            email: (user as any).email || '',
            phone: (user as any).phone || '',
            cnpj: (user as any).cnpj || ''
          });
        }
        setLoading(false);
        return;
      }

      try {
        console.log('📡 ConfiguracoesPage - Buscando dados da barbearia via API...');
        const response = await barbershopService.getById(user.idBarbershop);
        console.log('✅ ConfiguracoesPage - Dados recebidos da API:', response);
        
        // Extrair dados da resposta encapsulada
        const data = (response as any).data || response;
        console.log('📦 ConfiguracoesPage - Dados extraídos:', data);
        
        setBarbershopData(data);
        setProfileForm({
          barbershop: data.barbershop || '',
          email: data.email || '',
          phone: data.phone || '',
          cnpj: data.cnpj || ''
        });
      } catch (error) {
        console.error('❌ ConfiguracoesPage - Erro ao carregar dados da barbearia:', error);
        
        // Fallback: usar dados do próprio user se a API falhar
        if (user) {
          console.log('🔄 ConfiguracoesPage - Usando dados do user como fallback');
          const userData = (user as any).data || user;
          setBarbershopData(userData);
          setProfileForm({
            barbershop: userData.barbershop || '',
            email: userData.email || '',
            phone: userData.phone || '',
            cnpj: userData.cnpj || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadBarbershopData();
  }, [user]);

  const handleProfileSave = async () => {
    const barbershopId = user?.idBarbershop || (user as any)?.id;
    
    if (!barbershopId) {
      showError('Erro: ID da barbearia não encontrado. Faça login novamente.');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 ConfiguracoesPage - Salvando perfil:', {
        barbershopId,
        profileForm
      });
      
      const updatedData = await barbershopService.update(barbershopId, profileForm);
      console.log('✅ ConfiguracoesPage - Perfil atualizado:', updatedData);
      
      setBarbershopData(updatedData);
      setEditingProfile(false);
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('❌ ConfiguracoesPage - Erro ao atualizar perfil:', error);
      showError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar assinatura Pro -> Free
  const handleCancelSubscription = async () => {
    console.log('🔍 handleCancelSubscription - user?.subscriptionId:', user?.subscriptionId);
    console.log('🔍 handleCancelSubscription - user?.planType:', user?.planType);
    
    if (!user?.subscriptionId || user.subscriptionId.trim() === '') {
      showError('ID da assinatura não encontrado. Entre em contato com o suporte.');
      return;
    }

    if (user?.planType !== 'Pro') {
      showWarning('Você não possui uma assinatura Pro ativa para cancelar.');
      return;
    }

    try {
      setLoading(true);
      console.log('🚫 ConfiguracoesPage - Cancelando assinatura Pro:', user.subscriptionId);
      
      // Cancelar assinatura via API Asaas
      await subscriptionService.cancel(user.subscriptionId);
      
      // Atualizar dados do usuário no contexto
      await refreshUserData();
      
      // Atualizar dados locais para Free
      if (barbershopData) {
        setBarbershopData({ 
          ...barbershopData, 
          planType: 'Free',
          subscriptionId: null 
        });
      }
      
      showSuccess('Assinatura Pro cancelada com sucesso! Sua conta foi alterada para o plano Free.');
      setShowCancelSubscriptionModal(false);
    } catch (error) {
      console.error('❌ ConfiguracoesPage - Erro ao cancelar assinatura:', error);
      showError('Erro ao cancelar assinatura. Tente novamente ou entre em contato com o suporte.');
    } finally {
      setLoading(false);
    }
  };

  // Deletar conta completamente
  const handleDeleteAccount = async () => {
    const barbershopId = user?.idBarbershop || (user as any)?.id;
    
    if (!barbershopId) {
      showError('ID da barbearia não encontrado. Faça login novamente.');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ ConfiguracoesPage - Deletando conta:', barbershopId);
      
      // 1. Primeiro cancelar assinatura se existir (Pro users)
      if (user?.planType === 'Pro' && user?.subscriptionId && user.subscriptionId.trim() !== '') {
        console.log('🚫 ConfiguracoesPage - Cancelando assinatura antes da exclusão:', user.subscriptionId);
        try {
          await subscriptionService.cancel(user.subscriptionId);
          console.log('✅ Assinatura cancelada com sucesso antes da exclusão');
        } catch (subscriptionError) {
          console.warn('⚠️ Erro ao cancelar assinatura (continuando com exclusão):', subscriptionError);
          // Continua com a exclusão mesmo se falhar o cancelamento da assinatura
        }
      }
      
      // 2. Deletar conta via API
      console.log('🗑️ Deletando barbearia:', barbershopId);
      await barbershopService.delete(barbershopId);
      
      showSuccess('Conta deletada com sucesso. Você será redirecionado para a tela de login.');
      setShowDeleteAccountModal(false);
      
      // Fazer logout e redirecionar
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      console.error('❌ ConfiguracoesPage - Erro ao deletar conta:', error);
      showError('Erro ao deletar conta. Tente novamente ou entre em contato com o suporte.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando configurações...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-white-muted">Gerencie as configurações da sua barbearia</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Perfil da Barbearia */}
          <Card className="bg-bg-secondary border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-primary-dark">Perfil da Barbearia</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {editingProfile ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">Nome da Barbearia</label>
                  {editingProfile ? (
                    <Input
                      value={profileForm.barbershop}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, barbershop: e }))}
                      placeholder="Nome da sua barbearia"
                    />
                  ) : (
                    <p className="text-text-secondary bg-gray-50 p-2 rounded border">
                      {barbershopData?.barbershop || profileForm.barbershop || 'Não informado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">Email</label>
                  <p className="text-text-secondary bg-gray-50 p-2 rounded border">
                    {barbershopData?.email || profileForm.email || 'Não informado'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Campo não editável</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">Telefone</label>
                  {editingProfile ? (
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e }))}
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-text-secondary bg-gray-50 p-2 rounded border">
                      {barbershopData?.phone || profileForm.phone || 'Não informado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">CNPJ</label>
                  <p className="text-text-secondary bg-gray-50 p-2 rounded border">
                    {barbershopData?.cnpj || profileForm.cnpj || 'Não informado'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Campo não editável</p>
                </div>



                {editingProfile && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleProfileSave}
                      className="flex items-center gap-2"
                      disabled={loading}
                    >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Notificações */}
          <Card className="bg-bg-secondary border border-border">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-primary-dark">Notificações</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-dark">Email</p>
                    <p className="text-sm text-text-muted">Receber notificações por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-dark">Agendamentos</p>
                    <p className="text-sm text-text-muted">Notificar sobre novos agendamentos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.appointment}
                      onChange={(e) => setNotifications(prev => ({ ...prev, appointment: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-dark">SMS</p>
                    <p className="text-sm text-text-muted">Receber notificações por SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-dark">Pagamentos</p>
                    <p className="text-sm text-text-muted">Notificar sobre pagamentos e faturas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.payment}
                      onChange={(e) => setNotifications(prev => ({ ...prev, payment: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* WhatsApp */}
          <Card className="bg-bg-secondary border border-border">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-primary-dark">WhatsApp</h2>
                {user?.planType === 'Pro' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Pro</span>
                )}
              </div>

              {user?.planType === 'Free' ? (
                // Versão bloqueada para plano Free
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Recurso Exclusivo Pro
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      A integração com WhatsApp está disponível apenas no Plano Pro. 
                      Receba notificações automáticas de agendamentos e gerencie sua comunicação.
                    </p>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-purple-800 mb-2">Com o Plano Pro você terá:</h4>
                      <ul className="text-sm text-purple-700 space-y-1 text-left">
                        <li>• Notificações automáticas de agendamentos</li>
                        <li>• Confirmações e lembretes via WhatsApp</li>
                        <li>• Comunicação direta com clientes</li>
                        <li>• Integração completa com Evolution API</li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/upgrade')}
                      className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 hover:border-purple-700 flex items-center mx-auto"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Fazer Upgrade para Pro
                    </Button>
                  </div>
                </div>
              ) : (
                // Versão completa para plano Pro
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary-dark">Status da Conexão</p>
                      <p className="text-sm text-text-muted">
                        {whatsappStatus.status === 'connected' ? 'Conectado e funcionando' :
                         whatsappStatus.status === 'connecting' ? 'Conectando...' :
                         whatsappStatus.status === 'error' ? 'Erro na conexão' :
                         'Desconectado'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {whatsappStatus.status === 'connected' ? (
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      ) : whatsappStatus.status === 'connecting' ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
                      ) : (
                        <MessageCircleOff className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        whatsappStatus.status === 'connected' ? 'text-green-600' :
                        whatsappStatus.status === 'connecting' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {whatsappStatus.status === 'connected' ? 'Conectado' :
                         whatsappStatus.status === 'connecting' ? 'Conectando' :
                         whatsappStatus.status === 'error' ? 'Erro' :
                         'Desconectado'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={() => setShowWhatsAppModal(true)}
                      className={`w-full flex items-center justify-center transition-colors duration-200 ${
                        whatsappStatus.status === 'connected' 
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' 
                          : 'bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700'
                      }`}
                      variant={whatsappStatus.status === 'connected' ? 'outline' : 'primary'}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {whatsappStatus.status === 'connected' ? 'Gerenciar Conexão' : 'Conectar WhatsApp'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* Status da Conta - Centralizado */}
        <Card className="bg-bg-secondary border border-border">
          <div className="p-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-primary-dark">Status da Conta</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="flex flex-col items-center space-y-2">
                  <p className="font-medium text-primary-dark">Status da Assinatura</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    (barbershopData?.status || 'Ativo') === 'Ativo' 
                      ? 'bg-green-100 text-green-800' 
                      : barbershopData?.status === 'Cancelado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {barbershopData?.status || 'Ativo'}
                  </span>
                  <p className="text-sm text-text-muted">Status atual da sua conta</p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col items-center space-y-2">
                  <p className="font-medium text-primary-dark">Plano Atual</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    (barbershopData?.planType || user?.planType) === 'Pro' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {barbershopData?.planType || user?.planType || 'Free'}
                  </span>
                  <p className="text-sm text-text-muted">Seu plano de assinatura</p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col items-center space-y-2">
                  <p className="font-medium text-primary-dark">Data de Criação</p>
                  <p className="text-lg font-semibold text-text-secondary">
                    {(barbershopData?.createdAt || (barbershopData as any)?.created_at)
                      ? new Date(barbershopData?.createdAt || (barbershopData as any)?.created_at).toLocaleDateString('pt-BR')
                      : 'Não disponível'
                    }
                  </p>
                  <p className="text-sm text-text-muted">Quando sua conta foi criada</p>
                </div>
              </div>
            </div>
            </div>
          </Card>

        {/* Área de Perigo */}
        <Card className="bg-red-50 border border-red-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-800">Área de Perigo</h2>
            </div>

            <div className="space-y-6">
              {/* Cancelar Assinatura Pro -> Free */}
              {user?.planType === 'Pro' && user?.subscriptionId && user.subscriptionId.trim() !== '' && (
                <div>
                  <h3 className="font-medium text-red-800 mb-2">Cancelar Assinatura Pro</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Cancelar sua assinatura Pro e voltar para o plano Free. Você manterá sua conta, 
                    mas perderá acesso às funcionalidades premium.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelSubscriptionModal(true)}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Plano Free
                  </Button>
                </div>
              )}

              {/* Deletar Conta */}
              <div>
                <h3 className="font-medium text-red-800 mb-2">Deletar Conta</h3>
                <p className="text-sm text-red-600 mb-4">
                  <strong>ATENÇÃO:</strong> Esta ação é irreversível! Todos os seus dados, agendamentos, 
                  barbeiros e histórico serão permanentemente excluídos. Sua conta será completamente removida.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar Conta Permanentemente
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Cancelamento de Assinatura Pro -> Free */}
      <Modal
        open={showCancelSubscriptionModal}
        title="Cancelar Assinatura Pro"
        onClose={() => setShowCancelSubscriptionModal(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCancelSubscriptionModal(false)}>
              Manter Pro
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCancelSubscription}
              className="bg-yellow-600 hover:bg-yellow-700 border-yellow-600"
              disabled={loading}
            >
              Voltar para Free
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Cancelar Assinatura Pro</p>
              <p className="text-sm text-yellow-600">
                Sua conta voltará para o plano Free com limitações.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-primary-dark">O que acontecerá após o cancelamento:</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Sua conta voltará para o plano Free</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Máximo de 1 barbeiro (excesso será desativado)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Máximo de 4 serviços (excesso será desativado)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Dashboard ficará indisponível</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Seus dados e agendamentos serão mantidos</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Você pode reativar a qualquer momento:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Faça upgrade novamente quando quiser</li>
              <li>• Todos os seus dados serão restaurados</li>
              <li>• Entre em contato para condições especiais</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-text-muted">
              Tem certeza de que deseja cancelar sua assinatura Pro?
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de Deletar Conta */}
      <Modal
        open={showDeleteAccountModal}
        title="Deletar Conta Permanentemente"
        onClose={() => setShowDeleteAccountModal(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowDeleteAccountModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 border-red-600"
              disabled={loading}
            >
              Deletar Permanentemente
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!</p>
              <p className="text-sm text-red-600">
                Toda sua conta e dados serão permanentemente excluídos.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-primary-dark">O que será deletado permanentemente:</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              {user?.planType === 'Pro' && user?.subscriptionId && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span><strong>Assinatura Pro será cancelada automaticamente</strong></span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Sua conta e perfil da barbearia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Todos os barbeiros cadastrados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Todos os serviços e preços</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Histórico completo de agendamentos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Horários de funcionamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Configurações e preferências</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-red-100 rounded-lg border-l-4 border-red-500">
            <h4 className="font-medium text-red-800 mb-2">🚨 IMPORTANTE:</h4>
            <ul className="space-y-1 text-sm text-red-700">
              <li>• Esta ação NÃO pode ser desfeita</li>
              <li>• Não há backup ou recuperação possível</li>
              <li>• Você precisará criar uma nova conta do zero</li>
              {user?.planType === 'Pro' && user?.subscriptionId && (
                <li>• <strong>Sua assinatura Pro será cancelada antes da exclusão</strong></li>
              )}
              <li>• Todas as cobranças futuras serão canceladas</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-text-muted font-medium">
              Tem absoluta certeza de que deseja deletar permanentemente sua conta?
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal do WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};

export default ConfiguracoesPage;
