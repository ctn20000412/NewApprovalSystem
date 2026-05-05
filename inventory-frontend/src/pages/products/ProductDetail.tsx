import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { productApi } from '../../services/api.ts';
import type { InventoryLog, Product } from '../../types';

type DetailTab = 'info' | 'logs';

const changeTypeStyle: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUST: 'bg-amber-100 text-amber-700',
};

function formatCurrency(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  useEffect(() => {
    if (!id) {
      setError('产品不存在。');
      setLoading(false);
      return;
    }

    void loadDetail(Number(id));
  }, [id]);

  const loadDetail = async (productId: number) => {
    try {
      setLoading(true);
      setError('');
      const [productData, logData] = await Promise.all([
        productApi.getById(productId),
        productApi.getInventoryLogs(productId),
      ]);
      setProduct(productData);
      setLogs(logData);
    } catch (err) {
      setError('产品详情加载失败，请稍后重试。');
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  const reloadLogs = async () => {
    if (!id) return;
    try {
      setLogsLoading(true);
      const data = await productApi.getInventoryLogs(Number(id));
      setLogs(data);
    } catch (err) {
      setError('库存流水加载失败，请稍后重试。');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm('确认删除该产品吗？此操作不可恢复。')) {
      return;
    }

    try {
      await productApi.delete(product.id);
      navigate('/products');
    } catch (err) {
      window.alert('删除失败，请稍后重试。');
    }
  };

  const inboundQuantity = useMemo(
    () => logs.filter((log) => log.quantity > 0).reduce((sum, log) => sum + log.quantity, 0),
    [logs],
  );

  const outboundQuantity = useMemo(
    () =>
      logs
        .filter((log) => log.quantity < 0)
        .reduce((sum, log) => sum + Math.abs(log.quantity), 0),
    [logs],
  );

  const latestLogTime = logs[0]?.createdAt;

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center text-gray-500">
          加载中...
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="page-shell space-y-4">
          <div className="alert alert-error">
            <div>{error || '产品不存在。'}</div>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            返回产品列表
          </Link>
        </div>
      </Layout>
    );
  }

  const isLowStock = product.stockQuantity <= product.minStock;
  const categoryName = product.categoryName || product.category?.name || '未分类';
  const retailPrice = product.retailPrice ?? product.price ?? 0;
  const costPrice = product.costPrice ?? 0;
  const inventoryValue = product.stockQuantity * costPrice;

  return (
    <Layout>
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Link
              to="/products"
              className="mt-1 inline-flex rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="page-title">{product.name}</h1>
                <span className={`badge ${product.active ? 'badge-approved' : 'badge-cancelled'}`}>
                  {product.active ? '启用中' : '已停用'}
                </span>
                {isLowStock && (
                  <span className="badge badge-rejected">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    低库存
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                规格型号：{product.spec || '-'} / 分类：{categoryName}
              </p>
            </div>
          </div>

          {isManager() && (
            <div className="flex gap-3">
              <Link to={`/products/${product.id}/edit`} className="btn btn-secondary btn-sm">
                <Edit className="h-4 w-4" />
                编辑
              </Link>
              <button type="button" onClick={handleDelete} className="btn btn-danger btn-sm">
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            </div>
          )}
        </div>

        {isLowStock && (
          <div className="alert alert-warning">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <div className="font-medium">库存预警</div>
              <div className="mt-1 text-sm">
                当前库存 {product.stockQuantity}，已低于或等于最低库存 {product.minStock}。
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">当前库存</div>
                <div className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                  {product.stockQuantity}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">最低库存</div>
                <div className="text-2xl font-bold text-gray-900">{product.minStock}</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">零售价</div>
                <div className="text-2xl font-bold text-gray-900">¥{formatCurrency(retailPrice)}</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">库存估值</div>
                <div className="text-2xl font-bold text-violet-700">¥{formatCurrency(inventoryValue)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="border-b border-gray-100 px-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                基本信息
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'logs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                库存流水
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">产品信息</h2>
                  <dl className="mt-4 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">产品名称</dt>
                      <dd className="font-medium text-gray-900">{product.name}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">规格型号</dt>
                      <dd className="font-medium text-gray-900">{product.spec || '-'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">产品分类</dt>
                      <dd className="font-medium text-gray-900">{categoryName}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">计量单位</dt>
                      <dd className="font-medium text-gray-900">{product.unit || '-'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">成本价</dt>
                      <dd className="font-medium text-gray-900">¥{formatCurrency(costPrice)}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">零售价</dt>
                      <dd className="font-medium text-primary-600">¥{formatCurrency(retailPrice)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">库存信息</h2>
                  <dl className="mt-4 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">当前库存</dt>
                      <dd className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stockQuantity}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">最低库存</dt>
                      <dd className="font-medium text-gray-900">{product.minStock}</dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">库存状态</dt>
                      <dd>
                        <span className={`badge ${isLowStock ? 'badge-rejected' : 'badge-approved'}`}>
                          {isLowStock ? '库存预警' : '库存正常'}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <dt className="text-gray-500">产品状态</dt>
                      <dd className="font-medium text-gray-900">{product.active ? '启用中' : '已停用'}</dd>
                    </div>
                  </dl>
                </div>

                {product.description && (
                  <div className="lg:col-span-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">产品描述</h2>
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                      {product.description}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">库存流水记录</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      按时间倒序展示该产品的出入库明细。
                    </p>
                  </div>
                  <button type="button" onClick={() => void reloadLogs()} className="btn btn-secondary btn-sm">
                    <RefreshCw className="h-4 w-4" />
                    刷新流水
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      累计入库
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700">+{inboundQuantity}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      累计出库
                    </div>
                    <div className="mt-2 text-2xl font-bold text-red-700">-{outboundQuantity}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">最近变动时间</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">
                      {latestLogTime ? new Date(latestLogTime).toLocaleString('zh-CN') : '暂无记录'}
                    </div>
                  </div>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
                ) : logs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                    <div className="text-base font-medium text-gray-700">暂无库存流水记录</div>
                    <div className="mt-2 text-sm text-gray-500">当前产品还没有出入库明细。</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>时间</th>
                          <th>类型</th>
                          <th className="text-right">变动数量</th>
                          <th className="text-right">变动前</th>
                          <th className="text-right">变动后</th>
                          <th>操作人</th>
                          <th>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td>{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                            <td>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  changeTypeStyle[log.changeType || ''] || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {log.changeTypeDescription || log.changeType || log.type || '-'}
                              </span>
                            </td>
                            <td
                              className={`text-right font-semibold ${
                                log.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {log.quantity >= 0 ? '+' : ''}
                              {log.quantity}
                            </td>
                            <td className="text-right">{log.beforeQuantity ?? log.beforeStock ?? '-'}</td>
                            <td className="text-right">{log.afterQuantity ?? log.afterStock ?? log.balance ?? '-'}</td>
                            <td>{log.operatorName || '-'}</td>
                            <td>
                              <div className="text-sm text-gray-600">{log.remark || '-'}</div>
                              {log.orderNo && (
                                <div className="mt-1 text-xs text-gray-500">关联订单：{log.orderNo}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
