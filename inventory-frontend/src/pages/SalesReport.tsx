import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  PackageCheck,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { reportApi } from '../services/api.ts';
import type { SalesPerformanceReport, User } from '../types';

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function SalesReportPage() {
  const { user, isManager } = useAuth();
  const managerMode = isManager();
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [report, setReport] = useState<SalesPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!managerMode) {
      return;
    }
    void loadSalesUsers();
  }, [managerMode]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (managerMode) {
      if (selectedUserId == null) {
        return;
      }
      void loadReport(month, selectedUserId);
      return;
    }

    void loadReport(month, user.id);
  }, [managerMode, month, selectedUserId, user]);

  const loadSalesUsers = async () => {
    try {
      setError('');
      const data = await reportApi.getSalesUsers();
      setSalesUsers(data);
      if (data.length > 0) {
        setSelectedUserId(data[0].id);
      } else if (user) {
        setSelectedUserId(user.id);
      }
    } catch (err) {
      console.error('Failed to load sales users:', err);
      setError('销售人员加载失败，请检查后端服务。');
      setLoading(false);
    }
  };

  const loadReport = async (targetMonth: string, targetUserId?: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await reportApi.getSalesReport({
        month: targetMonth,
        userId: targetUserId,
      });
      setReport(data);
    } catch (err) {
      console.error('Failed to load sales report:', err);
      setError('业绩数据加载失败，请检查统计接口。');
    } finally {
      setLoading(false);
    }
  };

  const selectedSalesName = useMemo(() => {
    if (!managerMode) {
      return user?.realName || '当前账号';
    }
    return salesUsers.find((item) => item.id === selectedUserId)?.realName || report?.salesName || '销售人员';
  }, [managerMode, user, salesUsers, selectedUserId, report]);

  const averagePerCustomer = useMemo(() => {
    if (!report || report.customerCount === 0) {
      return 0;
    }
    return Math.round(report.totalAmount / report.customerCount);
  }, [report]);

  const orderCount = report?.orderCount ?? 0;
  const totalAmount = report?.totalAmount ?? 0;
  const customerCount = report?.customerCount ?? 0;
  const avgPrice = report?.avgPrice ?? 0;

  return (
    <Layout>
      <div className="space-y-5">
        <section className="hero-panel">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="section-kicker">我的业绩</div>
              <h1 className="page-title mt-3">销售业绩、客户数量和客单价复盘</h1>
              <p className="page-subtitle max-w-3xl">
                按月份查看个人或指定销售的成交金额、订单数量和客户覆盖情况，帮助判断销售节奏和项目质量。
              </p>
            </div>

            <div className="card p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                {managerMode && (
                  <div>
                    <label className="form-label">销售人员</label>
                    <select
                      className="form-select"
                      value={selectedUserId ?? ''}
                      onChange={(event) => setSelectedUserId(Number(event.target.value))}
                    >
                      {salesUsers.length === 0 ? (
                        <option value="">暂无销售人员</option>
                      ) : (
                        salesUsers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.realName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">统计月份</label>
                  <input
                    type="month"
                    className="form-input"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void loadReport(month, managerMode ? selectedUserId : user?.id)}
                  className="btn btn-secondary"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="card-body flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-base font-semibold text-white">
                {selectedSalesName.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-gray-500">当前查看对象</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{selectedSalesName}</div>
                <div className="mt-1 text-xs text-gray-500">统计月份：{month}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-primary-50 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-700">
                <BarChart3 className="h-4 w-4" />
                本月成交金额
              </div>
              <div className="mt-2 text-2xl font-semibold text-primary-900">
                {loading ? '--' : formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card stat-card">
            <div className="stat-icon primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '--' : formatCurrency(totalAmount)}</div>
            <div className="stat-label">成交金额</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon success">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '--' : orderCount}</div>
            <div className="stat-label">成交订单</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon warning">
              <Users className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '--' : customerCount}</div>
            <div className="stat-label">服务客户</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon danger">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '--' : formatCurrency(avgPrice)}</div>
            <div className="stat-label">平均客单价</div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_0.8fr]">
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <div className="section-kicker">业绩结构</div>
                <h2 className="mt-1 text-base font-semibold text-gray-900">核心指标拆解</h2>
              </div>
            </div>
            <div className="card-body grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">成交金额</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {loading ? '--' : formatCurrency(totalAmount)}
                </div>
                <div className="mt-2 text-xs text-gray-500">反映当月实际完成订单规模。</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">成交订单</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{loading ? '--' : orderCount}</div>
                <div className="mt-2 text-xs text-gray-500">用于判断跟进转化频率。</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">客户数量</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{loading ? '--' : customerCount}</div>
                <div className="mt-2 text-xs text-gray-500">用于观察客户覆盖面。</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">客户平均贡献</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {loading ? '--' : formatCurrency(averagePerCustomer)}
                </div>
                <div className="mt-2 text-xs text-gray-500">成交金额除以客户数量。</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <div className="section-kicker">分析提示</div>
                <h2 className="mt-1 text-base font-semibold text-gray-900">下一步关注点</h2>
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Target className="h-4 w-4" />
                  订单节奏
                </div>
                <div className="mt-2 text-sm leading-6 text-blue-700">
                  {loading
                    ? '正在加载数据...'
                    : orderCount > 0
                      ? `本月已完成 ${orderCount} 单，可继续关注未完成订单和待审批申请。`
                      : '本月暂无成交订单，建议优先跟进待审批申请和报价项目。'}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <Users className="h-4 w-4" />
                  客户覆盖
                </div>
                <div className="mt-2 text-sm leading-6 text-emerald-700">
                  {loading
                    ? '正在加载数据...'
                    : customerCount > 1
                      ? `当前覆盖 ${customerCount} 个客户，可结合项目类型判断客户结构是否健康。`
                      : '客户数量偏少时，报表波动会更明显，建议增加有效客户覆盖。'}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <TrendingUp className="h-4 w-4" />
                  客单价
                </div>
                <div className="mt-2 text-sm leading-6 text-amber-700">
                  {loading
                    ? '正在加载数据...'
                    : `平均客单价为 ${formatCurrency(avgPrice)}，可结合利润和产品结构判断质量。`}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
