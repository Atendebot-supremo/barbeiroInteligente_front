// src/pages/CadastroPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { barbershopService, subscriptionService } from '../services/realApiService';
import { useNotification } from '../contexts/NotificationContext';
// Tipos para os planos (temporário para resolver problema de importação)
type TipoPlano = 'free' | 'pro';

interface PlanoLimites {
  barbeiros: number;
  servicos: number;
  agendamentos: number;
}

interface Plano {
  tipo: TipoPlano;
  nome: string;
  preco: number;
  descricao: string;
  limites: PlanoLimites;
  recursos: string[];
}

const CadastroPage = () => {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useNotification();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Funções utilitárias para formatação
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Validação de CNPJ
  const validateCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    
    if (numbers.length !== 14) return false;
    if (/^(\d)\1+$/.test(numbers)) return false; // Todos os dígitos iguais
    
    let tamanho = numbers.length - 2;
    let numeros = numbers.substring(0, tamanho);
    let digitos = numbers.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = numbers.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
  };

  // Validação de CPF
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false; // Todos os dígitos iguais
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numbers.charAt(i)) * (10 - i);
    }
    
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numbers.charAt(i)) * (11 - i);
    }
    
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(numbers.charAt(10));
  };

  // Definição dos planos disponíveis
  const planosDisponiveis: Plano[] = [
    {
      tipo: 'free',
      nome: 'Plano Free',
      preco: 0,
      descricao: 'Ideal para começar',
      limites: {
        barbeiros: 1,
        servicos: 4,
        agendamentos: 10
      },
      recursos: [
        'Até 1 barbeiro',
        'Até 4 serviços',
        'Até 10 agendamentos por mês',
        'Suporte básico'
      ]
    },
    {
      tipo: 'pro',
      nome: 'Plano Pro',
      preco: 29.90,
      descricao: 'Para barbearias em crescimento',
      limites: {
        barbeiros: 999,
        servicos: 999,
        agendamentos: 999
      },
      recursos: [
        'Barbeiros ilimitados',
        'Serviços ilimitados',
        'Agendamentos ilimitados',
        'Relatórios avançados',
        'Suporte prioritário',
        'Integração WhatsApp'
      ]
    }
  ];

  // Etapa 1: Dados da Barbearia
  const [planoSelecionado, setPlanoSelecionado] = useState<TipoPlano>('free');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState<'cpf' | 'cnpj'>('cnpj');
  const [documento, setDocumento] = useState('');
  const [celular, setCelular] = useState('');

  // Etapa 2: Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');

  // Etapa 3: Dados de Pagamento
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesValidade, setMesValidade] = useState('');
  const [anoValidade, setAnoValidade] = useState('');
  const [cvv, setCvv] = useState('');

  // Estados de erro
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Função para limpar erro específico
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Validação Etapa 1: Seleção de Planos
  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!planoSelecionado) newErrors.plano = 'Selecione um plano';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação Etapa 2: Dados da Barbearia
  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nomeBarbearia.trim()) newErrors.nomeBarbearia = 'Informe o nome da barbearia';
    if (!email.trim()) newErrors.email = 'Informe o email';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!senha.trim()) newErrors.senha = 'Informe a senha';
    else if (senha.length < 6) newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    
    if (!documento.trim()) {
      newErrors.documento = `Informe o ${documentoTipo.toUpperCase()}`;
    } else {
      if (documentoTipo === 'cnpj' && !validateCNPJ(documento)) {
        newErrors.documento = 'CNPJ inválido';
      } else if (documentoTipo === 'cpf' && !validateCPF(documento)) {
        newErrors.documento = 'CPF inválido';
      }
    }
    
    if (!celular.trim()) newErrors.celular = 'Informe o celular';
    else if (celular.replace(/\D/g, '').length < 10) newErrors.celular = 'Telefone inválido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação Etapa 3: Endereço
  const validateStep3 = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!cep.trim()) newErrors.cep = 'Informe o CEP';
    if (!endereco.trim()) newErrors.endereco = 'Informe o endereço';
    if (!numero.trim()) newErrors.numero = 'Informe o número';
    if (!bairro.trim()) newErrors.bairro = 'Informe o bairro';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação Etapa 4: Dados de Pagamento
  const validateStep4 = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nomeCartao.trim()) newErrors.nomeCartao = 'Informe o nome como no cartão';
    if (!numeroCartao.trim()) newErrors.numeroCartao = 'Informe o número do cartão';
    if (!mesValidade) newErrors.mesValidade = 'Informe o mês de validade';
    if (!anoValidade) newErrors.anoValidade = 'Informe o ano de validade';
    if (!cvv.trim()) newErrors.cvv = 'Informe o código de segurança';
    else if (cvv.length < 3) newErrors.cvv = 'CVV deve ter pelo menos 3 dígitos';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setErrors({});
    }
    if (step === 2 && validateStep2()) {
      setStep(3);
      setErrors({});
    }
    if (step === 3 && validateStep3()) {
      // Se for plano free, finalizar diretamente; se for pro, ir para pagamento
      if (planoSelecionado === 'free') {
        handleSubmit();
      } else {
        setStep(4);
        setErrors({});
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    // Para plano free, não precisa validar dados de pagamento
    if (planoSelecionado === 'pro' && !validateStep4()) return;

    setIsProcessing(true);
    try {
      console.log('🚀 Iniciando processo de cadastro...');
      
      // 1. Primeiro criar a conta da barbearia
      const cadastroData = {
        barbershop: nomeBarbearia,
        email: email,
        password: senha,
        cnpj: documento, // Manter formatação com pontuação
        phone: celular,
        instanceZapi: 'instancia_padrao', // Valor padrão
        status: 'Ativo' as const,
        planType: planoSelecionado === 'free' ? 'Free' : 'Pro'
      };

      console.log('📋 Criando conta da barbearia:', cadastroData);
      const barbershopResponse = await barbershopService.create(cadastroData);
      console.log('✅ Barbearia criada:', barbershopResponse);

      // Extrair dados da resposta (ClientId necessário para pagamento)
      const barbershopData = (barbershopResponse as any).data || barbershopResponse;
      const clientId = barbershopData.ClientId || barbershopData.clientId || barbershopData.client_id;

      // 2. Se for plano Pro, processar pagamento
      if (planoSelecionado === 'pro') {
        if (!clientId) {
          throw new Error('ClientId não encontrado na resposta da criação da conta');
        }

        console.log('💳 Processando pagamento Pro para clientId:', clientId);

        // Preparar dados do cartão
        const expiryDate = `${mesValidade}/${anoValidade.slice(-2)}`;
        const [month, year] = expiryDate.split('/');
        const fullYear = `20${year}`;

        // Calcular próxima data de cobrança
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        const dueDateString = nextDueDate.toISOString().split('T')[0];

        const subscriptionData = {
          customer: clientId,
          billingType: "CREDIT_CARD",
          value: 1.00, // Valor de teste
          nextDueDate: dueDateString,
          cycle: "MONTHLY",
          description: "Pro",
          status: "ACTIVE",
          discount: {
            value: 34,
            dueDateLimitDays: 0,
            type: "PERCENTAGE"
          },
          interest: { value: 0 },
          fine: { value: 0, type: "FIXED" },
          endDate: null,
          updatePendingPayments: true,
          externalReference: null,
          creditCard: {
            holderName: nomeCartao,
            number: numeroCartao.replace(/\s/g, ''),
            expiryMonth: month,
            expiryYear: fullYear,
            ccv: cvv
          },
          creditCardHolderInfo: {
            name: nomeCartao,
            email: email,
            cpfCnpj: documento.replace(/\D/g, ''),
            postalCode: cep.replace(/\D/g, ''),
            addressNumber: numero,
            phone: celular
          }
        };

        console.log('🚀 Enviando dados para API Asaas:', subscriptionData);
        const subscriptionResponse = await subscriptionService.createWithCreditCard(subscriptionData);
        console.log('✅ Assinatura criada:', subscriptionResponse);
      }

      // 3. Sucesso
      showSuccess(`Cadastro realizado com sucesso no Plano ${planoSelecionado === 'free' ? 'Free' : 'Pro'}! Você será redirecionado para o login.`);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      showError('Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div
      className="min-h-screen flex items-start justify-center pt-10 pb-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/src/assets/background-simples.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundColor: 'hsl(var(--color-bg-primary))',
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="/src/assets/Logo - Barbeiro Inteligente - Sem Fundo.png"
            alt="Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="mt-6 text-3xl font-extrabold text-primary-light">Crie sua conta</h2>

          <p className="mt-2 text-sm text-white-muted">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Faça o login
            </Link>
          </p>
        </div>

        <Card className="bg-bg-secondary text-text-secondary border border-border">
          <form className="space-y-6">
            {/* ETAPA 1: SELEÇÃO DE PLANOS */}
            {step === 1 && (
              <>
                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold text-primary-dark">Escolha seu Plano</h3>
                  <p className="text-text-muted">Selecione o plano ideal para sua barbearia</p>
                </div>

                {/* Seleção de Planos - Cards lado a lado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {planosDisponiveis.map((plano) => (
                    <div
                      key={plano.tipo}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                        planoSelecionado === plano.tipo
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setPlanoSelecionado(plano.tipo);
                        clearError('plano');
                      }}
                    >
                      {/* Header do card com título */}
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-primary-dark">{plano.nome}</h4>
                        <p className="text-sm text-text-muted">{plano.descricao}</p>
                      </div>

                      {/* Preço */}
                      <div className="text-center mb-4 py-3 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-primary">
                          {plano.preco === 0 ? 'Grátis' : `R$ ${plano.preco.toFixed(2)}`}
                        </div>
                        {plano.preco > 0 && (
                          <div className="text-sm text-text-muted">/mês</div>
                        )}
                      </div>
                          
                      {/* Recursos em lista vertical */}
                      <div className="space-y-2 mb-4">
                        {plano.recursos.map((recurso, index) => (
                          <div key={index} className="flex items-center text-sm text-text-secondary">
                            <span className="text-green-500 mr-2 text-base">✓</span>
                            {recurso}
                          </div>
                        ))}
                      </div>


                    </div>
                  ))}
                </div>
                
                {errors.plano && (
                  <p className="text-sm text-danger mt-4">{errors.plano}</p>
                )}
              </>
            )}

            {/* ETAPA 2: DADOS DA BARBEARIA */}
            {step === 2 && (
              <>
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-bold text-primary-dark">Dados da Barbearia</h3>
                  <p className="text-text-muted">Informe os dados básicos da sua barbearia</p>
                </div>

                <Input
                  label="Nome da Barbearia"
                  type="text"
                  value={nomeBarbearia}
                  onChange={(v) => { setNomeBarbearia(v); clearError('nomeBarbearia'); }}
                  id="nomeBarbearia"
                  error={errors.nomeBarbearia}
                  required
                />

                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); clearError('email'); }}
                  id="email"
                  error={errors.email}
                  required
                />

                <Input
                  label="Senha"
                  type="password"
                  value={senha}
                  onChange={(v) => { setSenha(v); clearError('senha'); }}
                  id="senha"
                  error={errors.senha}
                  placeholder="Mínimo 6 caracteres"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    Tipo de Documento
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="cpf"
                        checked={documentoTipo === 'cpf'}
                        onChange={(e) => {
                          setDocumentoTipo(e.target.value as 'cpf' | 'cnpj');
                          setDocumento('');
                          clearError('documento');
                        }}
                        className="mr-2"
                      />
                      CPF
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="cnpj"
                        checked={documentoTipo === 'cnpj'}
                        onChange={(e) => {
                          setDocumentoTipo(e.target.value as 'cpf' | 'cnpj');
                          setDocumento('');
                          clearError('documento');
                        }}
                        className="mr-2"
                      />
                      CNPJ
                    </label>
                  </div>
                </div>

                <Input
                  label={documentoTipo === 'cpf' ? 'CPF' : 'CNPJ'}
                  type="text"
                  value={documento}
                  onChange={(v) => { 
                    const formatted = documentoTipo === 'cpf' ? formatCPF(v) : formatCNPJ(v);
                    const maxLength = documentoTipo === 'cpf' ? 14 : 18; // CPF: xxx.xxx.xxx-xx, CNPJ: xx.xxx.xxx/xxxx-xx
                    if (formatted.length <= maxLength) {
                      setDocumento(formatted); 
                      clearError('documento');
                    }
                  }}
                  id="documento"
                  error={errors.documento}
                  placeholder={documentoTipo === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required
                />

                <Input
                  label="Celular"
                  type="tel"
                  value={celular}
                  onChange={(v) => { 
                    const formatted = formatPhone(v);
                    if (formatted.length <= 15) { // (xx) xxxxx-xxxx
                      setCelular(formatted); 
                      clearError('celular');
                    }
                  }}
                  id="celular"
                  error={errors.celular}
                  placeholder="(00) 00000-0000"
                  required
                />
              </>
            )}

            {/* ETAPA 3: ENDEREÇO */}
            {step === 3 && (
              <>
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-bold text-primary-dark">Endereço</h3>
                  <p className="text-text-muted">Informe o endereço da sua barbearia</p>
                </div>

                <Input
                  label="CEP"
                  type="text"
                  value={cep}
                  onChange={(v) => { 
                    const formatted = v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
                    if (formatted.length <= 9) {
                      setCep(formatted); 
                      clearError('cep');
                    }
                  }}
                  id="cep"
                  error={errors.cep}
                  placeholder="00000-000"
                  required
                />

                <Input
                  label="Endereço (Rua, Avenida, etc.)"
                  type="text"
                  value={endereco}
                  onChange={(v) => { setEndereco(v); clearError('endereco'); }}
                  id="endereco"
                  error={errors.endereco}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Número"
                    type="text"
                    value={numero}
                    onChange={(v) => { setNumero(v); clearError('numero'); }}
                    id="numero"
                    error={errors.numero}
                    required
                  />
                  <Input
                    label="Complemento"
                    type="text"
                    value={complemento}
                    onChange={(v) => { setComplemento(v); clearError('complemento'); }}
                    id="complemento"
                    placeholder="Opcional"
                  />
                </div>

                <Input
                  label="Bairro"
                  type="text"
                  value={bairro}
                  onChange={(v) => { setBairro(v); clearError('bairro'); }}
                  id="bairro"
                  error={errors.bairro}
                  required
                />
              </>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO E PAGAMENTO */}
            {step === 4 && (
              <>
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-bold text-primary-dark">
                    {planoSelecionado === 'free' ? 'Confirmação do Cadastro' : 'Dados de Pagamento'}
                  </h3>
                  <p className="text-text-muted">
                    {planoSelecionado === 'free' 
                      ? 'Revise suas informações e finalize seu cadastro gratuito'
                      : 'Informe os dados do cartão de crédito para o Plano Pro'
                    }
                  </p>
                </div>

                {/* Resumo do plano selecionado */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-primary-dark">
                      {planosDisponiveis.find(p => p.tipo === planoSelecionado)?.nome}
                    </h4>
                    <span className="text-lg font-bold text-primary">
                      {planoSelecionado === 'free' ? 'Grátis' : 'R$ 29,90/mês'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-3">
                    {planosDisponiveis.find(p => p.tipo === planoSelecionado)?.descricao}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>✓ Até {planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.barbeiros === 999 ? '∞' : planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.barbeiros} barbeiro(s)</div>
                    <div>✓ Até {planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.servicos === 999 ? '∞' : planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.servicos} serviço(s)</div>
                    <div className="col-span-2">✓ Até {planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.agendamentos === 999 ? '∞' : planosDisponiveis.find(p => p.tipo === planoSelecionado)?.limites.agendamentos} agendamento(s) {planoSelecionado === 'free' ? 'por mês' : ''}</div>
                  </div>
                </div>

                {/* Dados de pagamento apenas para plano Pro */}
                {planoSelecionado === 'pro' && (
                  <>
                    <div className="border-t border-border pt-6">
                      <h4 className="text-lg font-semibold text-primary-dark mb-4">Informações de Pagamento</h4>
                    </div>

                <Input
                  label="Nome Exato como no Cartão"
                  type="text"
                  value={nomeCartao}
                  onChange={(v) => { setNomeCartao(v.toUpperCase()); clearError('nomeCartao'); }}
                  id="nomeCartao"
                  error={errors.nomeCartao}
                  required
                />

                <Input
                  label="Número do Cartão"
                  type="text"
                  value={numeroCartao}
                  onChange={(v) => { 
                    const formatted = v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                    setNumeroCartao(formatted); 
                    clearError('numeroCartao'); 
                  }}
                  id="numeroCartao"
                  error={errors.numeroCartao}
                  placeholder="0000 0000 0000 0000"
                  required
                />

                <div className="grid grid-cols-3 gap-3">
                <div>
                    <label htmlFor="mesValidade" className="block text-sm font-medium text-text-secondary mb-1">
                      Mês
                  </label>
                  <select
                      id="mesValidade"
                      value={mesValidade}
                      onChange={(e) => { setMesValidade(e.target.value); clearError('mesValidade'); }}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${errors.mesValidade ? 'border-danger-border' : 'border-border'} bg-white`}
                    >
                      <option value="">Mês</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                  </select>
                    {errors.mesValidade && (
                      <p className="mt-1 text-sm text-danger">{errors.mesValidade}</p>
                  )}
                </div>

                  <div>
                    <label htmlFor="anoValidade" className="block text-sm font-medium text-text-secondary mb-1">
                      Ano
                    </label>
                    <select
                      id="anoValidade"
                      value={anoValidade}
                      onChange={(e) => { setAnoValidade(e.target.value); clearError('anoValidade'); }}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${errors.anoValidade ? 'border-danger-border' : 'border-border'} bg-white`}
                    >
                      <option value="">Ano</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors.anoValidade && (
                      <p className="mt-1 text-sm text-danger">{errors.anoValidade}</p>
                    )}
                  </div>

                  <Input
                    label="CVV"
                    type="text"
                    value={cvv}
                    onChange={(v) => { 
                      if (v.replace(/\D/g, '').length <= 4) {
                        setCvv(v.replace(/\D/g, '')); 
                        clearError('cvv');
                      }
                    }}
                    id="cvv"
                    error={errors.cvv}
                    placeholder="123"
                    required
                  />
                  </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-800">
                          🔒 Seus dados estão seguros. Utilizamos criptografia de ponta para proteger suas informações.
                        </p>
                        <p className="text-sm text-yellow-800">
                          💳 Após criar sua conta, processaremos automaticamente o pagamento do Plano Pro.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Mensagem para plano Free */}
                {planoSelecionado === 'free' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎉</span>
                      <div>
                        <h4 className="font-semibold text-green-800">Parabéns!</h4>
                        <p className="text-sm text-green-700">
                          Você está prestes a começar com o Plano Free. Clique em "Finalizar cadastro" para criar sua conta gratuita.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>Voltar</Button>
                )}
              </div>
              <div>
                {step < 4 ? (
                  <Button variant="primary" onClick={handleNext}>
                    {step === 3 && planoSelecionado === 'free' ? 'Finalizar cadastro' : 'Próxima etapa'}
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={isProcessing}
                  >
                    {isProcessing 
                      ? (planoSelecionado === 'pro' ? 'Processando pagamento...' : 'Criando conta...') 
                      : 'Finalizar cadastro'
                    }
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CadastroPage;