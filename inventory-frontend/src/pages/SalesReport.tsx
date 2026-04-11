import { useEffect, useMemo, useState } from 'react';
import { DollarSign, PackageCheck, RefreshCw, Target, TrendingUp, Users } from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { reportApi } from '../services/api.ts';
import type { SalesPerformanceReport, User } from '../types';

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
      setError('销售人员列表加载失败，请稍后重试。');
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
      setError('业绩报表加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const selectedSalesName = useMemo(() => {
    if (!managerMode) {
      return user?.realName || '当前用户';
    }
    return salesUsers.find((item) => item.id === selectedUserId)?.realName || report?.salesName || '销售人员';
  }, [managerMode, user, salesUsers, selectedUserId, report]);

  const averagePerCustomer = useMemo(() => {
    if (!report || report.customerCount === 0) {
      return 0;
    }
    return Math.round(report.totalAmount / report.customerCount);
  }, [report]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="page-title">我的业绩</h1>
            <p className="mt-1 text-sm text-gray-500">
              查看月度成交额、订单完成情况、客户覆盖和平均客单价。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {managerMode && (
              <select
                className="form-select w-auto"
                value={selectedUserId ?? ''}
                onChange={(event) => setSelectedUserId(Number(event.target.value))}
              >
                {salesUsers.length === 0 ? (
                  <option value="">暂无销售用户</option>
                ) : (
                  salesUsers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.realName}
                    </option>
                  ))
                )}
              </select>
            )}
            <input
              type="month"
              className="form-input w-auto"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
            <button
              type="button"
              onClick={() => void loadReport(month, managerMode ? selectedUserId : user?.id)}
              className="btn btn-secondary btn-sm"
            >
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

        <div className="card">
          <div className="card-body flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm text-gray-500">当前查看对象</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{selectedSalesName}</div>
              <div className="mt-2 text-sm text-gray-500">统计月份：{month}</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-4">
              <div className="text-sm text-blue-700">月度成交额</div>
              <div className="mt-2 text-3xl font-bold text-blue-900">
                ¥{loading ? '-' : formatCurrency(report?.totalAmount ?? 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="stat-card">
            <div className="stat-icon primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="stat-value">¥{loading ? '-' : formatCurrency(report?.totalAmount ?? 0)}</div>
            <div className="stat-label">成交额</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div className="stat-value">{loading ? '-' : report?.orderCount ?? 0}</div>
            <div className="stat-label">完成订单数</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <Users className="h-6 w-6" />
            </div>
            <div className="stat-value">{loading ? '-' : report?.customerCount ?? 0}</div>
            <div className="stat-label">覆盖客户数</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="stat-value">¥{loading ? '-' : formatCurrency(report?.avgPrice ?? 0)}</div>
            <div className="stat-label">平均客单价</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">业绩摘要</h2>
                <p className="mt-1 text-sm text-gray-500">用最核心的几个口径概览当月业绩表现。</p>
              </div>
            </div>
            <div className="card-body grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">月度成交额</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  ¥{loading ? '-' : formatCurrency(report?.totalAmount ?? 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">完成订单数</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? '-' : report?.orderCount ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">覆盖客户数</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? '-' : report?.customerCount ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">客户平均产出</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  ¥{loading ? '-' : formatCurrency(averagePerCustomer)}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">业绩解读</h2>
                <p className="mt-1 text-sm text-gray-500">根据当前月份数据给出简单的观察提示。</p>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Target className="h-4 w-4" />
                  订单推进
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  {loading
                    ? '加载中...'
                    : (report?.orderCount ?? 0) > 0
                      ? `本月已完成 ${report?.orderCount ?? 0} 单，建议继续跟进高潜项目，把已审批申请尽快转成订单。`
                      : '本月还没有完成订单，建议优先跟进已审批申请并推动成交。'}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <Users className="h-4 w-4" />
                  客户覆盖
                </div>
                <div className="mt-2 text-sm text-emerald-700">
                  {loading
                    ? '加载中...'
                    : (report?.customerCount ?? 0) > 1
                      ? `本月已覆盖 ${report?.customerCount ?? 0} 个客户，客户来源相对分散。`
                      : '客户覆盖较少，建议扩大跟进范围，降低对单一客户的依赖。'}
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <TrendingUp className="h-4 w-4" />
                  客单价表现
                </div>
                <div className="mt-2 text-sm text-amber-700">
                  {loading
                    ? '加载中...'
                    : `当前平均客单价为 ¥${formatCurrency(report?.avgPrice ?? 0)}，可以结合产品结构继续优化大单占比。`}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
