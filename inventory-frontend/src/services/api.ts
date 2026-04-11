import axios from 'axios';
import type {
  CompanyOverviewReport,
  InventoryLog,
  MonthlyReport,
  Order,
  PickupRequest,
  Product,
  ProductCategory,
  ProductPayload,
  SalesPerformanceReport,
  NotificationItem,
  User,
  WarehouseDashboard,
} from '../types';

const authClient = axios.create({
  baseURL: '/auth',
  withCredentials: true,
});

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return authClient.post('/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  logout: () => authClient.get('/logout'),
  getCurrentUser: (): Promise<User> => api.get('/user/current').then((res) => res.data),
};

// Product API
export const productApi = {
  getAll: (params?: { keyword?: string; categoryId?: number }): Promise<Product[]> =>
    api.get('/products', { params }).then((res) => res.data),
  getById: (id: number): Promise<Product> =>
    api.get(`/products/${id}`).then((res) => res.data),
  getInventoryLogs: (id: number): Promise<InventoryLog[]> =>
    api.get(`/products/${id}/inventory-logs`).then((res) => res.data),
  getCategories: (): Promise<ProductCategory[]> =>
    api.get('/products/categories').then((res) => res.data),
  getLowStock: (): Promise<Product[]> =>
    api.get('/products/low-stock').then((res) => res.data),
  create: (data: ProductPayload) =>
    api.post('/products', data),
  update: (id: number, data: Omit<ProductPayload, 'stockQuantity'>) =>
    api.put(`/products/${id}`, data),
  delete: (id: number) =>
    api.delete(`/products/${id}`),
};

// Request API
export const requestApi = {
  getAll: (params?: { status?: string }): Promise<PickupRequest[]> =>
    api.get('/requests', { params }).then((res) => res.data),
  getById: (id: number): Promise<PickupRequest> =>
    api.get(`/requests/${id}`).then((res) => res.data),
  getPending: (): Promise<PickupRequest[]> =>
    api.get('/requests/pending').then((res) => res.data),
  create: (data: {
    customerName: string;
    projectName: string;
    remark?: string;
    items: { productId: number; quantity: number; unitPrice: number }[];
  }) => api.post('/requests', data),
  update: (id: number, data: Partial<PickupRequest>) =>
    api.put(`/requests/${id}`, data),
  cancel: (id: number) =>
    api.post(`/requests/${id}/cancel`),
  approve: (id: number) =>
    api.post(`/requests/${id}/approve`),
  reject: (id: number, comment: string) =>
    api.post(`/requests/${id}/reject`, { comment }),
};

// Order API
export const orderApi = {
  getAll: (params?: { status?: string }): Promise<Order[]> =>
    api.get('/orders', { params }).then((res) => res.data),
  getById: (id: number): Promise<Order> =>
    api.get(`/orders/${id}`).then((res) => res.data),
  create: (data: { requestId: number; actualAmount: number; remark?: string }) =>
    api.post('/orders', data),
  complete: (id: number) =>
    api.post(`/orders/${id}/complete`),
  cancel: (id: number) =>
    api.post(`/orders/${id}/cancel`),
};

// Warehouse API
export const warehouseApi = {
  getDashboard: (): Promise<WarehouseDashboard> =>
    api.get('/warehouse/dashboard').then((res) => res.data),
  getLogs: (params?: { productId?: number; startDate?: string; endDate?: string }): Promise<InventoryLog[]> =>
    api.get('/warehouse/logs', { params }).then((res) => res.data),
};

// User API
export const userApi = {
  getAll: (): Promise<User[]> =>
    api.get('/users').then((res) => res.data),
  getById: (id: number): Promise<User> =>
    api.get(`/users/${id}`).then((res) => res.data),
  create: (data: { username: string; password: string; realName: string; role: 'MANAGER' | 'SALES'; email?: string; phone?: string }) =>
    api.post('/users', data),
  update: (id: number, data: { realName: string; role: 'MANAGER' | 'SALES'; email?: string; phone?: string }) =>
    api.put(`/users/${id}`, data),
  enable: (id: number) =>
    api.post(`/users/${id}/enable`),
  disable: (id: number) =>
    api.post(`/users/${id}/disable`),
  delete: (id: number) =>
    api.post(`/users/${id}/disable`),
};

// Report API
export const reportApi = {
  getCompanyReport: (params?: { month?: string }): Promise<CompanyOverviewReport> =>
    api.get('/reports/company', { params }).then((res) => res.data),
  getSalesReport: (params?: { userId?: number; month?: string }): Promise<SalesPerformanceReport> =>
    api.get('/reports/sales', { params }).then((res) => res.data),
  getSalesUsers: (): Promise<User[]> =>
    api.get('/reports/sales-users').then((res) => res.data),
  getMonthlyReport: (year: number, month: number): Promise<MonthlyReport> =>
    api.get('/reports/monthly', { params: { year, month } }).then((res) => res.data),
};

// Notification API
export const notificationApi = {
  getAll: (limit = 10): Promise<NotificationItem[]> =>
    api.get('/notifications', { params: { limit } }).then((res) => res.data),
  getUnreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then((res) => res.data.count),
  markAsRead: (id: number) =>
    api.post(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.post('/notifications/read-all'),
};

export default api;
