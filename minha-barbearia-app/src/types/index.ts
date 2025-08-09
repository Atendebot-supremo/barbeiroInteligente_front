// src/types/index.ts

// Tipos baseados nos ENUMs do banco de dados
export type StatusAgendamento = 'Agendado' | 'Concluido' | 'Cancelado';
export type StatusBarbearia = 'Ativo' | 'Inativo' | 'Inadimplente' | 'Cancelado';

// Interface baseada na tabela 'barberProducts'
export interface Servico {
  idProduct: string;      // UUID
  idBarber: string;       // UUID
  name: string;           // TEXT
  price: number;          // REAL
  desc?: string;          // TEXT (opcional, pois pode ser nulo)
  duration: number;       // SMALLINT
}

// Interface baseada na tabela 'barberAppointments'
export interface Agendamento {
  idAppointment: string;  // UUID
  idBarbershop: string;   // UUID
  idBarber: string;       // UUID
  idProduct: string;      // UUID
  clientName?: string;    // TEXT (opcional)
  clientPhone?: string;   // TEXT (opcional)
  createdAt: string;      // TIMESTAMPTZ
  updatedAt: string;      // TIMESTAMPTZ
  startOfSchedule?: string; // TIMESTAMPTZ - data/hora do agendamento
  status: StatusAgendamento;
}

// Interface para o usuário/barbearia logada
export interface Barbearia {
    idBarbershop: string;
    barbershop: string; // Nome da barbearia
    email: string;
    phone?: string;
    status: StatusBarbearia;
}

// Profissional/barbeiro
export interface Barbeiro {
  idBarber: string;
  name: string;
  phone?: string;
}

// Combos de serviços (para exibir e persistir no front)
export interface Combo {
  idCombo: string;
  idBarber: string; // combos por barbeiro
  name: string;
  itemProductIds: string[]; // IDs de serviços inclusos
  price: number;
  desc?: string;
}