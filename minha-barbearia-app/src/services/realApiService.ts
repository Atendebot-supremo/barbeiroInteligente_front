// src/services/realApiService.ts
import api from './api';
import type { 
  Servico, 
  Agendamento, 
  Barbearia, 
  Barbeiro, 
  HorarioBarbeiro, 
  SlotDisponivel,
  StatusBarbearia,
  StatusAgendamento,
  BaseEntity
} from '../types';

// --- INTERFACES ESPECÍFICAS DA API (quando diferentes do frontend) ---
// Interface para dados da barbearia na API (inclui campos extras da API)
export interface BarbershopAPI extends Barbearia, BaseEntity {
  id?: string;           // API usa 'id', frontend usa 'idBarbershop'
  password?: string;     // Só usado na criação
  cnpj: string;         // Obrigatório na API
  instanceZapi?: string; // Configuração WhatsApp
}

// Interface para barbeiro na API (mapeamento de campos)
export interface BarberAPI extends Barbeiro, BaseEntity {
  id?: string;  // API usa 'id', frontend usa 'idBarber'
}

// Interface para produto/serviço na API
export interface ProductAPI extends Servico, BaseEntity {
  id?: string;  // API usa 'id', frontend usa 'idProduct'
}

// Interface para agendamento na API
export interface AppointmentAPI extends Agendamento {
  id?: string;  // API usa 'id', frontend usa 'idAppointment'
}

// --- AUTENTICAÇÃO ---
export const authApi = {
  login: async (email: string, password: string): Promise<{ token?: string; user: any }> => {
    // baseURL já inclui "/api"; então usamos caminho relativo "/auth/login"
    const response = await api.post('/auth/login', { email, password });
    const payload = response.data ?? {};
    
    console.log('🔍 Resposta completa da API de login:', response.data);
    
    // API esperada: { success: true, data: { token, barbershop: { ... } } }
    const envelope = payload.data ?? payload; // caso venha sem envelope
    const token = envelope.token || envelope.accessToken || envelope.jwt;
    const user = envelope.barbershop || envelope.user || envelope;
    
    console.log('📋 Token extraído:', token);
    console.log('👤 User extraído:', user);
    
    return { token, user };
  },
};

