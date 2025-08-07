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