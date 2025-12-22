// App constants
export const APP_NAME = 'StockFlow';

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  PRODUCTS: '/api/products',
  PURCHASE_ORDERS: '/api/purchase_orders',
  SALES_ORDERS: '/api/sales_orders',
  WAREHOUSES: '/api/warehouses',
  CUSTOMERS: '/api/customers',
  SUPPLIERS: '/api/suppliers',
  CATEGORIES: '/api/product_categories',
  STAFF: '/api/staff',
  INVENTORY: '/api/inventory_transactions',
};

// Status colors
export const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#2196F3',
  confirmed: '#2196F3',
  received: '#4CAF50',
  shipped: '#9C27B0',
  delivered: '#4CAF50',
  cancelled: '#f44336',
  default: '#666',
};

// Common styles
export const COMMON_STYLES = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 12,
  },
  searchContainer: {
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
};