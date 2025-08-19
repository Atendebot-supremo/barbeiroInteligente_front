// src/services/api.ts
import axios from 'axios';

// Configuração da API real
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://69.62.97.91:3000/api';
console.log('🌐 Base URL da API:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para anexar Authorization se houver token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    console.error('Response data:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Request URL:', error.config?.url);
    console.error('Request method:', error.config?.method);
    console.error('Request data:', error.config?.data);
    
    if (error.response) {
      // Erro de resposta da API
      let message;
      
      // Tratamento especial para "Too Many Requests" (status 429)
      if (error.response.status === 429) {
        message = 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.';
      } else {
        message = error.response.data?.message || `Erro ${error.response.status}: ${error.response.statusText}`;
      }
      
      throw new Error(message);
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      // Erro de configuração
      throw new Error('Erro de configuração da requisição');
    }
  }
);

export default api;