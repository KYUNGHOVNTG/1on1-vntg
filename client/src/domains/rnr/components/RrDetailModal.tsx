/**
 * RrDetailModal Component
 *
 * 간단히 VIEW에서 R&R별 상세보기 버튼 클릭 시 표시되는 조회용 모달
 * - 성명, 부서명, 상위 R&R, R&R 명, 상세내용, 수행일정(막대그래프)
 */

import React from 'react';
import { Modal } from '@/core/ui/Modal/Modal';
import { TimelineBar } from './TimelineBar';
import type { RrItem } from '../types';

interface RrDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  empName: string;
  deptName: string;
  rr: RrItem | null;
  year: string;
}

export const RrDetailModal: React.FC<RrDetailModalProps> = ({
  isOpen,
  onClose,
  empName,
  deptName,
  rr,
  year,
}) => {
  if (!rr) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="R&R 상세 정보" size="md">
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">성명</p>
            <p className="text-sm font-semibold text-gray-900">{empName}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">부서명</p>
            <p className="text-sm font-semibold text-gray-900">{deptName}</p>
          </div>
        </div>

        {/* 상위 R&R */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">상위 R&R</p>
          <p className="text-sm font-medium text-gray-900">
            {rr.parent_title ?? (
              <span className="text-gray-400 italic">없음</span>
            )}
          </p>
        </div>

        {/* R&R 명 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">R&R</p>
          <p className="text-sm font-semibold text-gray-900">{rr.title}</p>
        </div>

        {/* 상세내용 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">상세내용</p>
          {rr.content ? (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {rr.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">내용 없음</p>
          )}
        </div>

        {/* 수행일정 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-2">수행일정</p>
          {rr.periods.length > 0 ? (
            <TimelineBar periods={rr.periods} year={year} showLabels={true} />
          ) : (
            <p className="text-sm text-gray-400 italic">일정 없음</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
