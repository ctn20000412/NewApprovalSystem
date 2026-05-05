import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, ClipboardList, Package, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { productApi, warehouseApi } from '../services/api.ts';
import type { InventoryLog, Product, WarehouseDashboard } from '../types';

type LogFilters = {
  productId: string;
  startDate: string;
  endDate: string;
};

const initialFilters: LogFilters = {
  productId: '',
  startDate: '',
  endDate: '',
};

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

export default function WarehousePage() {
  const [dashboard, setDashboard] = useState<WarehouseDashboard | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadPage();
  }, []);

  const lowStockProducts = dashboard?.lowStockProducts ?? [];
  const recentLogs = dashboard?.recentLogs ?? [];

  const selectedProductName = useMemo(() => {
    if (!filters.productId) return '全部产品';
    return products.find((product) => String(product.id) === filters.productId)?.name ?? '指定产品';
  }, [filters.productId, products]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardData, initialLogs, productList] = await Promise.all([
        warehouseApi.getDashboard(),
        warehouseApi.getLogs(),
        productApi.getAll(),
      ]);
      setDashboard(dashboardData);
      setLogs(initialLogs);
      setProducts(productList);
    } catch (err) {
      setError('货仓数据加载失败，请稍后重试。');
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  const loadLogs = async (nextFilters: LogFilters) => {
    try {
      setLogsLoading(true);
      const params: { productId?: number; startDate?: string; endDate?: string } = {};
      if (nextFilters.productId) {
        params.productId = Number(nextFilters.productId);
      }
      if (nextFilters.startDate) {
        params.startDate = nextFilters.startDate;
      }
      if (nextFilters.endDate) {
        params.endDate = nextFilters.endDate;
      }
      const data = await warehouseApi.getLogs(Object.keys(params).length ? params : undefined);
      setLogs(data);
    } catch (err) {
      setError('库存流水加载失败，请稍后重试。');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleFilterChange = (field: keyof LogFilters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = async () => {
    await loadLogs(filters);
  };

  const handleReset = async () => {
    setFilters(initialFilters);
    await loadLogs(initialFilters);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="page-title">货仓管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              查看库存总览、低库存预警和库存流水。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPage()}
            className="btn btn-secondary btn-sm self-start"
          >
            <RefreshCw className="h-4 w-4" />
            刷新数据
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="stat-value">{dashboard?.totalProducts ?? 0}</div>
            <div className="stat-label">在库产品数</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="stat-value">{dashboard?.totalStockQuantity ?? 0}</div>
            <div className="stat-label">库存总数量</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="stat-value">{dashboard?.lowStockCount ?? 0}</div>
            <div className="stat-label">低库存预警</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="stat-value">¥{formatCurrency(dashboard?.inventoryValue ?? 0)}</div>
            <div className="stat-label">库存成本估值</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">低库存产品</h2>
                <p className="mt-1 text-sm text-gray-500">当前需要重点关注的产品。</p>
              </div>
            </div>
            <div className="card-body">
              {lowStockProducts.length === 0 ? (
                <div className="empty-state py-10">
                  <div className="empty-state-title">暂无低库存产品</div>
                  <div className="empty-state-desc">当前库存均高于预警阈值。</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>产品</th>
                        <th>分类</th>
                        <th className="text-right">当前库存</th>
                        <th className="text-right">最低库存</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <Link
                              to={`/products/${product.id}`}
                              className="font-medium text-primary-600 hover:text-primary-700"
                            >
                              {product.name}
                            </Link>
                            <div className="mt-1 text-xs text-gray-500">{product.spec || '-'}</div>
                          </td>
                          <td>{product.categoryName || product.category?.name || '未分类'}</td>
                          <td className="text-right text-red-600 font-semibold">{product.stockQuantity}</td>
                          <td className="text-right">{product.minStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">最近流水</h2>
                <p className="mt-1 text-sm text-gray-500">最近 20 条库存变动记录。</p>
              </div>
            </div>
            <div className="card-body space-y-3">
              {recentLogs.length === 0 ? (
                <div className="empty-state py-10">
                  <div className="empty-state-title">暂无库存流水</div>
                  <div className="empty-state-desc">当前还没有出入库记录。</div>
                </div>
              ) : (
                recentLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {log.productName || '未知产品'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </div>
                        {log.remark && (
                          <div className="mt-2 text-sm text-gray-600">{log.remark}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            changeTypeStyle[log.changeType || ''] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {log.changeTypeDescription || log.changeType || '-'}
                        </span>
                        <div
                          className={`mt-2 text-sm font-semibold ${
                            log.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {log.quantity >= 0 ? '+' : ''}
                          {log.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">库存流水明细</h2>
              <p className="mt-1 text-sm text-gray-500">
                当前筛选范围：{selectedProductName}
              </p>
            </div>
          </div>
          <div className="card-body space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
              <select
                className="form-select"
                value={filters.productId}
                onChange={(event) => handleFilterChange('productId', event.target.value)}
              >
                <option value="">全部产品</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} / {product.spec || '-'}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={(event) => handleFilterChange('startDate', event.target.value)}
              />
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={(event) => handleFilterChange('endDate', event.target.value)}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void handleSearch()}>
                查询
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleReset()}>
                重置
              </button>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
            ) : logs.length === 0 ? (
              <div className="empty-state py-10">
                <div className="empty-state-title">没有匹配的库存流水</div>
                <div className="empty-state-desc">调整筛选条件后再试一次。</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>产品</th>
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
                          <div className="font-medium text-gray-900">{log.productName || '-'}</div>
                          <div className="mt-1 text-xs text-gray-500">{log.productSpec || '-'}</div>
                        </td>
                        <td>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              changeTypeStyle[log.changeType || ''] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {log.changeTypeDescription || log.changeType || '-'}
                          </span>
                        </td>
                        <td className={`text-right font-semibold ${log.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
        </section>
      </div>
    </Layout>
  );
}
