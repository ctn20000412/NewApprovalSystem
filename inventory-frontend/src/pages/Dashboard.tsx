import { useEffect, useMemo, useState } from 'react';
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
  const managerView = isManager();
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

  const headline = useMemo(() => {
    if (managerView) {
      return stats.pendingRequests > 0
        ? `今天先处理 ${stats.pendingRequests} 条待审批申请。`
        : '审批队列已清空，转去盯订单和库存。';
    }

    return stats.pendingRequests > 0
      ? `今天还有 ${stats.pendingRequests} 条申请在流转中。`
      : '今天的申请队列很干净，可以继续推进成交。';
  }, [managerView, stats.pendingRequests]);

  const summary = useMemo(() => {
    if (managerView) {
      return stats.monthOrders > 0
        ? `本月已成交 ${stats.monthOrders} 单，收入 ${formatCurrency(stats.monthSales)}。`
        : '本月暂未形成成交，建议先从申请线索和库存节奏开始推进。';
    }

    return stats.monthOrders > 0
      ? `你本月已推动 ${stats.monthOrders} 单成交，继续跟进客户与审批节奏。`
      : '你本月还没有形成订单，可以从新建申请或回访客户开始。';
  }, [managerView, stats.monthOrders, stats.monthSales]);

  const quickActions = managerView
    ? [
        {
          to: '/requests?status=PENDING',
          icon: ClipboardCheck,
          title: '查看待审批申请',
          desc: '优先处理还在审批队列里的取货申请，减少出库等待。',
          theme: 'from-primary-600 to-primary-800',
          tint: 'bg-primary-50',
        },
        {
          to: '/orders',
          icon: ReceiptText,
          title: '跟进订单进度',
          desc: '回看创建、完成与取消状态，把成交和出库节奏盯紧。',
          theme: 'from-accent-500 to-accent-700',
          tint: 'bg-accent-50',
        },
        {
          to: '/warehouse',
          icon: Boxes,
          title: '检查库存预警',
          desc: '查看低库存产品和近期流水，避免订单推进到一半才发现缺货。',
          theme: 'from-slate-700 to-slate-900',
          tint: 'bg-slate-100',
        },
      ]
    : [
        {
          to: '/requests/new',
          icon: FilePlus2,
          title: '新建取货申请',
          desc: '录入客户、项目和产品明细，尽快把客户需求推入审批流程。',
          theme: 'from-primary-600 to-primary-800',
          tint: 'bg-primary-50',
        },
        {
          to: '/orders',
          icon: ReceiptText,
          title: '查看我的订单',
          desc: '跟进已建订单状态，及时确认完成、取消和实际成交金额。',
          theme: 'from-accent-500 to-accent-700',
          tint: 'bg-accent-50',
        },
        {
          to: '/reports/sales',
          icon: TrendingUp,
          title: '查看我的业绩',
          desc: '按月份回看成交额、客户数和平均客单价，判断推进节奏。',
          theme: 'from-slate-700 to-slate-900',
          tint: 'bg-slate-100',
        },
      ];

  const playbook = [
    stats.pendingRequests > 0
      ? `当前有 ${stats.pendingRequests} 条待处理申请，优先清理审批阻塞。`
      : '当前没有待处理申请，可以把注意力转向订单完成和客户回访。',
    stats.monthOrders > 0
      ? `本月已形成 ${stats.monthOrders} 单成交，重点核对实际金额与交付节奏。`
      : '本月暂未形成订单，建议尽快从申请池里推进可成交项目。',
    stats.monthCustomers > 0
      ? `本月覆盖 ${stats.monthCustomers} 位客户，注意区分重点客户和长尾客户。`
      : '本月客户覆盖还不多，可以优先推进已有线索的复访节奏。',
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {error && (
          <div className="alert alert-error">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">数据读取失败</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="hero-panel">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_320px] xl:items-end">
              <div>
                <div className="section-kicker">今日节奏</div>
                <h2 className="page-title mt-3 max-w-[18ch]">
                  {headline}
                </h2>
                <p className="mt-4 max-w-[62ch] text-sm leading-7 text-gray-600">{summary}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CalendarDays className="h-4 w-4 text-primary-600" />
                      今日日期
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">
                      {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </div>
                    <div className="metric-chip-note">建议优先处理卡在审批和出库之间的关键节点。</div>
                  </div>

                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <ClipboardCheck className="h-4 w-4 text-primary-600" />
                      当前角色
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">{user?.roleDescription || '未识别'}</div>
                    <div className="metric-chip-note">不同角色看到的统计口径和操作入口会自动适配。</div>
                  </div>

                  <div className="metric-chip">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Sparkles className="h-4 w-4 text-accent-600" />
                      本月节奏
                    </div>
                    <div className="metric-chip-value text-[1.05rem]">
                      {loading ? '--' : `${stats.monthOrders} 单`}
                    </div>
                    <div className="metric-chip-note">申请、审批、建单和出库最好保持同一条推进节奏。</div>
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
                  <div className="metric-chip-note">按当前可见订单统计，可用来判断当月推进质量。</div>
                </div>

                <div className="metric-chip">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">待审批申请</span>
                    <Hourglass className="h-4 w-4 text-accent-600" />
                  </div>
                  <div className="metric-chip-value">{loading ? '--' : stats.pendingRequests}</div>
                  <div className="metric-chip-note">审批队列越长，申请转订单和出库就越容易堵塞。</div>
                </div>

                <div className="metric-chip">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">服务客户数</span>
                    <Users className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="metric-chip-value">{loading ? '--' : stats.monthCustomers}</div>
                  <div className="metric-chip-note">客户覆盖越广，越需要把项目和订单节奏看清楚。</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-kicker">操作提示</div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">今天先做哪几件事</h3>
            <div className="mt-5 space-y-4">
              {playbook.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-[24px] border p-4 ${
                    index === 0
                      ? 'border-primary-100 bg-primary-50/70'
                      : index === 1
                        ? 'border-accent-100 bg-accent-50/70'
                        : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {index === 0 ? '先看队列' : index === 1 ? '盯住成交' : '回看客户'}
                  </div>
                  <div className="mt-1 text-[13px] leading-5 text-gray-600">{item}</div>
                </div>
              ))}

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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr]">
          <div className="card stat-card p-6 text-primary-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">待审批申请</div>
                <div className="stat-value">
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
                <div className="stat-value">
                  {loading ? '--' : stats.monthOrders}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  保持申请推进和建单节奏更关键
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
                <div className="text-sm text-gray-500">已批准申请</div>
                <div className="stat-value">
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
                  用来判断项目质量和报价结构
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
                <div className="empty-state-title">暂时没有新的取货申请</div>
                <div className="empty-state-desc">
                  可以从新建申请开始，把客户项目、产品明细和预算金额推进到审批流程。
                </div>
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
                      <th>客户 / 项目</th>
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
                    className={`group block rounded-[26px] border border-gray-100 ${action.tint} p-5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg`}
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
              <div className="section-kicker">本月视角</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">把申请、订单和客户放在一起看</h3>
              <div className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
                <div className="rounded-[24px] border border-gray-100 bg-gray-50/80 p-4">
                  如果申请很多但订单不多，说明审批或报价转换环节存在阻塞，需要优先清理队列。
                </div>
                <div className="rounded-[24px] border border-gray-100 bg-gray-50/80 p-4">
                  如果订单金额高但客户数少，说明项目集中度较高，建议同时关注库存与交付风险。
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
