import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, ShieldCheck, Users, Warehouse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('用户名或密码不正确，请重新输入。');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pwd: string) => {
    setUsername(user);
    setPassword(pwd);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-16 right-20 h-96 w-96 rounded-full bg-primary-300/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between px-16 py-14 text-white">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/14 backdrop-blur-sm">
                <Warehouse className="h-8 w-8" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">智仓协同系统</div>
                <div className="mt-1 text-sm text-white/70">库存、申请、订单和审批一体协同</div>
              </div>
            </div>

            <h1 className="mt-12 max-w-[13ch] text-[2rem] font-bold leading-tight tracking-tight lg:text-[2.25rem]">
              把申请和库存放进同一条工作流里。
            </h1>
            <p className="mt-5 max-w-[54ch] text-base leading-8 text-white/80">
              从新建取货申请、经理审批到订单完成和库存流水回看，所有关键节点都留在同一套界面里。
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                  <Package className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold">申请到出库闭环</div>
                <div className="mt-2 text-sm leading-6 text-white/70">申请、审批、订单和库存不再拆开处理。</div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold">按角色控制动作</div>
                <div className="mt-2 text-sm leading-6 text-white/70">经理和销售看到的入口与数据口径自动区分。</div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                  <Users className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold">适合日常协同</div>
                <div className="mt-2 text-sm leading-6 text-white/70">适合销售、经理和仓储同一时间追踪关键节点。</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card animate-fade-in">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white">
              <Warehouse className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900">智仓协同系统</span>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-8 py-7">
              <div className="section-kicker">账号登录</div>
              <h2 className="mt-3 text-[1.85rem] font-bold tracking-tight text-gray-900">进入工作台</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                使用系统账号登录，继续处理今日的申请、订单和库存协同。
              </p>
            </div>

            <div className="px-8 py-7">
              {error && (
                <div className="alert alert-error mb-6 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                    !
                  </div>
                  <div className="text-sm">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="form-input"
                    placeholder="请输入用户名"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="form-input pr-12"
                      placeholder="请输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-12 w-full text-base disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? '登录中...' : '登录系统'}
                </button>
              </form>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">演示账号</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('manager', '123456')}
                    className="rounded-[20px] border border-accent-200 bg-accent-50 px-4 py-4 text-left transition-colors hover:border-accent-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">经理账号</div>
                        <div className="text-xs text-gray-500">manager / 123456</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('sales1', '123456')}
                    className="rounded-[20px] border border-primary-200 bg-primary-50 px-4 py-4 text-left transition-colors hover:border-primary-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">销售账号</div>
                        <div className="text-xs text-gray-500">sales1 / 123456</div>
                      </div>
                    </div>
                  </button>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-500">
                  如果你需要正式账号，请联系系统管理员创建并分配角色。
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            智仓协同系统 · 统一处理申请、审批、订单与库存
          </p>
        </div>
      </div>
    </div>
  );
}
