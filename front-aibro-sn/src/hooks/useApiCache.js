// src/hooks/useApiCache.js
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

// Simple in-memory cache
const cache = new Map();

// Cache invalidation after 5 minutes by default
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

export const useApiCache = (endpoint, options = {}) => {
  const { 
    enabled = true, 
    cacheTime = DEFAULT_CACHE_TIME,
    dependencies = [],
    transform = data => data,
    onSuccess = () => {},
    onError = () => {},
    refetchOnMount = true
  } = options;
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const cacheKey = endpoint + JSON.stringify(dependencies);
  
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);
  
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    
    // Check if we have cached data
    const cachedData = cache.get(cacheKey);
    const now = new Date().getTime();
    
    if (!force && cachedData && (now - cachedData.timestamp < cacheTime)) {
      setData(cachedData.data);
      setIsLoading(false);
      onSuccess(cachedData.data);
      return;
    }
    
    // Reset state
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await api.get(endpoint, {
        signal: abortControllerRef.current.signal
      });
      
      const transformedData = transform(response.data);
      
      // Update cache
      cache.set(cacheKey, {
        data: transformedData,
        timestamp: now
      });
      
      setData(transformedData);
      onSuccess(transformedData);
    } catch (err) {
      // Ignore aborted requests
      if (err.name === 'AbortError') return;
      
      setError(err);
      onError(err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [cacheKey, cacheTime, endpoint, enabled, transform, onSuccess, onError]);
  
  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
    
    return () => {
      // Cancel any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, refetchOnMount, ...dependencies]);
  
  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),  // Force refetch
    invalidateCache
  };
};

// Additional hook for mutations (POST, PUT, DELETE requests)
export const useApiMutation = (method, endpoint, options = {}) => {
  const {
    onSuccess = () => {},
    onError = () => {},
    invalidateQueries = []
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const mutate = async (data = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api[method.toLowerCase()](endpoint, data);
      
      // Invalidate queries if needed
      invalidateQueries.forEach(query => {
        cache.delete(query);
      });
      
      onSuccess(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      onError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    mutate,
    isLoading,
    error
  };
};