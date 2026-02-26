/**
 * RrRegisterModal Component
 *
 * R&R 등록 모달 컴포넌트
 * 기간 동적 추가/삭제, 겸직 부서 드롭다운, 상위 R&R 자동 조회를 지원합니다.
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
import type { PeriodInput } from '../types';

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
  year?: string;
  deptCode?: string;
  parentRrId?: string;
  title?: string;
  periods?: string;
}

interface RrRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

// =============================================
// 컴포넌트
// =============================================

export const RrRegisterModal: React.FC<RrRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Zustand store
  const {
    myDepartments,
    parentRrOptions,
    isLoading,
    fetchMyDepartments,
    fetchParentRrOptions,
    createRr,
  } = useRnrStore();

  // 폼 상태
  const [year, setYear] = useState<string>(CURRENT_YEAR);
  const [deptCode, setDeptCode] = useState<string>('');
  const [noParent, setNoParent] = useState<boolean>(false);
  const [parentRrId, setParentRrId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [periods, setPeriods] = useState<PeriodRow[]>([{ ...EMPTY_PERIOD }]);

  // 에러 상태
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // =============================================
  // 초기화 (모달 열릴 때)
  // =============================================

  const resetForm = useCallback(() => {
    setYear(CURRENT_YEAR);
    setDeptCode('');
    setNoParent(false);
    setParentRrId('');
    setTitle('');
    setContent('');
    setPeriods([{ ...EMPTY_PERIOD }]);
    setFormErrors({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchMyDepartments();
    }
  }, [isOpen, resetForm, fetchMyDepartments]);

  // =============================================
  // 부서 자동 선택 (단일 부서인 경우)
  // =============================================

  useEffect(() => {
    if (myDepartments.length === 1) {
      const singleDept = myDepartments[0].dept_code;
      setDeptCode(singleDept);
    }
  }, [myDepartments]);

  // =============================================
  // 부서 or 연도 변경 시 상위 R&R 재조회
  // =============================================

  useEffect(() => {
    if (deptCode) {
      fetchParentRrOptions(deptCode, year);
      setParentRrId('');
    }
  }, [deptCode, year, fetchParentRrOptions]);

  // =============================================
  // 유효성 검사
  // =============================================

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!year) {
      errors.year = '기준 년도를 선택해주세요';
    }
    if (!deptCode) {
      errors.deptCode = '소속 부서를 선택해주세요';
    }
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
      await createRr({
        year,
        dept_code: deptCode,
        parent_rr_id: noParent ? null : parentRrId || null,
        title: title.trim(),
        content: content.trim() || null,
        periods: periods.map(toPeriodInput),
      });

      toast.success('R&R이 등록되었습니다');
      onSuccess();
      onClose();
    } catch {
      toast.error('등록에 실패했습니다');
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
    // 기간 에러 초기화
    if (formErrors.periods) {
      setFormErrors((prev) => ({ ...prev, periods: undefined }));
    }
  };

  // =============================================
  // 부서 드롭다운 옵션
  // =============================================

  const deptOptions = myDepartments.map((d) => ({
    value: d.dept_code,
    label: d.is_main ? `${d.dept_name} (주소속)` : `${d.dept_name} (겸직)`,
  }));

  const isSingleDept = myDepartments.length === 1;

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
        disabled={isLoading.createRr}
      >
        취소
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        isLoading={isLoading.createRr}
        disabled={isLoading.createRr}
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
      title="R&R 등록"
      size="lg"
      footer={footer}
      closeOnBackdropClick={!isLoading.createRr}
    >
      <div className="space-y-5">

        {/* 기준 년도 & 소속 부서 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 기준 년도 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 ml-1 block">
              기준 년도 <span className="text-red-500">*</span>
            </label>
            <Select
              options={YEAR_OPTIONS}
              value={year}
              onChange={(val) => {
                setYear(val);
                setFormErrors((prev) => ({ ...prev, year: undefined }));
              }}
              placeholder="년도 선택"
            />
            {formErrors.year && (
              <InlineMessage variant="error" message={formErrors.year} />
            )}
          </div>

          {/* 소속 부서 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 ml-1 block">
              소속 부서 <span className="text-red-500">*</span>
            </label>
            {isLoading.myDepartments ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : isSingleDept ? (
              <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                {myDepartments[0]?.dept_name ?? '-'}
              </div>
            ) : (
              <Select
                options={deptOptions}
                value={deptCode}
                onChange={(val) => {
                  setDeptCode(val);
                  setFormErrors((prev) => ({ ...prev, deptCode: undefined }));
                }}
                placeholder="부서 선택"
              />
            )}
            {formErrors.deptCode && (
              <InlineMessage variant="error" message={formErrors.deptCode} />
            )}
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
                !deptCode
                  ? '부서를 먼저 선택해주세요'
                  : isLoading.parentRrOptions
                    ? '조회 중...'
                    : '상위 R&R 선택'
              }
              disabled={!deptCode || isLoading.parentRrOptions}
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
