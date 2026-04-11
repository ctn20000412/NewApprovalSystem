import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, DollarSign, RefreshCw, Users } from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { reportApi } from '../services/api.ts';
import type { CompanyOverviewReport, MonthlyReport } from '../types';

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
      setError('统计报表加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const approvalRate = useMemo(() => {
    if (!overview || overview.totalRequests === 0) {
      return 0;
    }
    return Math.round((overview.approvedRequests / overview.totalRequests) * 100);
  }, [overview]);

  const pendingRequests = useMemo(() => {
    if (!overview) {
      return 0;
    }
    return Math.max(overview.totalRequests - overview.approvedRequests - overview.rejectedRequests, 0);
  }, [overview]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="page-title">统计报表</h1>
            <p className="mt-1 text-sm text-gray-500">
              查看公司月度经营概览、申请情况和销售排行。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              className="form-input w-auto"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
            <button type="button" onClick={() => void loadReports(month)} className="btn btn-secondary btn-sm">
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="stat-card">
            <div className="stat-icon primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="stat-value">
              ¥{loading ? '-' : formatCurrency(overview?.totalRevenue ?? 0)}
            </div>
            <div className="stat-label">当月成交额</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="stat-value">{loading ? '-' : monthlyReport?.orderCount ?? 0}</div>
            <div className="stat-label">当月完成订单</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="stat-value">{loading ? '-' : `${approvalRate}%`}</div>
            <div className="stat-label">申请通过率</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger">
              <Users className="h-6 w-6" />
            </div>
            <div className="stat-value">
              {loading ? '-' : `${overview?.activeSalesCount ?? 0}/${overview?.totalSalesCount ?? 0}`}
            </div>
            <div className="stat-label">活跃销售人数</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">销售排行</h2>
                <p className="mt-1 text-sm text-gray-500">按当月已完成订单成交额排序。</p>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
              ) : !monthlyReport || monthlyReport.salesRanking.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-title">当月暂无成交排行</div>
                  <div className="empty-state-desc">当前月份没有已完成订单。</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>排名</th>
                        <th>销售人员</th>
                        <th className="text-right">订单数</th>
                        <th className="text-right">成交额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.salesRanking.map((item, index) => (
                        <tr key={`${item.salesName}-${index}`}>
                          <td>
                            <span className={`badge ${index < 3 ? 'badge-pending' : 'badge-draft'}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td className="font-medium text-gray-900">{item.salesName}</td>
                          <td className="text-right">{item.orderCount}</td>
                          <td className="text-right font-semibold text-primary-600">
                            ¥{formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">申请概览</h2>
                <p className="mt-1 text-sm text-gray-500">统计当前月份的申请状态分布。</p>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-sm text-emerald-700">已通过申请</div>
                <div className="mt-2 text-2xl font-bold text-emerald-900">
                  {loading ? '-' : overview?.approvedRequests ?? 0}
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-sm text-amber-700">待处理申请</div>
                <div className="mt-2 text-2xl font-bold text-amber-900">
                  {loading ? '-' : pendingRequests}
                </div>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="text-sm text-rose-700">已拒绝申请</div>
                <div className="mt-2 text-2xl font-bold text-rose-900">
                  {loading ? '-' : overview?.rejectedRequests ?? 0}
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="text-sm text-blue-700">申请总数</div>
                <div className="mt-2 text-2xl font-bold text-blue-900">
                  {loading ? '-' : overview?.totalRequests ?? 0}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">经营摘要</h2>
              <p className="mt-1 text-sm text-gray-500">公司整体经营和申请处理的基础口径。</p>
            </div>
          </div>
          <div className="card-body grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">公司总订单</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {loading ? '-' : overview?.totalOrders ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">月度成交额</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                ¥{loading ? '-' : formatCurrency(monthlyReport?.totalAmount ?? 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">销售参与度</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {loading ? '-' : `${overview?.activeSalesCount ?? 0}/${overview?.totalSalesCount ?? 0}`}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-500">申请通过率</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {loading ? '-' : `${approvalRate}%`}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
