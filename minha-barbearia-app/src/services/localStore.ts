import type { Servico, Combo, Barbeiro, Agendamento } from '../types';

const SERVICES_KEY = 'bi_services';
const COMBOS_KEY = 'bi_combos';
const BARBERS_KEY = 'bi_barbers';
const APPTS_KEY = 'bi_appointments';

export function loadServices(): Servico[] {
  const raw = localStorage.getItem(SERVICES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Servico[]; } catch { return []; }
}

export function saveServices(data: Servico[]): void {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(data));
}

export function loadCombos(): Combo[] {
  const raw = localStorage.getItem(COMBOS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Combo[]; } catch { return []; }
}

export function saveCombos(data: Combo[]): void {
  localStorage.setItem(COMBOS_KEY, JSON.stringify(data));
}

export function loadBarbers(): Barbeiro[] {
  const raw = localStorage.getItem(BARBERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Barbeiro[]; } catch { return []; }
}

export function saveBarbers(data: Barbeiro[]): void {
  localStorage.setItem(BARBERS_KEY, JSON.stringify(data));
}

export function loadAppointments(): Agendamento[] {
  const raw = localStorage.getItem(APPTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Agendamento[]; } catch { return []; }
}

export function saveAppointments(data: Agendamento[]): void {
  localStorage.setItem(APPTS_KEY, JSON.stringify(data));
}


