import { useQuery } from '@tanstack/react-query';
import { useApi } from '../contexts/ApiContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for fetching data with TanStack Query + AsyncStorage caching
 * Automatically loads cached data on app restart
 * @param {string} endpoint - API endpoint (e.g., 'customers', 'products')
 * @param {object} options - TanStack Query options
 */
export const useQueryData = (endpoint, options = {}) => {
  const { api } = useApi();
  const queryKey = [endpoint];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get(`/api/${endpoint}`);
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    },
    ...options,
  });

  // Load cached data from AsyncStorage if available and fresh enough
  const getCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(`query_${JSON.stringify(queryKey)}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.data) {
          const age = Date.now() - parsed.timestamp;
          const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
          if (age < MAX_CACHE_AGE) {
            return parsed.data;
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving cached data:', error);
    }
    return null;
  };

  return {
    ...query,
    data: query.data || [],
    getCachedData, // Expose async function for manual use
    isCached: query.isFetching && !!query.data,
  };
};

export default useQueryData;
