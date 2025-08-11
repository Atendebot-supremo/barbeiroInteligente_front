// src/pages/ServicosPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { barbershopService, productService } from '../services/realApiService';
import type { Servico, Barbeiro } from '../types';
import { Button, Card, Loading, Modal, Input } from '../components/ui';
import { formatCurrency, formatDuration } from '../utils/format';
import { loadServices, saveServices } from '../services/localStore';
import { useAuth } from '../contexts/AuthContext';

const ServicosPage = () => {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [services, setServices] = useState<Servico[]>([]);
  // Sem seção de combos; combos serão criados como produtos automaticamente
  const [loading, setLoading] = useState(true);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar barbeiros da barbearia
        if (user?.idBarbershop) {
          const barbersFromApi = await barbershopService.getBarbers(user.idBarbershop);
          const barbeirosFormatted: Barbeiro[] = barbersFromApi.map(barber => ({
            idBarber: (barber as any).id || (barber as any).idBarber || '',
            name: (barber as any).name,
            phone: (barber as any).phone,
          }));
          setBarbers(barbeirosFormatted);
        } else {
          setBarbers([]);
        }

        // Carregar serviços (produtos) da barbearia logada
        let servicesFromApi: Servico[] = [];
        if (user?.idBarbershop) {
          servicesFromApi = await barbershopService.getServices(user.idBarbershop);
        }
        setServices(servicesFromApi);
        saveServices(servicesFromApi);

        // Sem seção de combos

      } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        
        // Fallback para dados locais se a API falhar
        const storedServices = loadServices();
        
        if (storedServices.length > 0) setServices(storedServices);
        
        // Se não há dados locais, criar dados básicos
        // Não gerar barbeiros mock
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);



  // ---------- CRUD - Serviços ----------
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceBarberId, setServiceBarberId] = useState<string>('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [serviceDesc, setServiceDesc] = useState('');

  const openAddService = useCallback(() => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePrice(0);
    setServiceDuration(30);
    setServiceDesc('');
    setServiceBarberId(selectedBarberId || barbers[0]?.idBarber || '');
    setServiceModalOpen(true);
  }, [selectedBarberId, barbers]);

  const openEditService = useCallback((svc: Servico) => {
    setEditingServiceId(svc.idProduct);
    setServiceName(svc.name);
    setServicePrice(svc.price);
    setServiceDuration(svc.duration);
    setServiceDesc(svc.desc || '');
    setServiceBarberId(svc.idBarber);
    setServiceModalOpen(true);
  }, []);

  const submitServiceForm: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      if (!user?.idBarbershop) throw new Error('Barbearia não identificada');
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
        // Atualizar serviço existente (PUT /barber-products/{id})
        updatedService = await productService.update(editingServiceId, serviceData);
      } else {
        // Criar novo serviço (POST /barber-products)
        updatedService = await productService.create(serviceData);
      }

      // Converter para formato esperado pelo frontend
      const payload = (updatedService && (updatedService as any).data) ? (updatedService as any).data : updatedService;
      const formattedService: Servico = {
        idProduct: payload.id || payload.idProduct,
        idBarber: payload.idBarber ?? serviceBarberId,
        name: payload.name ?? serviceName,
        price: payload.price,
        desc: payload.desc ?? serviceDesc,
        duration: payload.duration ?? serviceDuration,
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
      
      // (Sem seção de combos para manter)
      
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
      // Deletar da API: DELETE /api/barber-products/{id}
      await productService.delete(deletingServiceId);
      
      // Atualizar lista local
      const updated = services.filter(s => s.idProduct !== deletingServiceId);
      setServices(updated);
      saveServices(updated);
      
      // (Sem seção de combos para manter)
      
      setDeletingServiceId(null);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço. Tente novamente.');
    }
  };

  // (Sem combo)

  // (Sem seção de combos, não precisamos do mapa id->service aqui)

  const servicesOfBarber = useMemo(
    () => (selectedBarberId ? services.filter(s => s.idBarber === selectedBarberId) : services),
    [services, selectedBarberId]
  );

  // Cálculos de paginação
  const totalPages = Math.ceil(servicesOfBarber.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = servicesOfBarber.slice(startIndex, endIndex);

  // Reset da página quando mudar filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBarberId]);

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
          <h1 className="text-3xl font-bold text-primary-light">Serviços</h1>
          <div className="flex items-center gap-3">
            <div>
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

        {/* Grid de Serviços */}
        <div className="space-y-6">
          {servicesOfBarber.length === 0 ? (
            <Card className="bg-bg-secondary text-text-secondary border border-border">
              <div className="text-center py-12">
                <p className="text-text-muted text-lg mb-4">Nenhum serviço cadastrado</p>
                <Button variant="primary" onClick={openAddService}>Adicionar Primeiro Serviço</Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Grid 3x3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentServices.map(service => (
                  <Card
                    key={service.idProduct}
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
                ))}
              </div>

              {/* Sistema de Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  {/* Botão Anterior */}
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    ← Anterior
                  </button>

                  {/* Números das páginas */}
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded-md min-w-[40px] ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Botão Próximo */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Próximo →
                  </button>
                </div>
              )}

              {/* Informações da paginação */}
              {totalPages > 1 && (
                <div className="text-center text-sm text-text-muted">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, servicesOfBarber.length)} de {servicesOfBarber.length} serviços
                </div>
              )}
            </>
          )}
        </div>

        {/* Seção de combos removida */}
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

      {/* Sem combo */}
    </>
  );
};

export default ServicosPage;