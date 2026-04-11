import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ClipboardList,
  PackageCheck,
  Receipt,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { notificationApi } from '../services/api.ts';
import type { NotificationItem } from '../types';

const notificationTypeMeta: Record<
  string,
  { icon: ComponentType<{ className?: string }>; color: string; badge: string; label: string }
> = {
  REQUEST_CREATED: {
    icon: ClipboardList,
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    label: '新申请',
  },
  REQUEST_APPROVED: {
    icon: PackageCheck,
    color: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    label: '已通过',
  },
  REQUEST_REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    badge: 'bg-red-50 text-red-700',
    label: '已驳回',
  },
  REQUEST_ADJUSTED: {
    icon: ClipboardList,
    color: 'text-sky-600',
    badge: 'bg-sky-50 text-sky-700',
    label: '已调整',
  },
  ORDER_CREATED: {
    icon: Receipt,
    color: 'text-violet-600',
    badge: 'bg-violet-50 text-violet-700',
    label: '新订单',
  },
  ORDER_COMPLETED: {
    icon: PackageCheck,
    color: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    label: '已完成',
  },
  ORDER_CANCELLED: {
    icon: XCircle,
    color: 'text-red-600',
    badge: 'bg-red-50 text-red-700',
    label: '已取消',
  },
  SYSTEM: {
    icon: Bell,
    color: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-700',
    label: '系统通知',
  },
};

function formatTime(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diffMinutes = Math.floor((now - date.getTime()) / 60000);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();

  const unreadDisplay = useMemo(() => {
    if (unreadCount <= 0) return '';
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  const updatePanelPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    let left = rect.right - width;
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16));

    const estimatedHeight = Math.min(460, window.innerHeight - 32);
    let top = rect.bottom + 12;

    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - estimatedHeight - 12);
    }

    setPanelStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 420,
    });
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getAll(10);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUnreadCount();
    const timer = window.setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadUnreadCount();
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();

    const handleViewportChange = () => updatePanelPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      updatePanelPosition();
      await Promise.all([loadNotifications(), loadUnreadCount()]);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await notificationApi.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        await handleMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    setOpen(false);

    if (notification.targetPath && notification.targetPath !== location.pathname) {
      navigate(notification.targetPath);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const panel = (
    <div className="pointer-events-none fixed inset-0 z-[400]">
      <div
        ref={panelRef}
        style={panelStyle}
        className="pointer-events-auto overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-slate-200/80"
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900">通知中心</div>
              <div className="mt-1 text-xs text-gray-500">
                {unreadCount > 0 ? `当前还有 ${unreadCount} 条未读通知` : '当前没有未读通知'}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAll()}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                全部已读
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在加载通知...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Bell className="h-6 w-6" />
              </div>
              <div className="mt-4 text-sm font-medium text-gray-900">暂无通知</div>
              <div className="mt-1 text-xs text-gray-500">新的申请、审批和订单状态变更会显示在这里。</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const meta = notificationTypeMeta[notification.type] || notificationTypeMeta.SYSTEM;
                const Icon = meta.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleOpenNotification(notification)}
                    className={`w-full px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                      notification.read ? 'bg-white' : 'bg-primary-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-2xl bg-gray-50 p-2 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-medium text-gray-900">{notification.title || '系统通知'}</div>
                          {!notification.read && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                          )}
                        </div>
                        {notification.content && (
                          <div className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                            {notification.content}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => void handleToggle()}
          className="relative rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadDisplay}
            </span>
          )}
        </button>
      </div>
      {open ? createPortal(panel, document.body) : null}
    </>
  );
}
