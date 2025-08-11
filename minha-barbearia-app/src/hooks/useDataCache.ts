import { useState, useEffect, useCallback } from 'react';

interface CacheConfig {
  key: string;
  ttl?: number; // Time to live em milliseconds (padrão: 5 minutos)
  fallbackToCache?: boolean; // Se deve usar cache quando API falhar
}

interface CacheData<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface UseDataCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  refresh: () => Promise<void>;
  invalidate: () => void;
  updateLocal: (updater: (current: T | null) => T | null) => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_VERSION = 1; // Incrementar quando estrutura de dados mudar

function useDataCache<T>(
  fetchFunction: () => Promise<T>,
  config: CacheConfig
): UseDataCacheReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const { key, ttl = DEFAULT_TTL, fallbackToCache = true } = config;

  // Ler do cache
  const readFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      
      // Verificar versão do cache
      if (cacheData.version !== CACHE_VERSION) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      // Verificar TTL
      if (Date.now() - cacheData.timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn(`Erro ao ler cache ${key}:`, error);
      return null;
    }
  }, [key, ttl]);

  // Escrever no cache
  const writeToCache = useCallback((data: T) => {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Erro ao escrever cache ${key}:`, error);
    }
  }, [key]);

  // Invalidar cache
  const invalidate = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
    setIsFromCache(false);
  }, [key]);

  // Buscar dados (API ou cache)
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Se não é refresh forçado, tenta usar cache primeiro
    if (!forceRefresh) {
      const cached = readFromCache();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setError(null);
        console.log(`📦 Dados carregados do cache: ${key}`);
        return;
      }
    }

    // Buscar da API
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🌐 Buscando dados da API: ${key}`);
      const result = await fetchFunction();
      
      setData(result);
      setIsFromCache(false);
      writeToCache(result);
      
      console.log(`✅ Dados atualizados da API: ${key}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar dados';
      setError(errorMessage);
      
      // Fallback para cache se configurado
      if (fallbackToCache) {
        const cached = readFromCache();
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          console.log(`🔄 Usando cache como fallback: ${key}`);
        }
      }
      
      console.error(`❌ Erro ao buscar ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, key, readFromCache, writeToCache, fallbackToCache]);

  // Atualizar dados localmente (optimistic updates)
  const updateLocal = useCallback((updater: (current: T | null) => T | null) => {
    setData(current => {
      const updated = updater(current);
      if (updated) {
        writeToCache(updated);
        setIsFromCache(false);
      }
      return updated;
    });
  }, [writeToCache]);

  // Refresh (força busca da API)
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refresh,
    invalidate,
    updateLocal
  };
}

export default useDataCache;
