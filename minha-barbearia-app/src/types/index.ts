// src/types/index.ts

// Tipos baseados nos ENUMs do banco de dados
export type StatusAgendamento = 'Agendado' | 'Confirmado' | 'Concluido' | 'Cancelado';

// Tipos de planos
export type TipoPlano = 'free' | 'pro';

export interface PlanoLimites {
  barbeiros: number;
  servicos: number;
  agendamentos: number;
}

export interface Plano {
  tipo: TipoPlano;
  nome: string;
  preco: number;
  descricao: string;
  limites: PlanoLimites;
  recursos: string[];
}

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
export interface Barbearia extends BaseEntity {
    idBarbershop: string;
    barbershop: string; // Nome da barbearia
    email: string;
    phone?: string;
    cnpj?: string;      // CNPJ da empresa
    instanceZapi?: string; // Configuração WhatsApp
    status: StatusBarbearia;
    planType?: string;  // Tipo do plano (Free, Pro)
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

// Interface para horários/schedules de barbeiros
export interface HorarioBarbeiro {
  id: string;          // idSchedule da API
  idBarber: string;
  startHour: string;   // formato timetz: "13:33:00+00" ou "HH:MM:SS.sssZ"
  endHour: string;     // formato timetz: "15:33:00+00" ou "HH:MM:SS.sssZ"
  day: string;         // "segunda-feira", "terça-feira", etc.
  createdAt?: string;
  updatedAt?: string;
}

// Interface base para entidades com timestamps
export interface BaseEntity {
  createdAt?: string;
  updatedAt?: string;
}

// Interface para slots disponíveis de agendamento
export interface SlotDisponivel {
  time: string;
  available: boolean;
}