import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { Calendar, Users, Settings, Plus, MessageCircle, MessageCircleOff, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { barbershopService } from '../services/realApiService';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import type { Agendamento, Servico, Barbeiro } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Hook do WhatsApp
  const { whatsappStatus } = useWhatsApp();
  
  // Verificar se é plano Free (Dashboard indisponível)
  const isFreeplan = user?.planType === 'Free';
  
  // Estados para dados reais da API
  const [topService, setTopService] = useState<{ name: string; count: number; percentage: number } | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Agendamento[]>([]);
  const [barbersMap, setBarbersMap] = useState<{ [key: string]: Barbeiro }>({});
  const [servicesMap, setServicesMap] = useState<{ [key: string]: Servico }>({});
  const [loading, setLoading] = useState(true);



  // Função para buscar todos os agendamentos da barbearia
  const fetchAllAppointments = async (): Promise<Agendamento[]> => {
    try {
      if (!user?.idBarbershop) {
        console.log('❌ Dashboard: ID da barbearia não encontrado');
        return [];
      }
      
      console.log('🔍 Dashboard: Buscando agendamentos da barbearia:', user.idBarbershop);
      
      // Usar rota específica da barbearia
      const response = await barbershopService.getAppointments(user.idBarbershop);
      
      console.log('📊 Dashboard: Agendamentos recebidos:', response);
      
      // Mapear para o formato esperado pelo frontend
      const appointments = response.map((apt: any) => ({
        idAppointment: (apt as any).id || (apt as any).idAppointment || '',
        idBarbershop: (apt as any).idBarbershop || user.idBarbershop,
        idBarber: (apt as any).idBarber || '',
        idProduct: (apt as any).idProduct || '',
        clientName: (apt as any).clientName,
        clientPhone: (apt as any).clientPhone,
        createdAt: (apt as any).createdAt || '',
        updatedAt: (apt as any).updatedAt || '',
        startOfSchedule: (apt as any).startOfSchedule,
        status: (apt as any).status || 'Agendado',
      }));
      
      console.log('📋 Dashboard: Agendamentos formatados:', appointments);
      return appointments;
    } catch (error) {
      console.error('❌ Dashboard: Erro ao buscar agendamentos:', error);
      return [];
    }
  };

  // Função para buscar serviço mais popular
  const fetchTopService = async (servicesMapping: { [key: string]: Servico }) => {
    try {
      console.log('🎯 Dashboard: Buscando top serviço...');
      
      // Buscar agendamentos dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      console.log('📅 Dashboard: Filtro 7 dias atrás:', sevenDaysAgo);
      
      const allAppointments = await fetchAllAppointments();
      console.log('📊 Dashboard: Total de agendamentos:', allAppointments.length);
      
      const recentAppointments = allAppointments.filter(apt => {
        if (!apt.createdAt) return false;
        const aptDate = new Date(apt.createdAt);
        return aptDate >= sevenDaysAgo;
      });
      console.log('📅 Dashboard: Agendamentos dos últimos 7 dias:', recentAppointments.length);

      // Contar serviços
      const serviceCounts: { [key: string]: number } = {};
      recentAppointments.forEach(apt => {
        serviceCounts[apt.idProduct] = (serviceCounts[apt.idProduct] || 0) + 1;
      });
      console.log('🔢 Dashboard: Contagem de serviços:', serviceCounts);

      // Encontrar o mais popular
      const topServiceId = Object.keys(serviceCounts).reduce((a, b) => 
        serviceCounts[a] > serviceCounts[b] ? a : b, ''
      );
      console.log('🏆 Dashboard: Top service ID:', topServiceId);

      if (topServiceId && serviceCounts[topServiceId] > 0) {
        const service = servicesMapping[topServiceId];
        const count = serviceCounts[topServiceId];
        const total = recentAppointments.length;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        console.log('✅ Dashboard: Top service encontrado:', { service, count, total, percentage });

        setTopService({
          name: service?.name || 'Serviço',
          count,
          percentage
        });
      } else {
        // Nenhum agendamento encontrado
        console.log('❌ Dashboard: Nenhum agendamento nos últimos 7 dias');
        setTopService(null);
      }
    } catch (error) {
      console.error('❌ Dashboard: Erro ao buscar top serviço:', error);
      setTopService(null);
    }
  };

  // Função para buscar próximos agendamentos
  const fetchUpcomingAppointments = async () => {
    try {
      const allAppointments = await fetchAllAppointments();
      
      // Filtrar agendamentos futuros e ordenar por data
      const upcoming = allAppointments
        .filter(apt => {
          if (!apt.startOfSchedule) return false;
          const aptDate = new Date(apt.startOfSchedule);
          return aptDate > new Date();
        })
        .sort((a, b) => {
          const dateA = new Date(a.startOfSchedule || 0);
          const dateB = new Date(b.startOfSchedule || 0);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 6); // Pegar apenas os próximos 6

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Erro ao buscar próximos agendamentos:', error);
      setUpcomingAppointments([]);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.idBarbershop) {
        console.log('❌ Dashboard: User ou idBarbershop não encontrado');
        return;
      }
      
      // Não carregar dados se for plano Free
      if (isFreeplan) {
        console.log('🔒 Dashboard: Acesso restrito para plano Free');
        setLoading(false);
        return;
      }
      
      console.log('🚀 Dashboard: Iniciando carregamento dos dados...');
      setLoading(true);
      
      try {
        // Primeiro carregar barbeiros e serviços da barbearia específica
        console.log('📞 Dashboard: Buscando barbeiros e serviços...');
        const [barbers, services] = await Promise.all([
          barbershopService.getBarbers(user.idBarbershop),
          barbershopService.getServices(user.idBarbershop)
        ]);

        console.log('👨‍💼 Dashboard: Barbeiros recebidos:', barbers);
        console.log('✂️ Dashboard: Serviços recebidos:', services);

        const barbersMapping: { [key: string]: Barbeiro } = {};
        barbers.forEach((barber: any) => {
          const formattedBarber: Barbeiro = {
            idBarber: (barber as any).id || (barber as any).idBarber,
            name: (barber as any).name,
            phone: (barber as any).phone,
          };
          barbersMapping[formattedBarber.idBarber] = formattedBarber;
        });

        const servicesMapping: { [key: string]: Servico } = {};
        services.forEach((service: any) => {
          const formattedService: Servico = {
            idProduct: (service as any).id || (service as any).idProduct,
            idBarber: (service as any).idBarber,
            name: (service as any).name,
            price: (service as any).price,
            desc: (service as any).desc,
            duration: (service as any).duration || 30,
          };
          servicesMapping[formattedService.idProduct] = formattedService;
        });

        console.log('🗺️ Dashboard: Mapeamento barbeiros:', barbersMapping);
        console.log('🗺️ Dashboard: Mapeamento serviços:', servicesMapping);

        setBarbersMap(barbersMapping);
        setServicesMap(servicesMapping);

        // Depois carregar dados que dependem dos mapeamentos
        await fetchTopService(servicesMapping);
        await fetchUpcomingAppointments();

      } catch (error) {
        console.error('❌ Dashboard: Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
        console.log('✅ Dashboard: Carregamento finalizado');
      }
    };

    loadDashboardData();
  }, [user?.idBarbershop, isFreeplan]);

  // Status do WhatsApp já é gerenciado pelo hook useWhatsAppConnection

  // Tela de upgrade para plano Free
  if (isFreeplan) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/src/assets/background-simples.png')",
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="max-w-4xl mx-auto p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary-light">Dashboard</h1>
            <p className="text-text-secondary mt-2">Visão geral do seu negócio</p>
          </header>

          <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="max-w-md mx-auto text-center p-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary-dark mb-2">Dashboard Indisponível</h3>
                <p className="text-text-secondary">
                  O Dashboard com métricas avançadas está disponível apenas no Plano Pro.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Plano Pro inclui:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Dashboard com métricas em tempo real</li>
                    <li>• Relatórios de performance</li>
                    <li>• Análise de serviços populares</li>
                    <li>• Barbeiros e serviços ilimitados</li>
                    <li>• Agendamentos ilimitados</li>
                  </ul>
                </div>
                
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => navigate('/upgrade')}
                >
                  Fazer Upgrade para Pro
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/agenda')}
                >
                  Ir para Agenda
                </Button>
              </div>
            </Card>
          </div>
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
            <h1 className="text-3xl font-bold text-primary-light">Dashboard</h1>
          </div>
        </div>

        {/* Ações Rápidas */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => navigate('/agenda')}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border-2 border-transparent hover:border-blue-200"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-primary-dark">Nova Agenda</p>
                <p className="text-xs text-text-secondary">Agendar cliente</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/servicos')}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border-2 border-transparent hover:border-green-200"
            >
              <Plus className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-primary-dark">Novo Serviço</p>
                <p className="text-xs text-text-secondary">Cadastrar serviço</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/barbeiros')}
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border-2 border-transparent hover:border-purple-200"
            >
              <Users className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-primary-dark">Barbeiros</p>
                <p className="text-xs text-text-secondary">Gerenciar equipe</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/configuracoes')}
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border-2 border-transparent hover:border-orange-200"
            >
              <Settings className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-primary-dark">Configurações</p>
                <p className="text-xs text-text-secondary">Ajustar sistema</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Layout Principal: Próximos Agendamentos + Top Serviço */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Próximos Agendamentos - Lado Esquerdo */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-dark">Próximos Agendamentos</h2>
              <button
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <span className="text-xs font-medium text-blue-700">Ver Todos</span>
                <ExternalLink className="w-3 h-3 text-blue-700" />
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-6 text-text-secondary">Carregando...</div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.slice(0, 4).map((appointment) => {
                  const appointmentDate = new Date(appointment.startOfSchedule || '');
                  const timeStr = appointmentDate.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const barber = barbersMap[appointment.idBarber];
                  const service = servicesMap[appointment.idProduct];
                  
                  const statusColor = appointment.status === 'Confirmado' ? 'bg-green-500' :
                                    appointment.status === 'Agendado' ? 'bg-blue-500' :
                                    appointment.status === 'Cancelado' ? 'bg-red-500' : 'bg-gray-500';

                  return (
                    <div key={appointment.idAppointment} 
                         className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                         onClick={() => navigate('/agenda')}>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">{timeStr}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-dark truncate">
                          {appointment.clientName || 'Cliente'}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {service?.name || 'Serviço'} • {barber?.name || 'Barbeiro'}
                        </p>
                      </div>
                      <div className={`w-2 h-2 ${statusColor} rounded-full flex-shrink-0`}></div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-text-secondary">
                  Nenhum agendamento próximo
                </div>
              )}
            </div>
          </Card>

          {/* Top Serviço - Lado Direito */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-primary-dark">Top Serviço</h2>
                  <p className="text-sm text-text-secondary">Últimos 7 dias</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/agenda')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver agenda completa"
              >
                <ExternalLink className="w-4 h-4 text-text-secondary hover:text-primary-dark" />
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-text-secondary">Carregando...</div>
            ) : topService ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary-dark">{topService.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{topService.count} agendamentos realizados</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Popularidade</span>
                    <span className="font-semibold text-primary-dark">{topService.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${topService.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                Sem dados disponíveis
              </div>
            )}
          </Card>
        </div>

        {/* Status do WhatsApp - Card destacado */}
        <div className="flex justify-center">
          <Card className={`p-4 border-2 ${
            whatsappStatus.status === 'connected' ? 'border-green-200 bg-green-50' : 
            whatsappStatus.status === 'disconnected' ? 'border-red-200 bg-red-50' : 
            'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center justify-center gap-3">
              {whatsappStatus.status === 'connecting' ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
              ) : whatsappStatus.status === 'connected' ? (
                <MessageCircle className="w-5 h-5 text-green-600" />
              ) : (
                <MessageCircleOff className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                whatsappStatus.status === 'connected' ? 'text-green-700' : 
                whatsappStatus.status === 'disconnected' ? 'text-red-700' : 
                'text-yellow-700'
              }`}>
                WhatsApp {whatsappStatus.status === 'connecting' ? 'Conectando...' : 
                         whatsappStatus.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </Card>
        </div>


      </div>
    </div>
  );
};

export default DashboardPage;

