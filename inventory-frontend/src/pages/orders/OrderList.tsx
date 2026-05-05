import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Eye,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { orderApi } from '../../services/api.ts';
import type { Order, OrderStatus } from '../../types';

const statusConfig: Record<OrderStatus, { text: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    text: '待处理',
    className: 'badge-pending',
    icon: <span className="h-2 w-2 rounded-full bg-amber-500" />,
  },
  CONFIRMED: {
    text: '已确认',
    className: 'badge border border-primary-200 bg-primary-50 text-primary-700',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  COMPLETED: {
    text: '已完成',
    className: 'badge-completed',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    text: '已取消',
    className: 'badge-cancelled',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterStatus ? { status: filterStatus } : undefined;
      const data = await orderApi.getAll(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('订单列表加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [filterStatus]);

  const filteredOrders = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) =>
      [order.orderNo, order.customerName, order.projectName, order.salesName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [orders, searchQuery]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      processing: orders.filter((order) => order.status === 'CONFIRMED').length,
      completed: orders.filter((order) => order.status === 'COMPLETED').length,
      totalAmount: orders
        .filter((order) => order.status === 'COMPLETED')
        .reduce((sum, order) => sum + Number(order.actualAmount || 0), 0),
    }),
    [orders],
  );

  const handleComplete = async (id: number) => {
    if (!window.confirm('确定要完成这张订单吗？完成后会进入已完成状态。')) return;
    try {
      await orderApi.complete(id);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to complete order:', err);
      window.alert('完成订单失败，请稍后重试。');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('确定要取消这张订单吗？取消后库存会按后端规则回滚。')) return;
    try {
      await orderApi.cancel(id);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      window.alert('取消订单失败，请稍后重试。');
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card stat-card text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">订单总数</div>
                <div className="stat-value">{loading ? '--' : stats.total}</div>
                <div className="stat-label">当前筛选范围内的全部订单</div>
              </div>
              <div className="stat-icon primary">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">待完成订单</div>
                <div className="stat-value">{loading ? '--' : stats.processing}</div>
                <div className="stat-label">已确认但尚未完成</div>
              </div>
              <div className="stat-icon warning">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">已完成订单</div>
                <div className="stat-value">{loading ? '--' : stats.completed}</div>
                <div className="stat-label">已进入成交完成状态</div>
              </div>
              <div className="stat-icon success">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">完成订单金额</div>
                <div className="stat-value text-primary-700">{loading ? '--' : formatCurrency(stats.totalAmount)}</div>
                <div className="stat-label">按实际成交金额统计</div>
              </div>
              <div className="stat-icon primary">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、客户、项目或销售"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="form-input pl-11"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="form-select pl-10"
              >
                <option value="">全部状态</option>
                <option value="PENDING">待处理</option>
                <option value="CONFIRMED">已确认</option>
                <option value="COMPLETED">已完成</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>

            <button type="button" onClick={() => void fetchOrders()} className="btn btn-secondary">
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>

            <Link to="/orders/new" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              新建订单
            </Link>
          </div>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">订单台账</div>
              <h2 className="mt-1 text-base font-semibold text-gray-900">订单列表</h2>
            </div>
            <div className="text-sm text-gray-500">
              当前显示 <span className="font-semibold text-primary-700">{filteredOrders.length}</span> 条
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-14" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Receipt className="h-7 w-7 text-primary-700" />
              </div>
              <div className="empty-state-title">暂无订单</div>
              <div className="empty-state-desc">当前条件下没有订单记录，可以从已批准申请创建订单。</div>
              <Link to="/orders/new" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                新建订单
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>订单</th>
                    <th>客户 / 项目</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>创建日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.PENDING;
                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{order.orderNo}</div>
                              <div className="text-xs text-gray-400">ID: {order.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{order.customerName || '-'}</div>
                          <div className="mt-1 text-sm text-gray-500">{order.projectName || '-'}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-primary-700">{formatCurrency(order.actualAmount)}</div>
                          {Number(order.totalAmount || 0) !== Number(order.actualAmount || 0) && (
                            <div className="mt-1 text-xs text-gray-400 line-through">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>
                            {status.icon}
                            {order.statusDescription || status.text}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/orders/${order.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
                              title="查看"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {order.status === 'CONFIRMED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleComplete(order.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-50"
                                  title="完成订单"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleCancel(order.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                                  title="取消订单"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
