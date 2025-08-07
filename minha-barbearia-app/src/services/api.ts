// src/services/api.ts
import axios from 'axios';

// No futuro, aqui você colocará a URL base da sua API real.
const api = axios.create({
  baseURL: 'http://api.ficticia.com', 
});

export default api;