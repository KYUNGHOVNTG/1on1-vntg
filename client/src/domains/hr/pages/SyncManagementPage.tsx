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
      // Mock 데이터를 사용하여 동기화 테스트 (53명)
      // 실제 운영 시에는 외부 시스템에서 전달받은 데이터를 사용
      // position_code: P001=대표이사, P002=총괄, P003=센터장/실장, P004=팀장, P005=팀원
      const mockEmployees = [
        // === 대표이사 / CEO직속 / 본부 / 총괄 ===
        { emp_no: '26000001', user_id: 'cjhol2107', name_kor: '최경호', dept_code: '260000', position_code: 'P001', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000002', user_id: 'user001', name_kor: '김태현', dept_code: '260010', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000003', user_id: 'user002', name_kor: '이정우', dept_code: '260100', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000004', user_id: 'user003', name_kor: '박성민', dept_code: '261000', position_code: 'P002', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === 센터장 / 실장 ===
        { emp_no: '26000005', user_id: 'user004', name_kor: '정수진', dept_code: '260110', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000006', user_id: 'user005', name_kor: '한지영', dept_code: '260120', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000007', user_id: 'user006', name_kor: '오승환', dept_code: '260130', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000008', user_id: 'user007', name_kor: '강민석', dept_code: '261010', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000009', user_id: 'user008', name_kor: '윤재호', dept_code: '261020', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000010', user_id: 'user009', name_kor: '서준혁', dept_code: '261030', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000011', user_id: 'user010', name_kor: '임하늘', dept_code: '261040', position_code: 'P003', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === FI팀 (260111) ===
        { emp_no: '26000012', user_id: 'user011', name_kor: '조현우', dept_code: '260111', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000013', user_id: 'user012', name_kor: '김소연', dept_code: '260111', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000014', user_id: 'user013', name_kor: '이도윤', dept_code: '260111', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === People Hub팀 (260121) ===
        { emp_no: '26000015', user_id: 'user014', name_kor: '박지은', dept_code: '260121', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000016', user_id: 'user015', name_kor: '최민규', dept_code: '260121', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000017', user_id: 'user016', name_kor: '정하윤', dept_code: '260121', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === 통합운영팀 (261011) ===
        { emp_no: '26000018', user_id: 'user017', name_kor: '신동현', dept_code: '261011', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000019', user_id: 'user018', name_kor: '김예진', dept_code: '261011', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000020', user_id: 'user019', name_kor: '이승우', dept_code: '261011', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === 운영사업팀 (261012) ===
        { emp_no: '26000021', user_id: 'user020', name_kor: '홍지수', dept_code: '261012', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000022', user_id: 'user021', name_kor: '장민호', dept_code: '261012', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000023', user_id: 'user022', name_kor: '백서윤', dept_code: '261012', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === ERP1팀 (261021) ===
        { emp_no: '26000024', user_id: 'user023', name_kor: '류현진', dept_code: '261021', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000025', user_id: 'user024', name_kor: '안소희', dept_code: '261021', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000026', user_id: 'user025', name_kor: '문재원', dept_code: '261021', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === MES1팀 (261022) ===
        { emp_no: '26000027', user_id: 'user026', name_kor: '구본석', dept_code: '261022', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000028', user_id: 'user027', name_kor: '양지원', dept_code: '261022', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000029', user_id: 'user028', name_kor: '노은지', dept_code: '261022', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === PC1팀 (261023) ===
        { emp_no: '26000030', user_id: 'user029', name_kor: '허성민', dept_code: '261023', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000031', user_id: 'user030', name_kor: '배한결', dept_code: '261023', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000032', user_id: 'user031', name_kor: '우서현', dept_code: '261023', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === CORE팀 (261024) ===
        { emp_no: '26000033', user_id: 'user032', name_kor: '남기훈', dept_code: '261024', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000034', user_id: 'user033', name_kor: '진수빈', dept_code: '261024', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000035', user_id: 'user034', name_kor: '하윤서', dept_code: '261024', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === ERP2팀 (261031) ===
        { emp_no: '26000036', user_id: 'user035', name_kor: '송재현', dept_code: '261031', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000037', user_id: 'user036', name_kor: '차민우', dept_code: '261031', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000038', user_id: 'user037', name_kor: '공유진', dept_code: '261031', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === MES2팀 (261032) ===
        { emp_no: '26000039', user_id: 'user038', name_kor: '유민수', dept_code: '261032', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000040', user_id: 'user039', name_kor: '권나연', dept_code: '261032', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000041', user_id: 'user040', name_kor: '탁준호', dept_code: '261032', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === PC2팀 (261033) ===
        { emp_no: '26000042', user_id: 'user041', name_kor: '변수아', dept_code: '261033', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000043', user_id: 'user042', name_kor: '성지훈', dept_code: '261033', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000044', user_id: 'user043', name_kor: '주영은', dept_code: '261033', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === ERP3팀 (261041) ===
        { emp_no: '26000045', user_id: 'user044', name_kor: '민경호', dept_code: '261041', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000046', user_id: 'user045', name_kor: '도현수', dept_code: '261041', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000047', user_id: 'user046', name_kor: '길소라', dept_code: '261041', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === ERP4팀 (261042) ===
        { emp_no: '26000048', user_id: 'user047', name_kor: '전재원', dept_code: '261042', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000049', user_id: 'user048', name_kor: '황수진', dept_code: '261042', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000050', user_id: 'user049', name_kor: '고태윤', dept_code: '261042', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        // === MES3팀 (261043) ===
        { emp_no: '26000051', user_id: 'user050', name_kor: '심현우', dept_code: '261043', position_code: 'P004', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000052', user_id: 'user051', name_kor: '추서영', dept_code: '261043', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
        { emp_no: '26000053', user_id: 'user052', name_kor: '방준서', dept_code: '261043', position_code: 'P005', on_work_yn: 'Y' as const, concurrent_positions: [] },
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
      // Mock 데이터를 사용하여 동기화 테스트 (25개 부서, 4depth 계층 구조)
      // 실제 운영 시에는 외부 시스템에서 전달받은 데이터를 사용
      const mockDepartments = [
        // Level 1: 대표이사
        { dept_code: '260000', dept_name: '대표이사',       upper_dept_code: null,      dept_head_emp_no: '26000001', use_yn: 'Y' as const },
        // Level 2: CEO직속 / 본부 / 총괄
        { dept_code: '260010', dept_name: 'CEO직속',        upper_dept_code: '260000',  dept_head_emp_no: '26000002', use_yn: 'Y' as const },
        { dept_code: '260100', dept_name: '사업지원본부',   upper_dept_code: '260000',  dept_head_emp_no: '26000003', use_yn: 'Y' as const },
        { dept_code: '261000', dept_name: '운영총괄',       upper_dept_code: '260000',  dept_head_emp_no: '26000004', use_yn: 'Y' as const },
        // Level 3: 실 / 센터 (사업지원본부 산하)
        { dept_code: '260110', dept_name: 'FM실',           upper_dept_code: '260100',  dept_head_emp_no: '26000005', use_yn: 'Y' as const },
        { dept_code: '260120', dept_name: 'EX실',           upper_dept_code: '260100',  dept_head_emp_no: '26000006', use_yn: 'Y' as const },
        { dept_code: '260130', dept_name: 'VC센터',         upper_dept_code: '260100',  dept_head_emp_no: '26000007', use_yn: 'Y' as const },
        // Level 3: 센터 (운영총괄 산하)
        { dept_code: '261010', dept_name: '통합운영센터',   upper_dept_code: '261000',  dept_head_emp_no: '26000008', use_yn: 'Y' as const },
        { dept_code: '261020', dept_name: '운영1센터',      upper_dept_code: '261000',  dept_head_emp_no: '26000009', use_yn: 'Y' as const },
        { dept_code: '261030', dept_name: '운영2센터',      upper_dept_code: '261000',  dept_head_emp_no: '26000010', use_yn: 'Y' as const },
        { dept_code: '261040', dept_name: '운영3센터',      upper_dept_code: '261000',  dept_head_emp_no: '26000011', use_yn: 'Y' as const },
        // Level 4: 팀 (FM실 산하)
        { dept_code: '260111', dept_name: 'FI팀',           upper_dept_code: '260110',  dept_head_emp_no: '26000012', use_yn: 'Y' as const },
        // Level 4: 팀 (EX실 산하)
        { dept_code: '260121', dept_name: 'People Hub팀',   upper_dept_code: '260120',  dept_head_emp_no: '26000015', use_yn: 'Y' as const },
        // Level 4: 팀 (통합운영센터 산하)
        { dept_code: '261011', dept_name: '통합운영팀',     upper_dept_code: '261010',  dept_head_emp_no: '26000018', use_yn: 'Y' as const },
        { dept_code: '261012', dept_name: '운영사업팀',     upper_dept_code: '261010',  dept_head_emp_no: '26000021', use_yn: 'Y' as const },
        // Level 4: 팀 (운영1센터 산하)
        { dept_code: '261021', dept_name: 'ERP1팀',         upper_dept_code: '261020',  dept_head_emp_no: '26000024', use_yn: 'Y' as const },
        { dept_code: '261022', dept_name: 'MES1팀',         upper_dept_code: '261020',  dept_head_emp_no: '26000027', use_yn: 'Y' as const },
        { dept_code: '261023', dept_name: 'PC1팀',          upper_dept_code: '261020',  dept_head_emp_no: '26000030', use_yn: 'Y' as const },
        { dept_code: '261024', dept_name: 'CORE팀',         upper_dept_code: '261020',  dept_head_emp_no: '26000033', use_yn: 'Y' as const },
        // Level 4: 팀 (운영2센터 산하)
        { dept_code: '261031', dept_name: 'ERP2팀',         upper_dept_code: '261030',  dept_head_emp_no: '26000036', use_yn: 'Y' as const },
        { dept_code: '261032', dept_name: 'MES2팀',         upper_dept_code: '261030',  dept_head_emp_no: '26000039', use_yn: 'Y' as const },
        { dept_code: '261033', dept_name: 'PC2팀',          upper_dept_code: '261030',  dept_head_emp_no: '26000042', use_yn: 'Y' as const },
        // Level 4: 팀 (운영3센터 산하)
        { dept_code: '261041', dept_name: 'ERP3팀',         upper_dept_code: '261040',  dept_head_emp_no: '26000045', use_yn: 'Y' as const },
        { dept_code: '261042', dept_name: 'ERP4팀',         upper_dept_code: '261040',  dept_head_emp_no: '26000048', use_yn: 'Y' as const },
        { dept_code: '261043', dept_name: 'MES3팀',         upper_dept_code: '261040',  dept_head_emp_no: '26000051', use_yn: 'Y' as const },
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
