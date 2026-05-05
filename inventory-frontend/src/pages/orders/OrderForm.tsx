import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, RefreshCw, Save } from 'lucide-react';
import { orderApi, requestApi } from '../../services/api.ts';
import Layout from '../../components/Layout.tsx';
import type { PickupRequest } from '../../types';

function formatCurrency(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestIdFromQuery = searchParams.get('requestId');

  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [formData, setFormData] = useState({
    requestId: '',
    actualAmount: '',
    remark: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchAvailableRequests();
  }, []);

  useEffect(() => {
    if (requestIdFromQuery && !formData.requestId) {
      setFormData((current) => ({
        ...current,
        requestId: requestIdFromQuery,
      }));
    }
  }, [requestIdFromQuery, formData.requestId]);

  useEffect(() => {
    if (!formData.requestId) {
      setSelectedRequest(null);
      return;
    }

    const request = requests.find((item) => item.id === Number(formData.requestId)) || null;
    setSelectedRequest(request);

    if (request && !formData.actualAmount) {
      setFormData((current) => ({
        ...current,
        actualAmount: String(request.estimatedAmount ?? request.totalAmount ?? ''),
      }));
    }
  }, [formData.requestId, formData.actualAmount, requests]);

  const fetchAvailableRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await requestApi.getAll();
      const availableRequests = data.filter(
        (request) => request.status === 'APPROVED' || request.status === 'ADJUSTED',
      );
      setRequests(availableRequests);
    } catch (err) {
      setError('加载可下单申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.requestId || !formData.actualAmount) {
      setError('请选择申请并填写实际成交金额');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await orderApi.create({
        requestId: Number(formData.requestId),
        actualAmount: parseFloat(formData.actualAmount),
        remark: formData.remark,
      });
      navigate('/orders');
    } catch (err: any) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(message || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const estimateAmount = useMemo(() => {
    if (!selectedRequest) return 0;
    return selectedRequest.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
  }, [selectedRequest]);

  const actualAmountNumber = Number(formData.actualAmount || 0);
  const amountDiff = actualAmountNumber - estimateAmount;
  const itemCount = selectedRequest?.items?.length || 0;

  return (
    <Layout>
      <div className="page-shell-narrow space-y-6">
        <section className="hero-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/orders"
                className="inline-flex rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  订单创建
                </div>
                <h1 className="page-title mt-3">从申请生成订单</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  只允许从已审批申请创建订单。订单创建后会进入确认状态，并触发库存扣减。
                </p>
              </div>
            </div>

            <div className="grid min-w-[280px] grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">可建单申请</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{requests.length}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">产品条目</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{itemCount}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">申请金额</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">¥{formatCurrency(estimateAmount)}</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                <div className="text-xs text-gray-500">成交差额</div>
                <div className={`mt-2 text-xl font-semibold ${amountDiff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {actualAmountNumber ? `${amountDiff >= 0 ? '+' : ''}¥${formatCurrency(amountDiff)}` : '--'}
                </div>
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
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl bg-gray-100 p-4 text-gray-500">
                <FileText className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">暂无可创建订单的申请</h2>
              <p className="mt-2 text-sm text-gray-500">
                只有状态为“已批准”或“已调整”的申请才能继续生成订单。
              </p>
              <Link to="/requests" className="btn btn-primary btn-sm mt-6">
                去查看申请
              </Link>
            </div>
          </div>
        ) : (
          <div className="form-layout">
            <form onSubmit={handleSubmit} className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">订单信息</h2>
                  <p className="mt-1 text-sm text-gray-500">先选择来源申请，再确认成交金额和备注</p>
                </div>
                <button type="button" onClick={() => void fetchAvailableRequests()} className="btn btn-secondary btn-sm">
                  <RefreshCw className="h-4 w-4" />
                  刷新
                </button>
              </div>

              <div className="card-body space-y-8">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    选择申请
                  </h3>
                  <div className="mt-4">
                    <label className="form-label">
                      来源申请 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.requestId}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, requestId: event.target.value }))
                      }
                      className="form-select"
                      required
                    >
                      <option value="">请选择申请</option>
                      {requests.map((request) => (
                        <option key={request.id} value={request.id}>
                          {request.requestNo} / {request.customerName} / {request.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {selectedRequest && (
                  <section className="border-t border-gray-100 pt-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                          申请明细
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          客户：{selectedRequest.customerName} / 项目：{selectedRequest.projectName}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="text-xs text-gray-500">销售</div>
                          <div className="mt-1 font-semibold text-gray-900">{selectedRequest.salesName}</div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="text-xs text-gray-500">申请状态</div>
                          <div className="mt-1 font-semibold text-gray-900">{selectedRequest.statusDescription}</div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="text-xs text-gray-500">产品条目</div>
                          <div className="mt-1 font-semibold text-gray-900">{itemCount}</div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="text-xs text-gray-500">申请金额</div>
                          <div className="mt-1 font-semibold text-primary-700">¥{formatCurrency(estimateAmount)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-3xl border border-gray-100">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>产品</th>
                            <th className="text-right">数量</th>
                            <th className="text-right">单价</th>
                            <th className="text-right">小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.items?.map((item, index) => (
                            <tr key={`${item.productName || item.product?.name}-${index}`}>
                              <td>{item.productName || item.product?.name || '-'}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right">¥{formatCurrency(item.unitPrice)}</td>
                              <td className="text-right font-semibold text-gray-900">
                                ¥{formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                <section className="border-t border-gray-100 pt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    成交信息
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="form-label">
                        实际成交金额 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.actualAmount}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, actualAmount: event.target.value }))
                          }
                          className="form-input pl-8"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="form-hint">如果金额与申请金额不同，系统仍会保留差额，便于后续对账。</div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="form-label">备注</label>
                      <textarea
                        value={formData.remark}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, remark: event.target.value }))
                        }
                        rows={3}
                        className="form-textarea"
                        placeholder="补充议价说明、交付要求或其他成交信息"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-5">
                <Link to="/orders" className="btn btn-secondary btn-sm">
                  取消
                </Link>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  <Save className="h-4 w-4" />
                  {submitting ? '提交中...' : '创建订单'}
                </button>
              </div>
            </form>

            <div className="sticky-panel space-y-6">
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">订单摘要</h2>
                    <p className="mt-1 text-sm text-gray-500">关键金额和差异实时同步</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedRequest?.requestNo || '未选择申请'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {selectedRequest
                        ? `${selectedRequest.customerName} / ${selectedRequest.projectName}`
                        : '先选择一条已审批申请'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">申请金额</div>
                      <div className="mt-2 text-lg font-semibold text-gray-900">
                        ¥{formatCurrency(estimateAmount)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">成交金额</div>
                      <div className="mt-2 text-lg font-semibold text-primary-700">
                        ¥{formatCurrency(actualAmountNumber)}
                      </div>
                    </div>
                    <div className="col-span-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">金额差额</div>
                      <div className={`mt-2 text-2xl font-semibold ${amountDiff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {actualAmountNumber ? `${amountDiff >= 0 ? '+' : ''}¥${formatCurrency(amountDiff)}` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">注意事项</h2>
                  </div>
                </div>
                <div className="card-body space-y-3 text-sm text-gray-600">
                  <p>订单创建后会按申请明细扣减库存，因此明细和数量要在申请阶段确认清楚。</p>
                  <p>若实际成交金额与申请金额存在差异，建议在备注中说明原因，方便财务核对。</p>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
