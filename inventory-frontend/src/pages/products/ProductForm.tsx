import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Save, ShieldAlert, Tags } from 'lucide-react';
import { productApi } from '../../services/api.ts';
import Layout from '../../components/Layout.tsx';
import type { ProductCategory, ProductPayload } from '../../types';

interface ProductFormData extends ProductPayload {
  stockQuantity: number;
}

const initialFormData: ProductFormData = {
  name: '',
  categoryId: 0,
  spec: '',
  unit: '台',
  costPrice: 0,
  retailPrice: 0,
  stockQuantity: 0,
  minStock: 0,
};

function formatCurrency(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  useEffect(() => {
    void fetchCategories();
    if (isEdit && id) {
      void fetchProduct(parseInt(id, 10));
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategories();
      setCategories(data);
    } catch (err) {
      setError('加载产品分类失败');
    }
  };

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await productApi.getById(productId);
      setFormData({
        name: data.name,
        categoryId: data.categoryId ?? data.category?.id ?? 0,
        spec: data.spec ?? '',
        unit: data.unit || '台',
        costPrice: Number(data.costPrice ?? 0),
        retailPrice: Number(data.retailPrice ?? data.price ?? 0),
        stockQuantity: Number(data.stockQuantity ?? 0),
        minStock: Number(data.minStock ?? 0),
      });
    } catch (err) {
      setError('加载产品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.categoryId || !formData.spec.trim()) {
      setError('请完整填写产品名称、分类和规格');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload: ProductPayload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        spec: formData.spec.trim(),
        unit: formData.unit.trim() || '台',
        costPrice: formData.costPrice,
        retailPrice: formData.retailPrice,
        minStock: formData.minStock,
        ...(isEdit ? {} : { stockQuantity: formData.stockQuantity }),
      };

      if (isEdit && id) {
        await productApi.update(parseInt(id, 10), payload);
      } else {
        await productApi.create(payload);
      }
      navigate('/products');
    } catch (err: any) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(message || (isEdit ? '更新产品失败' : '创建产品失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    let nextValue: string | number;

    if (name === 'categoryId') {
      nextValue = value === '' ? 0 : Number(value);
    } else if (type === 'number') {
      nextValue = value === '' ? 0 : Number(value);
    } else {
      nextValue = value;
    }

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const selectedCategoryName = useMemo(
    () => categories.find((item) => item.id === formData.categoryId)?.name || '未选择分类',
    [categories, formData.categoryId],
  );

  const margin = Math.max(formData.retailPrice - formData.costPrice, 0);
  const estimatedValue = formData.costPrice * (isEdit ? formData.stockQuantity : formData.stockQuantity);

  return (
    <Layout>
      <div className="page-shell-narrow space-y-6">
        <section className="hero-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/products"
                className="inline-flex rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  产品资料维护
                </div>
                <h1 className="mt-3 text-3xl font-bold text-gray-900">
                  {isEdit ? '编辑产品' : '新增产品'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  将产品基础资料、价格和安全库存集中维护，减少后续申请和订单环节的字段反复修改。
                </p>
              </div>
            </div>

            <div className="grid min-w-[280px] grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">产品分类</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{categories.length}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">{isEdit ? '当前库存' : '初始库存'}</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{formData.stockQuantity}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">单台毛利</div>
                <div className="mt-2 text-xl font-semibold text-emerald-700">¥{formatCurrency(margin)}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">安全库存</div>
                <div className="mt-2 text-xl font-semibold text-amber-700">{formData.minStock}</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="card">
            <div className="flex items-center justify-center py-20 text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="form-layout">
            <form onSubmit={handleSubmit} className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">产品信息</h2>
                  <p className="mt-1 text-sm text-gray-500">填写用于申请、订单和库存统计的主数据</p>
                </div>
              </div>

              <div className="card-body space-y-8">
                <section className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                      基础资料
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="form-label">
                          产品名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="例如：格力 GMV 中央空调主机"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">
                          规格型号 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="spec"
                          value={formData.spec}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="例如：GMV-120WL/F"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">
                          产品分类 <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="categoryId"
                          value={formData.categoryId || ''}
                          onChange={handleChange}
                          className="form-select"
                          required
                        >
                          <option value="">请选择产品分类</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">计量单位</label>
                        <input
                          type="text"
                          name="unit"
                          value={formData.unit}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="台 / 套 / 件"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 border-t border-gray-100 pt-8">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                      价格与库存
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="form-label">
                          成本价 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                          <input
                            type="number"
                            name="costPrice"
                            step="0.01"
                            min="0"
                            value={formData.costPrice}
                            onChange={handleChange}
                            className="form-input pl-8"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">
                          销售价 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                          <input
                            type="number"
                            name="retailPrice"
                            step="0.01"
                            min="0"
                            value={formData.retailPrice}
                            onChange={handleChange}
                            className="form-input pl-8"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">{isEdit ? '当前库存' : '初始库存'}</label>
                        <input
                          type="number"
                          name="stockQuantity"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="0"
                          disabled={isEdit}
                        />
                        {isEdit && (
                          <div className="form-hint">编辑产品时库存由订单和库存流水维护，不在这里直接修改。</div>
                        )}
                      </div>

                      <div>
                        <label className="form-label">最低库存</label>
                        <input
                          type="number"
                          name="minStock"
                          min="0"
                          value={formData.minStock}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="0"
                        />
                        <div className="form-hint">低于该值后，产品列表和货仓页会显示低库存预警。</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-5">
                <Link to="/products" className="btn btn-secondary btn-sm">
                  取消
                </Link>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  <Save className="h-4 w-4" />
                  {submitting ? '提交中...' : isEdit ? '保存修改' : '创建产品'}
                </button>
              </div>
            </form>

            <div className="sticky-panel space-y-6">
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">实时预览</h2>
                    <p className="mt-1 text-sm text-gray-500">提交前快速检查关键字段</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formData.name.trim() || '未填写产品名称'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formData.spec.trim() || '未填写规格'} / {selectedCategoryName}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">成本价</div>
                      <div className="mt-2 text-lg font-semibold text-gray-900">
                        ¥{formatCurrency(formData.costPrice)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">销售价</div>
                      <div className="mt-2 text-lg font-semibold text-primary-600">
                        ¥{formatCurrency(formData.retailPrice)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">库存估值</div>
                      <div className="mt-2 text-lg font-semibold text-gray-900">
                        ¥{formatCurrency(estimatedValue)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">单台毛利</div>
                      <div className="mt-2 text-lg font-semibold text-emerald-700">
                        ¥{formatCurrency(margin)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">填写建议</h2>
                  </div>
                </div>
                <div className="card-body space-y-4 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <Tags className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <span>名称尽量包含品牌、系列和用途，便于销售与仓库快速检索。</span>
                  </div>
                  <div className="flex gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>最低库存建议结合月均销量设置，避免大量产品同时出现无效预警。</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
