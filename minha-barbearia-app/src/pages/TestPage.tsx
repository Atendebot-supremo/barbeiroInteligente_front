import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Funcionando!
          </h1>
          <p className="text-gray-600 mb-6">
            O Tailwind CSS está funcionando corretamente!
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Componentes UI</h3>
              <p className="text-blue-600 text-sm">Button, Input, Card, Loading</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Contexts</h3>
              <p className="text-green-600 text-sm">AuthContext para autenticação</p>
            </div>
            
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Hooks</h3>
              <p className="text-purple-600 text-sm">useLocalStorage, useApi</p>
            </div>
            
            <div className="bg-orange-100 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">Utils</h3>
              <p className="text-orange-600 text-sm">Validação e formatação</p>
            </div>
          </div>
          
          <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
