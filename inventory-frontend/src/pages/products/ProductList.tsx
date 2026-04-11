import { useEffect, useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext.tsx';
import Layout from '../../components/Layout.tsx';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      let data: Product[];
      if (showLowStock) {
        data = await productApi.getLowStock();
      } else {
        const params: { keyword?: string; categoryId?: number } = {};
        if (searchQuery.trim()) params.keyword = searchQuery.trim();
        if (filterCategory) params.categoryId = Number(filterCategory);
        data = await productApi.getAll(params);
      }
      setProducts(data);
    } catch (fetchError) {
      console.error('Failed to load products:', fetchError);
      setError('产品数据加载失败，请稍后重试。');
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
    if (!window.confirm('确认删除这个产品吗？删除后产品将无法继续被申请和建单。')) {
      return;
    }

    try {
      await productApi.delete(id);
      await fetchProducts();
    } catch (deleteError) {
      console.error('Failed to delete product:', deleteError);
      window.alert('删除失败，请稍后重试。');
    }
  };

  const lowStockCount = products.filter((product) => product.stockQuantity <= product.minStock).length;
  const activeCount = products.filter((product) => product.active).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.stockQuantity * (product.costPrice || 0),
    0,
  );

  return (
    <Layout>
      <div className="space-y-6">
        <section className="hero-panel">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_380px] xl:items-end">
            <div>
              <div className="section-kicker">产品与库存基础数据</div>
              <h2 className="mt-4 max-w-[12ch] text-[clamp(2.1rem,2.9vw,4rem)] font-bold tracking-tight text-gray-900">
                把产品规格、价格和库存安全线放在一个清晰的视图里。
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-gray-600 md:text-base">
                产品页不只是列表。它同时承担销售选品、审批核对和出库前确认的基础数据入口，所以需要更快看清库存风险和价格结构。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Layers3 className="h-4 w-4 text-primary-600" />
                  当前结果
                </div>
                <div className="metric-chip-value">{loading ? '--' : products.length}</div>
                <div className="metric-chip-note">基于当前筛选条件显示的产品数。</div>
              </div>
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertTriangle className="h-4 w-4 text-accent-600" />
                  低库存预警
                </div>
                <div className="metric-chip-value">{loading ? '--' : lowStockCount}</div>
                <div className="metric-chip-note">库存小于等于安全线的产品数。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">产品总数</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : products.length}
                </div>
                <div className="mt-3 text-xs text-gray-500">结果随搜索、分类和低库存筛选同步变化。</div>
              </div>
              <div className="stat-icon primary">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">启用产品</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : activeCount}
                </div>
                <div className="mt-3 text-xs text-gray-500">停用产品不会继续出现在后续业务流中。</div>
              </div>
              <div className="stat-icon success">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">库存估值</div>
                <div className="mt-3 text-[2rem] font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : formatCurrency(inventoryValue)}
                </div>
                <div className="mt-3 text-xs text-gray-500">按成本价和当前库存数量估算。</div>
              </div>
              <div className="stat-icon warning">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">分类数量</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {categories.length}
                </div>
                <div className="mt-3 text-xs text-gray-500">用分类过滤能更快收窄产品范围。</div>
              </div>
              <div className="stat-icon warning">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto_auto] xl:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品名称、规格或关键词"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                className="form-input pl-12"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              开始筛选
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
              {showLowStock ? '查看全部' : '只看低库存'}
            </button>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-2xl px-3 py-2 text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <List className="h-4 w-4" />
                    列表
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-2xl px-3 py-2 text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Grid2X2 className="h-4 w-4" />
                    卡片
                  </span>
                </button>
              </div>

              {isManager() && (
                <Link to="/products/new" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  新建产品
                </Link>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">产品数据暂时不可用</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">产品清单</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                {viewMode === 'grid' ? '卡片视图' : '列表视图'}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              当前显示 <span className="font-semibold text-primary-700">{loading ? '--' : products.length}</span> 个产品
            </div>
          </div>

          {loading ? (
            <div className={viewMode === 'grid' ? 'grid gap-5 p-6 xl:grid-cols-2 2xl:grid-cols-3' : 'space-y-4 p-6'}>
              {Array.from({ length: viewMode === 'grid' ? 6 : 5 }).map((_, index) => (
                <div key={index} className="rounded-[28px] border border-gray-100 p-5">
                  <div className="skeleton h-12 w-12" />
                  <div className="skeleton mt-5 h-6 w-2/3" />
                  <div className="skeleton mt-3 h-4 w-1/2" />
                  <div className="grid gap-3 pt-5 md:grid-cols-3">
                    <div className="skeleton h-20" />
                    <div className="skeleton h-20" />
                    <div className="skeleton h-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package className="h-8 w-8 text-primary-700" />
              </div>
              <div className="empty-state-title">没有找到符合条件的产品</div>
              <div className="empty-state-desc">
                可以调整搜索词、切换分类，或者关闭低库存筛选后重新查看完整产品列表。
              </div>
              {isManager() && (
                <Link to="/products/new" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  新建产品
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-5 p-6 xl:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => {
                const isLowStock = product.stockQuantity <= product.minStock;

                return (
                  <div
                    key={product.id}
                    className="group rounded-[30px] border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-primary-100 hover:bg-white hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-800 text-lg font-semibold text-white shadow-[0_18px_24px_-18px_rgba(17,105,68,0.75)]">
                        {product.name?.charAt(0) || 'P'}
                      </div>
                      <span className={`badge ${product.active ? 'badge-approved' : 'badge-cancelled'}`}>
                        {product.active ? '已启用' : '已停用'}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="text-lg font-semibold tracking-tight text-gray-900">{product.name}</div>
                      <div className="mt-1 text-sm text-gray-500">{product.spec || '暂无规格信息'}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="badge border border-sky-200 bg-sky-50 text-sky-700">
                        {getCategoryName(product)}
                      </span>
                      <span className="badge border border-gray-200 bg-white text-gray-600">
                        单位 {product.unit}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[22px] border border-gray-100 bg-white p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-400">库存</div>
                        <div className={`mt-2 text-lg font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stockQuantity} {product.unit}
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-gray-100 bg-white p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-400">安全线</div>
                        <div className="mt-2 text-lg font-semibold text-gray-900">{product.minStock}</div>
                      </div>
                      <div className="rounded-[22px] border border-gray-100 bg-white p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-400">零售价</div>
                        <div className="mt-2 text-lg font-semibold text-primary-700">
                          {formatCurrency(getDisplayPrice(product))}
                        </div>
                      </div>
                    </div>

                    {isLowStock && (
                      <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        当前库存已经低于或等于安全线，审批和建单前建议先核对货仓流水。
                      </div>
                    )}

                    <div className="mt-5 flex items-center gap-2 border-t border-gray-200 pt-5">
                      <Link to={`/products/${product.id}`} className="btn btn-secondary flex-1 text-sm">
                        <Eye className="h-4 w-4" />
                        查看详情
                      </Link>
                      {isManager() && (
                        <>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-sky-700 transition-colors hover:bg-sky-50"
                            title="编辑产品"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => void handleDelete(product.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-red-600 transition-colors hover:bg-red-50"
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
            <div className="divide-y divide-gray-100 px-6">
              {products.map((product) => {
                const isLowStock = product.stockQuantity <= product.minStock;

                return (
                  <div
                    key={product.id}
                    className="grid gap-4 py-5 xl:grid-cols-[minmax(0,1.35fr)_180px_180px_130px_150px] xl:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-800 text-lg font-semibold text-white shadow-[0_18px_24px_-18px_rgba(17,105,68,0.75)]">
                        {product.name?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-semibold tracking-tight text-gray-900">{product.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{product.spec || '暂无规格信息'}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="badge border border-sky-200 bg-sky-50 text-sky-700">
                            {getCategoryName(product)}
                          </span>
                          <span className={`badge ${product.active ? 'badge-approved' : 'badge-cancelled'}`}>
                            {product.active ? '已启用' : '已停用'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">库存数量</div>
                      <div className={`mt-2 text-base font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stockQuantity} {product.unit}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">安全线 {product.minStock}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">零售价 / 成本价</div>
                      <div className="mt-2 text-base font-semibold text-primary-700">
                        {formatCurrency(getDisplayPrice(product))}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        成本 {formatCurrency(product.costPrice || 0)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">预警状态</div>
                      <div className="mt-2">
                        {isLowStock ? (
                          <span className="badge badge-pending">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            低库存
                          </span>
                        ) : (
                          <span className="badge badge-approved">库存安全</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 xl:justify-end">
                      <Link to={`/products/${product.id}`} className="btn btn-secondary text-sm">
                        <Eye className="h-4 w-4" />
                        查看
                      </Link>
                      {isManager() && (
                        <>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-sky-700 transition-colors hover:bg-sky-50"
                            title="编辑产品"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => void handleDelete(product.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-red-600 transition-colors hover:bg-red-50"
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
          )}
        </section>
      </div>
    </Layout>
  );
}
