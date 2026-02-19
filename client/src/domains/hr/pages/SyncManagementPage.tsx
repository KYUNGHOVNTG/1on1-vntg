/**
 * 동기화 관리 페이지
 *
 * 직원 및 부서 정보 동기화 기능을 제공하고 동기화 이력을 표시합니다.
 */

import { useEffect } from 'react';
import { RefreshCw, Database, History } from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '../store';
import { SyncHistoryTable } from '../components/SyncHistoryTable';

export function SyncManagementPage() {
  // =============================================
  // Hooks
  // =============================================
  const {
    syncHistory,
    loading,
    syncEmployees,
    syncDepartments,
    fetchSyncHistory,
  } = useHRStore();

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    fetchSyncHistory();
  }, [fetchSyncHistory]);

  // =============================================
  // Handlers
  // =============================================
  const handleSyncEmployees = async () => {
    try {
      // Mock 데이터를 사용하여 동기화 테스트 (20명)
      // 실제 운영 시에는 외부 시스템에서 전달받은 데이터를 사용
      // 목 데이터 기준: concurrent_positions가 없는 직원은 빈 배열 (주소속만 관리)
      // 겸직이 있는 직원은 is_main='Y'(주소속) + is_main='N'(겸직) 레코드 포함
      const mockEmployees = [
        // 경영지원팀 (D001)
        { emp_no: 'E001', user_id: 'user001', name_kor: '김대표', dept_code: 'D001', position_code: 'P001', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E002', user_id: 'user002', name_kor: '이총괄', dept_code: 'D001', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E003', user_id: 'user003', name_kor: '박경영', dept_code: 'D001', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 개발팀 (D002)
        // E004: 주소속 D002, 겸직 D003 (디자인팀 협업)
        {
          emp_no: 'E004', user_id: 'user004', name_kor: '최개발', dept_code: 'D002', position_code: 'P004', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'D002', is_main: 'Y' as const, position_code: 'P004' },
            { dept_code: 'D003', is_main: 'N' as const, position_code: 'P005' },
          ],
        },
        { emp_no: 'E005', user_id: 'user005', name_kor: '정프론트', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // E006: 주소속 D002, 겸직 D004 (마케팅팀 기술 지원)
        {
          emp_no: 'E006', user_id: 'user006', name_kor: '강백엔드', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'D002', is_main: 'Y' as const, position_code: 'P005' },
            { dept_code: 'D004', is_main: 'N' as const, position_code: 'P005' },
          ],
        },
        { emp_no: 'E007', user_id: 'user007', name_kor: '조풀스택', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // E008: 주소속 D002, 겸직 D005 (영업팀 기술 지원)
        {
          emp_no: 'E008', user_id: 'user008', name_kor: '윤데이터', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'D002', is_main: 'Y' as const, position_code: 'P005' },
            { dept_code: 'D005', is_main: 'N' as const, position_code: 'P005' },
          ],
        },
        { emp_no: 'E009', user_id: 'user009', name_kor: '장인프라', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E010', user_id: 'user010', name_kor: '임모바일', dept_code: 'D002', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 디자인팀 (D003)
        { emp_no: 'E011', user_id: 'user011', name_kor: '한디자인', dept_code: 'D003', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E012', user_id: 'user012', name_kor: '오UI', dept_code: 'D003', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E013', user_id: 'user013', name_kor: '서UX', dept_code: 'D003', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E014', user_id: 'user014', name_kor: '신그래픽', dept_code: 'D003', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 마케팅팀 (D004)
        { emp_no: 'E015', user_id: 'user015', name_kor: '권마케팅', dept_code: 'D004', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E016', user_id: 'user016', name_kor: '황컨텐츠', dept_code: 'D004', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E017', user_id: 'user017', name_kor: '배SNS', dept_code: 'D004', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 영업팀 (D005)
        { emp_no: 'E018', user_id: 'user018', name_kor: '성영업', dept_code: 'D005', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E019', user_id: 'user019', name_kor: '곽세일즈', dept_code: 'D005', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: 'E020', user_id: 'user020', name_kor: '류영업', dept_code: 'D005', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
      ];

      const result = await syncEmployees(mockEmployees);
      toast.success(result.message);

      // 동기화 이력 새로고침
      fetchSyncHistory();
    } catch (error) {
      console.error('직원 정보 동기화 실패:', error);
      toast.error('직원 정보 동기화에 실패했습니다.');
    }
  };

  const handleSyncDepartments = async () => {
    try {
      // Mock 데이터를 사용하여 동기화 테스트 (5개 부서)
      // 실제 운영 시에는 외부 시스템에서 전달받은 데이터를 사용
      const mockDepartments = [
        { dept_code: 'D001', dept_name: '경영지원팀', upper_dept_code: null, dept_head_emp_no: 'E002', use_yn: 'Y' as const },
        { dept_code: 'D002', dept_name: '개발팀', upper_dept_code: null, dept_head_emp_no: 'E004', use_yn: 'Y' as const },
        { dept_code: 'D003', dept_name: '디자인팀', upper_dept_code: null, dept_head_emp_no: 'E011', use_yn: 'Y' as const },
        { dept_code: 'D004', dept_name: '마케팅팀', upper_dept_code: null, dept_head_emp_no: 'E015', use_yn: 'Y' as const },
        { dept_code: 'D005', dept_name: '영업팀', upper_dept_code: null, dept_head_emp_no: 'E018', use_yn: 'Y' as const },
      ];

      const result = await syncDepartments(mockDepartments);
      toast.success(result.message);

      // 동기화 이력 새로고침
      fetchSyncHistory();
    } catch (error) {
      console.error('부서 정보 동기화 실패:', error);
      toast.error('부서 정보 동기화에 실패했습니다.');
    }
  };

  const handleRefreshHistory = () => {
    fetchSyncHistory();
    toast.info('동기화 이력을 새로고침했습니다.');
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-[#4950DC]" />
          <h1 className="text-2xl font-bold text-gray-900">동기화 관리</h1>
        </div>
        <p className="text-sm text-gray-500">
          외부 시스템(오라클)과 데이터를 동기화하고 이력을 관리합니다.
        </p>
      </div>

      {/* 동기화 버튼 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 직원 정보 동기화 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                직원 정보 동기화
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                외부 시스템의 직원 데이터를 가져와 업데이트합니다.
              </p>
              <button
                onClick={handleSyncEmployees}
                disabled={loading.syncEmployees}
                className="w-full px-5 py-2.5 bg-[#4950DC] hover:bg-[#3840C5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading.syncEmployees ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    직원 정보 동기화
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 부서 정보 동기화 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                부서 정보 동기화
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                외부 시스템의 부서 데이터를 가져와 업데이트합니다.
              </p>
              <button
                onClick={handleSyncDepartments}
                disabled={loading.syncDepartments}
                className="w-full px-5 py-2.5 bg-[#14B287] hover:bg-[#108E6C] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading.syncDepartments ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    부서 정보 동기화
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 동기화 이력 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 이력 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              동기화 이력
            </h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              최근 {syncHistory.length}건
            </span>
          </div>
          <button
            onClick={handleRefreshHistory}
            disabled={loading.syncHistory}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading.syncHistory ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* 이력 테이블 */}
        <SyncHistoryTable
          histories={syncHistory}
          loading={loading.syncHistory}
        />
      </div>
    </div>
  );
}
