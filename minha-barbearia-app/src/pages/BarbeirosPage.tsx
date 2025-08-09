// src/pages/BarbeirosPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Modal } from '../components/ui';
import type { Barbeiro, Servico, Combo } from '../types';
import { loadBarbers, saveBarbers, loadServices, saveServices, loadCombos, saveCombos } from '../services/localStore';
import { barberService, productService } from '../services/realApiService';

const BarbeirosPage: React.FC = () => {
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [services, setServices] = useState<Servico[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar barbeiros da API
        const barbersFromApi = await barberService.getAll();
        const barbeirosFormatted: Barbeiro[] = barbersFromApi.map(barber => ({
          idBarber: barber.id || '',
          name: barber.name,
          phone: undefined, // API não retorna phone para barbeiros
        }));
        setBarbers(barbeirosFormatted);
        saveBarbers(barbeirosFormatted);

        // Carregar serviços para contagem
        const productsFromApi = await productService.getAll();
        const servicesFormatted: Servico[] = productsFromApi.map(product => ({
          idProduct: product.id || '',
          idBarber: product.idBarber,
          name: product.name,
          price: product.price,
          desc: product.desc,
          duration: product.duration || 30,
        }));
        setServices(servicesFormatted);
        saveServices(servicesFormatted);

        // Carregar combos do localStorage
        const storedCombos = loadCombos();
        setCombos(storedCombos);

      } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        
        // Fallback para dados locais
        const storedBarbers = loadBarbers();
        const storedServices = loadServices();
        const storedCombos = loadCombos();
        
        setBarbers(storedBarbers);
        setServices(storedServices);
        setCombos(storedCombos);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const countsByBarber = useMemo(() => {
    const serviceCount = new Map<string, number>();
    const comboCount = new Map<string, number>();
    for (const s of services) {
      serviceCount.set(s.idBarber, (serviceCount.get(s.idBarber) || 0) + 1);
    }
    for (const c of combos) {
      comboCount.set(c.idBarber, (comboCount.get(c.idBarber) || 0) + 1);
    }
    return { serviceCount, comboCount };
  }, [services, combos]);

  // Modal de barbeiro
  const [barberModalOpen, setBarberModalOpen] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState('');

  const openAddBarber = () => {
    setEditingBarberId(null);
    setBarberName('');
    setBarberModalOpen(true);
  };
  const openEditBarber = (barber: Barbeiro) => {
    setEditingBarberId(barber.idBarber);
    setBarberName(barber.name);
    setBarberModalOpen(true);
  };
  const submitBarberForm: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      // Primeiro, vamos tentar obter as barbearias para pegar um ID válido
      let validBarbershopId = null;
      
      try {
        const { barbershopService } = await import('../services/realApiService');
        console.log('Buscando barbearias existentes...');
        const barbershops = await barbershopService.getAll();
        console.log('Barbearias encontradas:', barbershops);
        
        if (barbershops && barbershops.length > 0) {
          validBarbershopId = barbershops[0].id;
          console.log('Usando idBarbershop:', validBarbershopId);
        }
      } catch (error) {
        console.warn('Não foi possível obter barbershops:', error);
      }
      
      // Se não temos um ID válido, mostrar erro para o usuário
      if (!validBarbershopId) {
        alert('❌ Erro: É necessário ter pelo menos uma barbearia cadastrada antes de criar barbeiros.\n\nVá para a página de teste (/test-api) e execute "Barbershops - Criar Teste" primeiro.');
        return;
      }

      const barberData = {
        name: barberName.trim(),
        idBarbershop: validBarbershopId,
      };
      
      console.log('Enviando dados do barbeiro:', barberData);

      let updatedBarber: any;
      if (editingBarberId) {
        // Atualizar barbeiro existente
        updatedBarber = await barberService.update(editingBarberId, barberData);
      } else {
        // Criar novo barbeiro
        updatedBarber = await barberService.create(barberData);
      }

      // Converter para formato esperado pelo frontend
      const formattedBarber: Barbeiro = {
        idBarber: updatedBarber.id || editingBarberId || '',
        name: updatedBarber.name,
        phone: undefined, // API não retorna phone para barbeiros
      };

      // Atualizar lista local
      const updated = editingBarberId
        ? barbers.map(b => (b.idBarber === editingBarberId ? formattedBarber : b))
        : [formattedBarber, ...barbers];
      
      setBarbers(updated);
      saveBarbers(updated);
      setBarberModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar barbeiro:', error);
      alert('Erro ao salvar barbeiro. Tente novamente.');
    }
  };

  // Excluir barbeiro (e dados associados)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const requestDeleteBarber = (id: string) => {
    setDeletingBarberId(id);
    setConfirmDeleteOpen(true);
  };
  const confirmDeleteBarber = async () => {
    if (!deletingBarberId) return;
    try {
      // Deletar da API
      await barberService.delete(deletingBarberId);
      
      // Atualizar listas locais
      const updatedBarbers = barbers.filter(b => b.idBarber !== deletingBarberId);
      const updatedServices = services.filter(s => s.idBarber !== deletingBarberId);
      const updatedCombos = combos.filter(c => c.idBarber !== deletingBarberId);
      
      setBarbers(updatedBarbers);
      setServices(updatedServices);
      setCombos(updatedCombos);
      saveBarbers(updatedBarbers);
      saveServices(updatedServices);
      saveCombos(updatedCombos);
      
      setDeletingBarberId(null);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Erro ao excluir barbeiro:', error);
      alert('Erro ao excluir barbeiro. Tente novamente.');
    }
  };

  if (loading) {
    return null;
  }

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-primary">Barbeiros</h1>
            <Button variant="primary" onClick={openAddBarber}>Adicionar Barbeiro</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map(b => (
              <Card key={b.idBarber} className="bg-bg-secondary text-text-secondary border border-border" title={b.name}>
                <div className="space-y-3">
                  <div className="text-sm text-text-muted">
                    Serviços: {countsByBarber.serviceCount.get(b.idBarber) || 0} • Combos: {countsByBarber.comboCount.get(b.idBarber) || 0}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditBarber(b)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => requestDeleteBarber(b.idBarber)}>Excluir</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {barbers.length === 0 && (
            <Card className="bg-bg-secondary text-text-secondary border border-border">
              <div className="text-center py-12">
                <p className="text-text-muted">Nenhum barbeiro cadastrado</p>
                <Button variant="primary" className="mt-4" onClick={openAddBarber}>Adicionar primeiro barbeiro</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Barbeiro */}
      <Modal
        open={barberModalOpen}
        title={editingBarberId ? 'Editar barbeiro' : 'Novo barbeiro'}
        onClose={() => setBarberModalOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setBarberModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => (document.getElementById('barber-form') as HTMLFormElement)?.requestSubmit()}>Salvar</Button>
          </>
        )}
      >
        <form id="barber-form" onSubmit={submitBarberForm} className="space-y-4">
          <Input label="Nome" value={barberName} onChange={setBarberName} required id="barber-name" />
        </form>
      </Modal>

      {/* Confirmar exclusão */}
      <Modal
        open={confirmDeleteOpen}
        title="Excluir barbeiro"
        onClose={() => setConfirmDeleteOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDeleteBarber}>Excluir</Button>
          </>
        )}
      >
        <p className="text-text-secondary">Tem certeza que deseja excluir este barbeiro? Os serviços e combos associados serão removidos.</p>
      </Modal>
    </>
  );
};

export default BarbeirosPage;


