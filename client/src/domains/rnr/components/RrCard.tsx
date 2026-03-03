import React, { useState } from 'react';
import type { RrItem } from '../types';
import { TimelineBar } from './TimelineBar';
import { Network, Pencil, Trash2 } from 'lucide-react';
import { RrEditModal } from './RrEditModal';
import { useRnrStore } from '../store';
import { toast } from '@/core/ui/Toast';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';

interface RrCardProps {
    rr: RrItem;
    onMutated?: () => void;
}

export const RrCard: React.FC<RrCardProps> = ({ rr, onMutated }) => {
    const { deleteRr, isLoading } = useRnrStore();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const handleDeleteConfirm = async () => {
        try {
            await deleteRr(rr.rr_id);
            toast.success('R&R이 삭제되었습니다');
            setIsDeleteConfirmOpen(false);
            onMutated?.();
        } catch {
            toast.error('삭제에 실패했습니다');
        }
    };

    const handleEditSuccess = () => {
        onMutated?.();
    };

    return (
        <>
            {/* ─────────── 카드 ─────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* 카드 헤더: 상위 R&R 뱃지 + 수정/삭제 버튼 */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    {rr.parent_title ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                            <Network className="w-3.5 h-3.5" />
                            상위: {rr.parent_title}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold">
                            상위 없음
                        </span>
                    )}

                    {/* 수정 / 삭제 버튼 */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-[#4950DC] hover:bg-[#4950DC]/8 transition-all"
                            aria-label="R&R 수정"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            수정
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                            aria-label="R&R 삭제"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                        </button>
                    </div>
                </div>

                {/* 카드 본문: 좌(정보) 50% | 우(수행기간) 50% */}
                <div className="flex px-6 pb-6 gap-6">
                    {/* 좌측: 상위 R&R명, R&R명, 상세내용 */}
                    <div className="w-1/2 flex flex-col gap-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                            {rr.title}
                        </h3>
                        {rr.content ? (
                            <p className="text-sm text-gray-500 line-clamp-4 leading-relaxed mt-1">
                                {rr.content}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 italic mt-1">상세 내용이 없습니다.</p>
                        )}
                    </div>

                    {/* 세로 구분선 */}
                    <div className="w-px bg-gray-100 self-stretch flex-shrink-0" />

                    {/* 우측: 수행 기간 (타임라인 바) */}
                    <div className="w-1/2 min-w-0">
                        <TimelineBar periods={rr.periods} year={rr.year} />
                    </div>
                </div>
            </div>

            {/* ─────────── 수정 모달 ─────────── */}
            {isEditOpen && (
                <RrEditModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSuccess={handleEditSuccess}
                    rr={rr}
                />
            )}

            {/* ─────────── 삭제 확인 모달 ─────────── */}
            <Modal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="R&R 삭제"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            disabled={isLoading.deleteRr}
                        >
                            취소
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleDeleteConfirm}
                            isLoading={isLoading.deleteRr}
                            disabled={isLoading.deleteRr}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                            삭제
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-900">"{rr.title}"</span>{' '}
                    R&R을 삭제하시겠습니까?
                    <br />
                    <span className="text-red-500 text-xs mt-1 block">삭제 후 복구할 수 없습니다.</span>
                </p>
            </Modal>
        </>
    );
};
