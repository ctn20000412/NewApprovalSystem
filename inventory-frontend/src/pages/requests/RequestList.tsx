import { useEffect, useState } from 'react';
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
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'ADJUSTED', label: '已调整' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
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
      setError('申请列表加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('确认取消这条申请吗？取消后将不会进入后续建单流程。')) {
      return;
    }

    try {
      await requestApi.cancel(id);
      await loadRequests();
    } catch (cancelError) {
      console.error('Failed to cancel request:', cancelError);
      window.alert('取消失败，请稍后重试。');
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length;
  const totalAmount = requests.reduce((sum, request) => sum + Number(request.totalAmount || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <section className="hero-panel">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-end">
            <div>
              <div className="section-kicker">销售申请协同</div>
              <h2 className="mt-4 max-w-[13ch] text-[clamp(1.9rem,2.4vw,3.3rem)] font-bold tracking-tight text-gray-900">
                让每一条取货申请都能被快速看见、及时处理。
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-gray-600 md:text-base">
                这里汇总客户项目、申请金额和审批状态。经理可以直接盯住待审批积压，销售可以专注处理自己仍可编辑或取消的申请。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock3 className="h-4 w-4 text-accent-600" />
                  待审批
                </div>
                <div className="metric-chip-value">{loading ? '--' : pendingCount}</div>
                <div className="metric-chip-note">越早审批，越不容易拖慢建单与出库。</div>
              </div>
              <div className="metric-chip">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-primary-600" />
                  已通过
                </div>
                <div className="metric-chip-value">{loading ? '--' : approvedCount}</div>
                <div className="metric-chip-note">已通过的申请可以继续转单。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_1fr_1fr]">
          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">申请总数</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : requests.length}
                </div>
                <div className="mt-3 text-xs text-gray-500">按当前筛选条件统计。</div>
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
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : pendingCount}
                </div>
                <div className="mt-3 text-xs text-gray-500">需要经理尽快确认。</div>
              </div>
              <div className="stat-icon warning">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">已通过申请</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : approvedCount}
                </div>
                <div className="mt-3 text-xs text-gray-500">可以继续推进建单。</div>
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
                <div className="mt-3 text-xs text-gray-500">便于判断当前销售机会规模。</div>
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
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">申请列表暂时不可用</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">申请明细</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">取货申请列表</h3>
            </div>
            <div className="text-sm text-gray-500">
              当前登录账号：<span className="font-semibold text-gray-900">{user?.realName || '-'}</span>
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
              <div className="empty-state-title">当前没有符合条件的申请</div>
              <div className="empty-state-desc">可以切换状态筛选，或者直接发起一条新的取货申请。</div>
              <Link to="/requests/new" className="btn btn-primary">
                <FilePlus2 className="h-4 w-4" />
                新建申请
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 px-6">
              {requests.map((request) => {
                const applicantName = request.applicant?.realName || request.salesName || '未知申请人';
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
                      <div className="mt-3 text-xs text-gray-500">申请人 {applicantName}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">申请金额</div>
                      <div className="mt-2 text-base font-semibold text-gray-900">
                        {formatCurrency(requestAmount)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{itemCount} 个条目</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">审批状态</div>
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
