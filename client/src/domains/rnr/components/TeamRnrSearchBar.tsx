/**
 * TeamRnrSearchBar Component
 *
 * 팀 R&R 현황 조회 조건 필터 바
 * 기준 연도 / 부서 / 직책명 / 성명 필터를 지원합니다.
 */

import React from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/core/ui/Select';
import { Input } from '@/core/ui/Input';
import { Button } from '@/core/ui/Button';
import type { TeamRrFilterOptionItem } from '../types';

const CURRENT_YEAR = String(new Date().getFullYear());

const YEAR_OPTIONS = [-1, 0, 1].map((offset) => {
  const y = String(parseInt(CURRENT_YEAR) + offset);
  return { value: y, label: `${y}년` };
});

interface TeamRnrSearchBarProps {
  year: string;
  onYearChange: (year: string) => void;
  deptCode: string;
  onDeptChange: (deptCode: string) => void;
  positionCode: string;
  onPositionChange: (positionCode: string) => void;
  empName: string;
  onEmpNameChange: (name: string) => void;
  departments: TeamRrFilterOptionItem[];
  positions: TeamRrFilterOptionItem[];
  onSearch: () => void;
  isLoading: boolean;
}

export const TeamRnrSearchBar: React.FC<TeamRnrSearchBarProps> = ({
  year,
  onYearChange,
  deptCode,
  onDeptChange,
  positionCode,
  onPositionChange,
  empName,
  onEmpNameChange,
  departments,
  positions,
  onSearch,
  isLoading,
}) => {
  const deptOptions = [
    { value: '', label: '전체 부서' },
    ...departments.map((d) => ({ value: d.code, label: d.name })),
  ];

  const positionOptions = [
    { value: '', label: '전체 직책' },
    ...positions.map((p) => ({ value: p.code, label: p.name })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* 기준 연도 */}
        <div className="w-28">
          <Select
            label="기준 연도"
            options={YEAR_OPTIONS}
            value={year}
            onChange={onYearChange}
          />
        </div>

        {/* 부서 */}
        <div className="w-44">
          <Select
            label="부서"
            options={deptOptions}
            value={deptCode}
            onChange={onDeptChange}
            placeholder="전체 부서"
          />
        </div>

        {/* 직책 */}
        <div className="w-36">
          <Select
            label="직책"
            options={positionOptions}
            value={positionCode}
            onChange={onPositionChange}
            placeholder="전체 직책"
          />
        </div>

        {/* 성명 */}
        <div className="w-44">
          <label className="text-xs font-semibold text-gray-700 ml-1 block mb-1.5">성명</label>
          <Input
            value={empName}
            onChange={(e) => onEmpNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="성명 검색"
          />
        </div>

        {/* 조회 버튼 */}
        <div className="pb-0">
          <Button
            variant="primary"
            size="md"
            icon={<Search size={15} />}
            onClick={onSearch}
            isLoading={isLoading}
            disabled={isLoading}
          >
            조회
          </Button>
        </div>
      </div>
    </div>
  );
};
