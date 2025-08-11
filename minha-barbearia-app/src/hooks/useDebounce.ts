import { useState, useEffect } from 'react';

/**
 * Hook para fazer debounce de valores
 * Útil para campos de busca para evitar muitas chamadas de API
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em milliseconds (padrão: 500ms)
 * @returns Valor debounced
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
