import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CircleDollarSign,
  Edit,
  Eye,
  Filter,
  Grid2X2,
  Layers3,
  List,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { productApi } from '../../services/api.ts';
import type { Product, ProductCategory } from '../../types';

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

function getCategoryName(product: Product) {
  return product.categoryName || product.category?.name || '未分类';
}

function getDisplayPrice(product: Product) {
  return product.retailPrice ?? product.price ?? 0;
}

export default function ProductList() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      if (showLowStock) {
        const data = await productApi.getLowStock();
        setProducts(data);
        return;
      }

      const params: { keyword?: string; categoryId?: number } = {};
      if (searchQuery.trim()) params.keyword = searchQuery.trim();
      if (filterCategory) params.categoryId = Number(filterCategory);

      const data = await productApi.getAll(params);
      setProducts(data);
    } catch (fetchError) {
      console.error('Failed to load products:', fetchError);
      setError('产品列表加载失败，请检查后端服务和网络连接。');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategories();
      setCategories(data);
    } catch (fetchError) {
      console.error('Failed to load categories:', fetchError);
      setError('产品分类加载失败，请稍后重试。');
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [filterCategory, showLowStock]);

  const handleSearch = () => {
    void fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除这个产品？删除后会影响相关库存和订单查看。')) {
      return;
    }

    try {
      await productApi.delete(id);
      await fetchProducts();
    } catch (deleteError) {
      console.error('Failed to delete product:', deleteError);
      window.alert('删除产品失败，请确认该产品是否仍被业务数据引用。');
    }
  };

  const productStats = useMemo(() => {
    const lowStockCount = products.filter((product) => product.stockQuantity <= product.minStock).length;
    const activeCount = products.filter((product) => product.active).length;
    const inventoryValue = products.reduce(
      (sum, product) => sum + product.stockQuantity * (product.costPrice || 0),
      0,
    );

    return {
      total: products.length,
      activeCount,
      lowStockCount,
      inventoryValue,
    };
  }, [products]);

  return (
    <Layout>
      <div className="space-y-5">
        <section className="hero-panel">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div>
              <div className="section-kicker">产品管理</div>
              <h2 className="page-title mt-3">产品、分类与库存风险集中维护</h2>
              <p className="page-subtitle max-w-3xl">
                统一查看产品售价、成本、库存余量和低库存状态。经理可以新增、编辑、停用产品，销售可按产品信息快速核对取货明细。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Layers3 className="h-4 w-4 text-primary-600" />
                  当前产品
                </div>
                <div className="metric-chip-value">{loading ? '--' : productStats.total}</div>
                <div className="metric-chip-note">符合当前筛选条件的产品数。</div>
              </div>
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertTriangle className="h-4 w-4 text-accent-600" />
                  低库存
                </div>
                <div className="metric-chip-value">{loading ? '--' : productStats.lowStockCount}</div>
                <div className="metric-chip-note">库存小于或等于最低库存的产品。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card stat-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="stat-label">产品总数</div>
                <div className="stat-value">{loading ? '--' : productStats.total}</div>
                <div className="mt-2 text-xs text-gray-500">来自当前筛选结果。</div>
              </div>
              <div className="stat-icon primary">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="stat-label">启用产品</div>
                <div className="stat-value">{loading ? '--' : productStats.activeCount}</div>
                <div className="mt-2 text-xs text-gray-500">可参与申请和订单。</div>
              </div>
              <div className="stat-icon success">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="stat-label">库存成本</div>
                <div className="stat-value">{loading ? '--' : formatCurrency(productStats.inventoryValue)}</div>
                <div className="mt-2 text-xs text-gray-500">按成本价估算当前库存。</div>
              </div>
              <div className="stat-icon warning">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="stat-label">产品分类</div>
                <div className="stat-value">{categories.length}</div>
                <div className="mt-2 text-xs text-gray-500">分类用于检索和归档。</div>
              </div>
              <div className="stat-icon warning">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto] xl:items-center">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品名称、规格或型号"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                className="form-input pl-10"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
                className="form-select pl-10"
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleSearch} className="btn btn-primary">
              <Search className="h-4 w-4" />
              查询
            </button>

            <button
              onClick={() => setShowLowStock((current) => !current)}
              className={`btn ${
                showLowStock
                  ? 'border border-accent-200 bg-accent-50 text-accent-700'
                  : 'btn-secondary'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              {showLowStock ? '取消预警' : '低库存'}
            </button>

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <List className="h-4 w-4" />
                  列表
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Grid2X2 className="h-4 w-4" />
                  卡片
                </button>
              </div>

              {isManager() && (
                <Link to="/products/new" className="btn btn-primary whitespace-nowrap">
                  <Plus className="h-4 w-4" />
                  新增
                </Link>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">产品数据异常</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">产品台账</div>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                {viewMode === 'grid' ? '卡片视图' : '列表视图'}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              共 <span className="font-semibold text-primary-700">{loading ? '--' : products.length}</span> 个产品
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4">
                  <div className="skeleton h-10 w-10" />
                  <div className="skeleton mt-4 h-5 w-2/3" />
                  <div className="skeleton mt-2 h-4 w-1/2" />
                  <div className="skeleton mt-4 h-16" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package className="h-7 w-7 text-primary-700" />
              </div>
              <div className="empty-state-title">没有匹配的产品</div>
              <div className="empty-state-desc">调整关键词、分类或低库存筛选后再试。</div>
              {isManager() && (
                <Link to="/products/new" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  新增产品
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => {
                const lowStock = product.stockQuantity <= product.minStock;

                return (
                  <div key={product.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-sm font-semibold text-white">
                        {product.name?.charAt(0) || 'P'}
                      </div>
                      <span className={`badge ${product.active ? 'badge-approved' : 'badge-cancelled'}`}>
                        {product.active ? '启用' : '停用'}
                      </span>
                    </div>

                    <div className="mt-4 min-h-[58px]">
                      <div className="truncate text-base font-semibold text-gray-900">{product.name}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {product.spec || product.model || '暂无规格'}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge border border-sky-200 bg-sky-50 text-sky-700">
                        {getCategoryName(product)}
                      </span>
                      <span className="badge border border-gray-200 bg-white text-gray-600">
                        {product.unit || '件'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">库存</div>
                        <div className={`mt-1 font-semibold ${lowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stockQuantity}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">预警</div>
                        <div className="mt-1 font-semibold text-gray-900">{product.minStock}</div>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">售价</div>
                        <div className="mt-1 font-semibold text-primary-700">
                          {formatCurrency(getDisplayPrice(product))}
                        </div>
                      </div>
                    </div>

                    {lowStock && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                        库存已低于预警线，建议及时补货或调整申请节奏。
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4">
                      <Link to={`/products/${product.id}`} className="btn btn-secondary flex-1 text-sm">
                        <Eye className="h-4 w-4" />
                        详情
                      </Link>
                      {isManager() && (
                        <>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-sky-700 hover:bg-sky-50"
                            title="编辑产品"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => void handleDelete(product.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 hover:bg-red-50"
                            title="删除产品"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>产品信息</th>
                    <th>分类</th>
                    <th>库存</th>
                    <th>价格</th>
                    <th>状态</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const lowStock = product.stockQuantity <= product.minStock;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-sm font-semibold text-white">
                              {product.name?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-gray-900">{product.name}</div>
                              <div className="mt-1 truncate text-sm text-gray-500">
                                {product.spec || product.model || '暂无规格'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge border border-sky-200 bg-sky-50 text-sky-700">
                            {getCategoryName(product)}
                          </span>
                        </td>
                        <td>
                          <div className={`font-semibold ${lowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stockQuantity} {product.unit}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">预警线 {product.minStock}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-primary-700">
                            {formatCurrency(getDisplayPrice(product))}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            成本 {formatCurrency(product.costPrice || 0)}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <span className={`badge ${product.active ? 'badge-approved' : 'badge-cancelled'}`}>
                              {product.active ? '启用' : '停用'}
                            </span>
                            {lowStock && (
                              <span className="badge badge-pending">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                低库存
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link to={`/products/${product.id}`} className="btn btn-secondary text-sm">
                              <Eye className="h-4 w-4" />
                              查看
                            </Link>
                            {isManager() && (
                              <>
                                <Link
                                  to={`/products/${product.id}/edit`}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-sky-700 hover:bg-sky-50"
                                  title="编辑产品"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => void handleDelete(product.id)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 hover:bg-red-50"
                                  title="删除产品"
                                >
                                  <Trash2 className="h-4 w-4" />
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
