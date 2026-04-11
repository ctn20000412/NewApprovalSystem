import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  Hourglass,
  Package,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import Layout from '../components/Layout.tsx';
import { orderApi, requestApi } from '../services/api.ts';
import type { PickupRequest } from '../types';

interface DashboardStats {
  pendingRequests: number;
  approvedRequests: number;
  monthOrders: number;
  monthSales: number;
  monthCustomers: number;
  avgOrderAmount: number;
}

const statusStyles: Record<string, string> = {
  PENDING: 'badge badge-pending',
  APPROVED: 'badge badge-approved',
  REJECTED: 'badge badge-rejected',
  ADJUSTED: 'badge border border-sky-200 bg-sky-50 text-sky-700',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
};

function formatCurrency(amount: number) {
  return `¥${Number(amount || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
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

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    approvedRequests: 0,
    monthOrders: 0,
    monthSales: 0,
    monthCustomers: 0,
    avgOrderAmount: 0,
  });
  const [recentRequests, setRecentRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requests, orders] = await Promise.all([requestApi.getAll(), orderApi.getAll()]);
      const requestList = Array.isArray(requests) ? requests : [];
      const orderList = Array.isArray(orders) ? orders : [];
      const now = new Date();

      const currentMonthOrders = orderList.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
      });

      const monthSales = currentMonthOrders.reduce(
        (sum, order) => sum + Number(order.actualAmount || order.totalAmount || 0),
        0,
      );

      const monthCustomers = new Set(
        currentMonthOrders.map((order) => order.customerName).filter(Boolean),
      ).size;

      setStats({
        pendingRequests: requestList.filter((request) => request.status === 'PENDING').length,
        approvedRequests: requestList.filter((request) => request.status === 'APPROVED').length,
        monthOrders: currentMonthOrders.length,
        monthSales,
        monthCustomers,
        avgOrderAmount: currentMonthOrders.length ? monthSales / currentMonthOrders.length : 0,
      });

      setRecentRequests(
        [...requestList]
          .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt))
          .slice(0, 6),
      );
    } catch (loadError) {
      console.error('Failed to load dashboard data:', loadError);
      setError('运营总览加载失败，请刷新页面后重试。');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      to: '/requests/new',
      icon: FilePlus2,
      title: '新建取货申请',
      desc: '录入客户项目、产品条目和预估金额，快速进入审批流程。',
      theme: 'from-primary-600 to-primary-800',
      tint: 'bg-primary-50',
    },
    {
      to: '/orders',
      icon: ReceiptText,
      title: '查看订单进度',
      desc: '检查已创建订单、完成情况和取消记录，及时跟进交付节点。',
      theme: 'from-accent-500 to-accent-700',
      tint: 'bg-accent-50',
    },
    {
      to: '/products',
      icon: Boxes,
      title: '检查产品库存',
      desc: '核对低库存和重点品类，避免申请通过后无法及时出库。',
      theme: 'from-slate-700 to-slate-900',
      tint: 'bg-slate-100',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {error && (
          <div className="alert alert-error">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">数据加载失败</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="hero-panel">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-end">
              <div>
                <div className="section-kicker">今日节奏</div>
                <h2 className="mt-4 max-w-[13ch] text-[clamp(1.5rem,1.9vw,2.45rem)] font-bold leading-[1.12] tracking-tight text-gray-900">
                  把申请、订单和库存放在同一个工作流里。
                </h2>
                <p className="mt-4 max-w-[62ch] text-[13px] leading-6 text-gray-600 md:text-sm">
                  {isManager()
                    ? '集中查看待审批申请、本月订单和销售额变化，优先处理阻塞项，再回到仓位和用户侧排查风险。'
                    : '先确认自己提交的申请进度，再核对本月成交与客户覆盖情况，遇到异常可以继续下钻到订单和库存页面。'}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CalendarDays className="h-4 w-4 text-primary-600" />
                      今日日期
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">
                      {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </div>
                    <div className="metric-chip-note">建议优先处理今天需要审批和跟进的事项。</div>
                  </div>

                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <ClipboardCheck className="h-4 w-4 text-primary-600" />
                      当前角色
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">{user?.roleDescription || '未登录'}</div>
                    <div className="metric-chip-note">不同角色看到的数据范围和操作权限不同。</div>
                  </div>

                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Sparkles className="h-4 w-4 text-accent-600" />
                      本月节奏
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">
                      {loading ? '--' : `${stats.monthOrders} 单`}
                    </div>
                    <div className="metric-chip-note">成交节奏会直接影响库存占用和出库安排。</div>
                  </div>
                </div>
              </div>

              <div className="metric-strip">
                <div className="metric-chip">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">本月成交额</span>
                    <CircleDollarSign className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="metric-chip-value">{loading ? '--' : formatCurrency(stats.monthSales)}</div>
                  <div className="metric-chip-note">按当前可见订单统计，自动匹配你的权限范围。</div>
                </div>

                <div className="metric-chip">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">待处理申请</span>
                    <Hourglass className="h-4 w-4 text-accent-600" />
                  </div>
                  <div className="metric-chip-value">{loading ? '--' : stats.pendingRequests}</div>
                  <div className="metric-chip-note">申请积压越多，审批和库存调度越容易断层。</div>
                </div>

                <div className="metric-chip">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">服务客户数</span>
                    <Users className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="metric-chip-value">{loading ? '--' : stats.monthCustomers}</div>
                  <div className="metric-chip-note">按本月订单去重，便于观察客户覆盖面。</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-kicker">操作提示</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">今天先做哪几件事</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] border border-primary-100 bg-primary-50/70 p-4">
                <div className="text-sm font-medium text-gray-900">先看审批积压</div>
                <div className="mt-1 text-[13px] leading-5 text-gray-600">
                  当前还有 <span className="font-semibold text-primary-700">{loading ? '--' : stats.pendingRequests}</span>{' '}
                  条待审批申请，越早处理越能减少订单和出库串联的延迟。
                </div>
              </div>

              <div className="rounded-[24px] border border-accent-100 bg-accent-50/70 p-4">
                <div className="text-sm font-medium text-gray-900">留意成交质量</div>
                <div className="mt-1 text-[13px] leading-5 text-gray-600">
                  本月平均单价约为{' '}
                  <span className="font-semibold text-accent-700">
                    {loading ? '--' : formatCurrency(stats.avgOrderAmount)}
                  </span>
                  ，低于预期时需要回看项目利润和报价节奏。
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-sm font-medium text-gray-900">当前登录账号</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 font-semibold text-white">
                    {user?.realName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user?.realName || '-'}</div>
                    <div className="text-sm text-gray-500">
                      {user?.username || '-'} · {user?.roleDescription || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr]">
          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">待审批申请</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : stats.pendingRequests}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-accent-700">
                  <Hourglass className="h-3.5 w-3.5" />
                  直接影响后续订单与出库节奏
                </div>
              </div>
              <div className="stat-icon warning">
                <Hourglass className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">本月订单数</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : stats.monthOrders}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  维持稳定成交比冲量更重要
                </div>
              </div>
              <div className="stat-icon success">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">已审批申请</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : stats.approvedRequests}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500">
                  可以继续推进建单和出库
                </div>
              </div>
              <div className="stat-icon primary">
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">平均客单价</div>
                <div className="mt-3 text-[2rem] font-semibold tracking-tight text-gray-900">
                  {loading ? '--' : formatCurrency(stats.avgOrderAmount)}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500">
                  用于判断报价质量和项目结构
                </div>
              </div>
              <div className="stat-icon warning">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <div className="section-kicker">最近动态</div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">最近取货申请</h3>
              </div>
              <Link
                to="/requests"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
              >
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 px-6 py-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-[24px] border border-gray-100 p-4 md:grid-cols-[180px_minmax(0,1fr)_140px_120px]"
                  >
                    <div className="skeleton h-12" />
                    <div className="skeleton h-12" />
                    <div className="skeleton h-12" />
                    <div className="skeleton h-12" />
                  </div>
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package className="h-8 w-8 text-primary-700" />
                </div>
                <div className="empty-state-title">最近还没有新的取货申请</div>
                <div className="empty-state-desc">新增申请后，这里会展示最近的客户项目、金额和状态。</div>
                <Link to="/requests/new" className="btn btn-primary">
                  <FilePlus2 className="h-4 w-4" />
                  新建取货申请
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>申请编号</th>
                      <th>客户与项目</th>
                      <th>申请金额</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <div className="font-semibold text-gray-900">{request.requestNo || '-'}</div>
                          <div className="mt-1 text-xs text-gray-400">{formatDate(request.createdAt)}</div>
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{request.customerName || '未填写客户'}</div>
                          <div className="mt-1 text-sm text-gray-500">{request.projectName || '未填写项目'}</div>
                        </td>
                        <td className="font-semibold text-gray-900">
                          {formatCurrency(Number(request.totalAmount || 0))}
                        </td>
                        <td>
                          <span className={statusStyles[request.status] || 'badge badge-pending'}>
                            {request.statusDescription || request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="section-kicker">快捷入口</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">直接进入关键动作</h3>
              <div className="mt-5 space-y-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={`group block rounded-[28px] border border-gray-100 ${action.tint} p-5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.theme} text-white`}
                      >
                        <action.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
                    </div>
                    <div className="mt-5 text-base font-semibold text-gray-900">{action.title}</div>
                    <div className="mt-2 text-sm leading-6 text-gray-600">{action.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="section-kicker">今日提醒</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">关注这两个风险点</h3>
              <div className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
                <div className="rounded-[24px] border border-gray-100 bg-gray-50/80 p-4">
                  如果待审批申请连续增加，说明审批和库存评估没有同步，需要优先回看申请链路。
                </div>
                <div className="rounded-[24px] border border-gray-100 bg-gray-50/80 p-4">
                  如果订单数正常但成交额偏低，要回看产品结构、报价折扣和客户类型是否失衡。
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
