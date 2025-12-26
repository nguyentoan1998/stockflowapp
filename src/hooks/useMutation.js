import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addItem, updateItem, deleteItem } from '../redux/slices/dataSlice';

/**
 * Custom hook for handling mutations (create, update, delete)
 * Updates both Redux store and MMKV cache automatically
 * @param {string} endpoint - API endpoint (e.g., 'customers')
 * @param {object} api - axios instance
 */
export const useMutation = (endpoint, api) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create new item
  const create = useCallback(
    async (data) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post(`/api/${endpoint}`, data);
        const newItem = response.data.data || response.data;

        // Update Redux store
        dispatch(addItem({ type: endpoint, item: newItem }));

        return { success: true, data: newItem };
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Create failed';
        setError(errorMessage);
        console.error(`Error creating ${endpoint}:`, err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, api, dispatch]
  );

  // Update existing item
  const update = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.put(`/api/${endpoint}/${id}`, data);
        const updatedItem = response.data.data || response.data;

        // Update Redux store
        dispatch(updateItem({ type: endpoint, id, item: updatedItem }));

        return { success: true, data: updatedItem };
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Update failed';
        setError(errorMessage);
        console.error(`Error updating ${endpoint}:`, err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, api, dispatch]
  );

  // Delete item
  const remove = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        await api.delete(`/api/${endpoint}/${id}`);

        // Update Redux store
        dispatch(deleteItem({ type: endpoint, id }));

        return { success: true };
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Delete failed';
        setError(errorMessage);
        console.error(`Error deleting ${endpoint}:`, err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, api, dispatch]
  );

  // Batch create
  const createBatch = useCallback(
    async (items) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post(`/api/${endpoint}/batch`, { items });
        const createdItems = response.data.data || response.data;

        // Update Redux store with all items
        createdItems.forEach((item) => {
          dispatch(addItem({ type: endpoint, item }));
        });

        return { success: true, data: createdItems };
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Batch create failed';
        setError(errorMessage);
        console.error(`Error batch creating ${endpoint}:`, err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, api, dispatch]
  );

  return {
    create,
    update,
    remove,
    createBatch,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useMutation;
