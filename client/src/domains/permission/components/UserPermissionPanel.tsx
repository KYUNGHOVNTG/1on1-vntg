/**
 * UserPermissionPanel Component
 *
 * 사용자별 메뉴 권한 관리 패널
 *
 * 주요 기능:
 * - 좌측: 사용자 목록 표시
 * - 우측: 선택된 사용자의 추가 메뉴 권한 관리 (MenuTreeCheckbox)
 * - 메뉴 권한 일괄 저장
 *
 * 참고: 사용자별 권한은 직책별 권한에 추가되는 권한입니다.
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, User } from 'lucide-react';
import { Button } from '@/core/ui/Button';
import { InlineMessage } from '@/core/ui/InlineMessage';
import { Badge } from '@/core/ui/Badge';
import { cn } from '@/core/utils/cn';
import { MenuTreeCheckbox } from '../components/MenuTreeCheckbox';
import {
  getUsers,
  getUserMenus,
  updateUserMenus,
  getMenusForPermission,
} from '../api';
import type {
  UserBasic,
  MenuForPermission,
  UserMenuPermissionUpdateRequest,
} from '../types';

export const UserPermissionPanel: React.FC = () => {
  // State
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [menus, setMenus] = useState<MenuForPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedMenuCodes, setSelectedMenuCodes] = useState<string[]>([]);
  const [originalMenuCodes, setOriginalMenuCodes] = useState<string[]>([]);

  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 조회
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setError(null);
        const data = await getUsers();
        setUsers(data);

        // 첫 번째 사용자 자동 선택
        if (data.length > 0) {
          setSelectedUser(data[0].user_id);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
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

  // 선택된 사용자의 메뉴 권한 조회
  useEffect(() => {
    if (!selectedUser) {
      setSelectedMenuCodes([]);
      setOriginalMenuCodes([]);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const data = await getUserMenus(selectedUser);
        setSelectedMenuCodes(data.menu_codes);
        setOriginalMenuCodes(data.menu_codes);
      } catch (err) {
        console.error('Failed to fetch user menus:', err);
        setSelectedMenuCodes([]);
        setOriginalMenuCodes([]);
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [selectedUser]);

  // 사용자 선택 핸들러
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  // 메뉴 선택 변경 핸들러
  const handleMenuChange = (codes: string[]) => {
    setSelectedMenuCodes(codes);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!selectedUser) {
      toast.error('사용자를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      const request: UserMenuPermissionUpdateRequest = {
        menu_codes: selectedMenuCodes,
      };
      await updateUserMenus(selectedUser, request);
      setOriginalMenuCodes(selectedMenuCodes);
      toast.success('메뉴 권한이 저장되었습니다.');
    } catch (err) {
      console.error('Failed to update user menus:', err);
      toast.error('메뉴 권한 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 변경 여부 확인
  const hasChanges =
    JSON.stringify([...selectedMenuCodes].sort()) !==
    JSON.stringify([...originalMenuCodes].sort());

  // 선택된 사용자 정보
  const selectedUserData = users.find((u) => u.user_id === selectedUser);

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측: 사용자 목록 */}
      <div className="w-80 flex flex-col">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <User size={18} className="text-primary" />
            사용자 목록
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            추가 권한을 설정할 사용자를 선택하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <InlineMessage variant="error" className="mb-4">
            {error}
          </InlineMessage>
        )}

        {/* 사용자 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loadingUsers ? (
            <div className="text-center py-8 text-gray-500">
              사용자 목록을 불러오는 중...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 사용자가 없습니다.
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleUserSelect(user.user_id)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-left transition-all',
                  'border border-gray-200',
                  selectedUser === user.user_id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                )}
                type="button"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{user.email}</div>
                  <Badge
                    variant={
                      selectedUser === user.user_id ? 'primary' : 'neutral'
                    }
                    className={cn(
                      'text-xs',
                      selectedUser === user.user_id && 'bg-white/20 text-white'
                    )}
                  >
                    {user.position_code}
                  </Badge>
                </div>
                <div
                  className={cn(
                    'text-xs',
                    selectedUser === user.user_id
                      ? 'text-white/80'
                      : 'text-gray-500'
                  )}
                >
                  {user.user_id}
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
              추가 메뉴 권한 설정
            </h3>
            {selectedUserData && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedUserData.email} 사용자에게 추가로 부여할 메뉴를
                선택하세요
              </p>
            )}
            <InlineMessage variant="info" className="mt-2">
              직책별 권한은 자동으로 부여되며, 여기서는 추가 권한만 설정합니다.
            </InlineMessage>
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
          {!selectedUser ? (
            <div className="text-center py-16 text-gray-500">
              좌측에서 사용자를 선택하세요
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
