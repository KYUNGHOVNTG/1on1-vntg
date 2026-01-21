/**
 * NotificationCenter Component
 *
 * 종 아이콘을 클릭하면 나타나는 알림 센터
 * 누적된 알림을 확인하고 관리
 *
 * @example
 * <NotificationCenter />
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { NotificationCenterProps } from './NotificationCenter.types';
import { useNotificationStore } from './notification.store';
import { cn } from '../../utils/cn';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const typeConfig = {
    info: { icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    warning: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                알림 {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    모두 읽음
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="모두 삭제"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
                          !notification.read && 'bg-indigo-50/30'
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                          <Icon className={cn('w-4 h-4', config.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="p-1 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                          aria-label="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
