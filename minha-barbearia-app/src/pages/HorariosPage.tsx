// src/pages/HorariosPage.tsx
import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Input } from '../components/ui';
import type { Barbeiro } from '../types';
import { barbershopService, scheduleService } from '../services/realApiService';
import { useAuth } from '../contexts/AuthContext';

// Interface para múltiplos períodos no mesmo dia
interface PeriodoTrabalho {
  id?: string;        // ID do horário na API
  horaInicio: string; // formato HH:mm para exibição
  horaFim: string;    // formato HH:mm para exibição
  ativo: boolean;
}

interface HorariosDia {
  diaSemana: string;
  periodos: PeriodoTrabalho[];
}

const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda-feira', apiDay: 'segunda-feira' },
  { key: 'terca', label: 'Terça-feira', apiDay: 'terça-feira' },
  { key: 'quarta', label: 'Quarta-feira', apiDay: 'quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira', apiDay: 'quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira', apiDay: 'sexta-feira' },
  { key: 'sabado', label: 'Sábado', apiDay: 'sábado' },
  { key: 'domingo', label: 'Domingo', apiDay: 'domingo' },
];

// Funções auxiliares para conversão de horários
const convertTimetzToHHMM = (timetz: string): string => {
  // Converter "13:33:22.591Z" ou "13:33:00+00" para "13:33"
  try {
    // Remover timezone e segundos/milissegundos
    const timeOnly = timetz.split('+')[0].split('Z')[0];
    const [hours, minutes] = timeOnly.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.warn('Erro ao converter timetz:', timetz, error);
    return '00:00';
  }
};

