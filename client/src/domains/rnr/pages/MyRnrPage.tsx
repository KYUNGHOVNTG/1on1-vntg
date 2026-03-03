/**
 * MyRnrPage Component
 *
 * 나의 R&R 관리 페이지 (M002_1, /goals/myRnr)
 *
 * - 페이지 진입 시 현재 연도 기준 R&R 목록 자동 조회
 * - 간단히(테이블) / 자세히(카드+타임라인) 토글 뷰 지원
 * - 새 R&R 등록 모달 연동 (등록 완료 후 목록 자동 새로고침)
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Breadcrumb, Button } from '@/core/ui';
import { useRnrStore } from '../store';
import {
  RrListSection,
  RrRegisterModal,
  MyRnrSimpleGrid,
  ToggleTabs,
} from '../components';
import type { ViewMode } from '../components/ToggleTabs';

const CURRENT_YEAR = String(new Date().getFullYear());

export const MyRnrPage: React.FC = () => {
  const {
    myRrList,
    myRrTotal,
    isLoading,
    fetchMyRrList,
  } = useRnrStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const loadList = useCallback(() => {
    fetchMyRrList(CURRENT_YEAR);
  }, [fetchMyRrList]);

  // 페이지 진입 시 R&R 목록 자동 조회
  useEffect(() => {
    loadList();
  }, [loadList]);

  // 등록 완료 후 목록 자동 새로고침
  const handleRegisterSuccess = useCallback(() => {
    loadList();
  }, [loadList]);

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: 'R&R 관리' },
          { label: '나의 R&R 관리' },
        ]}
      />

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            나의 R&R 관리
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {CURRENT_YEAR}년 기준 · 총{' '}
            <span className="font-semibold text-gray-700">{myRrTotal}</span>건
          </p>
        </div>

        {/* 우측: 뷰 전환 탭 + 등록 버튼 */}
        <div className="flex items-center gap-3">
          <ToggleTabs value={viewMode} onChange={setViewMode} />
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            새 R&R 등록
          </Button>
        </div>
      </div>

      {/* R&R 목록 (간단히 / 자세히) */}
      {viewMode === 'simple' ? (
        <MyRnrSimpleGrid
          items={myRrList}
          isLoading={isLoading.myRrList}
          onRegisterClick={() => setIsModalOpen(true)}
        />
      ) : (
        <RrListSection
          items={myRrList}
          isLoading={isLoading.myRrList}
          onRegisterClick={() => setIsModalOpen(true)}
          onMutated={loadList}
        />
      )}

      {/* R&R 등록 모달 */}
      <RrRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
};
