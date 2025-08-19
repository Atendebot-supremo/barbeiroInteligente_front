import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Card, Button, Input } from '../components/ui';
import { ArrowLeft, Check, CreditCard, Shield, Star, Zap } from 'lucide-react';
import { subscriptionService } from '../services/realApiService';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  const { success: showSuccess, error: showError, warning: showWarning } = useNotification();

  // Estados do formulário de pagamento
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cpf: '',
    email: user?.email || '',
    cep: '',
    endereco: '',
    telefone: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Dados do plano Pro
  const proplanData = {
    name: 'Plano Pro',
    price: 97.00,
    originalPrice: 147.00,
    discount: 34,
    features: [
      'Dashboard com métricas avançadas',
      'Barbeiros ilimitados',
      'Serviços ilimitados',
      'Agendamentos ilimitados',
      'Relatórios detalhados',
      'Suporte prioritário',
      'Backup automático',
      'Integrações avançadas'
    ]
  };

  // Formatação de campos
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 8) {
      return v.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const formatTelefone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'cardNumber':
        setPaymentData(prev => ({ ...prev, [field]: formatCardNumber(value) }));
        break;
      case 'expiryDate':
        setPaymentData(prev => ({ ...prev, [field]: formatExpiryDate(value) }));
        break;
      case 'cpf':
        setPaymentData(prev => ({ ...prev, [field]: formatCPF(value) }));
        break;
      case 'cep':
        setPaymentData(prev => ({ ...prev, [field]: formatCEP(value) }));
        break;
      case 'telefone':
        setPaymentData(prev => ({ ...prev, [field]: formatTelefone(value) }));
        break;
      case 'cvv':
        if (value.length <= 4) {
          setPaymentData(prev => ({ ...prev, [field]: value.replace(/\D/g, '') }));
        }
        break;
      default:
        setPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    const { cardName, cardNumber, expiryDate, cvv, cpf, email, cep, endereco, telefone } = paymentData;
    
    if (!cardName.trim()) {
      showError('Nome no cartão é obrigatório');
      return false;
    }
    
    if (cardNumber.replace(/\s/g, '').length < 16) {
      showError('Número do cartão deve ter 16 dígitos');
      return false;
    }
    
    if (expiryDate.length < 5) {
      showError('Data de validade é obrigatória');
      return false;
    }
    
    if (cvv.length < 3) {
      showError('CVV deve ter pelo menos 3 dígitos');
      return false;
    }
    
    if (cpf.replace(/\D/g, '').length < 11) {
      showError('CPF é obrigatório');
      return false;
    }
    
    if (!email.trim()) {
      showError('Email é obrigatório');
      return false;
    }
    
    if (cep.replace(/\D/g, '').length < 8) {
      showError('CEP é obrigatório');
      return false;
    }
    
    if (!endereco.trim()) {
      showError('Endereço é obrigatório');
      return false;
    }
    
    if (telefone.replace(/\D/g, '').length < 10) {
      showError('Telefone é obrigatório');
      return false;
    }
    
    return true;
  };

  const handleUpgrade = async () => {
    if (!validateForm()) return;

    // Verificar se o clientId está disponível
    if (!user?.clientId) {
      showError('ClientId não encontrado. Entre em contato com o suporte para configurar sua conta.');
      return;
    }

    const customerId = user.clientId;

    setIsProcessing(true);
    try {
      // Preparar dados para a API Asaas
      const { cardName, cardNumber, expiryDate, cvv, cpf, email, cep, endereco, telefone } = paymentData;
      
      // Extrair mês e ano da data de validade
      const [month, year] = expiryDate.split('/');
      const fullYear = `20${year}`; // Converter AA para 20AA
      
      // Calcular próxima data de cobrança (próximo mês)
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      const dueDateString = nextDueDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const subscriptionData = {
        customer: customerId,
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
        interest: {
          value: 0
        },
        fine: {
          value: 0,
          type: "FIXED"
        },
        endDate: null,
        updatePendingPayments: true,
        externalReference: null,
        creditCard: {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ''), // Remover espaços
          expiryMonth: month,
          expiryYear: fullYear,
          ccv: cvv
        },
        creditCardHolderInfo: {
          name: cardName,
          email: email,
          cpfCnpj: cpf.replace(/\D/g, ''), // Remover formatação
          postalCode: cep.replace(/\D/g, ''), // Remover formatação
          addressNumber: endereco,
          phone: telefone
        }
      };

      console.log('👤 Dados do usuário completos:', user);
      console.log('🆔 Customer ID usado:', customerId);
      
      if (!user?.clientId) {
        console.warn('⚠️ PROBLEMA: clientId não encontrado no objeto user');
        console.log('🔍 Campos disponíveis no user:', Object.keys(user || {}));
      }
      console.log('🚀 Enviando dados para API Asaas:', subscriptionData);
      
      const response = await subscriptionService.createWithCreditCard(subscriptionData);
      
      console.log('✅ Resposta da API:', response);
      
      // Atualizar dados do usuário no contexto
      await refreshUserData();
      
      showSuccess('Upgrade realizado com sucesso! Bem-vindo ao Plano Pro!');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Erro no upgrade:', error);
      showError('Erro ao processar pagamento. Verifique os dados e tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/src/assets/background-simples.png')",
        backgroundRepeat: 'repeat',
        backgroundColor: 'hsl(var(--color-bg-primary))',
      }}
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-light">Upgrade para Pro</h1>
            <p className="text-text-secondary mt-2">Libere todo o potencial da sua barbearia</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Informações do Plano */}
          <div className="space-y-6">
            {/* Card do Plano Pro */}
            <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="absolute top-4 right-4">
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {proplanData.discount}% OFF
                </span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-2xl font-bold text-purple-800">{proplanData.name}</h2>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-purple-800">
                      R$ {proplanData.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-lg text-text-secondary ml-2">/mês</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-lg line-through text-gray-500">
                      R$ {proplanData.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="ml-2 text-sm text-green-600 font-semibold">
                      Economize R$ {(proplanData.originalPrice - proplanData.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Recursos inclusos:
                  </h3>
                  {proplanData.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Garantia */}
            <Card className="bg-green-50 border border-green-200">
              <div className="p-4 flex items-center">
                <Shield className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-green-800">Garantia de 7 dias</h3>
                  <p className="text-sm text-green-700">
                    Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 7 dias.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Formulário de Pagamento */}
          <div>
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <CreditCard className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-xl font-semibold text-primary-dark">Dados de Pagamento</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nome no Cartão *
                    </label>
                    <Input
                      type="text"
                      placeholder="Nome como está no cartão"
                      value={paymentData.cardName}
                      onChange={(value) => handleInputChange('cardName', value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Número do Cartão *
                    </label>
                    <Input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={paymentData.cardNumber}
                      onChange={(value) => handleInputChange('cardNumber', value)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Validade *
                      </label>
                      <Input
                        type="text"
                        placeholder="MM/AA"
                        value={paymentData.expiryDate}
                        onChange={(value) => handleInputChange('expiryDate', value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        CVV *
                      </label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(value) => handleInputChange('cvv', value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      CPF *
                    </label>
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={paymentData.cpf}
                      onChange={(value) => handleInputChange('cpf', value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={paymentData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Telefone *
                    </label>
                    <Input
                      type="tel"
                      placeholder="(34) 98858-5271"
                      value={paymentData.telefone}
                      onChange={(value) => handleInputChange('telefone', value)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        CEP *
                      </label>
                      <Input
                        type="text"
                        placeholder="00000-000"
                        value={paymentData.cep}
                        onChange={(value) => handleInputChange('cep', value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Número *
                      </label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={paymentData.endereco}
                        onChange={(value) => handleInputChange('endereco', value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumo do Pedido */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Resumo do Pedido</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plano Pro (mensal)</span>
                      <span>R$ {proplanData.originalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({proplanData.discount}%)</span>
                      <span>-R$ {(proplanData.originalPrice - proplanData.price).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Valor de teste</span>
                      <span>-R$ {(proplanData.price - 1.00).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total (Teste)</span>
                      <span>R$ 1,00</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Upgrade */}
                <Button
                  variant="primary"
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full mt-6 py-3 text-lg font-semibold"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    `Fazer Upgrade - R$ 1,00/mês (Teste)`
                  )}
                </Button>

                <p className="text-xs text-text-muted mt-4 text-center">
                  Seus dados estão seguros e protegidos. O pagamento é processado de forma segura.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
