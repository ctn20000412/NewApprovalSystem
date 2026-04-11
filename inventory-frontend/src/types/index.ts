export type UserRole = 'MANAGER' | 'SALES';
export type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADJUSTED'
  | 'COMPLETED'
  | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type InventoryChangeType = 'IN' | 'OUT' | 'ADJUST';

export interface User {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  roleDescription: string;
  email?: string;
  phone?: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent?: {
    id: number;
    name: string;
  };
  status: number;
}

export interface Product {
  id: number;
  name: string;
  spec: string;
  model: string;
  description?: string;
  unit: string;
  price: number;
  costPrice: number;
  retailPrice: number;
  stockQuantity: number;
  minStock: number;
  status: number;
  active: boolean;
  categoryId?: number;
  categoryName?: string;
  category?: ProductCategory;
}

export interface ProductPayload {
  name: string;
  categoryId: number;
  spec: string;
  unit: string;
  costPrice: number;
  retailPrice: number;
  stockQuantity?: number;
  minStock: number;
}

export interface RequestItem {
  id: number;
  product?: Product;
  productId?: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PickupRequest {
  id: number;
  requestNo: string;
  applicant: User;
  customerName: string;
  projectName: string;
  remark?: string;
  totalAmount: number;
  estimatedAmount: number;
  status: RequestStatus;
  statusDescription: string;
  items: RequestItem[];
  createdAt: string;
  salesId?: number;
  salesName?: string;
  approvedBy?: User;
  approvedAt?: string;
  approvedComment?: string;
}

export interface Order {
  id: number;
  orderNo: string;
  requestId?: number;
  request?: Pick<PickupRequest, 'id' | 'requestNo' | 'customerName' | 'projectName'>;
  sales?: User;
  salesId?: number;
  salesName?: string;
  customerName: string;
  projectName: string;
  totalAmount: number;
  actualAmount: number;
  remark?: string;
  status: OrderStatus;
  statusDescription: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  items?: RequestItem[];
}

export interface InventoryLog {
  id: number;
  product?: Product;
  productId?: number;
  productName?: string;
  productSpec?: string;
  productUnit?: string;
  type?: InventoryChangeType;
  changeType?: InventoryChangeType;
  changeTypeDescription?: string;
  quantity: number;
  rawQuantity?: number;
  beforeStock?: number;
  afterStock?: number;
  beforeQuantity?: number;
  afterQuantity?: number;
  balance?: number;
  operatorName?: string;
  orderId?: number;
  orderNo?: string;
  remark?: string;
  createdAt: string;
}

export interface WarehouseDashboard {
  totalProducts: number;
  totalStockQuantity: number;
  lowStockCount: number;
  inventoryValue: number;
  lowStockProducts: Product[];
  recentLogs: InventoryLog[];
}

export interface SalesPerformanceReport {
  year?: number;
  month?: number;
  userId?: number;
  salesName: string;
  orderCount: number;
  totalAmount: number;
  customerCount: number;
  avgPrice: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  orderCount: number;
  totalAmount: number;
  salesRanking: SalesPerformanceReport[];
}

export interface CompanyOverviewReport {
  year: number;
  month: number;
  totalOrders: number;
  totalRevenue: number;
  activeSalesCount: number;
  totalSalesCount: number;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export type NotificationType =
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_ADJUSTED'
  | 'ORDER_CREATED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'SYSTEM';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content?: string;
  targetPath?: string;
  relatedId?: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
