import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShieldCheck,
  Users,
  Warehouse,
  WarehouseIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import NotificationBell from './NotificationBell.tsx';

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}

const pageLabels: Record<string, string> = {
  '/dashboard': '运营总览',
  '/requests': '取货申请',
  '/orders': '订单管理',
  '/warehouse': '货仓管理',
  '/products': '产品管理',
  '/users': '用户管理',
  '/reports': '统计报表',
  '/reports/sales': '我的业绩',
};

const pageDescriptions: Record<string, string> = {
  '/dashboard': '集中查看审批节奏、订单推进和本月成交变化，保持销售与库存协同。',
  '/requests': '管理销售取货申请，跟踪审批状态、客户项目和待处理任务。',
  '/orders': '查看订单流转和成交金额，及时处理完成、取消与异常订单。',
  '/warehouse': '掌握库存余量、流水变动和低库存预警，确保仓储动作可追踪。',
  '/products': '维护产品规格、价格和库存安全线，让产品信息保持一致。',
  '/users': '管理系统账号、角色和启停状态，控制业务权限边界。',
  '/reports': '按月查看公司经营概览和销售排行，给管理决策提供依据。',
  '/reports/sales': '追踪个人成交额、客户数和客单价，及时调整销售节奏。',
};

function NavLink({ to, icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
      <span className="h-5 w-5 shrink-0">{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
    </Link>
  );
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="nav-section">
      <div className="nav-section-title">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function getMatchedValue(pathname: string, source: Record<string, string>) {
  const matchedPath = Object.keys(source)
    .sort((left, right) => right.length - left.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  return matchedPath ? source[matchedPath] : null;
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isManager } = useAuth();

  const currentPageLabel = getMatchedValue(location.pathname, pageLabels) || '业务工作台';
  const currentPageDescription =
    getMatchedValue(location.pathname, pageDescriptions) ||
    '围绕申请、订单、库存和报表，形成同一套协同视图。';

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <WarehouseIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-white">智仓协同系统</div>
              <div className="mt-1 text-xs leading-5 text-white/60">
                让申请审批、订单流转、库存变化和业绩统计落在同一套业务节奏里。
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavSection title="业务协同">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
              运营总览
            </NavLink>
            <NavLink to="/requests" icon={<FileText className="h-5 w-5" />}>
              取货申请
            </NavLink>
            <NavLink to="/orders" icon={<Receipt className="h-5 w-5" />}>
              订单管理
            </NavLink>
            <NavLink to="/warehouse" icon={<Warehouse className="h-5 w-5" />}>
              货仓管理
            </NavLink>
            <NavLink to="/products" icon={<Package className="h-5 w-5" />}>
              产品管理
            </NavLink>
          </NavSection>

          {isManager() && (
            <NavSection title="管理中心">
              <NavLink to="/users" icon={<Users className="h-5 w-5" />}>
                用户管理
              </NavLink>
              <NavLink to="/reports" icon={<BarChart3 className="h-5 w-5" />}>
                统计报表
              </NavLink>
            </NavSection>
          )}

          <NavSection title="个人视图">
            <NavLink to="/reports/sales" icon={<BarChart3 className="h-5 w-5" />}>
              我的业绩
            </NavLink>
          </NavSection>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.14] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                {user?.realName?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{user?.realName}</div>
                <div className="text-xs text-white/60">{user?.roleDescription}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/70">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary-300" />
                当前账号已启用会话保护
              </div>
              <div className="mt-2 text-xs leading-5 text-white/50">
                完成审批、调价或用户管理后建议及时退出，避免共享设备留下登录状态。
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white/80 transition-all hover:bg-white/[0.16] hover:text-white active:translate-y-[1px]"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-shell">
          <div className="mb-6 rounded-[30px] border border-white/70 bg-white/[0.76] px-5 py-5 shadow-sm backdrop-blur md:px-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-center">
              <div>
                <div className="section-kicker">运营工作台</div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                  <span>系统首页</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium text-gray-600">{currentPageLabel}</span>
                </div>
                <h1 className="mt-4 text-[clamp(2rem,2.6vw,3.2rem)] font-bold tracking-tight text-gray-900">
                  {currentPageLabel}
                </h1>
                <p className="mt-2 max-w-[66ch] text-sm leading-6 text-gray-500">
                  {currentPageDescription}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[auto_auto_auto] md:justify-end">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm text-primary-700">
                  <CalendarDays className="h-4 w-4" />
                  {today}
                </div>
                <div
                  className={`inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-medium ${
                    isManager()
                      ? 'border border-accent-200 bg-accent-50 text-accent-700'
                      : 'border border-primary-200 bg-primary-50 text-primary-700'
                  }`}
                >
                  {user?.roleDescription}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <NotificationBell />
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <div className="hidden text-right sm:block">
                      <div className="text-sm font-medium text-gray-900">{user?.realName}</div>
                      <div className="text-xs text-gray-500">{user?.username}</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 font-semibold text-white">
                      {user?.realName?.[0] || 'U'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
