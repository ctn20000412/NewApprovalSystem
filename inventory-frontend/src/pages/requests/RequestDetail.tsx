import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Pencil,
  ReceiptText,
  X,
  XCircle,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { requestApi } from '../../services/api.ts';
import type { PickupRequest } from '../../types';

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'badge badge-pending';
    case 'APPROVED':
      return 'badge badge-approved';
    case 'REJECTED':
      return 'badge badge-rejected';
    case 'ADJUSTED':
      return 'badge border border-sky-200 bg-sky-50 text-sky-700';
    case 'COMPLETED':
      return 'badge badge-completed';
    case 'CANCELLED':
      return 'badge badge-cancelled';
    default:
      return 'badge badge-cancelled';
  }
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isManager } = useAuth();
  const [request, setRequest] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await requestApi.getById(Number(id));
      setRequest(data);
    } catch (loadError) {
      console.error('Failed to load request:', loadError);
      setError('申请详情加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('确认取消这条申请吗？取消后将不会进入后续建单流程。')) {
      return;
    }

    try {
      setSubmitting(true);
      await requestApi.cancel(Number(id));
      await loadRequest();
    } catch (cancelError) {
      console.error('Failed to cancel request:', cancelError);
      setError('取消申请失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('确认通过这条申请吗？通过后即可继续建单。')) {
      return;
    }

    try {
      setSubmitting(true);
      await requestApi.approve(Number(id));
      await loadRequest();
    } catch (approveError) {
      console.error('Failed to approve request:', approveError);
      setError('审批失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      window.alert('请填写驳回原因。');
      return;
    }

    try {
      setSubmitting(true);
      await requestApi.reject(Number(id), rejectComment.trim());
      setShowRejectModal(false);
      setRejectComment('');
      await loadRequest();
    } catch (rejectError) {
      console.error('Failed to reject request:', rejectError);
      setError('驳回失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = request?.status === 'PENDING' && request.applicant.id === user?.id;
  const canCancel = request?.status === 'PENDING' && request.applicant.id === user?.id;
  const canApprove = request?.status === 'PENDING' && isManager();

  const totalQuantity = useMemo(
    () => request?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [request],
  );

  if (loading) {
    return (
      <Layout>
        <div className="page-shell">
          <div className="card">
            <div className="flex items-center justify-center py-20 text-gray-500">正在加载申请详情...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="page-shell">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText className="h-8 w-8 text-primary-700" />
              </div>
              <div className="empty-state-title">没有找到这条申请</div>
              <div className="empty-state-desc">可能是申请不存在，或者你当前没有访问权限。</div>
              <Link to="/requests" className="btn btn-primary">
                返回申请列表
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell space-y-6">
        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">操作未完成</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="hero-panel">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-end">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  to="/requests"
                  className="inline-flex rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  申请详情
                </div>
              </div>

              <h2 className="page-title mt-3 max-w-[16ch]">
                {request.requestNo}
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-gray-600 md:text-base">
                这里汇总客户、项目、产品条目和审批动作。经理可以直接审批，销售可以继续编辑或取消仍处于待审批状态的申请。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">当前状态</div>
                <div className="mt-3">
                  <span className={getStatusClass(request.status)}>{request.statusDescription}</span>
                </div>
                <div className="metric-chip-note">状态会决定是否还能编辑、取消或建单。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">申请总额</div>
                <div className="metric-chip-value text-primary-700">{formatCurrency(request.totalAmount)}</div>
                <div className="metric-chip-note">审批时建议同步关注金额是否合理。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">产品条目</div>
                <div className="metric-chip-value">{request.items.length}</div>
                <div className="metric-chip-note">条目数量越多，越需要关注库存与单价准确性。</div>
              </div>
              <div className="metric-chip">
                <div className="text-sm font-medium text-gray-700">合计数量</div>
                <div className="metric-chip-value">{totalQuantity}</div>
                <div className="metric-chip-note">用于提前判断货仓出库压力。</div>
              </div>
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <div className="space-y-6 min-w-0">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">基础信息</h2>
                  <p className="mt-1 text-sm text-gray-500">客户、项目、申请人和备注说明。</p>
                </div>
              </div>

              <div className="card-body">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">申请编号</div>
                    <div className="mt-2 font-medium text-gray-900">{request.requestNo}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">申请时间</div>
                    <div className="mt-2 font-medium text-gray-900">{formatDate(request.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">客户名称</div>
                    <div className="mt-2 font-medium text-gray-900">{request.customerName}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">项目名称</div>
                    <div className="mt-2 font-medium text-gray-900">{request.projectName}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">申请人</div>
                    <div className="mt-2 font-medium text-gray-900">{request.applicant.realName}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-gray-400">状态</div>
                    <div className="mt-2">
                      <span className={getStatusClass(request.status)}>{request.statusDescription}</span>
                    </div>
                  </div>
                  {request.remark && (
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">备注说明</div>
                      <div className="mt-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600">
                        {request.remark}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">产品条目</h2>
                  <p className="mt-1 text-sm text-gray-500">逐条核对规格、数量、单价和小计金额。</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th>规格</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium text-gray-900">
                            {item.product?.name || item.productName || '-'}
                          </div>
                        </td>
                        <td className="text-sm text-gray-500">
                          {item.product?.spec || item.product?.model || '-'}
                        </td>
                        <td className="text-sm text-gray-900">{item.quantity}</td>
                        <td className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {request.approvedBy && (
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">审批信息</h2>
                    <p className="mt-1 text-sm text-gray-500">记录审批人、时间和审批说明。</p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">审批人</div>
                      <div className="mt-2 font-medium text-gray-900">{request.approvedBy.realName}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-gray-400">审批时间</div>
                      <div className="mt-2 font-medium text-gray-900">{formatDate(request.approvedAt)}</div>
                    </div>
                    {request.approvedComment && (
                      <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-400">审批说明</div>
                        <div className="mt-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600">
                          {request.approvedComment}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="sticky-panel space-y-6">
            {(canEdit || canCancel || canApprove) && (
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">可执行操作</h2>
                    <p className="mt-1 text-sm text-gray-500">按当前状态展示可以继续执行的动作。</p>
                  </div>
                </div>

                <div className="card-body space-y-3">
                  {canEdit && (
                    <Link to={`/requests/${id}/edit`} className="btn btn-secondary w-full">
                      <Pencil className="h-4 w-4" />
                      编辑申请
                    </Link>
                  )}

                  {canCancel && (
                    <button onClick={handleCancel} disabled={submitting} className="btn btn-danger w-full">
                      <XCircle className="h-4 w-4" />
                      取消申请
                    </button>
                  )}

                  {canApprove && (
                    <>
                      <button onClick={handleApprove} disabled={submitting} className="btn btn-success w-full">
                        <CheckCircle2 className="h-4 w-4" />
                        审批通过
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={submitting}
                        className="btn btn-danger w-full"
                      >
                        <X className="h-4 w-4" />
                        驳回申请
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {(request.status === 'APPROVED' || request.status === 'ADJUSTED') && (
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">后续动作</h2>
                    <p className="mt-1 text-sm text-gray-500">审批通过后可以直接从申请创建订单。</p>
                  </div>
                </div>

                <div className="card-body">
                  <Link to={`/orders/new?requestId=${id}`} className="btn btn-primary w-full">
                    <ReceiptText className="h-4 w-4" />
                    基于申请创建订单
                  </Link>
                </div>
              </section>
            )}

            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">状态说明</h2>
                  <p className="mt-1 text-sm text-gray-500">帮助理解不同状态下还能执行哪些动作。</p>
                </div>
              </div>

              <div className="card-body space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-pending">待审批</span>
                    <span>等待经理审核，销售仍可编辑或取消。</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-approved">已通过</span>
                    <span>可以继续创建订单并推进出库。</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-rejected">已驳回</span>
                    <span>申请被拒绝，需要根据原因重新调整后再发起。</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-cancelled">已取消</span>
                    <span>申请已终止，不再进入后续建单流程。</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">快速跳转</h2>
                </div>
              </div>

              <div className="card-body space-y-3">
                <Link to="/requests" className="btn btn-secondary w-full">
                  <Eye className="h-4 w-4" />
                  返回申请列表
                </Link>
                <Link to="/products" className="btn btn-secondary w-full">
                  <ClipboardList className="h-4 w-4" />
                  查看产品库存
                </Link>
              </div>
            </section>
          </div>
        </div>

        {showRejectModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[30px] border border-white/60 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-kicker">审批动作</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">填写驳回原因</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    驳回原因会回写到申请记录里，销售可以据此修改后重新提交。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6">
                <label className="form-label">驳回原因</label>
                <textarea
                  value={rejectComment}
                  onChange={(event) => setRejectComment(event.target.value)}
                  rows={4}
                  className="form-textarea"
                  placeholder="例如：报价过高、项目资料不完整、库存不足、产品选择需要调整"
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submitting}
                  className="btn btn-danger"
                >
                  <XCircle className="h-4 w-4" />
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
