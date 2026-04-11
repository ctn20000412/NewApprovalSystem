import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Warehouse, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pwd: string) => {
    setUsername(user);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Warehouse className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold">库存管理系统</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            智能化库存管理<br />
            <span className="text-primary-200">提升企业运营效率</span>
          </h2>
          
          <p className="text-lg text-white/80 mb-12 max-w-md">
            专为中央空调销售企业打造，涵盖产品管理、取货申请、订单跟踪、库存监控等全流程管理
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">44+ 产品</div>
                <div className="text-sm text-white/60">分类管理</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">安全可靠</div>
                <div className="text-sm text-white/60">权限控制</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 via-white to-orange-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">库存管理系统</span>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-card border border-purple-100/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
              <p className="text-gray-500">请登录您的账户继续使用</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-fade-in">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">!</span>
                </div>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </span>
                ) : (
                  '登 录'
                )}
              </button>
            </form>

            {/* 快速填充测试账号 */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-4">快速选择测试账号</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillCredentials('manager', '123456')}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">经理账号</div>
                    <div className="text-xs text-gray-500">manager</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('sales1', '123456')}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">销售账号</div>
                    <div className="text-xs text-gray-500">sales1</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            © 2026 企业库存管理系统 · 中央空调销售专用
          </p>
        </div>
      </div>
    </div>
  );
}
