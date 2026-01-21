import React, { useEffect } from 'react';
import {
  Layout,
  ListTodo,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/core/utils/cn';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useMenuStore, type MenuHierarchy } from '@/domains/menu';

interface SidebarProps {
  /** 사이드바 열림 상태 (모바일) */
  isOpen?: boolean;
  /** 사이드바 축소 상태 (데스크탑) */
  isCollapsed?: boolean;
  /** 사이드바 닫기 핸들러 (모바일) */
  onClose?: () => void;
  /** 사이드바 축소 토글 핸들러 (데스크탑) */
  onToggleCollapse?: () => void;
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
  return <Icon size={20} />;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
  onLogout
}) => {
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
          'fixed lg:relative inset-y-0 left-0 z-50',
          'h-screen border-r border-gray-200 bg-white shadow-sm',
          'flex flex-col',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0', // 데스크탑에서는 항상 표시 (위치)
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* 토글 버튼 (데스크탑 전용) */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden lg:flex absolute -right-3 top-9 z-50',
            'w-7 h-7 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md',
            'text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200',
            'transform hover:scale-110'
          )}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* 로고 영역 */}
        <div className={cn(
          "flex items-center h-24 border-b border-gray-100 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "px-8"
        )}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
              1
            </div>
          ) : (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              1on1-VNTG
            </h1>
          )}
        </div>

        {/* 메뉴 섹션 헤더 - Collapsed 상태에서는 숨김 */}
        {!isCollapsed && (
          <div className="mt-8 mb-2 px-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Main Menu
            </p>
          </div>
        )}

        {/* Collapsed 상태에서의 간격 조정 */}
        {isCollapsed && <div className="mt-8" />}

        {/* 메인 메뉴 */}
        <nav className="space-y-2 flex-1 px-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {loading ? (
            !isCollapsed && <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : mainMenus.length > 0 ? (
            mainMenus.map((menu) => (
              <MenuItemComponent
                key={menu.menu_code}
                menu={menu}
                isCollapsed={isCollapsed}
              />
            ))
          ) : (
            !isCollapsed && (
              <div className="px-4 py-2 text-sm text-gray-500">
                No menus
              </div>
            )
          )}

          {/* 시스템 메뉴 */}
          {systemMenus.length > 0 && (
            <>
              {!isCollapsed ? (
                <div className="my-6 h-px bg-gray-100 mx-2" />
              ) : (
                <div className="my-4" />
              )}
              {systemMenus.map((menu) => (
                <MenuItemComponent
                  key={menu.menu_code}
                  menu={menu}
                  isCollapsed={isCollapsed}
                />
              ))}
            </>
          )}
        </nav>

        {/* 하단 영역 */}
        <div className={cn(
          "mt-auto border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm",
          isCollapsed ? "p-2 space-y-2" : "p-6 space-y-4"
        )}>
          {/* 알림 버튼 */}
          <button
            className={cn(
              "w-full flex items-center rounded-xl transition-all duration-200 group relative",
              isCollapsed
                ? "justify-center w-10 h-10 mx-auto text-gray-500 hover:bg-white hover:shadow-sm"
                : "gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900"
            )}
            title="알림"
          >
            <div className="relative">
              <Bell size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </div>
            {!isCollapsed && (
              <>
                <span>Notifications</span>
                <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-bold">
                  3
                </span>
              </>
            )}
          </button>

          {/* 로그아웃 버튼 */}
          {onLogout && (
            <button
              onClick={onLogout}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200 group",
                isCollapsed
                  ? "justify-center w-10 h-10 mx-auto text-gray-500 hover:bg-red-50 hover:text-red-500"
                  : "gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
              )}
              title={isCollapsed ? "로그아웃" : undefined}
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform duration-200" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          )}

          {/* 사용자 프로필 */}
          {user && (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center pt-2" : "gap-3 pt-2"
            )}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-sm font-bold text-indigo-600 border-2 border-white shadow-sm">
                {user.name.substring(0, 1).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/** 메뉴 아이템 컴포넌트 */
interface MenuItemComponentProps {
  menu: MenuHierarchy;
  level?: number;
  isCollapsed: boolean;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({ menu, level = 0, isCollapsed }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const navigate = useNavigate();
  const hasChildren = menu.children && menu.children.length > 0;

  // TODO: 현재 활성화된 메뉴를 확인하여 active 상태 설정
  const active = false;

  const handleClick = () => {
    if (hasChildren && !isCollapsed) {
      setIsExpanded(!isExpanded);
    } else if (menu.menu_url) {
      navigate(menu.menu_url);
    }
  };

  // 사이드바가 접히면 하위 메뉴는 자동으로 닫힘 (선택적 UX)
  // 여기서는 isCollapsed가 true가 되면 렌더링에서 숨겨지므로 state는 유지해도 됨.

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center rounded-xl transition-all duration-200 group relative',
          'min-h-[44px]', // 터치 타겟 확보
          isCollapsed
            ? 'justify-center px-0 py-3'
            : 'px-4 py-3 gap-3',
          active
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
          !isCollapsed && level > 0 && 'pl-11' // 계층 구조 들여쓰기
        )}
        title={isCollapsed ? menu.menu_name : undefined}
      >
        <span
          className={cn(
            'transition-transform duration-200 flex-shrink-0',
            active ? 'scale-100' : 'group-hover:scale-110'
          )}
        >
          {getMenuIcon(menu.menu_code)}
        </span>

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium truncate">
              {menu.menu_name}
            </span>
            {hasChildren && (
              <ChevronRight
                size={16}
                className={cn(
                  'transition-transform duration-200 text-gray-400',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </>
        )}

        {/* Collapsed 상태일 때 Hover 시 툴팁처럼 이름 표시 (우측으로 띄우기) - Option */}
        {/* 브라우저 기본 title 속성을 사용했으므로 커스텀 툴팁은 생략하거나 추가 가능 */}
      </button>

      {/* 하위 메뉴 (framer-motion 적용) */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {menu.children.map((child) => (
                <MenuItemComponent
                  key={child.menu_code}
                  menu={child}
                  level={level + 1}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
