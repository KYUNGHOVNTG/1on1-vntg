/**
 * Sidebar Component
 *
 * 사이드바 네비게이션
 *
 * @example
 * <Sidebar isOpen={isOpen} onClose={handleClose} />
 */

import React from 'react';
import { Layout, ListTodo, Users, Settings } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface SidebarProps {
  /** 사이드바 열림 상태 */
  isOpen?: boolean;
  /** 사이드바 닫기 핸들러 (모바일) */
  onClose?: () => void;
}

/** 네비게이션 메뉴 아이템 타입 */
interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

/** 네비게이션 메뉴 아이템 리스트 */
const navItems: NavItem[] = [
  { icon: <Layout size={18} />, label: '대시보드', active: true },
  { icon: <ListTodo size={18} />, label: 'R&R 관리' },
  { icon: <Users size={18} />, label: '1on1 미팅' },
];

/** 시스템 메뉴 아이템 */
const systemItems: NavItem[] = [
  { icon: <Settings size={18} />, label: '시스템 관리' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 border-r border-gray-200 bg-white',
          'flex flex-col p-4',
          'transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:flex'
        )}
      >
        {/* 메뉴 섹션 헤더 */}
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            메인 메뉴
          </p>
        </div>

        {/* 메인 메뉴 */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item, index) => (
            <NavItemComponent key={index} {...item} />
          ))}

          {/* 구분선 */}
          <div className="my-4 h-px bg-gray-100 mx-3" />

          {/* 시스템 메뉴 */}
          {systemItems.map((item, index) => (
            <NavItemComponent key={index} {...item} />
          ))}
        </nav>

        {/* 사용자 프로필 (하단) */}
        <div className="mt-auto p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Team Lead</p>
          </div>
        </div>
      </aside>
    </>
  );
};

/** 네비게이션 아이템 컴포넌트 */
const NavItemComponent: React.FC<NavItem> = ({ icon, label, active }) => {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
        'transition-all duration-200 group',
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <span
        className={cn(
          'transition-transform duration-200',
          active ? 'scale-100' : 'group-hover:scale-110'
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
};
