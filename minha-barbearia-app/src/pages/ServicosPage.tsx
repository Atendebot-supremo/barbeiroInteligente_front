// src/pages/ServicosPage.tsx
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockApiService';
import type { Servico } from '../types'; // 1. Importando o tipo CORRETO

// 2. REMOVEMOS a definição do tipo antigo 'Service'.

const ServicosPage = () => {
  // 3. Atualizamos o estado para esperar um array do tipo Servico[]
  const [services, setServices] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await dataService.getServices();
        setServices(data); // Tipos compatíveis!
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return <p>Carregando serviços...</p>;
  }

  return (
    <div>
      <h2>Gerenciamento de Serviços</h2>
      <button>Adicionar Novo Serviço</button>
      <hr />
      <ul>
        {/* 4. Atualizamos o JSX para usar as chaves do tipo Servico */}
        {services.map(service => (
          <li key={service.idProduct} style={{ marginBottom: '10px' }}>
            <strong>{service.name}</strong> - R$ {service.price.toFixed(2)} ({service.duration} min)
            <p>{service.desc}</p>
            <button style={{ marginRight: '5px' }}>Editar</button>
            <button>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServicosPage;