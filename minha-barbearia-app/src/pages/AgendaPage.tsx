// src/pages/AgendaPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Input } from '../components/ui';
import type { Barbeiro, Servico, StatusAgendamento } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { barbershopService, appointmentService } from '../services/realApiService';
import type { Agendamento } from '../types';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

const AgendaPage: React.FC = () => {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [services, setServices] = useState<Servico[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');

  // Modal de evento
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState<null | {
    id?: string;
    title: string;
    start: string;
    end?: string;
    barberName?: string;
    serviceName?: string;
    clientName?: string;
    clientPhone?: string;
    barberId?: string;
    serviceId?: string;
  }>(null);

  // Modal de criação
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBarberId, setNewBarberId] = useState<string>('');
  const [newServiceId, setNewServiceId] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(''); // yyyy-mm-dd
  const [newTime, setNewTime] = useState<string>(''); // HH:mm
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('Agendado');

  // Função para converter data/hora local para timestamp com timezone Brasil
  const toTimestampBR = (date: string, time: string): string => {
    // Criar data/hora local (já considera o timezone do browser)
    const dateTime = new Date(`${date}T${time}:00`);
    // Retornar ISO string (já vai estar no timezone correto)
    return dateTime.toISOString();
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.idBarbershop) {
          // Carregar barbeiros da barbearia
          const apiBarbers = await barbershopService.getBarbers(user.idBarbershop);
          const formatted: Barbeiro[] = apiBarbers.map((b: any) => ({
            idBarber: b.id || b.idBarber || '',
            name: b.name,
            phone: b.phone,
          }));
          setBarbers(formatted);

          // Carregar serviços da barbearia
          const apiServices = await barbershopService.getServices(user.idBarbershop);
          const formattedServices: Servico[] = apiServices.map((s: any) => ({
            idProduct: s.id || s.idProduct || '',
            idBarber: s.idBarber,
            name: s.name,
            price: s.price,
            desc: s.desc,
            duration: s.duration,
          }));
          setServices(formattedServices);
        } else {
          setBarbers([]);
          setServices([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setBarbers([]);
        setServices([]);
      }
    };
    load();
  }, [user?.idBarbershop]);

  // Carregar agendamentos da API
  useEffect(() => {
    const loadAppointments = async () => {
      if (!barbers.length || !services.length) return;
      
      try {
        // Buscar agendamentos de todos os barbeiros da barbearia
        const allAppointments: Agendamento[] = [];
        
        for (const barber of barbers) {
          try {
            const barberAppointments = await appointmentService.getByBarber(barber.idBarber);
            
            // Verificar se é um array válido
            if (!Array.isArray(barberAppointments)) {
              console.warn(`API retornou dados inválidos para barbeiro ${barber.name}:`, barberAppointments);
              continue;
            }

            const formatted = barberAppointments.map((a: any) => ({
              idAppointment: a.id || a.idAppointment || '',
              idBarbershop: a.idBarbershop,
              idBarber: a.idBarber,
              idProduct: a.idProduct,
              clientName: a.clientName || '',
              clientPhone: a.clientPhone || '',
              createdAt: a.createdAt || new Date().toISOString(),
              updatedAt: a.updatedAt || new Date().toISOString(),
              startOfSchedule: a.startOfSchedule, // Campo correto para data/hora do agendamento
              status: (a.status === 'completed' ? 'Concluido' : 
                     a.status === 'cancelled' ? 'Cancelado' : 'Agendado') as StatusAgendamento,
            }));
            allAppointments.push(...formatted);
          } catch (error) {
            console.error(`Erro ao carregar agendamentos do barbeiro ${barber.name}:`, error);
          }
        }

        // Converter para eventos do calendário
        const asEvents = allAppointments.map((a) => {
          const svc = services.find(s => s.idProduct === a.idProduct);
          const b = barbers.find(x => x.idBarber === a.idBarber);
          const title = `${a.clientName || 'Cliente'} · ${svc?.name || 'Atendimento'}`;
          return {
            id: a.idAppointment,
            title,
            start: a.startOfSchedule || a.createdAt, // Usar startOfSchedule (data/hora do agendamento) em vez de createdAt
            extendedProps: {
              barberId: a.idBarber,
              barberName: b?.name,
              serviceId: a.idProduct,
              serviceName: svc?.name,
              clientName: a.clientName,
              clientPhone: a.clientPhone,
              status: a.status,
            },
          };
        });
        setEvents(asEvents);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        setEvents([]);
      }
    };

    loadAppointments();
  }, [barbers, services]);

  // Criar um novo agendamento ao selecionar um slot (sem edição via drag)
  const handleSelect = (selInfo: any) => {
    // Pré-preenche modal de criação com horário selecionado
    const dt = new Date(selInfo.startStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    setNewDate(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
    setNewTime(`${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
    const defaultBarber = selectedBarberId || barbers[0]?.idBarber || '';
    setNewBarberId(defaultBarber);
    const firstService = services.find(s => s.idBarber === defaultBarber);
    setNewServiceId(firstService?.idProduct || '');
    setNewClientName('');
    setNewClientPhone('');
    setCreateModalOpen(true);
  };

  // Abrir card ao clicar (com opção de cancelar)
  const handleEventClick = (info: any) => {
    const ev = info.event;
    const id = ev.id as string | undefined;
    setEventDetails({
      id,
      title: ev.title,
      start: ev.start?.toISOString() || '',
      end: ev.end?.toISOString(),
      barberName: ev.extendedProps?.barberName,
      serviceName: ev.extendedProps?.serviceName,
      clientName: ev.extendedProps?.clientName,
      clientPhone: ev.extendedProps?.clientPhone,
      barberId: ev.extendedProps?.barberId,
      serviceId: ev.extendedProps?.serviceId,
    });
    setEventModalOpen(true);
  };

  const handleCreateSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!newBarberId || !newServiceId || !newDate || !newTime || !user?.idBarbershop) return;
    
    try {
      const startOfSchedule = toTimestampBR(newDate, newTime);
      
      const created = await appointmentService.create({
        idBarbershop: user.idBarbershop,
        idBarber: newBarberId,
        idProduct: newServiceId,
        clientName: newClientName || 'Cliente',
        clientPhone: newClientPhone || '',
        startOfSchedule,
        status: 'Agendado',
      });

      // Atualizar a lista de eventos
      const svc = services.find(s => s.idProduct === newServiceId);
      const barber = barbers.find(b => b.idBarber === newBarberId);
      const newEvent = {
        id: created.id || `appt-${Date.now()}`,
        title: `${newClientName || 'Cliente'} · ${svc?.name || 'Atendimento'}`,
        start: startOfSchedule,
        extendedProps: {
          barberId: newBarberId,
          barberName: barber?.name,
          serviceId: newServiceId,
          serviceName: svc?.name,
          clientName: newClientName || 'Cliente',
          clientPhone: newClientPhone || '',
          status: 'Agendado',
        },
      };

      setEvents(prev => [...prev, newEvent]);
      setCreateModalOpen(false);
      
      // Limpar formulário
      setNewClientName('');
      setNewClientPhone('');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!eventDetails?.id) {
      setEventModalOpen(false);
      return;
    }
    
    try {
      await appointmentService.delete(eventDetails.id);
      setEvents(prev => prev.filter(ev => ev.id !== eventDetails.id));
      setEventModalOpen(false);
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      alert('Erro ao cancelar agendamento. Tente novamente.');
    }
  };

  const handleEditAppointment = () => {
    if (!eventDetails?.id) return;
    
    setEditingId(eventDetails.id);
    setEditClientName(eventDetails.clientName || '');
    setEditClientPhone(eventDetails.clientPhone || '');
    
    // Extrair horário do start date
    const startDate = new Date(eventDetails.start);
    const timeString = startDate.toTimeString().slice(0, 5); // HH:mm
    setEditTime(timeString);
    
    setEditStatus((eventDetails as any).extendedProps?.status || 'Agendado');
    setEventModalOpen(false);
    setEditModalOpen(true);
  };

  const handleEditSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    
    try {
      // Para edição, precisamos enviar o timestamp completo, não apenas HH:mm
      let startOfSchedule = undefined;
      if (editTime && eventDetails?.start) {
        // Extrair a data do agendamento original e combinar com o novo horário
        const originalDate = new Date(eventDetails.start);
        const [hours, minutes] = editTime.split(':');
        const newDateTime = new Date(originalDate);
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        startOfSchedule = newDateTime.toISOString();
      }

      await appointmentService.update(editingId, {
        clientName: editClientName || undefined,
        clientPhone: editClientPhone || undefined,
        startOfSchedule,
        status: editStatus,
      });

      // Atualizar o evento na lista
      setEvents(prev => prev.map(event => {
        if (event.id === editingId) {
          return {
            ...event,
            title: `${editClientName || 'Cliente'} · ${event.extendedProps?.serviceName || 'Atendimento'}`,
            start: startOfSchedule || event.start, // Atualizar horário se foi alterado
            extendedProps: {
              ...event.extendedProps,
              clientName: editClientName,
              clientPhone: editClientPhone,
              status: editStatus,
            },
          };
        }
        return event;
      }));
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
      alert('Erro ao editar agendamento. Tente novamente.');
    }
  };

  const gotoToday = () => calendarRef.current?.getApi().today();
  const gotoPrev = () => calendarRef.current?.getApi().prev();
  const gotoNext = () => calendarRef.current?.getApi().next();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-primary-light">
              Agenda ({
                calendarView === 'dayGridMonth' ? 'Mensal' :
                calendarView === 'timeGridWeek' ? 'Semanal' :
                'Diário'
              })
            </h1>
          </div>
          <div className="flex items-end gap-4">
            <div>
              
              <select
                id="barber"
                value={selectedBarberId}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedBarberId(newValue);
                  // Força re-renderização do calendário
                  setTimeout(() => {
                    calendarRef.current?.getApi().refetchEvents();
                  }, 100);
                }}
                className="w-56 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white"
              >
                <option value="">Geral</option>
                {barbers.map(b => (
                  <option key={b.idBarber} value={b.idBarber}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={gotoToday}>Hoje</Button>
              <Button variant="outline" onClick={gotoPrev}>‹</Button>
              <Button variant="outline" onClick={gotoNext}>›</Button>
            </div>
            <Button variant="primary" onClick={() => {
              // abrir modal de criação em branco
              setNewBarberId(selectedBarberId || barbers[0]?.idBarber || '');
              const firstService = services.find(s => s.idBarber === (selectedBarberId || barbers[0]?.idBarber));
              setNewServiceId(firstService?.idProduct || '');
              const now = new Date();
              const pad = (n: number) => String(n).padStart(2, '0');
              setNewDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
              setNewTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
              setNewClientName('');
              setNewClientPhone('');
              setCreateModalOpen(true);
            }}>Novo agendamento</Button>
          </div>
        </div>

        {/* FullCalendar (protótipo) */}
        <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          <FullCalendar
            key={`calendar-${selectedBarberId || 'all'}-${calendarView}`}
            ref={calendarRef as any}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView={calendarView}
            locales={[ptBrLocale]}
            locale="pt-br"
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            height="70vh"
            headerToolbar={false}
            nowIndicator={true}
            selectable={true}
            selectMirror={true}
            editable={false}
            weekends={true}
            events={useMemo(() => {
              if (!selectedBarberId || selectedBarberId === '') {
                return events;
              }
              
              return events.filter(ev => {
                const barberId = ev.extendedProps?.barberId;
                return barberId === selectedBarberId;
              });
            }, [events, selectedBarberId])}
            select={handleSelect}
            eventClick={handleEventClick}
          />
        </div>

        {/* Seletor de visualização */}
        <div className="flex justify-center">
          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-sm font-medium text-text-secondary">Visualização:</span>
              <div className="flex gap-2">
                <Button
                  variant={calendarView === 'dayGridMonth' ? 'primary' : 'outline'}
                  onClick={() => {
                    setCalendarView('dayGridMonth');
                    calendarRef.current?.getApi().changeView('dayGridMonth');
                  }}
                  className="px-4 py-2"
                >
                  Mensal
                </Button>
                <Button
                  variant={calendarView === 'timeGridWeek' ? 'primary' : 'outline'}
                  onClick={() => {
                    setCalendarView('timeGridWeek');
                    calendarRef.current?.getApi().changeView('timeGridWeek');
                  }}
                  className="px-4 py-2"
                >
                  Semanal
                </Button>
                <Button
                  variant={calendarView === 'timeGridDay' ? 'primary' : 'outline'}
                  onClick={() => {
                    setCalendarView('timeGridDay');
                    calendarRef.current?.getApi().changeView('timeGridDay');
                  }}
                  className="px-4 py-2"
                >
                  Diário
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Modal de detalhes do agendamento */}
    <Modal
      open={eventModalOpen}
      title="Detalhes do agendamento"
      onClose={() => setEventModalOpen(false)}
      footer={(
        <>
          <Button variant="danger" onClick={handleCancelAppointment}>Cancelar agendamento</Button>
          <Button variant="primary" onClick={handleEditAppointment}>Editar</Button>
          <Button variant="outline" onClick={() => setEventModalOpen(false)}>Fechar</Button>
        </>
      )}
    >
      {eventDetails ? (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-text-secondary">Produto:</span> {eventDetails?.serviceName || '—'}
          </div>
          <div>
            <span className="font-medium text-text-secondary">Barbeiro:</span> {eventDetails?.barberName || '—'}
          </div>
          <div>
            <span className="font-medium text-text-secondary">Dia/Hora:</span> {new Date(eventDetails?.start || '').toLocaleString('pt-BR')}
          </div>
          <div>
            <span className="font-medium text-text-secondary">Cliente:</span> {eventDetails?.clientName || '—'}
          </div>
          <div>
            <span className="font-medium text-text-secondary">Telefone:</span> {eventDetails?.clientPhone || '—'}
          </div>
        </div>
      ) : null}
    </Modal>

    {/* Modal de criação */}
    <Modal
      open={createModalOpen}
      title="Novo agendamento"
      onClose={() => setCreateModalOpen(false)}
      footer={(
        <>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => (document.getElementById('create-appt-form') as HTMLFormElement)?.requestSubmit()}>Salvar</Button>
        </>
      )}
    >
      <form id="create-appt-form" className="space-y-4" onSubmit={handleCreateSubmit}>
        <div>
          <label htmlFor="cb-barber" className="block text-sm font-medium text-text-secondary mb-1">Barbeiro</label>
          <select id="cb-barber" value={newBarberId} onChange={(e) => {
            setNewBarberId(e.target.value);
            const first = services.find(s => s.idBarber === e.target.value);
            setNewServiceId(first?.idProduct || '');
          }} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white">
            {barbers.map(b => (
              <option key={b.idBarber} value={b.idBarber}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cb-service" className="block text-sm font-medium text-text-secondary mb-1">Serviço</label>
          <select id="cb-service" value={newServiceId} onChange={(e) => setNewServiceId(e.target.value)} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white">
            {services.filter(s => s.idBarber === newBarberId).map(s => (
              <option key={s.idProduct} value={s.idProduct}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Data" type="date" value={newDate} onChange={setNewDate} id="cb-date" required />
          <Input label="Hora" type="time" value={newTime} onChange={setNewTime} id="cb-time" required />
        </div>

        <Input label="Nome do cliente" value={newClientName} onChange={setNewClientName} id="cb-client" />
        <Input label="Telefone do cliente" value={newClientPhone} onChange={setNewClientPhone} id="cb-phone" />
      </form>
    </Modal>

    {/* Modal de edição */}
    <Modal
      open={editModalOpen}
      title="Editar agendamento"
      onClose={() => setEditModalOpen(false)}
      footer={(
        <>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => (document.getElementById('edit-appt-form') as HTMLFormElement)?.requestSubmit()}>Salvar</Button>
        </>
      )}
    >
      <form id="edit-appt-form" className="space-y-4" onSubmit={handleEditSubmit}>
        <Input label="Nome do cliente" value={editClientName} onChange={setEditClientName} id="edit-client" />
        <Input label="Telefone do cliente" value={editClientPhone} onChange={setEditClientPhone} id="edit-phone" />
        <Input label="Horário" type="time" value={editTime} onChange={setEditTime} id="edit-time" />
        
        <div>
          <label htmlFor="edit-status" className="block text-sm font-medium text-text-secondary mb-1">Status</label>
          <select 
            id="edit-status" 
            value={editStatus} 
            onChange={(e) => setEditStatus(e.target.value)} 
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white"
          >
            <option value="Agendado">Agendado</option>
            <option value="Concluido">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </form>
    </Modal>
  </>
  );
};

export default AgendaPage;