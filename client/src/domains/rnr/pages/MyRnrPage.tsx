/**
 * MyRnrPage Component
 *
 * 나의 R&R 관리 페이지 (M002_1, /goals/myRnr)
 *
 * - 페이지 진입 시 현재 연도 기준 R&R 목록 자동 조회
 * - 카드 형태 + 타임라인 바로 R&R 시각화
 * - 새 R&R 등록 모달 연동 (등록 완료 후 목록 자동 새로고침)
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Breadcrumb, Button } from '@/core/ui';
import { useRnrStore } from '../store';
import { RrListSection, RrRegisterModal } from '../components';

const CURRENT_YEAR = String(new Date().getFullYear());

export const MyRnrPage: React.FC = () => {
  const {
    myRrList,
    myRrTotal,
    isLoading,
    fetchMyRrList,
  } = useRnrStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          새 R&R 등록
        </Button>
      </div>

      {/* R&R 목록 (카드 + 타임라인) */}
      <RrListSection
        items={myRrList}
        isLoading={isLoading.myRrList}
        onRegisterClick={() => setIsModalOpen(true)}
      />

      {/* R&R 등록 모달 */}
      <RrRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
};
