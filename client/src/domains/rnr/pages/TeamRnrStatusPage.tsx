/**
 * TeamRnrStatusPage Component
 *
 * 조직원 R&R 현황 페이지 (M002_3, /goals/teamRnr)
 *
 * - 조직장(P001~P004)만 접근 가능
 * - 하위 조직 팀원 전체의 R&R을 부서/직책/성명 필터로 조회
 * - 아코디언 방식으로 사원별 R&R 현황 표시
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Breadcrumb } from '@/core/ui';
import { useRnrStore } from '../store';
import { TeamRnrSearchBar, TeamRnrDetailAccordion } from '../components';

const CURRENT_YEAR = String(new Date().getFullYear());

export const TeamRnrStatusPage: React.FC = () => {
  const {
    teamRrList,
    teamRrTotal,
    teamFilterOptions,
    isLoading,
    fetchTeamRrList,
    fetchTeamFilterOptions,
  } = useRnrStore();

  // 검색 조건
  const [year, setYear] = useState<string>(CURRENT_YEAR);
  const [deptCode, setDeptCode] = useState<string>('');
  const [positionCode, setPositionCode] = useState<string>('');
  const [empName, setEmpName] = useState<string>('');

  // 초기 진입 시 필터 옵션 + 목록 조회
  useEffect(() => {
    fetchTeamFilterOptions();
    fetchTeamRrList({ year });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(() => {
    fetchTeamRrList({
      year,
      dept_code: deptCode || undefined,
      position_code: positionCode || undefined,
      emp_name: empName.trim() || undefined,
    });
  }, [fetchTeamRrList, year, deptCode, positionCode, empName]);

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: 'R&R 관리' },
          { label: '조직원 R&R 현황' },
        ]}
      />

      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          조직원 R&R 현황
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {year}년 기준 · 총{' '}
          <span className="font-semibold text-gray-700">{teamRrTotal}</span>명
        </p>
      </div>

      {/* 조회 조건 필터 */}
      <TeamRnrSearchBar
        year={year}
        onYearChange={(val) => setYear(val)}
        deptCode={deptCode}
        onDeptChange={(val) => setDeptCode(val)}
        positionCode={positionCode}
        onPositionChange={(val) => setPositionCode(val)}
        empName={empName}
        onEmpNameChange={(val) => setEmpName(val)}
        departments={teamFilterOptions?.departments ?? []}
        positions={teamFilterOptions?.positions ?? []}
        onSearch={handleSearch}
        isLoading={isLoading.teamRrList}
      />

      {/* R&R 목록 (아코디언) */}
      <TeamRnrDetailAccordion
        items={teamRrList}
        isLoading={isLoading.teamRrList}
        year={year}
      />
    </div>
  );
};
