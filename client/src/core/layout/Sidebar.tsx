/**
 * Sidebar Component
 *
 * 사이드바 네비게이션
 * 사용자 권한에 따라 동적으로 메뉴를 렌더링합니다.
 *
 * @example
 * <Sidebar isOpen={isOpen} onClose={handleClose} />
 */

import React, { useEffect } from 'react';
import {
  Layout,
  ListTodo,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/core/utils/cn';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useMenuStore, type MenuHierarchy } from '@/domains/menu';

interface SidebarProps {
  /** 사이드바 열림 상태 */
  isOpen?: boolean;
  /** 사이드바 닫기 핸들러 (모바일) */
  onClose?: () => void;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
}

/** 메뉴 아이콘 매핑 */
const MENU_ICON_MAP: Record<string, LucideIcon> = {
  M001: Layout, // 대시보드
  M002: ListTodo, // R&R 관리
  M003: Users, // 1on1 미팅
  M004: Settings, // 시스템 관리
};

/** 메뉴 아이콘 가져오기 */
const getMenuIcon = (menuCode: string): React.ReactNode => {
  const Icon = MENU_ICON_MAP[menuCode] || Layout;
  return <Icon size={18} />;
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, onLogout }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { menus, loading, fetchUserMenus } = useMenuStore();

  // 사용자 로그인 시 메뉴 조회
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.position_code) {
      fetchUserMenus(user.id, user.position_code);
    }
  }, [isAuthenticated, user?.id, user?.position_code, fetchUserMenus]);

  // 메뉴를 최상위와 하위로 분리 (시스템 관리는 별도로)
  const mainMenus = menus.filter(
    (menu) => menu.menu_level === 1 && menu.menu_code !== 'M004'
  );
  const systemMenus = menus.filter((menu) => menu.menu_code === 'M004');

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
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">메뉴 로딩 중...</div>
          ) : mainMenus.length > 0 ? (
            mainMenus.map((menu) => (
              <MenuItemComponent key={menu.menu_code} menu={menu} />
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              조회 가능한 메뉴가 없습니다.
            </div>
          )}

          {/* 구분선 */}
          {systemMenus.length > 0 && <div className="my-4 h-px bg-gray-100 mx-3" />}

          {/* 시스템 메뉴 */}
          {systemMenus.map((menu) => (
            <MenuItemComponent key={menu.menu_code} menu={menu} />
          ))}
        </nav>

        {/* 하단 영역 */}
        <div className="mt-auto space-y-3">
          {/* 로그아웃 버튼 */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut size={18} className="group-hover:scale-110 transition-transform duration-200" />
              <span>로그아웃</span>
            </button>
          )}

          {/* 사용자 프로필 */}
          {user && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/** 메뉴 아이템 컴포넌트 (재귀적으로 하위 메뉴 렌더링) */
interface MenuItemComponentProps {
  menu: MenuHierarchy;
  level?: number;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({ menu, level = 0 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const navigate = useNavigate();
  const hasChildren = menu.children && menu.children.length > 0;

  // TODO: 현재 활성화된 메뉴를 확인하여 active 상태 설정
  const active = false;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (menu.menu_url) {
      navigate(menu.menu_url);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
          'transition-all duration-200 group',
          active
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
          level > 0 && 'ml-4'
        )}
      >
        <span
          className={cn(
            'transition-transform duration-200',
            active ? 'scale-100' : 'group-hover:scale-110'
          )}
        >
          {getMenuIcon(menu.menu_code)}
        </span>
        <span className="flex-1 text-left">{menu.menu_name}</span>
        {hasChildren && (
          <ChevronRight
            size={16}
            className={cn(
              'transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
        )}
      </button>

      {/* 하위 메뉴 (재귀적 렌더링) */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {menu.children.map((child) => (
            <MenuItemComponent key={child.menu_code} menu={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
