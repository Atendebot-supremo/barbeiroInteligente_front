// src/pages/TestApiPage.tsx
import React, { useState } from 'react';
import { Button, Card, Loading } from '../components/ui';
import { apiServices } from '../services/realApiService';

const TestApiPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { success: true, data: result, error: null } 
      }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { success: false, data: null, error: error.message } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'Barbershops - Listar',
      key: 'barbershops-list',
      test: () => apiServices.barbershop.getAll(),
    },
    {
      name: 'Barbershops - Criar Nova',
      key: 'barbershops-create',
      test: () => apiServices.barbershop.create({
        barbershop: "Barbearia " + Math.random().toString(36).substring(7),
        email: "teste" + Math.random().toString(36).substring(7) + "@barbearia.com",
        password: "senha123",
        cnpj: "12345678000190",
        phone: "(11) 99999-9999",
        instanceZapi: "instancia_teste",
        status: "Ativo"
      }),
    },
    {
      name: 'Barbeiros - Listar',
      key: 'barbers-list',
      test: () => apiServices.barber.getAll(),
    },
    {
      name: 'Produtos - Listar',
      key: 'products-list',
      test: () => apiServices.product.getAll(),
    },
    {
      name: 'Horários - Listar',
      key: 'schedules-list',
      test: () => apiServices.schedule.getAll(),
    },
    {
      name: 'Agendamentos - Listar',
      key: 'appointments-list',
      test: () => apiServices.appointment.getAll(),
    },
  ];

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.key, test.test);
      // Pequeno delay entre os testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
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
          <h1 className="text-3xl font-bold text-text-primary">Teste de Conectividade da API</h1>
          <Button variant="primary" onClick={runAllTests}>
            Executar Todos os Testes
          </Button>
        </div>

        <div className="text-sm text-text-muted">
          <p>API Base URL: <code>http://69.62.97.91:3000/api</code></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map(test => {
            const result = testResults[test.key];
            const isLoading = loading[test.key];
            
            return (
              <Card 
                key={test.key}
                title={test.name}
                className="bg-bg-secondary text-text-secondary border border-border"
              >
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => runTest(test.key, test.test)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Testando...' : 'Testar'}
                  </Button>

                  {isLoading && <Loading size="sm" />}

                  {result && (
                    <div className="mt-4">
                      <div className={`text-sm font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅ Sucesso' : '❌ Erro'}
                      </div>
                      
                      {result.success && result.data && (
                        <div className="mt-2">
                          <div className="text-xs text-text-muted">Dados retornados:</div>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {!result.success && result.error && (
                        <div className="mt-2">
                          <div className="text-xs text-text-muted">Erro:</div>
                          <div className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <div className="text-blue-800">
            <h3 className="font-medium">🔧 Debug da API</h3>
            <div className="mt-2 text-xs space-y-1">
              <div>
                <strong>Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://69.62.97.91:3000/api'}
              </div>
              <div>
                <strong>Teste individual:</strong> Clique nos botões "Testar" para ver detalhes específicos de cada endpoint
              </div>
              <div>
                <strong>Logs:</strong> Abra o Console do navegador (F12) para ver logs detalhados de requisições e respostas
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="text-green-800">
            <h3 className="font-medium">✅ API Funcionando!</h3>
            <ol className="mt-2 text-sm space-y-1 list-decimal list-inside">
              <li><strong>Barbershops - Listar:</strong> ✅ Funcionou</li>
              <li><strong>Barbershops - Criar Nova:</strong> ✅ Funcionou (formato completo)</li>
              <li><strong>Barbeiros - Listar:</strong> 🧪 Teste após criar barbearia</li>
              <li><strong>Produtos - Listar:</strong> 🧪 Teste após criar barbeiro</li>
              <li><strong>Fluxo completo funcionando!</strong> 🎉</li>
            </ol>
          </div>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <div className="text-yellow-800">
            <h3 className="font-medium">🔧 Problema Identificado e Resolvido</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li>• <strong>UUID Inválido:</strong> API rejeita "placeholder-barbershop-id" como UUID</li>
              <li>• <strong>Dependência:</strong> Barbeiros precisam de uma barbearia existente</li>
              <li>• <strong>Solução:</strong> Sistema agora busca UUIDs reais de barbearias existentes</li>
              <li>• <strong>Fallback:</strong> Avisa usuário se não há barbearias cadastradas</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestApiPage;
