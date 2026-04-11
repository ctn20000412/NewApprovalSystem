import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Power, RefreshCw, Save, Search, Shield, User, Users } from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { userApi } from '../services/api.ts';
import type { User as UserType, UserRole } from '../types';

type FormMode = 'create' | 'edit';

type UserFormData = {
  username: string;
  password: string;
  realName: string;
  role: UserRole;
  email: string;
  phone: string;
};

const initialFormData: UserFormData = {
  username: '',
  password: '123456',
  realName: '',
  role: 'SALES',
  email: '',
  phone: '',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err) {
      setError('用户数据加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone || '').includes(searchQuery);

      const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.status === 1) ||
        (statusFilter === 'DISABLED' && item.status !== 1);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = users.filter((item) => item.status === 1).length;
    const managerCount = users.filter((item) => item.role === 'MANAGER').length;
    const salesCount = users.filter((item) => item.role === 'SALES').length;

    return {
      total: users.length,
      activeCount,
      managerCount,
      salesCount,
    };
  }, [users]);

  const resetForm = () => {
    setFormMode('create');
    setEditingUserId(null);
    setFormData(initialFormData);
  };

  const handleEdit = (targetUser: UserType) => {
    setFormMode('edit');
    setEditingUserId(targetUser.id);
    setFormData({
      username: targetUser.username,
      password: '',
      realName: targetUser.realName,
      role: targetUser.role,
      email: targetUser.email || '',
      phone: targetUser.phone || '',
    });
    setSuccessMessage('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (formMode === 'create') {
        await userApi.create({
          username: formData.username.trim(),
          password: formData.password.trim(),
          realName: formData.realName.trim(),
          role: formData.role,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        });
        setSuccessMessage('用户创建成功。');
      } else if (editingUserId != null) {
        await userApi.update(editingUserId, {
          realName: formData.realName.trim(),
          role: formData.role,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        });
        setSuccessMessage('用户信息更新成功。');
      }

      await loadUsers();
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data || '保存失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: UserType) => {
    const actionText = targetUser.status === 1 ? '禁用' : '启用';
    if (!window.confirm(`确认${actionText}用户 ${targetUser.realName} 吗？`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      if (targetUser.status === 1) {
        await userApi.disable(targetUser.id);
        setSuccessMessage('用户已禁用。');
      } else {
        await userApi.enable(targetUser.id);
        setSuccessMessage('用户已启用。');
      }
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data || `${actionText}失败，请稍后重试。`);
    }
  };

  const isEditing = formMode === 'edit' && editingUserId != null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="page-title">用户管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理系统账号、角色分配和启停用状态。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => void loadUsers()} className="btn btn-secondary btn-sm">
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
            <button type="button" onClick={resetForm} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              新建用户
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <div>{successMessage}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">账号总数</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <Power className="h-6 w-6" />
            </div>
            <div className="stat-value">{stats.activeCount}</div>
            <div className="stat-label">启用账号</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <Shield className="h-6 w-6" />
            </div>
            <div className="stat-value">{stats.managerCount}</div>
            <div className="stat-label">经理账号</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">
              <User className="h-6 w-6" />
            </div>
            <div className="stat-value">{stats.salesCount}</div>
            <div className="stat-label">销售账号</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
                <p className="mt-1 text-sm text-gray-500">支持按关键词、角色和状态筛选。</p>
              </div>
            </div>
            <div className="card-body space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div className="search-box">
                  <Search className="search-icon h-5 w-5" />
                  <input
                    type="text"
                    placeholder="搜索用户名、姓名、邮箱或手机号"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as 'ALL' | UserRole)}
                >
                  <option value="ALL">全部角色</option>
                  <option value="MANAGER">经理</option>
                  <option value="SALES">销售</option>
                </select>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'DISABLED')}
                >
                  <option value="ALL">全部状态</option>
                  <option value="ACTIVE">已启用</option>
                  <option value="DISABLED">已禁用</option>
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-title">没有匹配的用户</div>
                  <div className="empty-state-desc">调整筛选条件后再试一次。</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>账号</th>
                        <th>角色</th>
                        <th>联系方式</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((item) => {
                        const isSelf = currentUser?.id === item.id;
                        const isActive = item.status === 1;

                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="font-medium text-gray-900">{item.realName}</div>
                              <div className="mt-1 text-sm text-gray-500">{item.username}</div>
                            </td>
                            <td>
                              <span className={`badge ${item.role === 'MANAGER' ? 'badge-pending' : 'badge-approved'}`}>
                                {item.roleDescription}
                              </span>
                            </td>
                            <td>
                              <div className="text-sm text-gray-700">{item.phone || '-'}</div>
                              <div className="mt-1 text-xs text-gray-500">{item.email || '-'}</div>
                            </td>
                            <td>
                              <span className={`badge ${isActive ? 'badge-approved' : 'badge-cancelled'}`}>
                                {isActive ? '已启用' : '已禁用'}
                              </span>
                            </td>
                            <td className="text-sm text-gray-500">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                  title="编辑"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleStatus(item)}
                                  disabled={isSelf && isActive}
                                  className={`rounded-lg p-2 transition-colors ${
                                    isSelf && isActive
                                      ? 'cursor-not-allowed text-gray-300'
                                      : isActive
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={isSelf && isActive ? '当前登录账号不能被禁用' : isActive ? '禁用' : '启用'}
                                >
                                  <Power className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? '编辑用户' : '新增用户'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isEditing ? '修改用户资料和角色。' : '创建新的系统账号。'}
                </p>
              </div>
            </div>

            <div className="card-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.username}
                    onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
                    disabled={isEditing}
                    required
                  />
                  {isEditing && <div className="form-hint">编辑模式下用户名不允许修改。</div>}
                </div>

                {!isEditing && (
                  <div className="form-group">
                    <label className="form-label">初始密码</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.password}
                      onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                    <div className="form-hint">默认建议使用 `123456`，首次发放后再由使用人修改。</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.realName}
                    onChange={(event) => setFormData((current) => ({ ...current, realName: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">角色</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value as UserRole }))}
                  >
                    <option value="SALES">销售</option>
                    <option value="MANAGER">经理</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">手机号</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">邮箱</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                    <Save className="h-4 w-4" />
                    {submitting ? '保存中...' : isEditing ? '保存修改' : '创建用户'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm">
                    重置
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
