import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../../services/api.ts';
import Layout from '../../components/Layout.tsx';
import type { Order } from '../../types';
import { ArrowLeft, CheckCircle, XCircle, Printer } from 'lucide-react';

const statusLabels: Record<string, { text: string; color: string; bgColor: string }> = {
  PENDING: { text: '待确认', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  CONFIRMED: { text: '已确认', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  COMPLETED: { text: '已完成', color: 'text-green-800', bgColor: 'bg-green-100' },
  CANCELLED: { text: '已取消', color: 'text-gray-800', bgColor: 'bg-gray-100' },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder(parseInt(id));
    }
  }, [id]);

  const fetchOrder = async (orderId: number) => {
    try {
      setLoading(true);
      const data = await orderApi.getById(orderId);
      setOrder(data);
    } catch (err) {
      setError('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    if (!confirm('确认完成此订单吗？')) return;
    try {
      await orderApi.complete(order.id);
      fetchOrder(order.id);
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('确认取消此订单吗？')) return;
    try {
      await orderApi.cancel(order.id);
      fetchOrder(order.id);
    } catch (err) {
      alert('操作失败');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="page-shell">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || '订单不存在'}
          </div>
          <div className="mt-4">
            <Link to="/orders" className="text-indigo-600 hover:text-indigo-800">
              ← 返回订单列表
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const status = statusLabels[order.status] || { text: order.status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  const itemCount = order.items?.length || 0;
  const amountDiff = (order.actualAmount || 0) - (order.totalAmount || 0);

  return (
    <Layout>
      <div className="page-shell space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.bgColor} ${status.color}`}>
                  {status.text}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">订单号: {order.orderNo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4 mr-2" />
              打印
            </button>
            {order.status === 'CONFIRMED' && (
              <>
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  完成订单
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  取消订单
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5">
            <div className="text-sm text-gray-500">订单金额</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              ¥{order.totalAmount?.toLocaleString()}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">成交金额</div>
            <div className="mt-2 text-2xl font-bold text-primary-700">
              ¥{order.actualAmount?.toLocaleString()}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">金额差额</div>
            <div className={`mt-2 text-2xl font-bold ${amountDiff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {amountDiff > 0 ? '+' : ''}
              ¥{amountDiff.toLocaleString()}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">产品条目</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{itemCount}</div>
          </div>
        </div>

        {/* Order Info */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  客户名称
                </label>
                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  项目名称
                </label>
                <div className="text-sm font-medium text-gray-900">{order.projectName}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  销售人员
                </label>
                <div className="text-sm font-medium text-gray-900">{order.salesName}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  创建时间
                </label>
                <div className="text-sm text-gray-900">
                  {new Date(order.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  更新时间
                </label>
                <div className="text-sm text-gray-900">
                  {order.updatedAt ? new Date(order.updatedAt).toLocaleString('zh-CN') : '-'}
                </div>
              </div>
              {order.completedAt && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    完成时间
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(order.completedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">商品明细</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      产品名称
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数量
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单价
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      小计
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.productName || item.product?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ¥{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        ¥{(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                      预计金额:
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ¥{order.totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50">
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-indigo-900 text-right">
                      实际成交金额:
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-indigo-600 text-right">
                      ¥{order.actualAmount?.toLocaleString()}
                    </td>
                  </tr>
                  {order.actualAmount !== order.totalAmount && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-xs text-gray-500 text-right">
                        差额:
                      </td>
                      <td className={`px-4 py-2 text-xs text-right ${
                        order.actualAmount > order.totalAmount ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(order.actualAmount - order.totalAmount) > 0 ? '+' : ''}
                        ¥{(order.actualAmount - order.totalAmount).toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Remark */}
        {order.remark && (
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">备注</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.remark}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
