// src/pages/BarbeirosPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Modal } from '../components/ui';
import type { Barbeiro, Servico, Combo } from '../types';
import { loadBarbers, saveBarbers, loadServices, saveServices, loadCombos, saveCombos } from '../services/localStore';

const BarbeirosPage: React.FC = () => {
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [services, setServices] = useState<Servico[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const b = loadBarbers();
    const s = loadServices();
    const c = loadCombos();
    setBarbers(b);
    setServices(s);
    setCombos(c);
    setLoading(false);
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
  const [barberPhone, setBarberPhone] = useState('');

  const openAddBarber = () => {
    setEditingBarberId(null);
    setBarberName('');
    setBarberPhone('');
    setBarberModalOpen(true);
  };
  const openEditBarber = (barber: Barbeiro) => {
    setEditingBarberId(barber.idBarber);
    setBarberName(barber.name);
    setBarberPhone(barber.phone || '');
    setBarberModalOpen(true);
  };
  const submitBarberForm: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const id = editingBarberId ?? (crypto.randomUUID ? crypto.randomUUID() : `bar-${Date.now()}`);
    const newBarber: Barbeiro = { idBarber: id, name: barberName.trim(), phone: barberPhone.trim() || undefined };
    const updated = editingBarberId
      ? barbers.map(b => (b.idBarber === editingBarberId ? newBarber : b))
      : [newBarber, ...barbers];
    setBarbers(updated);
    saveBarbers(updated);
    setBarberModalOpen(false);
  };

  // Excluir barbeiro (e dados associados)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const requestDeleteBarber = (id: string) => {
    setDeletingBarberId(id);
    setConfirmDeleteOpen(true);
  };
  const confirmDeleteBarber = () => {
    if (!deletingBarberId) return;
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
              <Card key={b.idBarber} className="bg-bg-secondary text-text-secondary border border-border" title={b.name} subtitle={b.phone}>
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
          <Input label="Telefone (opcional)" value={barberPhone} onChange={setBarberPhone} id="barber-phone" />
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


