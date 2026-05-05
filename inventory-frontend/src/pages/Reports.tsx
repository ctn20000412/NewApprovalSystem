import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, DollarSign, RefreshCw, Users } from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { reportApi } from '../services/api.ts';
import type { CompanyOverviewReport, MonthlyReport } from '../types';

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [overview, setOverview] = useState<CompanyOverviewReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadReports(month);
  }, [month]);

  const loadReports = async (targetMonth: string) => {
    try {
      setLoading(true);
      setError('');
      const [year, monthValue] = targetMonth.split('-').map(Number);
      const [overviewData, monthlyData] = await Promise.all([
        reportApi.getCompanyReport({ month: targetMonth }),
        reportApi.getMonthlyReport(year, monthValue),
      ]);
      setOverview(overviewData);
      setMonthlyReport(monthlyData);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('统计报表加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const approvalRate = useMemo(() => {
    if (!overview || overview.totalRequests === 0) return 0;
    return Math.round((overview.approvedRequests / overview.totalRequests) * 100);
  }, [overview]);

  const pendingRequests = useMemo(() => {
    if (!overview) return 0;
    return Math.max(overview.totalRequests - overview.approvedRequests - overview.rejectedRequests, 0);
  }, [overview]);

  return (
    <Layout>
      <div className="space-y-5">
        <section className="card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="section-kicker">公司报表</div>
              <h2 className="mt-1 text-base font-semibold text-gray-900">经营数据</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="month"
                className="form-input w-auto"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
              <button type="button" onClick={() => void loadReports(month)} className="btn btn-secondary">
                <RefreshCw className="h-4 w-4" />
                刷新
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            <div>{error}</div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card stat-card">
            <div className="stat-icon primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '-' : formatCurrency(overview?.totalRevenue ?? 0)}</div>
            <div className="stat-label">当月成交额</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon success">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '-' : monthlyReport?.orderCount ?? 0}</div>
            <div className="stat-label">当月完成订单</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon warning">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="stat-value">{loading ? '-' : `${approvalRate}%`}</div>
            <div className="stat-label">申请通过率</div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="stat-value">
              {loading ? '-' : `${overview?.activeSalesCount ?? 0}/${overview?.totalSalesCount ?? 0}`}
            </div>
            <div className="stat-label">活跃销售人数</div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <div className="section-kicker">销售排行</div>
                <h2 className="mt-1 text-base font-semibold text-gray-900">本月销售表现</h2>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="skeleton h-12" />
                  ))}
                </div>
              ) : !monthlyReport || monthlyReport.salesRanking.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-title">暂无销售排行</div>
                  <div className="empty-state-desc">当前月份还没有已完成订单。</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>排名</th>
                        <th>销售</th>
                        <th className="text-right">订单数</th>
                        <th className="text-right">成交额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.salesRanking.map((item, index) => (
                        <tr key={`${item.salesName}-${index}`}>
                          <td>
                            <span className={`badge ${index < 3 ? 'badge-pending' : 'badge-cancelled'}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td className="font-medium text-gray-900">{item.salesName}</td>
                          <td className="text-right">{item.orderCount}</td>
                          <td className="text-right font-semibold text-primary-700">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-kicker">申请概览</div>
                <h2 className="mt-1 text-base font-semibold text-gray-900">审批状态</h2>
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <span className="text-sm text-emerald-700">已批准</span>
                <span className="text-base font-semibold text-emerald-900">
                  {loading ? '-' : overview?.approvedRequests ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <span className="text-sm text-amber-700">待处理</span>
                <span className="text-base font-semibold text-amber-900">{loading ? '-' : pendingRequests}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <span className="text-sm text-rose-700">已驳回</span>
                <span className="text-base font-semibold text-rose-900">
                  {loading ? '-' : overview?.rejectedRequests ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
                <span className="text-sm text-primary-700">申请总数</span>
                <span className="text-base font-semibold text-primary-900">
                  {loading ? '-' : overview?.totalRequests ?? 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="section-kicker">经营摘要</div>
              <h2 className="mt-1 text-base font-semibold text-gray-900">关键指标</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <div className="p-5">
              <div className="text-sm text-gray-500">订单总数</div>
              <div className="stat-value">{loading ? '-' : overview?.totalOrders ?? 0}</div>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500">月报成交额</div>
              <div className="stat-value">{loading ? '-' : formatCurrency(monthlyReport?.totalAmount ?? 0)}</div>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500">销售活跃度</div>
              <div className="stat-value">
                {loading ? '-' : `${overview?.activeSalesCount ?? 0}/${overview?.totalSalesCount ?? 0}`}
              </div>
            </div>
            <div className="p-5">
              <div className="text-sm text-gray-500">申请通过率</div>
              <div className="stat-value">{loading ? '-' : `${approvalRate}%`}</div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
