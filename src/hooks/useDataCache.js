import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData, setListData, clearData } from '../redux/slices/dataSlice';
import { selectList, selectLoading, selectError, selectLastUpdated } from '../redux/slices/dataSlice';
import { CacheStorage } from '../utils/storage';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Custom hook for data fetching with intelligent caching
 * - Uses Redux Persist for offline data
 * - Uses MMKV for fast cache checking
 * - Supports background sync
 * @param {string} endpoint - API endpoint (e.g., 'customers', 'products')
 * @param {object} api - axios instance
 * @param {object} options - { forceRefresh, syncInterval }
 */
export const useDataCache = (endpoint, api, options = {}) => {
  const dispatch = useDispatch();
  const { forceRefresh = false, syncInterval = null } = options;
  
  // Get data from Redux store
  const data = useSelector((state) => selectList(state, endpoint));
  const loading = useSelector((state) => selectLoading(state, endpoint));
  const error = useSelector((state) => selectError(state, endpoint));
  const lastUpdated = useSelector((state) => selectLastUpdated(state, endpoint));
  
  const fetchInProgress = useRef(false);
  const syncIntervalRef = useRef(null);

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    if (!lastUpdated) return false;
    const now = Date.now();
    return now - lastUpdated < CACHE_DURATION;
  }, [lastUpdated]);

  // Fetch data from server
  const fetchFromServer = useCallback(async () => {
    if (fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      const response = await api.get(`/api/${endpoint}`);
      
      const listData = response.data.data || response.data;
      dispatch(setListData({ type: endpoint, data: listData }));
      
      // Cache the timestamp
      CacheStorage.set(`${endpoint}_lastFetch`, Date.now());
      
      return listData;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    } finally {
      fetchInProgress.current = false;
    }
  }, [endpoint, api, dispatch]);

  // Refresh data from server (force refresh)
  const refresh = useCallback(async () => {
    try {
      return await fetchFromServer();
    } catch (err) {
      console.error('Error refreshing data:', err);
      return null;
    }
  }, [fetchFromServer]);

  // Load data with intelligent caching
  const loadData = useCallback(async () => {
    // Force refresh
    if (forceRefresh) {
      return await fetchFromServer();
    }

    // Check if cache is valid
    if (isCacheValid() && data && data.length > 0) {
      return data; // Return cached data
    }

    // Cache expired or no data - fetch from server
    return await fetchFromServer();
  }, [forceRefresh, isCacheValid, data, fetchFromServer]);

  // Clear cache
  const clearCache = useCallback(() => {
    dispatch(clearData({ type: endpoint }));
    CacheStorage.remove(`${endpoint}_lastFetch`);
  }, [endpoint, dispatch]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [endpoint]); // Only load once per endpoint change

  // Setup background sync if needed
  useEffect(() => {
    if (!syncInterval || !api) return;

    syncIntervalRef.current = setInterval(() => {
      fetchFromServer().catch((err) => {
        console.error('Background sync error:', err);
      });
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncInterval, api, fetchFromServer]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    loadData,
    clearCache,
    isCacheValid: isCacheValid(),
  };
};

export default useDataCache;
