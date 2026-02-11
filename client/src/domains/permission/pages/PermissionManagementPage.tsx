/**
 * PermissionManagementPage
 *
 * 권한 관리 메인 페이지
 *
 * 주요 기능:
 * - Tab 1: 직책별 메뉴 권한 부여 (PositionPermissionPanel)
 * - Tab 2: 사용자별 메뉴 권한 부여 (UserPermissionPanel)
 */

import React, { useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { Breadcrumb } from '@/core/ui';
import { cn } from '@/core/utils/cn';
import { PositionPermissionPanel } from '../components/PositionPermissionPanel';
import { UserPermissionPanel } from '../components/UserPermissionPanel';

type TabType = 'position' | 'user';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'position',
    label: '직책별 권한',
    icon: <Shield size={16} />,
    description: '직책별로 메뉴 접근 권한을 설정합니다',
  },
  {
    id: 'user',
    label: '사용자별 권한',
    icon: <Users size={16} />,
    description: '개별 사용자에게 추가 메뉴 권한을 부여합니다',
  },
];

export const PermissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('position');

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: '시스템 관리', path: '/admin' },
          { label: '권한 관리', path: '/admin/permission' },
        ]}
      />

      {/* Page Header */}
      <div className="mt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">권한 관리</h1>
        <p className="text-sm text-gray-500 mt-2">
          직책별 또는 사용자별로 메뉴 접근 권한을 설정할 수 있습니다
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-3 text-sm font-medium rounded-t-xl transition-all',
                  'flex items-center gap-2',
                  activeTab === tab.id
                    ? 'bg-white text-primary border-t-2 border-x border-primary border-b-0'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
                type="button"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-xl border border-t-0 border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'position' && <PositionPermissionPanel />}
        {activeTab === 'user' && <UserPermissionPanel />}
      </div>
    </div>
  );
};