// --- SERVIÇO DE BARBEARIAS ---
export const barbershopService = {
  // Criar nova barbearia
  create: async (data: {
    barbershop: string;
    email: string;
    password: string;
    cnpj: string;
    phone: string;
    instanceZapi: string;
    status: StatusBarbearia;
    planType: string;
  }): Promise<any> => {
    const response = await api.post('/barbershop', data);
    return response.data;
  },

  // Listar todas as barbearias
  getAll: async (filters?: { search?: string; status?: string; cnpj?: string }): Promise<Barbearia[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.cnpj) params.append('cnpj', filters.cnpj);
    
    const response = await api.get(`/barbershop?${params.toString()}`);
    console.log('Barbershops API response:', response.data);
    
    // Verificar formato da resposta
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.barbershops)) {
      return response.data.barbershops;
    } else {
      console.warn('Formato de resposta inesperado para barbearias:', response.data);
      return [];
    }
  },

  // Buscar barbearia por ID
  getById: async (id: string): Promise<Barbearia> => {
    const response = await api.get(`/barbershop/${id}`);
    return response.data;
  },



  // Atualizar barbearia
  update: async (id: string, data: Partial<BarbershopAPI>): Promise<Barbearia> => {
    const response = await api.put(`/barbershop/${id}`, data);
    return response.data;
  },

  // Deletar barbearia
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barbershop/${id}`);
  },

  // Serviços (produtos) da barbearia logada
  getServices: async (barbershopId: string): Promise<Servico[]> => {
    const response = await api.get(`/barbershop/${barbershopId}/products`);
    const payload = response.data ?? {};
    const arr = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
    // Normaliza para o tipo Servico usado no app
    return (arr as any[]).map((p) => ({
      idProduct: p.idProduct || p.id || '',
      idBarber: p.idBarber,
      name: p.name,
      price: p.price,
      desc: p.desc ?? '',
      duration: p.duration ?? 30,
    }));
  },
  createService: async (barbershopId: string, data: Partial<ProductAPI>): Promise<ProductAPI> => {
    const response = await api.post(`/barbershop/${barbershopId}/services`, data);
    return response.data;
  },
  updateService: async (
    barbershopId: string,
    serviceId: string,
    data: Partial<ProductAPI>
  ): Promise<ProductAPI> => {
    const response = await api.put(`/barbershop/${barbershopId}/services/${serviceId}` , data);
    return response.data;
  },
  deleteService: async (barbershopId: string, serviceId: string): Promise<void> => {
    await api.delete(`/barbershop/${barbershopId}/services/${serviceId}`);
  },

  // Agendamentos da barbearia
  getAppointments: async (barbershopId: string): Promise<any[]> => {
    const response = await api.get(`/barbershop/${barbershopId}/appointments`);
    return response.data?.data || response.data || [];
  },

  // Barbeiros da barbearia
  getBarbers: async (barbershopId: string): Promise<Barbeiro[]> => {
    const response = await api.get(`/barbershop/${barbershopId}/barbers`);
    const data = response.data;
    if (Array.isArray(data)) return data as Barbeiro[];
    if (Array.isArray(data?.data)) return data.data as Barbeiro[];
    if (Array.isArray(data?.barbers)) return data.barbers as Barbeiro[];
    return [];
  },
  // Criação/edição/exclusão seguem endpoints globais
  // POST /barbers  { idBarbershop, name }
  createBarber: async (_barbershopId: string, data: Partial<BarberAPI>): Promise<Barbeiro> => {
    const payload = { ...data, idBarbershop: (data as any)?.idBarbershop || _barbershopId } as any;
    const response = await api.post(`/barbers`, payload);
    return response.data;
  },
  // PUT /barbers/{id}
  updateBarber: async (_barbershopId: string, barberId: string, data: Partial<BarberAPI>): Promise<Barbeiro> => {
    const response = await api.put(`/barbers/${barberId}`, data);
    return response.data;
  },
  // DELETE /barbers/{id}
  deleteBarber: async (_barbershopId: string, barberId: string): Promise<void> => {
    await api.delete(`/barbers/${barberId}`);
  },
};

// --- SERVIÇO DE BARBEIROS ---
export const barberService = {
  // Listar todos os barbeiros
  getAll: async (filters?: { search?: string }): Promise<Barbeiro[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/barbers?${params.toString()}`);
    console.log('Barbers API response:', response.data);
    
    // Verificar se a resposta é um array ou se está encapsulada em um objeto
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.barbers)) {
      return response.data.barbers;
    } else {
      console.warn('Formato de resposta inesperado para barbeiros:', response.data);
      return [];
    }
  },

  // Buscar barbeiro por ID
  getById: async (id: string): Promise<Barbeiro> => {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  // Criar novo barbeiro
  create: async (data: Partial<BarberAPI>): Promise<Barbeiro> => {
    const response = await api.post('/barbers', data);
    return response.data;
  },

  // Atualizar barbeiro
  update: async (id: string, data: Partial<BarberAPI>): Promise<Barbeiro> => {
    const response = await api.put(`/barbers/${id}`, data);
    return response.data;
  },

  // Deletar barbeiro
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barbers/${id}`);
  },
};

// --- SERVIÇO DE PRODUTOS/SERVIÇOS ---
export const productService = {
  // Listar todos os produtos
  getAll: async (filters?: { 
    search?: string; 
    idBarber?: string; 
    price_min?: number; 
    price_max?: number; 
  }): Promise<Servico[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.idBarber) params.append('idBarber', filters.idBarber);
    if (filters?.price_min) params.append('price_min', filters.price_min.toString());
    if (filters?.price_max) params.append('price_max', filters.price_max.toString());
    
    const response = await api.get(`/barber-products?${params.toString()}`);
    console.log('Products API response:', response.data);
    
    // Verificar formato da resposta
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.products)) {
      return response.data.products;
    } else {
      console.warn('Formato de resposta inesperado para produtos:', response.data);
      return [];
    }
  },

  // Buscar produto por ID
  getById: async (id: string): Promise<Servico> => {
    const response = await api.get(`/barber-products/${id}`);
    return response.data;
  },

  // Criar novo produto
  create: async (data: Partial<ProductAPI>): Promise<Servico> => {
    // API exige: { idBarber, name, price, desc, duration }
    const response = await api.post('/barber-products', data);
    return response.data;
  },

  // Atualizar produto
  update: async (id: string, data: Partial<ProductAPI>): Promise<Servico> => {
    const response = await api.put(`/barber-products/${id}`, data);
    return response.data;
  },

  // Deletar produto
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barber-products/${id}`);
  },
};

