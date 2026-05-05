import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  PackagePlus,
  Save,
  Trash2,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { productApi, requestApi } from '../../services/api.ts';
import type { Product, PickupRequest } from '../../types';

interface RequestItemForm {
  productId: number;
  quantity: number;
  unitPrice: number;
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function RequestForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<RequestItemForm[]>([{ productId: 0, quantity: 1, unitPrice: 0 }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadProducts();
    if (isEdit) {
      void loadRequest();
    }
  }, [id, isEdit]);

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (loadError) {
      console.error('Failed to load products:', loadError);
      setError('产品列表加载失败，请稍后重试。');
    }
  };

  const loadRequest = async () => {
    setLoading(true);
    try {
      const request: PickupRequest = await requestApi.getById(Number(id));
      setCustomerName(request.customerName);
      setProjectName(request.projectName);
      setRemark(request.remark || '');
      setItems(
        request.items.map((item) => ({
          productId: item.product?.id || item.productId || 0,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );
    } catch (loadError) {
      console.error('Failed to load request:', loadError);
      setError('申请详情加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems((current) => [...current, { productId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      window.alert('至少保留一个产品条目。');
      return;
    }
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, field: keyof RequestItemForm, value: number) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const validItems = useMemo(
    () => items.filter((item) => item.productId > 0 && item.quantity > 0),
    [items],
  );

  const totalQuantity = useMemo(
    () => validItems.reduce((sum, item) => sum + item.quantity, 0),
    [validItems],
  );

  const estimatedAmount = useMemo(
    () => validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [validItems],
  );

  const selectedProducts = useMemo(
    () =>
      validItems
        .map((item) => products.find((product) => product.id === item.productId))
        .filter((product): product is Product => Boolean(product)),
    [products, validItems],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!customerName.trim() || !projectName.trim()) {
      setError('请完整填写客户名称和项目名称。');
      return;
    }

    if (validItems.length === 0) {
      setError('请至少添加一个有效的产品条目。');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        projectName: projectName.trim(),
        remark: remark.trim(),
        items: validItems,
      };

      if (isEdit) {
        await requestApi.update(Number(id), payload);
      } else {
        await requestApi.create(payload);
      }

      navigate('/requests');
    } catch (saveError) {
      console.error('Failed to save request:', saveError);
      setError('申请保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-shell">
          <div className="card">
            <div className="flex items-center justify-center py-20 text-gray-500">正在加载申请信息...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell space-y-6">
        <section className="hero-panel">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_380px] xl:items-end">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  to="/requests"
                  className="inline-flex rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  取货申请录入
                </div>
              </div>

              <h2 className="page-title mt-3 max-w-[16ch]">
                {isEdit ? '修改申请内容并继续推进审批。' : '创建新的取货申请，直接进入审批流程。'}
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-gray-600 md:text-base">
                先填写客户和项目，再录入产品、数量和单价。右侧会实时汇总数量、金额和库存信息，减少提交前来回核对。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">产品条目</div>
                <div className="metric-chip-value">{items.length}</div>
                <div className="metric-chip-note">包括未完成选择的草稿条目。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">有效条目</div>
                <div className="metric-chip-value">{validItems.length}</div>
                <div className="metric-chip-note">只有有效条目会计入申请总额。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">合计数量</div>
                <div className="metric-chip-value">{totalQuantity}</div>
                <div className="metric-chip-note">便于提前判断出库压力。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">预估金额</div>
                <div className="metric-chip-value text-primary-700">{formatCurrency(estimatedAmount)}</div>
                <div className="metric-chip-note">用于审批和后续建单金额参考。</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">申请暂时无法保存</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <div className="form-layout">
          <form onSubmit={handleSubmit} className="card min-w-0">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">申请内容</h2>
                <p className="mt-1 text-sm text-gray-500">先填写客户和项目，再逐条录入产品信息。</p>
              </div>
            </div>

            <div className="card-body space-y-8">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">基础信息</h3>
                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="min-w-0">
                    <label className="form-label">
                      客户名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      className="form-input"
                      placeholder="例如：华岚地产、锦悦商业中心"
                      required
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="form-label">
                      项目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      className="form-input"
                      placeholder="例如：星河府二期中央空调项目"
                      required
                    />
                  </div>

                  <div className="min-w-0 md:col-span-2">
                    <label className="form-label">备注说明</label>
                    <textarea
                      value={remark}
                      onChange={(event) => setRemark(event.target.value)}
                      rows={3}
                      className="form-textarea"
                      placeholder="补充客户要求、交付时间、价格说明或审批关注点"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">产品条目</h3>
                    <p className="mt-2 text-sm text-gray-500">每个条目都需要选择产品、填写数量和单价。</p>
                  </div>

                  <button type="button" onClick={addItem} className="btn btn-secondary btn-sm self-start">
                    <PackagePlus className="h-4 w-4" />
                    添加条目
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {items.map((item, index) => {
                    const selectedProduct = products.find((product) => product.id === item.productId);
                    const subtotal = item.quantity * item.unitPrice;

                    return (
                      <div
                        key={`${index}-${item.productId}`}
                        className="rounded-[28px] border border-gray-100 bg-gray-50/90 p-4"
                      >
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_140px_180px_132px]">
                          <div className="min-w-0">
                            <label className="form-label">产品</label>
                            <select
                              value={item.productId}
                              onChange={(event) => updateItem(index, 'productId', Number(event.target.value))}
                              className="form-select"
                              required
                            >
                              <option value={0}>请选择产品</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} / {product.spec} / 库存 {product.stockQuantity} {product.unit}
                                </option>
                              ))}
                            </select>
                            {selectedProduct && (
                              <div className="mt-2 text-xs leading-5 text-gray-500">
                                分类 {selectedProduct.categoryName || selectedProduct.category?.name || '未分类'}，
                                当前库存 {selectedProduct.stockQuantity} {selectedProduct.unit}，
                                安全线 {selectedProduct.minStock}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="form-label">数量</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(event) => updateItem(index, 'quantity', Number(event.target.value))}
                              min={1}
                              className="form-input"
                              required
                            />
                          </div>

                          <div>
                            <label className="form-label">单价</label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(event) => updateItem(index, 'unitPrice', Number(event.target.value))}
                              min={0}
                              step={0.01}
                              className="form-input"
                              placeholder="0.00"
                              required
                            />
                          </div>

                          <div className="flex flex-col justify-between gap-3">
                            <div>
                              <div className="text-xs text-gray-500">小计</div>
                              <div className="mt-2 text-lg font-semibold text-primary-700">
                                {formatCurrency(subtotal)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-5">
              <button type="button" onClick={() => navigate('/requests')} className="btn btn-secondary btn-sm">
                返回列表
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                <Save className="h-4 w-4" />
                {saving ? '正在保存...' : isEdit ? '保存修改' : '提交申请'}
              </button>
            </div>
          </form>

          <div className="sticky-panel space-y-6">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">申请摘要</h2>
                  <p className="mt-1 text-sm text-gray-500">右侧摘要会随着表单内容实时更新。</p>
                </div>
              </div>

              <div className="card-body space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {customerName.trim() || '未填写客户名称'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {projectName.trim() || '未填写项目名称'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">已选产品</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">{selectedProducts.length}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">总数量</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">{totalQuantity}</div>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">预估金额</div>
                    <div className="mt-2 text-2xl font-semibold text-primary-700">
                      {formatCurrency(estimatedAmount)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="text-sm font-medium text-gray-900">已选产品预览</div>
                  {selectedProducts.length === 0 ? (
                    <div className="mt-3 text-sm text-gray-500">还没有选择有效产品条目。</div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {selectedProducts.slice(0, 4).map((product) => (
                        <div key={product.id} className="rounded-2xl bg-gray-50 px-3 py-3">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {product.spec} · 库存 {product.stockQuantity} {product.unit}
                          </div>
                        </div>
                      ))}
                      {selectedProducts.length > 4 && (
                        <div className="text-xs text-gray-500">
                          还有 {selectedProducts.length - 4} 个产品未展开显示。
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">填写建议</h2>
              </div>
              <div className="card-body space-y-3 text-sm leading-6 text-gray-600">
                <p>数量和单价直接决定申请总额，审批前建议先核对一次项目报价。</p>
                <p>如果某个产品库存已经接近安全线，最好提前和货仓确认，避免通过后无法及时出库。</p>
                <p>备注里可以写交付时间、客户要求或审批关注点，能减少来回沟通。</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
