// src/pages/BarbeirosPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button, Card, Input, Modal } from '../components/ui';
import type { Barbeiro, Servico, Combo } from '../types';
import { loadCombos, saveCombos } from '../services/localStore';
import { barbershopService } from '../services/realApiService';
import { useAuth } from '../contexts/AuthContext';

const BarbeirosPage: React.FC = () => {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [services, setServices] = useState<Servico[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!user?.idBarbershop) throw new Error('Barbearia não identificada');
        // Carregar barbeiros da barbearia
        const barbersFromApi = await barbershopService.getBarbers(user.idBarbershop);
        const barbeirosFormatted: Barbeiro[] = barbersFromApi.map(barber => ({
          idBarber: (barber as any).id || (barber as any).idBarber || '',
          name: (barber as any).name,
          phone: (barber as any).phone,
        }));
        setBarbers(barbeirosFormatted);

        // Carregar serviços da barbearia para contagem
        const servicesRaw = await barbershopService.getServices(user.idBarbershop);
        const servicesFormatted: Servico[] = servicesRaw.map(product => ({
          idProduct: (product as any).id || (product as any).idProduct || '',
          idBarber: (product as any).idBarber,
          name: (product as any).name,
          price: (product as any).price,
          desc: (product as any).desc,
          duration: (product as any).duration || 30,
        }));
        setServices(servicesFormatted);

        // Carregar combos do localStorage
        const storedCombos = loadCombos();
        setCombos(storedCombos);

      } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        
        // Fallback: manter combos locais apenas (sem dados mock de barbeiros/serviços)
        const storedCombos = loadCombos();
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
      const barberData = {
        name: barberName.trim(),
        idBarbershop: user?.idBarbershop,
      } as any;
      
      console.log('Enviando dados do barbeiro:', barberData);

      let updatedBarber: any;
      if (!user?.idBarbershop) throw new Error('Barbearia não identificada');
      if (editingBarberId) {
        updatedBarber = await barbershopService.updateBarber(user.idBarbershop, editingBarberId, barberData);
      } else {
        // API exige POST /barbers com idBarbershop no body
        updatedBarber = await barbershopService.createBarber(user.idBarbershop, barberData);
      }

      // Converter para formato esperado pelo frontend (suportando envelope { success, data })
      const payload = (updatedBarber && (updatedBarber as any).data) ? (updatedBarber as any).data : updatedBarber;
      const formattedBarber: Barbeiro = {
        idBarber: (payload && (payload as any).id) || editingBarberId || '',
        name: (payload && (payload as any).name) || barberName.trim(),
        phone: (payload as any)?.phone,
      };

      // Atualizar lista local
      const updated = editingBarberId
        ? barbers.map(b => (b.idBarber === editingBarberId ? formattedBarber : b))
        : [formattedBarber, ...barbers];
      
      setBarbers(updated);
      // Resetar formulário e fechar modal
      setBarberName('');
      setEditingBarberId(null);
      setBarberModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar barbeiro:', error);
      alert('Erro ao salvar barbeiro. Tente novamente.');
    }
  };

  // Excluir barbeiro (e dados associados)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const requestDeleteBarber = useCallback((id: string) => {
    setDeletingBarberId(id);
    setConfirmDeleteOpen(true);
  }, []);
  const confirmDeleteBarber = async () => {
    if (!deletingBarberId) return;
    try {
      // Deletar da API
      if (!user?.idBarbershop) throw new Error('Barbearia não identificada');
      await barbershopService.deleteBarber(user.idBarbershop, deletingBarberId);
      
      // Atualizar listas locais
      const updatedBarbers = barbers.filter(b => b.idBarber !== deletingBarberId);
      const updatedServices = services.filter(s => s.idBarber !== deletingBarberId);
      const updatedCombos = combos.filter(c => c.idBarber !== deletingBarberId);
      
      setBarbers(updatedBarbers);
      setServices(updatedServices);
      setCombos(updatedCombos);
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
            <h1 className="text-3xl font-bold text-primary-light">Barbeiros</h1>
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


