// src/services/realApiService.ts
import api from './api';
import type { Servico, Agendamento } from '../types';

// --- INTERFACES PARA A API REAL ---
export interface Barbershop {
  id?: string;
  barbershop: string;     // Nome da barbearia
  email: string;
  password?: string;      // Obrigatório na criação, opcional na resposta
  cnpj: string;
  phone: string;
  instanceZapi: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Barber {
  id?: string;
  idBarbershop: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarberProduct {
  id?: string;
  idBarber: string;
  name: string;
  price: number;
  desc?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarberSchedule {
  id?: string;
  idBarber: string;
  startHour: string; // "09:00"
  endHour: string;   // "18:00"
  day: string;       // "segunda-feira", "terça-feira", etc.
  createdAt?: string;
  updatedAt?: string;
}

export interface BarberAppointment {
  id?: string;
  idBarbershop: string;
  idBarber: string;
  idProduct: string;
  clientName: string;
  clientPhone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
}

// --- SERVIÇO DE BARBEARIAS ---
export const barbershopService = {
  // Listar todas as barbearias
  getAll: async (filters?: { search?: string; status?: string; cnpj?: string }): Promise<Barbershop[]> => {
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
  getById: async (id: string): Promise<Barbershop> => {
    const response = await api.get(`/barbershop/${id}`);
    return response.data;
  },

  // Criar nova barbearia
  create: async (data: Partial<Barbershop>): Promise<Barbershop> => {
    console.log('🏪 Criando barbearia com dados:', data);
    console.log('📤 Enviando POST para /barbershop');
    
    const response = await api.post('/barbershop', data);
    
    console.log('✅ Barbearia criada com sucesso:', response.data);
    return response.data;
  },

  // Atualizar barbearia
  update: async (id: string, data: Partial<Barbershop>): Promise<Barbershop> => {
    const response = await api.put(`/barbershop/${id}`, data);
    return response.data;
  },

  // Deletar barbearia
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barbershop/${id}`);
  },
};

// --- SERVIÇO DE BARBEIROS ---
export const barberService = {
  // Listar todos os barbeiros
  getAll: async (filters?: { search?: string }): Promise<Barber[]> => {
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
  getById: async (id: string): Promise<Barber> => {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  // Criar novo barbeiro
  create: async (data: Partial<Barber>): Promise<Barber> => {
    const response = await api.post('/barbers', data);
    return response.data;
  },

  // Atualizar barbeiro
  update: async (id: string, data: Partial<Barber>): Promise<Barber> => {
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
  }): Promise<BarberProduct[]> => {
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
  getById: async (id: string): Promise<BarberProduct> => {
    const response = await api.get(`/barber-products/${id}`);
    return response.data;
  },

  // Criar novo produto
  create: async (data: Partial<BarberProduct>): Promise<BarberProduct> => {
    const response = await api.post('/barber-products', data);
    return response.data;
  },

  // Atualizar produto
  update: async (id: string, data: Partial<BarberProduct>): Promise<BarberProduct> => {
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
  getAll: async (): Promise<BarberSchedule[]> => {
    const response = await api.get('/barber-schedules');
    return response.data;
  },

  // Buscar horário por ID
  getById: async (id: string): Promise<BarberSchedule> => {
    const response = await api.get(`/barber-schedules/${id}`);
    return response.data;
  },

  // Criar novo horário
  create: async (data: Partial<BarberSchedule>): Promise<BarberSchedule> => {
    const response = await api.post('/barber-schedules', data);
    return response.data;
  },

  // Atualizar horário
  update: async (id: string, data: Partial<BarberSchedule>): Promise<BarberSchedule> => {
    const response = await api.put(`/barber-schedules/${id}`, data);
    return response.data;
  },

  // Deletar horário
  delete: async (id: string): Promise<void> => {
    await api.delete(`/barber-schedules/${id}`);
  },

  // Buscar slots disponíveis
  getAvailableSlots: async (barberId: string, date: string, day: string): Promise<AvailableSlot[]> => {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('day', day);
    
    const response = await api.get(`/barber-schedules/available-slots/${barberId}?${params.toString()}`);
    return response.data;
  },

  // Buscar horários semanais do barbeiro
  getWeeklySchedule: async (barberId: string): Promise<BarberSchedule[]> => {
    const response = await api.get(`/barber-schedules/weekly/${barberId}`);
    return response.data;
  },
};

// --- SERVIÇO DE AGENDAMENTOS ---
export const appointmentService = {
  // Listar todos os agendamentos
  getAll: async (filters?: { 
    idBarbershop?: string; 
    idBarber?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<BarberAppointment[]> => {
    const params = new URLSearchParams();
    if (filters?.idBarbershop) params.append('idBarbershop', filters.idBarbershop);
    if (filters?.idBarber) params.append('idBarber', filters.idBarber);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/barber-appointments?${params.toString()}`);
    return response.data;
  },

  // Buscar agendamento por ID
  getById: async (id: string): Promise<BarberAppointment> => {
    const response = await api.get(`/barber-appointments/${id}`);
    return response.data;
  },

  // Criar novo agendamento
  create: async (data: Partial<BarberAppointment>): Promise<BarberAppointment> => {
    const response = await api.post('/barber-appointments', data);
    return response.data;
  },

  // Atualizar agendamento
  update: async (id: string, data: Partial<BarberAppointment>): Promise<BarberAppointment> => {
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
  getToday: async (barbershopId: string): Promise<BarberAppointment[]> => {
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
      idProduct: product.id || '',
      idBarber: product.idBarber,
      name: product.name,
      price: product.price,
      desc: product.desc || '',
      duration: product.duration || 30,
    }));
  },

  // Adapta os agendamentos para o formato esperado pelo frontend
  getAgendaEvents: async (): Promise<Agendamento[]> => {
    try {
      const appointments = await appointmentService.getAll();
      return appointments.map(appointment => ({
        idAppointment: appointment.id || '',
        idBarbershop: appointment.idBarbershop,
        idBarber: appointment.idBarber,
        idProduct: appointment.idProduct,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        createdAt: appointment.createdAt || new Date().toISOString(),
        updatedAt: appointment.updatedAt || new Date().toISOString(),
        status: appointment.status === 'completed' ? 'Concluido' : 
                appointment.status === 'cancelled' ? 'Cancelado' : 'Agendado',
      }));
    } catch (error) {
      console.warn('Erro ao carregar agendamentos da API, usando dados locais:', error);
      return [];
    }
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
};
