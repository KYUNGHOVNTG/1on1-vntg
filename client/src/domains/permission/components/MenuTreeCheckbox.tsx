/**
 * MenuTreeCheckbox Component
 *
 * 계층 구조 메뉴를 트리 형태로 표시하고 체크박스로 선택/해제할 수 있는 컴포넌트
 *
 * 주요 기능:
 * - 계층 구조 메뉴를 트리 형태로 표시
 * - 체크박스로 메뉴 선택/해제
 * - 상위 메뉴 체크 시 하위 메뉴 자동 체크
 * - COMMON/ADMIN 메뉴 구분 표시 (Badge)
 */

import React, { useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/core/ui/Checkbox';
import { Badge } from '@/core/ui/Badge';
import { cn } from '@/core/utils/cn';
import type { MenuForPermission } from '../types';

interface MenuTreeCheckboxProps {
  /** 전체 메뉴 목록 (평탄한 배열) */
  menus: MenuForPermission[];
  /** 선택된 메뉴 코드 배열 */
  selectedMenuCodes: string[];
  /** 선택 변경 콜백 */
  onChange: (codes: string[]) => void;
}

/**
 * 메뉴 트리 아이템 컴포넌트
 */
interface MenuTreeItemProps {
  menu: MenuForPermission;
  selectedCodes: string[];
  onToggle: (menuCode: string, isChecked: boolean) => void;
  level: number;
}

const MenuTreeItem: React.FC<MenuTreeItemProps> = ({
  menu,
  selectedCodes,
  onToggle,
  level,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = menu.children && menu.children.length > 0;
  const isChecked = selectedCodes.includes(menu.menu_code);

  const handleToggle = () => {
    onToggle(menu.menu_code, !isChecked);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors',
          level > 1 && 'ml-6'
        )}
      >
        {/* 확장/축소 아이콘 */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            type="button"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {/* 체크박스 */}
        <Checkbox checked={isChecked} onChange={handleToggle} />

        {/* 메뉴명 */}
        <span className="text-sm text-gray-700 flex-1">{menu.menu_name}</span>

        {/* 메뉴 타입 Badge */}
        <Badge
          variant={menu.menu_type === 'ADMIN' ? 'primary' : 'neutral'}
          className="text-xs"
        >
          {menu.menu_type}
        </Badge>
      </div>

      {/* 하위 메뉴 */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {menu.children!.map((child) => (
            <MenuTreeItem
              key={child.menu_code}
              menu={child}
              selectedCodes={selectedCodes}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * MenuTreeCheckbox 메인 컴포넌트
 */
export const MenuTreeCheckbox: React.FC<MenuTreeCheckboxProps> = ({
  menus,
  selectedMenuCodes,
  onChange,
}) => {
  /**
   * 평탄한 메뉴 배열을 계층 구조로 변환
   */
  const menuTree = useMemo(() => {
    const buildTree = (parentCode: string | null): MenuForPermission[] => {
      return menus
        .filter((menu) => menu.up_menu_code === parentCode)
        .sort((a, b) => (a.sort_seq || 0) - (b.sort_seq || 0))
        .map((menu) => ({
          ...menu,
          children: buildTree(menu.menu_code),
        }));
    };

    return buildTree(null);
  }, [menus]);

  /**
   * 특정 메뉴의 모든 하위 메뉴 코드를 재귀적으로 수집
   */
  const getAllChildCodes = (menuCode: string): string[] => {
    const menu = menus.find((m) => m.menu_code === menuCode);
    if (!menu) return [];

    const children = menus.filter((m) => m.up_menu_code === menuCode);
    const childCodes = children.flatMap((child) => [
      child.menu_code,
      ...getAllChildCodes(child.menu_code),
    ]);

    return childCodes;
  };

  /**
   * 메뉴 체크박스 토글 핸들러
   */
  const handleToggle = (menuCode: string, isChecked: boolean) => {
    let newSelectedCodes = [...selectedMenuCodes];

    if (isChecked) {
      // 체크: 자신과 모든 하위 메뉴 추가
      const childCodes = getAllChildCodes(menuCode);
      newSelectedCodes.push(menuCode, ...childCodes);
      // 중복 제거
      newSelectedCodes = [...new Set(newSelectedCodes)];
    } else {
      // 체크 해제: 자신과 모든 하위 메뉴 제거
      const childCodes = getAllChildCodes(menuCode);
      const codesToRemove = new Set([menuCode, ...childCodes]);
      newSelectedCodes = newSelectedCodes.filter(
        (code) => !codesToRemove.has(code)
      );
    }

    onChange(newSelectedCodes);
  };

  return (
    <div className="space-y-1">
      {menuTree.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          권한을 부여할 수 있는 메뉴가 없습니다.
        </div>
      ) : (
        menuTree.map((menu) => (
          <MenuTreeItem
            key={menu.menu_code}
            menu={menu}
            selectedCodes={selectedMenuCodes}
            onToggle={handleToggle}
            level={1}
          />
        ))
      )}
    </div>
  );
};
