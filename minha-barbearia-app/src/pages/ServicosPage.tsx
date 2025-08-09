// src/pages/ServicosPage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dataService, productService, barberService } from '../services/realApiService';
import type { Servico, Combo, Barbeiro } from '../types';
import { Button, Card, Loading, Modal, Input } from '../components/ui';
import { formatCurrency, formatDuration } from '../utils/format';
import { loadServices, saveServices, loadCombos, saveCombos, loadBarbers, saveBarbers } from '../services/localStore';

const ServicosPage = () => {
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [services, setServices] = useState<Servico[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const servicesCarouselRef = useRef<HTMLDivElement | null>(null);
  const combosCarouselRef = useRef<HTMLDivElement | null>(null);

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

        // Carregar serviços da API
        const servicesFromApi = await dataService.getServices();
        setServices(servicesFromApi);
        saveServices(servicesFromApi);

        // Carregar combos do localStorage (já que não há API para combos ainda)
        const storedCombos = loadCombos();
        setCombos(storedCombos);

      } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        
        // Fallback para dados locais se a API falhar
        const storedBarbers = loadBarbers();
        const storedServices = loadServices();
        const storedCombos = loadCombos();
        
        if (storedBarbers.length > 0) setBarbers(storedBarbers);
        if (storedServices.length > 0) setServices(storedServices);
        setCombos(storedCombos);
        
        // Se não há dados locais, criar dados básicos
        if (storedBarbers.length === 0) {
          const defaultBarbers = [
            { idBarber: 'uuid-barber-1', name: 'João' },
            { idBarber: 'uuid-barber-2', name: 'Carlos' },
          ];
          setBarbers(defaultBarbers);
          saveBarbers(defaultBarbers);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const scrollCarouselBy = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9);
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // ---------- CRUD - Serviços ----------
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceBarberId, setServiceBarberId] = useState<string>('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [serviceDesc, setServiceDesc] = useState('');

  const openAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePrice(0);
    setServiceDuration(30);
    setServiceDesc('');
    setServiceBarberId(selectedBarberId || barbers[0]?.idBarber || '');
    setServiceModalOpen(true);
  };

  const openEditService = (svc: Servico) => {
    setEditingServiceId(svc.idProduct);
    setServiceName(svc.name);
    setServicePrice(svc.price);
    setServiceDuration(svc.duration);
    setServiceDesc(svc.desc || '');
    setServiceBarberId(svc.idBarber);
    setServiceModalOpen(true);
  };

  const submitServiceForm: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const barberId = serviceBarberId || selectedBarberId || barbers[0]?.idBarber || 'uuid-barber-1';
      const serviceData = {
        name: serviceName.trim(),
        price: Number(servicePrice) || 0,
        desc: serviceDesc.trim() || undefined,
        duration: Number(serviceDuration) || 30,
        idBarber: barberId,
      };

      let updatedService: any;
      if (editingServiceId) {
        // Atualizar serviço existente
        updatedService = await productService.update(editingServiceId, serviceData);
      } else {
        // Criar novo serviço
        updatedService = await productService.create(serviceData);
      }

      // Converter para formato esperado pelo frontend
      const formattedService: Servico = {
        idProduct: updatedService.id || updatedService.idProduct,
        idBarber: updatedService.idBarber,
        name: updatedService.name,
        price: updatedService.price,
        desc: updatedService.desc,
        duration: updatedService.duration,
      };

      // Atualizar lista local
      let updated: Servico[];
      if (editingServiceId) {
        updated = services.map(s => (s.idProduct === editingServiceId ? formattedService : s));
      } else {
        updated = [formattedService, ...services];
      }
      
      setServices(updated);
      saveServices(updated);
      
      // Atualizar combos que referenciam serviços inexistentes
      const svcIds = new Set(updated.map(s => s.idProduct));
      const cleanedCombos = combos
        .map(c => ({ ...c, itemProductIds: c.itemProductIds.filter(idp => svcIds.has(idp)) }))
        .filter(c => c.itemProductIds.length > 0);
      if (cleanedCombos.length !== combos.length) {
        setCombos(cleanedCombos);
        saveCombos(cleanedCombos);
      }
      
      setServiceModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      // TODO: Mostrar erro para o usuário
      alert('Erro ao salvar serviço. Tente novamente.');
    }
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const requestDeleteService = (id: string) => {
    setDeletingServiceId(id);
    setConfirmDeleteOpen(true);
  };
  const confirmDeleteService = async () => {
    if (!deletingServiceId) return;
    try {
      // Deletar da API
      await productService.delete(deletingServiceId);
      
      // Atualizar lista local
      const updated = services.filter(s => s.idProduct !== deletingServiceId);
      setServices(updated);
      saveServices(updated);
      
      // Limpar combos que perderam itens
      const svcIds = new Set(updated.map(s => s.idProduct));
      const cleanedCombos = combos
        .map(c => ({ ...c, itemProductIds: c.itemProductIds.filter(idp => svcIds.has(idp)) }))
        .filter(c => c.itemProductIds.length > 0);
      setCombos(cleanedCombos);
      saveCombos(cleanedCombos);
      
      setDeletingServiceId(null);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço. Tente novamente.');
    }
  };

  // ---------- CRUD - Combos ----------
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState<number>(0);
  const [comboDesc, setComboDesc] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const openAddCombo = () => {
    setEditingComboId(null);
    setComboName('');
    setComboPrice(0);
    setComboDesc('');
    setSelectedIds(new Set());
    setComboModalOpen(true);
  };
  const openEditCombo = (combo: Combo) => {
    setEditingComboId(combo.idCombo);
    setComboName(combo.name);
    setComboPrice(combo.price);
    setComboDesc(combo.desc || '');
    setSelectedIds(new Set(combo.itemProductIds));
    setComboModalOpen(true);
  };
  const submitComboForm: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const id = editingComboId ?? (crypto.randomUUID ? crypto.randomUUID() : `cmb-${Date.now()}`);
    const newCombo: Combo = {
      idCombo: id,
      idBarber: selectedBarberId || barbers[0]?.idBarber || 'uuid-barber-1',
      name: comboName.trim(),
      itemProductIds: Array.from(selectedIds),
      price: Number(comboPrice) || 0,
      desc: comboDesc.trim() || undefined,
    };
    let updated: Combo[];
    if (editingComboId) {
      updated = combos.map(c => (c.idCombo === editingComboId ? newCombo : c));
    } else {
      updated = [newCombo, ...combos];
    }
    setCombos(updated);
    saveCombos(updated);
    setComboModalOpen(false);
  };
  const requestDeleteCombo = (id: string) => {
    setDeletingComboId(id);
    setConfirmDeleteComboOpen(true);
  };
  const [confirmDeleteComboOpen, setConfirmDeleteComboOpen] = useState(false);
  const [deletingComboId, setDeletingComboId] = useState<string | null>(null);
  const confirmDeleteCombo = () => {
    if (!deletingComboId) return;
    const updated = combos.filter(c => c.idCombo !== deletingComboId);
    setCombos(updated);
    saveCombos(updated);
    setDeletingComboId(null);
    setConfirmDeleteComboOpen(false);
  };

  const idToService = useMemo(() => {
    const map = new Map<string, Servico>();
    for (const s of services) map.set(s.idProduct, s);
    return map;
  }, [services]);

  const servicesOfBarber = useMemo(
    () => (selectedBarberId ? services.filter(s => s.idBarber === selectedBarberId) : services),
    [services, selectedBarberId]
  );
  const combosOfBarber = useMemo(
    () => (selectedBarberId ? combos.filter(c => c.idBarber === selectedBarberId) : combos),
    [combos, selectedBarberId]
  );

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/src/assets/background-simples.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundColor: 'hsl(var(--color-bg-primary))',
        }}
      >
        <div className="max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-center">
            <Loading size="lg" text="Carregando serviços..." />
          </div>
        </div>
      </div>
    );
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-text-primary">Serviços</h1>
          <div className="flex items-center gap-3">
            <div>
              <label htmlFor="barber" className="block text-sm font-medium text-text-secondary mb-1">Barbeiro</label>
              <select
                id="barber"
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="w-56 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white"
              >
                <option value="">Todos</option>
                {barbers.map(b => (
                  <option key={b.idBarber} value={b.idBarber}>{b.name}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={openAddService}>Adicionar Serviço</Button>
          </div>
        </div>

        {/* Carousel de Serviços */}
        <div className="relative">
          <div className="overflow-x-auto snap-x snap-mandatory carousel" ref={servicesCarouselRef}>
            <div className="flex gap-4 py-2">
              {servicesOfBarber.map(service => (
                <div key={service.idProduct} className="snap-center flex-shrink-0 w-72">
                  <Card
                    title={service.name}
                    subtitle={`${formatCurrency(service.price)} • ${formatDuration(service.duration)}`}
                    hoverable
                    className="bg-bg-secondary text-text-secondary border border-border h-full"
                  >
                    <div className="space-y-4">
                      {service.desc && (
                        <p className="text-text-muted text-sm">{service.desc}</p>
                      )}
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditService(service)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => requestDeleteService(service.idProduct)}>Excluir</Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              {servicesOfBarber.length === 0 && (
                <div className="w-full">
                  <Card className="bg-bg-secondary text-text-secondary border border-border">
                    <div className="text-center py-8">
                      <p className="text-text-muted">Nenhum serviço cadastrado</p>
                      <Button variant="primary" className="mt-4">Adicionar Primeiro Serviço</Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
          {/* Arrows */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex justify-between items-center">
            <button
              className="pointer-events-auto ml-[-8px] rounded-full bg-bg-secondary/80 border border-border text-text-secondary px-3 py-2 shadow hover:bg-bg-secondary"
              onClick={() => scrollCarouselBy(servicesCarouselRef, 'left')}
            >
              ‹
            </button>
            <button
              className="pointer-events-auto mr-[-8px] rounded-full bg-bg-secondary/80 border border-border text-text-secondary px-3 py-2 shadow hover:bg-bg-secondary"
              onClick={() => scrollCarouselBy(servicesCarouselRef, 'right')}
            >
              ›
            </button>
          </div>
        </div>

        {/* Seção de Combos */}
        <div className="flex justify-between items-center mt-6">
          <h2 className="text-2xl font-semibold text-text-primary">Combos</h2>
          <Button variant="primary" onClick={openAddCombo}>Criar Combo</Button>
        </div>

        <div className="relative">
          <div className="overflow-x-auto snap-x snap-mandatory carousel" ref={combosCarouselRef}>
            <div className="flex gap-4 py-2">
              {combosOfBarber.map(combo => (
                <div key={combo.idCombo} className="snap-center flex-shrink-0 w-80">
                  <Card
                    title={combo.name}
                    subtitle={`${combo.itemProductIds.length} itens • ${formatCurrency(combo.price)}`}
                    hoverable
                    className="bg-bg-secondary text-text-secondary border border-border h-full"
                  >
                    <div className="space-y-3">
                      {combo.desc && (
                        <p className="text-text-muted text-sm">{combo.desc}</p>
                      )}
                      <ul className="list-disc pl-5 text-sm text-text-muted">
                        {combo.itemProductIds.map(id => {
                          const item = idToService.get(id);
                          if (!item) return null;
                          return (
                            <li key={`${combo.idCombo}-${id}`}>{item.name} ({formatDuration(item.duration)})</li>
                          );
                        })}
                      </ul>
                      <div className="flex space-x-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => openEditCombo(combo)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => requestDeleteCombo(combo.idCombo)}>Remover</Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              {combosOfBarber.length === 0 && (
                <div className="w-full">
                  <Card className="bg-bg-secondary text-text-secondary border border-border">
                    <div className="text-center py-8">
                      <p className="text-text-muted">Nenhum combo criado</p>
                      <Button variant="primary" className="mt-4">Criar primeiro combo</Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
          {/* Arrows */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex justify-between items-center">
            <button
              className="pointer-events-auto ml-[-8px] rounded-full bg-bg-secondary/80 border border-border text-text-secondary px-3 py-2 shadow hover:bg-bg-secondary"
              onClick={() => scrollCarouselBy(combosCarouselRef, 'left')}
            >
              ‹
            </button>
            <button
              className="pointer-events-auto mr-[-8px] rounded-full bg-bg-secondary/80 border border-border text-text-secondary px-3 py-2 shadow hover:bg-bg-secondary"
              onClick={() => scrollCarouselBy(combosCarouselRef, 'right')}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Modal Serviço */}
      <Modal
        open={serviceModalOpen}
        title={editingServiceId ? 'Editar serviço' : 'Novo serviço'}
        onClose={() => setServiceModalOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => (document.getElementById('service-form') as HTMLFormElement)?.requestSubmit()}>Salvar</Button>
          </>
        )}
      >
        <form id="service-form" onSubmit={submitServiceForm} className="space-y-4">
          <Input label="Nome" value={serviceName} onChange={setServiceName} required id="svc-name" />
          <div>
            <label htmlFor="svc-barber" className="block text-sm font-medium text-text-secondary mb-1">Barbeiro</label>
            <select
              id="svc-barber"
              value={serviceBarberId}
              onChange={(e) => setServiceBarberId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-border bg-white"
            >
              {barbers.map(b => (
                <option key={b.idBarber} value={b.idBarber}>{b.name}</option>
              ))}
            </select>
          </div>
          <Input label="Preço (R$)" type="number" value={String(servicePrice)} onChange={(v) => setServicePrice(Number(v))} required id="svc-price" />
          <Input label="Duração (min)" type="number" value={String(serviceDuration)} onChange={(v) => setServiceDuration(Number(v))} required id="svc-duration" />
          <Input label="Descrição" value={serviceDesc} onChange={setServiceDesc} id="svc-desc" />
        </form>
      </Modal>

      {/* Confirmar exclusão serviço */}
      <Modal
        open={confirmDeleteOpen}
        title="Excluir serviço"
        onClose={() => setConfirmDeleteOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDeleteService}>Excluir</Button>
          </>
        )}
      >
        <p className="text-text-secondary">Tem certeza que deseja excluir este serviço? Esta ação pode afetar combos.</p>
      </Modal>

      {/* Modal Combo */}
      <Modal
        open={comboModalOpen}
        title={editingComboId ? 'Editar combo' : 'Novo combo'}
        onClose={() => setComboModalOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setComboModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => (document.getElementById('combo-form') as HTMLFormElement)?.requestSubmit()}>Salvar</Button>
          </>
        )}
      >
        <form id="combo-form" onSubmit={submitComboForm} className="space-y-4">
          <Input label="Nome do combo" value={comboName} onChange={setComboName} required id="cmb-name" />
          <Input label="Preço (R$)" type="number" value={String(comboPrice)} onChange={(v) => setComboPrice(Number(v))} required id="cmb-price" />
          <Input label="Descrição" value={comboDesc} onChange={setComboDesc} id="cmb-desc" />

          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Selecione os serviços</p>
            <div className="max-h-60 overflow-auto space-y-2 pr-1">
              {services.map(s => {
                const checked = selectedIds.has(s.idProduct);
                return (
                  <label key={s.idProduct} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(s.idProduct); else next.delete(s.idProduct);
                        setSelectedIds(next);
                      }}
                    />
                    <span>{s.name} — {formatCurrency(s.price)} ({formatDuration(s.duration)})</span>
                  </label>
                );
              })}
              {services.length === 0 && (
                <p className="text-text-muted text-sm">Cadastre serviços antes de criar um combo.</p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmar exclusão combo */}
      <Modal
        open={confirmDeleteComboOpen}
        title="Excluir combo"
        onClose={() => setConfirmDeleteComboOpen(false)}
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteComboOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDeleteCombo}>Excluir</Button>
          </>
        )}
      >
        <p className="text-text-secondary">Tem certeza que deseja excluir este combo?</p>
      </Modal>
    </>
  );
};

export default ServicosPage;