// API service functions for the StockFlow app
import { useApi } from '../contexts/ApiContext';

export const useStockFlowApi = () => {
  const { api } = useApi();

  return {
    // Products
    getProducts: (params = {}) => api.get('/api/products', { params }),
    getProduct: (id) => api.get(`/api/products/${id}`),
    createProduct: (data) => api.post('/api/products', data),
    updateProduct: (id, data) => api.put(`/api/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/api/products/${id}`),

    // Purchase Orders
    getPurchaseOrders: (params = {}) => api.get('/api/purchase_orders', { params }),
    getPurchaseOrder: (id) => api.get(`/api/purchase_orders/${id}`),
    createPurchaseOrder: (data) => api.post('/api/purchase_orders', data),
    updatePurchaseOrder: (id, data) => api.put(`/api/purchase_orders/${id}`, data),
    deletePurchaseOrder: (id) => api.delete(`/api/purchase_orders/${id}`),

    // Sales Orders
    getSalesOrders: (params = {}) => api.get('/api/sales_orders', { params }),
    getSalesOrder: (id) => api.get(`/api/sales_orders/${id}`),
    createSalesOrder: (data) => api.post('/api/sales_orders', data),
    updateSalesOrder: (id, data) => api.put(`/api/sales_orders/${id}`, data),
    deleteSalesOrder: (id) => api.delete(`/api/sales_orders/${id}`),

    // Warehouses
    getWarehouses: (params = {}) => api.get('/api/warehouses', { params }),
    getWarehouse: (id) => api.get(`/api/warehouses/${id}`),
    createWarehouse: (data) => api.post('/api/warehouses', data),
    updateWarehouse: (id, data) => api.put(`/api/warehouses/${id}`, data),
    deleteWarehouse: (id) => api.delete(`/api/warehouses/${id}`),

    // Customers
    getCustomers: (params = {}) => api.get('/api/customers', { params }),
    getCustomer: (id) => api.get(`/api/customers/${id}`),
    createCustomer: (data) => api.post('/api/customers', data),
    updateCustomer: (id, data) => api.put(`/api/customers/${id}`, data),
    deleteCustomer: (id) => api.delete(`/api/customers/${id}`),

    // Suppliers
    getSuppliers: (params = {}) => api.get('/api/suppliers', { params }),
    getSupplier: (id) => api.get(`/api/suppliers/${id}`),
    createSupplier: (data) => api.post('/api/suppliers', data),
    updateSupplier: (id, data) => api.put(`/api/suppliers/${id}`, data),
    deleteSupplier: (id) => api.delete(`/api/suppliers/${id}`),

    // Categories
    getProductCategories: (params = {}) => api.get('/api/product_categories', { params }),
    
    // Inventory
    getInventoryTransactions: (params = {}) => api.get('/api/inventory_transactions', { params }),
    
    // Staff
    getStaff: (params = {}) => api.get('/api/staff', { params }),
  };
};