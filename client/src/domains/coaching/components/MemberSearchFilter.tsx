/**
 * 팀원 검색 필터 컴포넌트
 *
 * 부서 Select + 이름 검색 Input을 제공합니다.
 * - 이름 검색: 300ms 디바운스 후 서버 재조회 (카드 필터 초기화)
 * - 부서 Select: 변경 즉시 서버 재조회
 */

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/core/ui';
import type { SelectOption } from '@/core/ui/Select/Select.types';
import { cn } from '@/core/utils/cn';

interface Department {
  dept_code: string;
  dept_name: string;
}

interface MemberSearchFilterProps {
  departments: Department[];
  deptCode: string;
  searchName: string;
  onDeptChange: (deptCode: string) => void;
  onSearchChange: (searchName: string) => void;
}

export function MemberSearchFilter({
  departments,
  deptCode,
  searchName,
  onDeptChange,
  onSearchChange,
}: MemberSearchFilterProps) {
  const [inputValue, setInputValue] = useState(searchName);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 외부에서 searchName이 초기화되면 input도 초기화
  useEffect(() => {
    setInputValue(searchName);
  }, [searchName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  const deptOptions: SelectOption[] = [
    { value: '', label: '전체 부서' },
    ...departments.map((d) => ({ value: d.dept_code, label: d.dept_name })),
  ];

  return (
    <div className="flex items-center gap-3">
      {/* 부서 Select */}
      <div className="w-48">
        <Select
          options={deptOptions}
          value={deptCode}
          onChange={onDeptChange}
          placeholder="전체 부서"
        />
      </div>

      {/* 이름 검색 Input */}
      <div className="relative w-60">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="팀원 이름 검색"
          className={cn(
            'w-full h-10 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-sm',
            'focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all'
          )}
        />
      </div>
    </div>
  );
}
