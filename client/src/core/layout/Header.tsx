/**
 * Header Component
 *
 * 상단 네비게이션 헤더
 *
 * @example
 * <Header onMenuClick={handleMenuClick} />
 */

import React from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Avatar } from '@/core/ui';

interface HeaderProps {
  /** 모바일 메뉴 버튼 클릭 핸들러 */
  onMenuClick?: () => void;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 h-16 flex items-center justify-between">
      {/* 좌측: 로고 및 햄버거 메뉴 */}
      <div className="flex items-center gap-3">
        {/* 모바일 햄버거 메뉴 */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* 로고 */}
        <span className="text-xl font-bold text-gray-900 tracking-tighter cursor-pointer">
          1on1-Mirror
        </span>
      </div>

      {/* 우측: 알림, 로그아웃, 사용자 프로필 */}
      <div className="flex items-center gap-4">
        {/* 알림 아이콘 */}
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} strokeWidth={2} />
        </button>

        {/* 로그아웃 버튼 */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="로그아웃"
          >
            <LogOut size={20} strokeWidth={2} />
          </button>
        )}

        {/* 사용자 프로필 */}
        <Avatar
          size="sm"
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        />
      </div>
    </header>
  );
};
