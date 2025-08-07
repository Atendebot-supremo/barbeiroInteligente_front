// src/services/mockApiService.ts
import type { Servico, Agendamento, Barbearia } from '../types';

// Simula um delay da rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- SERVIÇO DE AUTENTICAÇÃO ---
export const authService = {
  login: async (email: string, pass: string) => {
    await delay(500);
    if (email === 'barbeiro@teste.com' && pass === '1234') {
      // Retornando o objeto de usuário no formato da tabela 'barbershop'
      const userData: Barbearia = {
        idBarbershop: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        barbershop: 'Barbearia do Zé',
        email: 'barbeiro@teste.com',
        phone: '11987654321',
        status: 'Ativo',
      };
      return {
        user: userData,
        token: 'fake-jwt-token-string-from-real-api',
      };
    }
    throw new Error('Usuário ou senha inválidos');
  },
};

// --- SERVIÇO DE DADOS ---
export const dataService = {
  // Busca de Serviços
  getServices: async (): Promise<Servico[]> => {
    await delay(300);
    return [
      { 
        idProduct: 'uuid-product-1',
        idBarber: 'uuid-barber-1',
        name: 'Corte na Tesoura',
        price: 50.50, // REAL pode ter casas decimais
        desc: 'Corte social clássico feito na tesoura.',
        duration: 45,
      },
      { 
        idProduct: 'uuid-product-2',
        idBarber: 'uuid-barber-1',
        name: 'Barba Terapia',
        price: 40.00,
        desc: 'Modelagem de barba com toalha quente e massagem.',
        duration: 30,
      },
      { 
        idProduct: 'uuid-product-3',
        idBarber: 'uuid-barber-2',
        name: 'Platinado',
        price: 150.00,
        desc: 'Descoloração e tonalização para o cabelo platinado.',
        duration: 120,
      },
    ];
  },

  // Busca de Agendamentos
  getAgendaEvents: async (): Promise<Agendamento[]> => {
    await delay(400);
    const now = new Date();
    const todayAt10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const todayAt11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);

    return [
      {
        idAppointment: 'uuid-appointment-1',
        idBarbershop: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        idBarber: 'uuid-barber-1',
        idProduct: 'uuid-product-1',
        clientName: 'João da Silva',
        clientPhone: '11999998888',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Agendado',
      },
      {
        idAppointment: 'uuid-appointment-2',
        idBarbershop: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        idBarber: 'uuid-barber-1',
        idProduct: 'uuid-product-2',
        clientName: 'Carlos Pereira',
        clientPhone: '21977776666',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Concluido',
      }
    ];
  },
};