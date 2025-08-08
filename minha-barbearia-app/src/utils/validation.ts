// Funções de validação reutilizáveis

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email é obrigatório';
  if (!emailRegex.test(email)) return 'Email inválido';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 4) return 'Senha deve ter pelo menos 4 caracteres';
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  if (!phone) return null; // Telefone é opcional
  if (!phoneRegex.test(phone)) return 'Telefone inválido';
  return null;
};

export const validatePrice = (price: number): string | null => {
  if (price < 0) return 'Preço não pode ser negativo';
  if (price === 0) return 'Preço deve ser maior que zero';
  return null;
};

export const validateDuration = (duration: number): string | null => {
  if (duration <= 0) return 'Duração deve ser maior que zero';
  if (duration > 480) return 'Duração não pode ser maior que 8 horas';
  return null;
};