// --- SERVIÇO DE HORÁRIOS ---
export const scheduleService = {
  // Listar todos os horários
  getAll: async (): Promise<HorarioBarbeiro[]> => {
    const response = await api.get('/barber-schedules');
    console.log('📅 Resposta da API - getAll schedules:', response.data);
    
    // Verificar formato da resposta
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data.map((schedule: any) => ({
        id: schedule.idSchedule,        // ✅ Usar idSchedule da API
        idBarber: schedule.idBarber,
        startHour: schedule.startHour,
        endHour: schedule.endHour,
        day: schedule.day,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    } else if (Array.isArray(response.data)) {
      return response.data.map((schedule: any) => ({
        id: schedule.idSchedule || schedule.id,  // ✅ Garantir idSchedule
        idBarber: schedule.idBarber,
        startHour: schedule.startHour,
        endHour: schedule.endHour,
        day: schedule.day,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    } else {
      console.warn('Formato inesperado da resposta de horários:', response.data);
      return [];
    }
  },

  // Buscar horários por barbeiro
  getByBarber: async (barberId: string): Promise<HorarioBarbeiro[]> => {
    const allSchedules = await scheduleService.getAll();
    return allSchedules.filter(schedule => schedule.idBarber === barberId);
  },

  // Criar novo horário
  create: async (data: {
    idBarber: string;
    startHour: string; // formato ISO com timezone
    endHour: string;   // formato ISO com timezone
    day: string;       // nome do dia da semana
  }): Promise<HorarioBarbeiro> => {
    console.log('📅 Criando horário:', data);
    const response = await api.post('/barber-schedules', data);
    console.log('✅ Horário criado - resposta completa:', response.data);
    
    // Normalizar resposta para garantir que o ID está correto
    const schedule = response.data?.data || response.data;
    const normalizedSchedule = {
      id: schedule.idSchedule || schedule.id,  // ✅ Garantir idSchedule
      idBarber: schedule.idBarber,
      startHour: schedule.startHour,
      endHour: schedule.endHour,
      day: schedule.day,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
    
    console.log('✅ Horário normalizado:', normalizedSchedule);
    return normalizedSchedule;
  },

  // Deletar horário
  delete: async (id: string): Promise<void> => {
    console.log('🗑️ Deletando horário:', id);
    await api.delete(`/barber-schedules/${id}`);
    console.log('✅ Horário deletado');
  },

  // Buscar horário por ID
  getById: async (id: string): Promise<HorarioBarbeiro> => {
    const response = await api.get(`/barber-schedules/${id}`);
    return response.data;
  },

  // Atualizar horário
  update: async (id: string, data: Partial<HorarioBarbeiro>): Promise<HorarioBarbeiro> => {
    const response = await api.put(`/barber-schedules/${id}`, data);
    return response.data;
  },

  // Buscar slots disponíveis
  getAvailableSlots: async (barberId: string, date: string, day: string): Promise<SlotDisponivel[]> => {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('day', day);
    
    const response = await api.get(`/barber-schedules/available-slots/${barberId}?${params.toString()}`);
    return response.data;
  },

  // Buscar horários semanais do barbeiro
  getWeeklySchedule: async (barberId: string): Promise<HorarioBarbeiro[]> => {
    return await scheduleService.getByBarber(barberId);
  },
};

// --- SERVIÇO DE AGENDAMENTOS ---
export const appointmentService = {
  // Buscar agendamentos de um barbeiro específico
  getByBarber: async (barberId: string): Promise<Agendamento[]> => {
    const response = await api.get(`/barbers/${barberId}/appointments`);
    // A API pode retornar { data: [...] } ou diretamente [...]
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Buscar agendamento por ID
  getById: async (id: string): Promise<Agendamento> => {
    const response = await api.get(`/barber-appointments/${id}`);
    return response.data;
  },

  // Criar novo agendamento
  create: async (data: {
    idBarbershop: string;
    idBarber: string;
    idProduct: string;
    clientName: string;
    clientPhone: string;
    startOfSchedule: string; // timestamp em formato ISO com timezone Brasil
    status: StatusAgendamento;
  }): Promise<Agendamento> => {
    const response = await api.post('/barber-appointments', data);
    return response.data;
  },

  // Atualizar agendamento
  update: async (id: string, data: {
    clientName?: string;
    clientPhone?: string;
    startOfSchedule?: string; // formato HH:mm ou timestamp completo
    status?: StatusAgendamento;
  }): Promise<Agendamento> => {
    const response = await api.put(`/barber-appointments/${id}`, data);
    return response.data;
  },

  // Deletar agendamento
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barber-appointments/${id}`);
  },

  // Estatísticas dos agendamentos
  getStats: async (barbershopId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/barber-appointments/stats/${barbershopId}?${params.toString()}`);
    return response.data;
  },

  // Agendamentos de hoje
  getToday: async (barbershopId: string): Promise<AppointmentAPI[]> => {
    const response = await api.get(`/barber-appointments/today/${barbershopId}`);
    return response.data;
  },
};

// --- ADAPTADORES PARA COMPATIBILIDADE COM O CÓDIGO EXISTENTE ---
// Estes adaptadores permitem usar a API real mantendo compatibilidade com o código atual

export const dataService = {
  // Adapta os produtos para o formato Servico esperado pelo frontend
  getServices: async (): Promise<Servico[]> => {
    const products = await productService.getAll();
    return products.map(product => ({
      idProduct: product.idProduct || '',
      idBarber: product.idBarber,
      name: product.name,
      price: product.price,
      desc: product.desc || '',
      duration: product.duration || 30,
    }));
  },

  // Adapta os agendamentos para o formato esperado pelo frontend
  // Função obsoleta - use appointmentService.getByBarber() diretamente
  getAgendaEvents: async (): Promise<Agendamento[]> => {
    console.warn('getAgendaEvents() está obsoleto, use appointmentService.getByBarber()');
    return [];
  },
};

// Serviço de Assinaturas (Asaas)
export const subscriptionService = {
  // Criar assinatura com cartão de crédito
  createWithCreditCard: async (data: {
    customer: string;
    value: number;
    nextDueDate: string;
    description: string;
    discount?: {
      value: number;
      dueDateLimitDays: number;
      type: string;
    };
    creditCard: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode?: string;
      addressNumber?: string;
    };
  }): Promise<any> => {
    // Usar os dados diretamente como payload, já que vem estruturado corretamente
    const payload = data;
    
    const response = await api.post('/subscriptions/asaas/with-credit-card', payload);
    return response.data;
  },

  // Cancelar assinatura (Pro -> Free)
  cancel: async (subscriptionId: string): Promise<any> => {
    const response = await api.delete(`/subscriptions/asaas/${subscriptionId}`);
    return response.data;
  },
};

// Exportação combinada para fácil importação
export const apiServices = {
  barbershop: barbershopService,
  barber: barberService,
  product: productService,
  schedule: scheduleService,
  appointment: appointmentService,
  data: dataService,
  subscription: subscriptionService,
};
