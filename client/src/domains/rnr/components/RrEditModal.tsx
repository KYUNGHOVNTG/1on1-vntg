/**
 * RrEditModal Component
 *
 * R&R 수정 모달 컴포넌트
 * 기존 R&R 데이터를 초기값으로 채워 수정할 수 있습니다.
 * 수정 가능 항목: 상위 R&R, R&R명, 상세내용, 수행기간
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';
import { Input } from '@/core/ui/Input';
import { Select } from '@/core/ui/Select';
import { Textarea } from '@/core/ui/Textarea';
import { Checkbox } from '@/core/ui/Checkbox';
import { InlineMessage } from '@/core/ui/InlineMessage';
import { toast } from '@/core/ui/Toast';
import { useRnrStore } from '../store';
import type { RrItem, PeriodInput } from '../types';

// =============================================
// 타입 정의
// =============================================

interface PeriodRow {
    startYear: string;
    startMonth: string;
    endYear: string;
    endMonth: string;
}

interface FormErrors {
    parentRrId?: string;
    title?: string;
    periods?: string;
}

interface RrEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    rr: RrItem;
}

// =============================================
// 상수 정의
// =============================================

const CURRENT_YEAR = '2026';

const YEAR_OPTIONS = [-2, -1, 0, 1, 2].map((offset) => {
    const y = String(parseInt(CURRENT_YEAR) + offset);
    return { value: y, label: `${y}년` };
});

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: m, label: `${i + 1}월` };
});

const EMPTY_PERIOD: PeriodRow = {
    startYear: CURRENT_YEAR,
    startMonth: '01',
    endYear: CURRENT_YEAR,
    endMonth: '12',
};

// =============================================
// 유틸 함수
// =============================================

function toPeriodInput(row: PeriodRow): PeriodInput {
    return {
        start_date: row.startYear + row.startMonth,
        end_date: row.endYear + row.endMonth,
    };
}

function isPeriodValid(row: PeriodRow): boolean {
    const start = row.startYear + row.startMonth;
    const end = row.endYear + row.endMonth;
    return start <= end;
}

function periodToRow(start: string, end: string): PeriodRow {
    return {
        startYear: start.slice(0, 4),
        startMonth: start.slice(4, 6),
        endYear: end.slice(0, 4),
        endMonth: end.slice(4, 6),
    };
}

// =============================================
// 컴포넌트
// =============================================

export const RrEditModal: React.FC<RrEditModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    rr,
}) => {
    // Zustand store
    const {
        parentRrOptions,
        isLoading,
        fetchParentRrOptions,
        updateRr,
    } = useRnrStore();

    // 폼 상태
    const [noParent, setNoParent] = useState<boolean>(false);
    const [parentRrId, setParentRrId] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [periods, setPeriods] = useState<PeriodRow[]>([{ ...EMPTY_PERIOD }]);

    // 에러 상태
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // =============================================
    // 초기화 (모달 열릴 때 기존 데이터로 채우기)
    // =============================================

    const resetForm = useCallback(() => {
        const hasParent = !!rr.parent_rr_id;
        setNoParent(!hasParent);
        setParentRrId(rr.parent_rr_id ?? '');
        setTitle(rr.title);
        setContent(rr.content ?? '');
        setPeriods(
            rr.periods.length > 0
                ? rr.periods.map((p) => periodToRow(p.start_date, p.end_date))
                : [{ ...EMPTY_PERIOD }]
        );
        setFormErrors({});
    }, [rr]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            // 상위 R&R 목록 조회
            fetchParentRrOptions(rr.dept_code, rr.year);
        }
    }, [isOpen, resetForm, fetchParentRrOptions, rr.dept_code, rr.year]);

    // =============================================
    // 유효성 검사
    // =============================================

    const validate = (): boolean => {
        const errors: FormErrors = {};

        if (!noParent && !parentRrId) {
            errors.parentRrId = '상위 R&R을 선택하거나 "상위 R&R 없이 등록"을 체크해주세요';
        }
        if (!title.trim()) {
            errors.title = 'R&R 명을 입력해주세요';
        }
        if (periods.length === 0) {
            errors.periods = '수행 기간을 최소 1개 이상 등록해주세요';
        } else {
            const hasInvalid = periods.some((p) => !isPeriodValid(p));
            if (hasInvalid) {
                errors.periods = '시작 월은 종료 월보다 이전이어야 합니다';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // =============================================
    // 저장 핸들러
    // =============================================

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await updateRr(rr.rr_id, {
                parent_rr_id: noParent ? null : parentRrId || null,
                title: title.trim(),
                content: content.trim() || null,
                periods: periods.map(toPeriodInput),
            });

            toast.success('R&R이 수정되었습니다');
            onSuccess();
            onClose();
        } catch {
            toast.error('수정에 실패했습니다');
        }
    };

    // =============================================
    // 기간 행 핸들러
    // =============================================

    const handleAddPeriod = () => {
        setPeriods((prev) => [...prev, { ...EMPTY_PERIOD }]);
    };

    const handleRemovePeriod = (index: number) => {
        if (periods.length <= 1) return;
        setPeriods((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePeriodChange = (
        index: number,
        field: keyof PeriodRow,
        value: string
    ) => {
        setPeriods((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
        if (formErrors.periods) {
            setFormErrors((prev) => ({ ...prev, periods: undefined }));
        }
    };

    // =============================================
    // 상위 R&R 드롭다운 옵션
    // =============================================

    const parentRrOpts = parentRrOptions.map((opt) => ({
        value: opt.rr_id,
        label: `${opt.title} (${opt.emp_name})`,
    }));

    // =============================================
    // 모달 푸터
    // =============================================

    const footer = (
        <>
            <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading.updateRr}
            >
                취소
            </Button>
            <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading.updateRr}
                disabled={isLoading.updateRr}
            >
                저장
            </Button>
        </>
    );

    // =============================================
    // 렌더링
    // =============================================

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="R&R 수정"
            size="lg"
            footer={footer}
            closeOnBackdropClick={!isLoading.updateRr}
        >
            <div className="space-y-5">

                {/* 기준 년도 & 소속 부서 (수정 불가 — 표시만) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 ml-1 block">
                            기준 년도
                        </label>
                        <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                            {rr.year}년
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 ml-1 block">
                            소속 부서
                        </label>
                        <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                            {rr.dept_code}
                        </div>
                    </div>
                </div>

                {/* 상위 R&R 없이 등록 체크박스 */}
                <div className="pt-1">
                    <Checkbox
                        label="상위 R&R 없이 등록"
                        checked={noParent}
                        onChange={(e) => {
                            setNoParent(e.target.checked);
                            if (e.target.checked) {
                                setParentRrId('');
                                setFormErrors((prev) => ({ ...prev, parentRrId: undefined }));
                            }
                        }}
                    />
                </div>

                {/* 상위 R&R 선택 */}
                {!noParent && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 ml-1 block">
                            상위 R&R <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={parentRrOpts}
                            value={parentRrId}
                            onChange={(val) => {
                                setParentRrId(val);
                                setFormErrors((prev) => ({ ...prev, parentRrId: undefined }));
                            }}
                            placeholder={
                                isLoading.parentRrOptions
                                    ? '조회 중...'
                                    : '상위 R&R 선택'
                            }
                            disabled={isLoading.parentRrOptions}
                        />
                        {formErrors.parentRrId && (
                            <InlineMessage variant="error" message={formErrors.parentRrId} />
                        )}
                    </div>
                )}

                {/* R&R 명 */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 ml-1 block">
                        R&R 명 <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (formErrors.title) {
                                setFormErrors((prev) => ({ ...prev, title: undefined }));
                            }
                        }}
                        placeholder="핵심 과업 제목을 입력해주세요"
                        error={formErrors.title}
                    />
                </div>

                {/* 상세 내용 */}
                <Textarea
                    label="상세 내용"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="구체적인 역할 및 책임을 작성해주세요 (선택사항)"
                    rows={3}
                />

                {/* 수행 기간 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 ml-1">
                            수행 기간 <span className="text-red-500">*</span>
                        </label>
                    </div>

                    {/* 기간 행 목록 */}
                    <div className="space-y-2">
                        {/* 헤더 */}
                        <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-1">
                            <span className="text-xs font-semibold text-gray-500 text-center">시작 월</span>
                            <span className="text-xs font-semibold text-gray-500 text-center">종료 월</span>
                            <span />
                        </div>

                        {periods.map((row, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[1fr_1fr_40px] gap-2 items-start"
                            >
                                {/* 시작 월 */}
                                <div className="flex gap-1.5">
                                    <Select
                                        options={YEAR_OPTIONS}
                                        value={row.startYear}
                                        onChange={(val) => handlePeriodChange(index, 'startYear', val)}
                                        placeholder="년"
                                        className="flex-1"
                                    />
                                    <Select
                                        options={MONTH_OPTIONS}
                                        value={row.startMonth}
                                        onChange={(val) => handlePeriodChange(index, 'startMonth', val)}
                                        placeholder="월"
                                        className="flex-1"
                                    />
                                </div>

                                {/* 종료 월 */}
                                <div className="flex gap-1.5">
                                    <Select
                                        options={YEAR_OPTIONS}
                                        value={row.endYear}
                                        onChange={(val) => handlePeriodChange(index, 'endYear', val)}
                                        placeholder="년"
                                        className="flex-1"
                                    />
                                    <Select
                                        options={MONTH_OPTIONS}
                                        value={row.endMonth}
                                        onChange={(val) => handlePeriodChange(index, 'endMonth', val)}
                                        placeholder="월"
                                        className="flex-1"
                                    />
                                </div>

                                {/* 삭제 버튼 */}
                                <button
                                    type="button"
                                    onClick={() => handleRemovePeriod(index)}
                                    disabled={periods.length <= 1}
                                    className="h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                                    aria-label="기간 삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* 기간 에러 */}
                    {formErrors.periods && (
                        <InlineMessage variant="error" message={formErrors.periods} />
                    )}

                    {/* 기간 추가 버튼 */}
                    <button
                        type="button"
                        onClick={handleAddPeriod}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#4950DC] hover:bg-[#4950DC]/5 rounded-xl transition-all font-medium"
                    >
                        <Plus size={16} />
                        기간 추가
                    </button>
                </div>
            </div>
        </Modal>
    );
};