const convertHHMMToTimetz = (time: string): string => {
  // Converter "13:33" para "13:33:22.591Z" (formato ISO com Z)
  const [hours, minutes] = time.split(':');
  
  // Criar um formato de hora ISO com Z no final
  // Formato: "HH:MM:SS.sssZ"
  const isoTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:22.591Z`;
  
  console.log(`⚙️ Convertendo "${time}" → "${isoTime}"`);
  
  return isoTime;
};

const getApiDayName = (dayKey: string): string => {
  return DIAS_SEMANA.find(d => d.key === dayKey)?.apiDay || dayKey;
};

const HorariosPage: React.FC = () => {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [horarios, setHorarios] = useState<HorariosDia[]>([]);
  const [loading, setLoading] = useState(false); // Começar com false para debug
  
  // Debug: log quando o componente é montado
  console.log('🎯 HorariosPage renderizado!');
  
  // Teste das funções de conversão
  console.log('🧪 Teste de conversões (novo formato):');
  console.log('  "11:00" →', convertHHMMToTimetz('11:00'));
  console.log('  "15:30" →', convertHHMMToTimetz('15:30'));
  console.log('  "segunda" →', getApiDayName('segunda'));

  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDia, setEditingDia] = useState<string>('');
  const [editingPeriodoIndex, setEditingPeriodoIndex] = useState<number>(-1);
  const [modalHoraInicio, setModalHoraInicio] = useState('');
  const [modalHoraFim, setModalHoraFim] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Carregando dados de horários...');
        console.log('👤 Usuário:', user);
        
        // Inicializar horários vazios
        initializeEmptyHorarios();
        
        if (user?.idBarbershop) {
          try {
            // Carregar barbeiros da API
            const barbersFromApi = await barbershopService.getBarbers(user.idBarbershop);
            const barbeirosFormatted: Barbeiro[] = barbersFromApi.map((barber, index) => ({
              idBarber: (barber as any).id || (barber as any).idBarber || `temp-${index}`,
              name: (barber as any).name,
              phone: (barber as any).phone,
            }));
            
            if (barbeirosFormatted.length > 0) {
              setBarbers(barbeirosFormatted);
              setSelectedBarberId(barbeirosFormatted[0].idBarber);
              console.log('✅ Barbeiros carregados da API:', barbeirosFormatted);
              
              // Carregar horários do primeiro barbeiro
              await loadHorariosFromAPI(barbeirosFormatted[0].idBarber);
            } else {
              console.log('ℹ️ Nenhum barbeiro cadastrado');
              setBarbers([]);
              setSelectedBarberId('');
            }
          } catch (apiError) {
            console.error('❌ Erro ao carregar barbeiros:', apiError);
            setBarbers([]);
            setSelectedBarberId('');
          }
        } else {
          console.log('⚠️ Usuário não identificado');
          setBarbers([]);
          setSelectedBarberId('');
        }
        
      } catch (error) {
        console.error('❌ Erro geral ao carregar dados:', error);
        setBarbers([]);
        setSelectedBarberId('');
        initializeEmptyHorarios();
      } finally {
        setLoading(false);
        console.log('✅ Carregamento finalizado');
      }
    };

    loadData();
  }, [user?.idBarbershop]);

  // Função para inicializar horários vazios
  const initializeEmptyHorarios = () => {
    const horariosIniciais: HorariosDia[] = DIAS_SEMANA.map(dia => ({
      diaSemana: dia.key,
      periodos: []
    }));
    setHorarios(horariosIniciais);
  };

  // Função para carregar horários da API
  const loadHorariosFromAPI = async (barberId: string) => {
    try {
      console.log('📅 Carregando horários do barbeiro:', barberId);
      const apiSchedules = await scheduleService.getByBarber(barberId);
      console.log('✅ Horários recebidos da API:', apiSchedules);
      
      // Converter para formato da interface
      const horariosFormatted: HorariosDia[] = DIAS_SEMANA.map(dia => {
        const daySchedules = apiSchedules.filter(schedule => 
          schedule.day === dia.apiDay
        );
        
        const periodos: PeriodoTrabalho[] = daySchedules.map(schedule => {
          const periodo = {
            id: schedule.id,
            horaInicio: convertTimetzToHHMM(schedule.startHour),
            horaFim: convertTimetzToHHMM(schedule.endHour),
            ativo: true
          };
          console.log(`📅 Convertendo horário para ${dia.label}:`, {
            original: schedule,
            convertido: periodo
          });
          return periodo;
        });
        
        return {
          diaSemana: dia.key,
          periodos
        };
      });
      
      setHorarios(horariosFormatted);
      console.log('✅ Horários formatados:', horariosFormatted);
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
      initializeEmptyHorarios();
    }
  };

  // Buscar horários do barbeiro selecionado
  useEffect(() => {
    if (selectedBarberId) {
      console.log('🔄 Carregando horários para barbeiro:', selectedBarberId);
      loadHorariosFromAPI(selectedBarberId);
    }
  }, [selectedBarberId]);

  const getDiaLabel = (diaSemana: string) => {
    return DIAS_SEMANA.find(d => d.key === diaSemana)?.label || diaSemana;
  };

  const formatPeriodo = (periodo: PeriodoTrabalho) => {
    return `${periodo.horaInicio} - ${periodo.horaFim}`;
  };

  const getPeriodosDia = (diaSemana: string) => {
    return horarios.find(h => h.diaSemana === diaSemana)?.periodos || [];
  };

  const openAddPeriodo = (diaSemana: string) => {
    setEditingDia(diaSemana);
    setEditingPeriodoIndex(-1);
    setModalHoraInicio('');
    setModalHoraFim('');
    setModalOpen(true);
  };

  const openEditPeriodo = (diaSemana: string, periodoIndex: number) => {
    const periodo = getPeriodosDia(diaSemana)[periodoIndex];
    if (periodo) {
      setEditingDia(diaSemana);
      setEditingPeriodoIndex(periodoIndex);
      setModalHoraInicio(periodo.horaInicio);
      setModalHoraFim(periodo.horaFim);
      setModalOpen(true);
    }
  };

  const handleSavePeriodo = async () => {
    if (!modalHoraInicio || !modalHoraFim || !editingDia || !selectedBarberId) return;

    try {
      if (editingPeriodoIndex === -1) {
        // Criar novo período na API
        const startHourTimetz = convertHHMMToTimetz(modalHoraInicio);
        const endHourTimetz = convertHHMMToTimetz(modalHoraFim);
        const dayName = getApiDayName(editingDia);
        
        const apiData = {
          idBarber: selectedBarberId,
          startHour: startHourTimetz,
          endHour: endHourTimetz,
          day: dayName
        };
        
        console.log('🔍 Debug - Conversões:');
        console.log('  modalHoraInicio:', modalHoraInicio, '→', startHourTimetz);
        console.log('  modalHoraFim:', modalHoraFim, '→', endHourTimetz);
        console.log('  editingDia:', editingDia, '→', dayName);
        console.log('➕ Criando período com dados:', apiData);
        
        const createdSchedule = await scheduleService.create(apiData);
        console.log('✅ Período criado:', createdSchedule);
        
        // Atualizar estado local
        const novoPeriodo: PeriodoTrabalho = {
          id: createdSchedule.id,
          horaInicio: modalHoraInicio,
          horaFim: modalHoraFim,
          ativo: true
        };
        
        console.log('📝 Novo período criado com ID:', createdSchedule.id);

        setHorarios(prev => prev.map(horario => {
          if (horario.diaSemana === editingDia) {
            const novosPeriodos = [...horario.periodos, novoPeriodo];
            // Ordenar períodos por hora de início
            novosPeriodos.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
            return { ...horario, periodos: novosPeriodos };
          }
          return horario;
        }));
      } else {
        // Editar período existente - por enquanto não implementado na API
        console.warn('⚠️ Edição de período não implementada ainda');
        alert('Edição de períodos será implementada em breve. Por favor, delete e crie novamente.');
        setModalOpen(false);
        return;
      }

      setModalOpen(false);
    } catch (error) {
      console.error('❌ Erro ao salvar período:', error);
      alert('Erro ao salvar período. Tente novamente.');
    }
  };

  const handleRemovePeriodo = async (diaSemana: string, periodoIndex: number) => {
    const periodo = getPeriodosDia(diaSemana)[periodoIndex];
    
    console.log('🔍 Debug - Tentando remover período:');
    console.log('  Dia:', diaSemana);
    console.log('  Index:', periodoIndex);
    console.log('  Período:', periodo);
    console.log('  ID do período:', periodo?.id);
    
    if (!periodo?.id) {
      console.warn('⚠️ Período sem ID, removendo apenas localmente');
      setHorarios(prev => prev.map(horario => {
        if (horario.diaSemana === diaSemana) {
          const novosPeriodos = horario.periodos.filter((_, index) => index !== periodoIndex);
          return { ...horario, periodos: novosPeriodos };
        }
        return horario;
      }));
      return;
    }

    try {
      console.log('🗑️ Removendo período com ID:', periodo.id);
      console.log('🌐 Fazendo DELETE para:', `/api/barber-schedules/${periodo.id}`);
      
      await scheduleService.delete(periodo.id);
      console.log('✅ Período removido da API com sucesso');
      
      // Atualizar estado local
      setHorarios(prev => prev.map(horario => {
        if (horario.diaSemana === diaSemana) {
          const novosPeriodos = horario.periodos.filter((_, index) => index !== periodoIndex);
          console.log(`📝 Removido período do dia ${diaSemana}. Períodos restantes:`, novosPeriodos.length);
          return { ...horario, periodos: novosPeriodos };
        }
        return horario;
      }));
    } catch (error: any) {
      console.error('❌ Erro ao remover período:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      alert(`Erro ao remover período: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const togglePeriodoAtivo = (diaSemana: string, periodoIndex: number) => {
    setHorarios(prev => prev.map(horario => {
      if (horario.diaSemana === diaSemana) {
        const novosPeriodos = horario.periodos.map((periodo, index) => {
          if (index === periodoIndex) {
            return { ...periodo, ativo: !periodo.ativo };
          }
          return periodo;
        });
        return { ...horario, periodos: novosPeriodos };
      }
      return horario;
    }));
  };

  const copyHorarios = (diaOrigem: string, diaDestino: string) => {
    const periodosOrigem = getPeriodosDia(diaOrigem);
    setHorarios(prev => prev.map(horario => {
      if (horario.diaSemana === diaDestino) {
        return { ...horario, periodos: [...periodosOrigem] };
      }
      return horario;
    }));
  };



  console.log('🔍 Debug - Estados atuais:', {
    loading,
    barbers: barbers.length,
    selectedBarberId,
    horarios: horarios.length,
    user: !!user
  });

  if (loading) {
    console.log('⏳ Mostrando tela de loading...');
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/src/assets/background-simples.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundColor: 'hsl(var(--color-bg-primary))',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Carregando horários...</p>
        </div>
      </div>
    );
  }

  const selectedBarber = barbers.find(b => b.idBarber === selectedBarberId);
  console.log('👤 Barbeiro selecionado:', selectedBarber);

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/src/assets/background-simples.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundColor: 'hsl(var(--color-bg-primary))',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-primary-light">Horários de Trabalho</h1>
            </div>
            {barbers.length > 0 && (
              <div className="flex items-center gap-3">
                <div>
                  <select
                    id="barber-select"
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-56 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white"
                  >
                    {barbers.map(b => (
                      <option key={b.idBarber} value={b.idBarber}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {barbers.length === 0 && (
            <Card className="bg-bg-secondary text-text-secondary border border-border">
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium text-primary-dark mb-2">Nenhum barbeiro cadastrado</h3>
                <p className="text-text-muted mb-4">
                  É necessário ter barbeiros cadastrados para configurar horários de trabalho.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/barbeiros'}
                >
                  Cadastrar Barbeiros
                </Button>
              </div>
            </Card>
          )}

          {/* Grid de dias da semana */}
          {barbers.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {DIAS_SEMANA.map(dia => {
              const periodos = getPeriodosDia(dia.key);
              const temPeriodos = periodos.length > 0;
              
              return (
                <Card 
                  key={dia.key} 
                  className="bg-bg-secondary text-text-secondary border border-border"
                >
                  <div className="p-4 space-y-4">
                    {/* Cabeçalho do dia */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-primary-dark">{dia.label}</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openAddPeriodo(dia.key)}
                        >
                          + Período
                        </Button>
                      </div>
                    </div>

                    {/* Lista de períodos */}
                    <div className="space-y-2">
                      {temPeriodos ? (
                        periodos.map((periodo, index) => (
                          <div 
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              periodo.ativo 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => togglePeriodoAtivo(dia.key, index)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  periodo.ativo 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {periodo.ativo && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                              <span className="font-medium">{formatPeriodo(periodo)}</span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEditPeriodo(dia.key, index)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemovePeriodo(dia.key, index)}
                                className="p-1 text-red-400 hover:text-red-600 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-text-muted">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm">Dia de folga</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2"
                            onClick={() => openAddPeriodo(dia.key)}
                          >
                            Adicionar horário
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Ações rápidas */}
                    {temPeriodos && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                copyHorarios(dia.key, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs px-2 py-1 border rounded text-gray-600 bg-white"
                            defaultValue=""
                          >
                            <option value="">Copiar para...</option>
                            {DIAS_SEMANA.filter(d => d.key !== dia.key).map(d => (
                              <option key={d.key} value={d.key}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            </div>
          )}


        </div>
      </div>

      {/* Modal para adicionar/editar período */}
      <Modal
        open={modalOpen}
        title={editingPeriodoIndex === -1 ? 'Adicionar Período' : 'Editar Período'}
        onClose={() => setModalOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSavePeriodo}>
              {editingPeriodoIndex === -1 ? 'Adicionar' : 'Salvar'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-3">
              Configurando horário para <span className="font-medium">{getDiaLabel(editingDia)}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora de início"
              type="time"
              value={modalHoraInicio}
              onChange={setModalHoraInicio}
              required
            />
            <Input
              label="Hora de fim"
              type="time"
              value={modalHoraFim}
              onChange={setModalHoraFim}
              required
            />
          </div>

          {modalHoraInicio && modalHoraFim && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Duração:</span> {
                  (() => {
                    const [inicioHora, inicioMin] = modalHoraInicio.split(':').map(Number);
                    const [fimHora, fimMin] = modalHoraFim.split(':').map(Number);
                    const inicioMinutos = inicioHora * 60 + inicioMin;
                    const fimMinutos = fimHora * 60 + fimMin;
                    const duracao = fimMinutos - inicioMinutos;
                    const horas = Math.floor(duracao / 60);
                    const minutos = duracao % 60;
                    return `${horas}h ${minutos}min`;
                  })()
                }
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default HorariosPage;
