/**
 * 코칭 대시보드 페이지 (Task 9)
 *
 * 리더의 팀원 목록과 면담 현황 통계를 표시합니다.
 *
 * 기능:
 * - 상단 요약 카드 (미실시 / 2개월 초과 / 1개월 도래)
 * - 부서 Select + 이름 검색 필터
 * - 팀원 목록 그리드
 * - 카드 필터: 클라이언트 사이드 필터링 (추가 API 호출 없음)
 * - 이름 검색: 300ms 디바운스 후 서버 재조회 (카드 필터 초기화)
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { getDepartments } from '@/domains/hr/api';
import type { Department } from '@/domains/hr/types';
import type { MeetingStatusBadge } from '../types';
import { useCoachingStore } from '../store';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import { MemberSearchFilter } from '../components/MemberSearchFilter';
import { MemberDataGrid } from '../components/MemberDataGrid';
import { PreMeetingModal } from '../components/PreMeetingModal';

export function CoachingDashboardPage() {
  const { dashboard, isLoading, error, fetchDashboard } = useCoachingStore();

  // -------- 필터 상태 --------
  /** 부서 필터 (서버 파라미터) */
  const [deptCode, setDeptCode] = useState('');
  /** 이름 검색어 (디바운스 후 서버 재조회) */
  const [searchName, setSearchName] = useState('');
  /** 요약 카드 클릭 필터 (클라이언트 사이드) */
  const [statusFilter, setStatusFilter] = useState<MeetingStatusBadge | null>(null);

  // -------- 부서 목록 --------
  const [departments, setDepartments] = useState<Department[]>([]);

  // -------- 사전 준비 모달 상태 --------
  const [pendingMeeting, setPendingMeeting] = useState<{
    meetingId: string;
    memberEmpNo: string;
  } | null>(null);

  // -------- 초기 데이터 로드 --------
  useEffect(() => {
    fetchDashboard({ dept_code: deptCode || undefined, search_name: searchName || undefined });
  }, [fetchDashboard, deptCode, searchName]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await getDepartments({ use_yn: 'Y' });
        setDepartments(res.items);
      } catch {
        // 부서 로드 실패해도 기본 동작 유지
      }
    };
    loadDepartments();
  }, []);

  // -------- 핸들러 --------

  /** 부서 변경: 서버 재조회 */
  const handleDeptChange = useCallback((code: string) => {
    setDeptCode(code);
    setStatusFilter(null); // 카드 필터 초기화
  }, []);

  /**
   * 이름 검색 변경: 서버 재조회
   * 이름 검색 시 카드 필터 초기화 (혼용 시 충돌 방지)
   */
  const handleSearchChange = useCallback((name: string) => {
    setSearchName(name);
    setStatusFilter(null); // 카드 필터 초기화
  }, []);

  /** 요약 카드 클릭: 클라이언트 사이드 필터링 */
  const handleStatusFilterChange = useCallback((filter: MeetingStatusBadge | null) => {
    setStatusFilter(filter);
  }, []);

  /** 미팅 생성 완료 콜백 → 사전 준비 모달 오픈 */
  const handleMeetingCreated = useCallback((meetingId: string, memberEmpNo: string) => {
    setPendingMeeting({ meetingId, memberEmpNo });
  }, []);

  /** 사전 준비 모달 닫기 */
  const handleModalClose = useCallback(() => {
    setPendingMeeting(null);
  }, []);

  // -------- 클라이언트 사이드 필터링 --------
  const filteredItems = useMemo(() => {
    if (!dashboard) return [];
    if (!statusFilter) return dashboard.items;
    return dashboard.items.filter((item) => item.meeting_status === statusFilter);
  }, [dashboard, statusFilter]);

  // -------- 로딩 스켈레톤 --------
  if (isLoading.dashboard && !dashboard) {
    return (
      <div className="p-6 space-y-6">
        {/* 요약 카드 스켈레톤 */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="w-9 h-9 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* 그리드 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // -------- 에러 상태 --------
  if (error.dashboard && !dashboard) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-600">데이터를 불러오는데 실패했습니다</p>
          <p className="text-xs text-red-400 mt-1">{error.dashboard}</p>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary ?? {
    requested_count: 0,
    overdue_2month: 0,
    due_1month: 0,
    normal_count: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">1on1 코칭 대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">팀원들의 면담 현황을 관리하세요</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} />
          <span>
            총{' '}
            <span className="font-semibold text-gray-900">{dashboard?.total ?? 0}</span>
            명
          </span>
        </div>
      </div>

      {/* 상단 요약 카드 */}
      <DashboardSummaryCards
        summary={summary}
        activeFilter={statusFilter}
        onFilterChange={handleStatusFilterChange}
      />

      {/* 검색 / 필터 영역 */}
      <div className="flex items-center justify-between">
        <MemberSearchFilter
          departments={departments}
          deptCode={deptCode}
          searchName={searchName}
          onDeptChange={handleDeptChange}
          onSearchChange={handleSearchChange}
        />

        <div className="flex items-center gap-4">
          {/* 카드 필터 적용 중 표시 */}
          {statusFilter && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>카드 필터 적용 중</span>
              <span className="font-semibold text-gray-900">{filteredItems.length}명</span>
              <button
                type="button"
                onClick={() => setStatusFilter(null)}
                className="text-xs text-[#4950DC] hover:underline"
              >
                초기화
              </button>
            </div>
          )}

          {/* 재조회 중 인디케이터 */}
          {isLoading.dashboard && dashboard && (
            <div className="text-xs text-gray-400 animate-pulse">새로고침 중...</div>
          )}
        </div>
      </div>

      {/* 팀원 목록 그리드 */}
      <MemberDataGrid items={filteredItems} onMeetingCreated={handleMeetingCreated} />

      {/* 사전 준비 모달 */}
      {pendingMeeting && (
        <PreMeetingModal
          meetingId={pendingMeeting.meetingId}
          memberEmpNo={pendingMeeting.memberEmpNo}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
