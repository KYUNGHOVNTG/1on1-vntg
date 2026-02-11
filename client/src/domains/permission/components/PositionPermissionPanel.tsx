/**
 * PositionPermissionPanel Component
 *
 * 직책별 메뉴 권한 관리 패널
 *
 * 주요 기능:
 * - 좌측: 직책 목록 표시
 * - 우측: 선택된 직책의 메뉴 권한 관리 (MenuTreeCheckbox)
 * - 메뉴 권한 일괄 저장
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Shield } from 'lucide-react';
import { Button } from '@/core/ui/Button';
import { InlineMessage } from '@/core/ui/InlineMessage';
import { cn } from '@/core/utils/cn';
import { MenuTreeCheckbox } from '../components/MenuTreeCheckbox';
import {
  getPositions,
  getPositionMenus,
  updatePositionMenus,
  getMenusForPermission,
} from '../api';
import type {
  Position,
  MenuForPermission,
  PositionMenuPermissionUpdateRequest,
} from '../types';

export const PositionPermissionPanel: React.FC = () => {
  // State
  const [positions, setPositions] = useState<Position[]>([]);
  const [menus, setMenus] = useState<MenuForPermission[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedMenuCodes, setSelectedMenuCodes] = useState<string[]>([]);
  const [originalMenuCodes, setOriginalMenuCodes] = useState<string[]>([]);

  // Loading States
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // 직책 목록 조회
  useEffect(() => {
    const loadPositions = async () => {
      try {
        setLoadingPositions(true);
        setError(null);
        const data = await getPositions();
        setPositions(data);

        // 첫 번째 직책 자동 선택
        if (data.length > 0) {
          setSelectedPosition(data[0].code);
        }
      } catch (err) {
        console.error('Failed to fetch positions:', err);
        setError('직책 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoadingPositions(false);
      }
    };

    loadPositions();
  }, []);

  // 전체 메뉴 목록 조회
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoadingMenus(true);
        const data = await getMenusForPermission();
        setMenus(data);
      } catch (err) {
        console.error('Failed to fetch menus:', err);
        setError('메뉴 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenus();
  }, []);

  // 선택된 직책의 메뉴 권한 조회
  useEffect(() => {
    if (!selectedPosition) {
      setSelectedMenuCodes([]);
      setOriginalMenuCodes([]);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const data = await getPositionMenus(selectedPosition);
        setSelectedMenuCodes(data.menu_codes);
        setOriginalMenuCodes(data.menu_codes);
      } catch (err) {
        console.error('Failed to fetch position menus:', err);
        setSelectedMenuCodes([]);
        setOriginalMenuCodes([]);
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [selectedPosition]);

  // 직책 선택 핸들러
  const handlePositionSelect = (code: string) => {
    setSelectedPosition(code);
  };

  // 메뉴 선택 변경 핸들러
  const handleMenuChange = (codes: string[]) => {
    setSelectedMenuCodes(codes);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!selectedPosition) {
      toast.error('직책을 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      const request: PositionMenuPermissionUpdateRequest = {
        menu_codes: selectedMenuCodes,
      };
      await updatePositionMenus(selectedPosition, request);
      setOriginalMenuCodes(selectedMenuCodes);
      toast.success('메뉴 권한이 저장되었습니다.');
    } catch (err) {
      console.error('Failed to update position menus:', err);
      toast.error('메뉴 권한 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 변경 여부 확인
  const hasChanges =
    JSON.stringify([...selectedMenuCodes].sort()) !==
    JSON.stringify([...originalMenuCodes].sort());

  // 선택된 직책 정보
  const selectedPositionData = positions.find((p) => p.code === selectedPosition);

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측: 직책 목록 */}
      <div className="w-80 flex flex-col">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            직책 목록
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            권한을 설정할 직책을 선택하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <InlineMessage variant="error" className="mb-4">
            {error}
          </InlineMessage>
        )}

        {/* 직책 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loadingPositions ? (
            <div className="text-center py-8 text-gray-500">
              직책 목록을 불러오는 중...
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 직책이 없습니다.
            </div>
          ) : (
            positions.map((position) => (
              <button
                key={position.code}
                onClick={() => handlePositionSelect(position.code)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-left transition-all',
                  'border border-gray-200',
                  selectedPosition === position.code
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                )}
                type="button"
              >
                <div className="font-medium text-sm">{position.code_name}</div>
                <div
                  className={cn(
                    'text-xs mt-1',
                    selectedPosition === position.code
                      ? 'text-white/80'
                      : 'text-gray-500'
                  )}
                >
                  {position.code}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 우측: 메뉴 권한 */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              메뉴 권한 설정
            </h3>
            {selectedPositionData && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedPositionData.code_name} 직책에 부여할 메뉴를 선택하세요
              </p>
            )}
          </div>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || loadingPermissions}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>

        {/* 메뉴 트리 */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
          {!selectedPosition ? (
            <div className="text-center py-16 text-gray-500">
              좌측에서 직책을 선택하세요
            </div>
          ) : loadingMenus || loadingPermissions ? (
            <div className="text-center py-16 text-gray-500">
              메뉴 정보를 불러오는 중...
            </div>
          ) : (
            <MenuTreeCheckbox
              menus={menus}
              selectedMenuCodes={selectedMenuCodes}
              onChange={handleMenuChange}
            />
          )}
        </div>

        {/* 변경사항 안내 */}
        {hasChanges && (
          <InlineMessage variant="warning" className="mt-4">
            변경된 내용이 있습니다. 저장 버튼을 클릭하여 저장하세요.
          </InlineMessage>
        )}
      </div>
    </div>
  );
};
