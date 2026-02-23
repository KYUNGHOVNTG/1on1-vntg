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
      // position_code: P001=대표이사, P002=총괄, P003=센터장/실장, P004=팀장, P005=팀원
      const mockEmployees = [
        // 경영본부 (DEPT001) - 본부장
        { emp_no: 'EMP001', user_id: 'user001', name_kor: '김철수', dept_code: 'DEPT001', position_code: 'P001', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // 기술본부 (DEPT002) - 본부장
        { emp_no: 'EMP002', user_id: 'user002', name_kor: '이영희', dept_code: 'DEPT002', position_code: 'P001', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // 영업본부 (DEPT003) - 본부장
        { emp_no: 'EMP003', user_id: 'user003', name_kor: '박민수', dept_code: 'DEPT003', position_code: 'P001', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 인사팀 (DEPT011) - 팀장, 겸직: 채용파트(DEPT111)
        {
          emp_no: 'EMP004', user_id: 'user004', name_kor: '정지훈', dept_code: 'DEPT011', position_code: 'P002', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'DEPT011', is_main: 'Y' as const, position_code: 'P002' },
            { dept_code: 'DEPT111', is_main: 'N' as const, position_code: 'P003' },
          ],
        },
        // 재무팀 (DEPT012) - 팀장
        { emp_no: 'EMP005', user_id: 'user005', name_kor: '최수진', dept_code: 'DEPT012', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 개발1팀 (DEPT021) - 팀장, 겸직: 프론트엔드파트(DEPT211)
        {
          emp_no: 'EMP006', user_id: 'user006', name_kor: '강동원', dept_code: 'DEPT021', position_code: 'P002', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'DEPT021', is_main: 'Y' as const, position_code: 'P002' },
            { dept_code: 'DEPT211', is_main: 'N' as const, position_code: 'P003' },
          ],
        },
        // 개발2팀 (DEPT022) - 팀장
        { emp_no: 'EMP007', user_id: 'user007', name_kor: '윤아름', dept_code: 'DEPT022', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 영업1팀 (DEPT031) - 팀장, 겸직: 영업지원파트(DEPT311)
        {
          emp_no: 'EMP008', user_id: 'user008', name_kor: '조민호', dept_code: 'DEPT031', position_code: 'P002', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'DEPT031', is_main: 'Y' as const, position_code: 'P002' },
            { dept_code: 'DEPT311', is_main: 'N' as const, position_code: 'P003' },
          ],
        },
        // 영업2팀 (DEPT032) - 팀장
        { emp_no: 'EMP009', user_id: 'user009', name_kor: '한지민', dept_code: 'DEPT032', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 채용파트 (DEPT111) - 파트장
        { emp_no: 'EMP010', user_id: 'user010', name_kor: '오세훈', dept_code: 'DEPT111', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // 평가파트 (DEPT112) - 파트장
        { emp_no: 'EMP011', user_id: 'user011', name_kor: '송혜교', dept_code: 'DEPT112', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 프론트엔드파트 (DEPT211) - 파트장
        { emp_no: 'EMP012', user_id: 'user012', name_kor: '임시완', dept_code: 'DEPT211', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // 백엔드파트 (DEPT212) - 파트장
        { emp_no: 'EMP013', user_id: 'user013', name_kor: '배수지', dept_code: 'DEPT212', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // AI파트 (DEPT221) - 파트장
        { emp_no: 'EMP014', user_id: 'user014', name_kor: '남주혁', dept_code: 'DEPT221', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // 영업지원파트 (DEPT311) - 파트장
        { emp_no: 'EMP015', user_id: 'user015', name_kor: '전지현', dept_code: 'DEPT311', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },

        // 백엔드파트 (DEPT212) - 팀원, 겸직: 개발2팀(DEPT022)
        {
          emp_no: 'EMP016', user_id: 'user016', name_kor: '유재석', dept_code: 'DEPT212', position_code: 'P004', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'DEPT212', is_main: 'Y' as const, position_code: 'P004' },
            { dept_code: 'DEPT022', is_main: 'N' as const, position_code: 'P004' },
          ],
        },
        // AI파트 (DEPT221) - 팀원, 겸직: 개발1팀(DEPT021)
        {
          emp_no: 'EMP017', user_id: 'user017', name_kor: '강호동', dept_code: 'DEPT221', position_code: 'P004', on_work_yn: 'Y' as const,
          concurrent_positions: [
            { dept_code: 'DEPT221', is_main: 'Y' as const, position_code: 'P004' },
            { dept_code: 'DEPT021', is_main: 'N' as const, position_code: 'P004' },
          ],
        },

        // 인사팀 (DEPT011) - 퇴직자
        { emp_no: 'EMP018', user_id: 'user018', name_kor: '신동엽', dept_code: 'DEPT011', position_code: 'P004', on_work_yn: 'N' as const, concurrent_positions: [] },
        // 개발1팀 (DEPT021) - 퇴직자
        { emp_no: 'EMP019', user_id: 'user019', name_kor: '김구라', dept_code: 'DEPT021', position_code: 'P004', on_work_yn: 'N' as const, concurrent_positions: [] },
        // 영업1팀 (DEPT031) - 퇴직자
        { emp_no: 'EMP020', user_id: 'user020', name_kor: '서장훈', dept_code: 'DEPT031', position_code: 'P004', on_work_yn: 'N' as const, concurrent_positions: [] },
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
      // Mock 데이터를 사용하여 동기화 테스트 (15개 부서, 3depth 계층 구조)
      // 실제 운영 시에는 외부 시스템에서 전달받은 데이터를 사용
      const mockDepartments = [
        // Level 1: 본부
        { dept_code: 'DEPT001', dept_name: '경영본부',       upper_dept_code: null,      dept_head_emp_no: 'EMP001', use_yn: 'Y' as const },
        { dept_code: 'DEPT002', dept_name: '기술본부',       upper_dept_code: null,      dept_head_emp_no: 'EMP002', use_yn: 'Y' as const },
        { dept_code: 'DEPT003', dept_name: '영업본부',       upper_dept_code: null,      dept_head_emp_no: 'EMP003', use_yn: 'Y' as const },
        // Level 2: 팀 (경영본부 산하)
        { dept_code: 'DEPT011', dept_name: '인사팀',         upper_dept_code: 'DEPT001', dept_head_emp_no: 'EMP004', use_yn: 'Y' as const },
        { dept_code: 'DEPT012', dept_name: '재무팀',         upper_dept_code: 'DEPT001', dept_head_emp_no: 'EMP005', use_yn: 'Y' as const },
        // Level 2: 팀 (기술본부 산하)
        { dept_code: 'DEPT021', dept_name: '개발1팀',        upper_dept_code: 'DEPT002', dept_head_emp_no: 'EMP006', use_yn: 'Y' as const },
        { dept_code: 'DEPT022', dept_name: '개발2팀',        upper_dept_code: 'DEPT002', dept_head_emp_no: 'EMP007', use_yn: 'Y' as const },
        // Level 2: 팀 (영업본부 산하)
        { dept_code: 'DEPT031', dept_name: '영업1팀',        upper_dept_code: 'DEPT003', dept_head_emp_no: 'EMP008', use_yn: 'Y' as const },
        { dept_code: 'DEPT032', dept_name: '영업2팀',        upper_dept_code: 'DEPT003', dept_head_emp_no: 'EMP009', use_yn: 'Y' as const },
        // Level 3: 파트 (인사팀 산하)
        { dept_code: 'DEPT111', dept_name: '채용파트',       upper_dept_code: 'DEPT011', dept_head_emp_no: 'EMP010', use_yn: 'Y' as const },
        { dept_code: 'DEPT112', dept_name: '평가파트',       upper_dept_code: 'DEPT011', dept_head_emp_no: 'EMP011', use_yn: 'Y' as const },
        // Level 3: 파트 (개발1팀 산하)
        { dept_code: 'DEPT211', dept_name: '프론트엔드파트', upper_dept_code: 'DEPT021', dept_head_emp_no: 'EMP012', use_yn: 'Y' as const },
        { dept_code: 'DEPT212', dept_name: '백엔드파트',     upper_dept_code: 'DEPT021', dept_head_emp_no: 'EMP013', use_yn: 'Y' as const },
        // Level 3: 파트 (개발2팀 산하)
        { dept_code: 'DEPT221', dept_name: 'AI파트',         upper_dept_code: 'DEPT022', dept_head_emp_no: 'EMP014', use_yn: 'Y' as const },
        // Level 3: 파트 (영업1팀 산하)
        { dept_code: 'DEPT311', dept_name: '영업지원파트',   upper_dept_code: 'DEPT031', dept_head_emp_no: 'EMP015', use_yn: 'Y' as const },
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
