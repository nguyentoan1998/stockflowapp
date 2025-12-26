import { useMutation } from '@tanstack/react-query';
import { useApi } from '../contexts/ApiContext';
import { invalidateQuery } from '../services/queryClient';

/**
 * Custom hook for mutations with automatic cache invalidation
 * After create/update/delete, automatically refetch the list
 * @param {string} endpoint - API endpoint (e.g., 'customers')
 * @param {string} method - HTTP method (create, update, delete)
 */
export const useMutateData = (endpoint, method = 'create') => {
  const { api } = useApi();

  const mutation = useMutation({
    mutationFn: async (payload) => {
      let response;

      if (method === 'create') {
        response = await api.post(`/api/${endpoint}`, payload);
      } else if (method === 'update') {
        const { id, data } = payload;
        response = await api.put(`/api/${endpoint}/${id}`, data);
      } else if (method === 'delete') {
        response = await api.delete(`/api/${endpoint}/${payload}`);
      }

      return response.data.data || response.data;
    },
    // Automatically invalidate the list query after mutation
    onSuccess: (data, variables) => {
      // Tell TanStack Query that the list is stale
      // It will automatically refetch when the component needs it
      invalidateQuery([endpoint]);
    },
    onError: (error) => {
      console.error(`Error during ${method} for ${endpoint}:`, error.message);
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error?.message,
    data: mutation.data,
  };
};

export default useMutateData;
