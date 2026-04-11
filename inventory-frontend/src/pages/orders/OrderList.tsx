import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../services/api.ts';
import Layout from '../../components/Layout.tsx';
import type { Order } from '../../types';
import { Plus, Eye, CheckCircle, XCircle, Search, Filter, Receipt, TrendingUp, Calendar } from 'lucide-react';

const statusConfig: Record<string, { text: string; bg: string; textColor: string; icon: React.ReactNode }> = {
  PENDING: { 
    text: '待确认', 
    bg: 'bg-amber-100', 
    textColor: 'text-amber-700',
    icon: <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
  },
  CONFIRMED: { 
    text: '已确认', 
    bg: 'bg-blue-100', 
    textColor: 'text-blue-700',
    icon: <CheckCircle className="w-4 h-4" />
  },
  COMPLETED: { 
    text: '已完成', 
    bg: 'bg-emerald-100', 
    textColor: 'text-emerald-700',
    icon: <CheckCircle className="w-4 h-4" />
  },
  CANCELLED: { 
    text: '已取消', 
    bg: 'bg-gray-100', 
    textColor: 'text-gray-600',
    icon: <XCircle className="w-4 h-4" />
  },
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterStatus ? { status: filterStatus } : undefined;
      const data = await orderApi.getAll(params);
      setOrders(data);
    } catch (err) {
      setError('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const filteredOrders = orders.filter(order =>
    order.orderNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleComplete = async (id: number) => {
    if (!confirm('确认完成此订单吗？')) return;
    try {
      await orderApi.complete(id);
      fetchOrders();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('确认取消此订单吗？')) return;
    try {
      await orderApi.cancel(id);
      fetchOrders();
    } catch (err) {
      alert('操作失败');
    }
  };

  // 统计
  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === 'CONFIRMED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    totalAmount: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + (o.actualAmount || 0), 0),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">订单管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              共 <span className="font-semibold text-primary-600">{filteredOrders.length}</span> 个订单
            </p>
          </div>
          <Link to="/orders/new" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            新建订单
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">全部订单</p>
              </div>
            </div>
          </div>
          <div className="stat-card card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                <p className="text-xs text-gray-500">待完成</p>
              </div>
            </div>
          </div>
          <div className="stat-card card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs text-gray-500">已完成</p>
              </div>
            </div>
          </div>
          <div className="stat-card card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-primary-600">¥{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">成交总额</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、客户或项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待确认</option>
                  <option value="CONFIRMED">已确认</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* 订单列表 */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="loading-spinner mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">暂无订单</h3>
              <p className="text-sm text-gray-500 mb-4">还没有订单记录</p>
              <Link to="/orders/new" className="btn btn-primary">
                <Plus className="w-4 h-4" />
                创建订单
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>订单信息</th>
                    <th>客户/项目</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.PENDING;
                    return (
                      <tr key={order.id} className="group">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{order.orderNo}</div>
                              <div className="text-xs text-gray-400">ID: {order.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.projectName}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-primary-600">
                            ¥{order.actualAmount?.toLocaleString()}
                          </div>
                          {order.totalAmount !== order.actualAmount && (
                            <div className="text-xs text-gray-400 line-through">
                              ¥{order.totalAmount?.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${status.bg} ${status.textColor} flex items-center gap-1.5`}>
                            {status.icon}
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/orders/${order.id}`}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {order.status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => handleComplete(order.id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="完成"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(order.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="取消"
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
        </div>
      </div>
    </Layout>
  );
}
