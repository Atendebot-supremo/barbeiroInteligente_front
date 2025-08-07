// src/pages/AgendaPage.tsx
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockApiService';
import type { Agendamento } from '../types'; // 1. Importando o tipo CORRETO

// 2. REMOVEMOS a definição do tipo antigo 'AgendaEvent' que estava aqui.

const AgendaPage = () => {
  // 3. Atualizamos o estado para esperar um array do tipo Agendamento[]
  const [events, setEvents] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await dataService.getAgendaEvents();
        setEvents(data); // Agora os tipos são compatíveis!
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <p>Carregando agenda...</p>;
  }

  return (
    <div>
      <h2>Minha Agenda</h2>
      <p>Lista de agendamentos carregada com os tipos corretos.</p>
      <hr />
      <ul>
        {/* 4. Atualizamos o JSX para usar as chaves do tipo Agendamento */}
        {events.map(event => (
          <li key={event.idAppointment}>
            <strong>Cliente: {event.clientName}</strong>
            <br />
            Status: {event.status}
            <br />
            Criado em: {new Date(event.createdAt).toLocaleString('pt-BR')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AgendaPage;