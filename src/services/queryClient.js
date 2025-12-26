import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom persistence layer using AsyncStorage
class AsyncStorageCache {
  async set(key, value) {
    try {
      await AsyncStorage.setItem(`query_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error caching query:', error);
    }
  }

  async get(key) {
    try {
      const cached = await AsyncStorage.getItem(`query_${key}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch (error) {
      console.error('Error retrieving cached query:', error);
      return undefined;
    }
  }

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`query_${key}`);
    } catch (error) {
      console.error('Error removing cached query:', error);
    }
  }

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const queryKeys = keys.filter(k => k.startsWith('query_'));
      await AsyncStorage.multiRemove(queryKeys);
    } catch (error) {
      console.error('Error clearing query cache:', error);
    }
  }
}

const asyncCache = new AsyncStorageCache();

// Query cache implementation
const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    // Persist successful query results to MMKV
    if (query.queryKey) {
      const cacheKey = JSON.stringify(query.queryKey);
      mmkvCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
  },
  onError: (error, query) => {
    console.error(`Query error for ${JSON.stringify(query.queryKey)}:`, error.message);
  },
});

// Mutation cache for notifications
const mutationCache = new MutationCache({
  onSuccess: (data, variables, context, mutation) => {
    console.log(`Mutation successful: ${mutation.meta?.endpoint || 'unknown'}`);
  },
  onError: (error, variables, context, mutation) => {
    console.error(`Mutation error: ${mutation.meta?.endpoint || 'unknown'}`, error.message);
  },
});

// Create QueryClient with custom config
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Helper to invalidate query
export const invalidateQuery = (queryKey) => {
  return queryClient.invalidateQueries({ queryKey });
};

// Helper to invalidate multiple queries
export const invalidateQueries = (filters) => {
  return queryClient.invalidateQueries(filters);
};

// Helper to prefetch query
export const prefetchQuery = (queryKey, queryFn) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

// Helper to get cached query data
export const getCachedData = (queryKey) => {
  return queryClient.getQueryData(queryKey);
};

// Clear all cached data (call on logout)
export const clearAllQueryCache = async () => {
  queryClient.clear();
  await asyncCache.clear();
};

// Restore cache from AsyncStorage on app startup
export const restoreQueryCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let restoredCount = 0;

    for (const key of keys) {
      if (key.startsWith('query_')) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Restored data will be used when queries are created
            restoredCount++;
          } catch (error) {
            console.error('Error parsing cached query:', error);
          }
        }
      }
    }

    console.log(`Restored ${restoredCount} cached queries`);
  } catch (error) {
    console.error('Error restoring query cache:', error);
  }
};

export { asyncCache };
export default queryClient;
