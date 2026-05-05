import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Filter,
  Pencil,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Layout from '../../components/Layout.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { requestApi } from '../../services/api.ts';
import type { PickupRequest } from '../../types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'ADJUSTED', label: '已调整' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const quickStatuses = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'COMPLETED', label: '已完成' },
];

function formatCurrency(amount: number) {
  return `¥${Number(amount || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', {
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

export default function RequestList() {
  const { user, isManager } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statusFilter = searchParams.get('status') ?? '';

  useEffect(() => {
    void loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await requestApi.getAll(statusFilter ? { status: statusFilter } : undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Failed to load requests:', loadError);
      setError('取货申请加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('确定要取消这条取货申请吗？取消后不能继续审批。')) {
      return;
    }

    try {
      await requestApi.cancel(id);
      await loadRequests();
    } catch (cancelError) {
      console.error('Failed to cancel request:', cancelError);
      window.alert('取消申请失败，请稍后重试。');
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length;
  const totalAmount = requests.reduce((sum, request) => sum + Number(request.totalAmount || 0), 0);

  const statusSummary = useMemo(() => {
    if (!statusFilter) return '当前展示全部申请。';
    const current = statusOptions.find((option) => option.value === statusFilter);
    return `当前筛选：${current?.label || statusFilter}`;
  }, [statusFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        <section className="hero-panel">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-end">
            <div>
              <div className="section-kicker">申请工作台</div>
              <h2 className="page-title mt-3 max-w-[18ch]">
                把客户项目、产品明细和审批节奏放在同一张申请台账里。
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-gray-600">
                这里集中处理取货申请的创建、筛选、查看和状态跟进。经理可以重点关注待审批项，销售可以快速回看自己的申请进度。
              </p>
              <div className="mt-4 inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm text-primary-700">
                {statusSummary}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock3 className="h-4 w-4 text-accent-600" />
                  待审批
                </div>
                <div className="metric-chip-value">{loading ? '--' : pendingCount}</div>
                <div className="metric-chip-note">待审批越多，后续订单和出库越容易堆积。</div>
              </div>
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-primary-600" />
                  已批准
                </div>
                <div className="metric-chip-value">{loading ? '--' : approvedCount}</div>
                <div className="metric-chip-note">已批准申请可以继续推进建单和出库。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.15fr]">
          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">申请总数</div>
                <div className="stat-value">
                  {loading ? '--' : requests.length}
                </div>
                <div className="mt-3 text-xs text-gray-500">覆盖当前筛选范围内的全部申请记录。</div>
              </div>
              <div className="stat-icon primary">
                <Filter className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">待审批申请</div>
                <div className="stat-value">
                  {loading ? '--' : pendingCount}
                </div>
                <div className="mt-3 text-xs text-gray-500">是最需要优先消化的申请队列。</div>
              </div>
              <div className="stat-icon warning">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">已批准申请</div>
                <div className="stat-value">
                  {loading ? '--' : approvedCount}
                </div>
                <div className="mt-3 text-xs text-gray-500">这些申请可以继续推进成订单。</div>
              </div>
              <div className="stat-icon success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">申请总金额</div>
                <div className="mt-3 text-[2rem] font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : formatCurrency(totalAmount)}
                </div>
                <div className="mt-3 text-xs text-gray-500">用于快速判断当前申请池的业务体量。</div>
              </div>
              <div className="stat-icon warning">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="grid gap-4 xl:grid-cols-[220px_auto_auto] xl:items-center">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextStatus) {
                    nextParams.set('status', nextStatus);
                  } else {
                    nextParams.delete('status');
                  }
                  setSearchParams(nextParams, { replace: true });
                }}
                className="form-select pl-10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => void loadRequests()} className="btn btn-secondary">
                <RefreshCw className="h-4 w-4" />
                刷新列表
              </button>

              {isManager() && (
                <Link to="/requests?status=PENDING" className="btn btn-secondary">
                  <Clock3 className="h-4 w-4" />
                  只看待审批
                </Link>
              )}
            </div>

            <div className="flex justify-start xl:justify-end">
              <Link to="/requests/new" className="btn btn-primary">
                <FilePlus2 className="h-4 w-4" />
                新建申请
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickStatuses.map((status) => {
              const active = statusFilter === status.value;
              return (
                <button
                  key={status.value || 'all'}
                  type="button"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    if (status.value) {
                      nextParams.set('status', status.value);
                    } else {
                      nextParams.delete('status');
                    }
                    setSearchParams(nextParams, { replace: true });
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">申请列表加载失败</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">申请列表</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">取货申请台账</h3>
            </div>
            <div className="text-sm text-gray-500">
              当前账号：<span className="font-semibold text-gray-900">{user?.realName || '-'}</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-[26px] border border-gray-100 p-5 xl:grid-cols-[160px_minmax(0,1.1fr)_180px_150px_150px]"
                >
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FilePlus2 className="h-8 w-8 text-primary-700" />
              </div>
              <div className="empty-state-title">当前筛选下没有取货申请</div>
              <div className="empty-state-desc">
                你可以切换状态筛选，也可以直接新建一条申请，把客户项目和产品明细推进到审批流里。
              </div>
              <Link to="/requests/new" className="btn btn-primary">
                <FilePlus2 className="h-4 w-4" />
                新建取货申请
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 px-6">
              {requests.map((request) => {
                const applicantName = request.applicant?.realName || request.salesName || '未识别申请人';
                const itemCount = request.items?.length ?? 0;
                const requestAmount = Number(request.totalAmount || 0);

                return (
                  <div
                    key={request.id}
                    className="grid gap-4 py-5 xl:grid-cols-[160px_minmax(0,1.1fr)_180px_150px_150px] xl:items-center"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">申请编号</div>
                      <div className="mt-2 font-semibold text-gray-900">{request.requestNo || '-'}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatDate(request.createdAt)}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{request.customerName || '未填写客户'}</div>
                      <div className="mt-1 text-sm text-gray-500">{request.projectName || '未填写项目'}</div>
                      <div className="mt-3 text-xs text-gray-500">申请人：{applicantName}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">申请金额</div>
                      <div className="mt-2 text-base font-semibold text-gray-900">
                        {formatCurrency(requestAmount)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{itemCount} 个产品条目</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">状态</div>
                      <div className="mt-2">
                        <span className={getStatusClass(request.status)}>{request.statusDescription || request.status}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 xl:justify-end">
                      <Link to={`/requests/${request.id}`} className="btn btn-secondary text-sm">
                        <Eye className="h-4 w-4" />
                        查看
                      </Link>
                      {request.status === 'PENDING' && request.applicant?.id === user?.id && (
                        <>
                          <Link
                            to={`/requests/${request.id}/edit`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-sky-700 transition-colors hover:bg-sky-50"
                            title="编辑申请"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => void handleCancel(request.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                            title="取消申请"
                          >
                            <XCircle className="h-4 w-4" />
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
