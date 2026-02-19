/**
 * 직원 목록 페이지
 *
 * 직원 정보를 조회하고 관리하는 페이지입니다.
 *
 * [TASK 1] 명수 뱃지 가시성 수정 - 흰 배경 + 테두리 + 진한 텍스트
 * [TASK 2] 재직여부 Select 공통 스타일 적용
 * [TASK 3] 직책 Select - 공통코드 테이블(POSITION) 연동
 * [TASK 4] 부서 Select - cm_department 연동
 * [TASK 5] Backend JOIN - 부서명·직책명 표시 (dept_name, position_name)
 * [TASK 7] 겸직 전개 목록 표시 및 겸직 라벨 (expand_concurrent=true)
 */

import { useState, useEffect } from 'react';
import { Search, Users, Filter, ChevronDown } from 'lucide-react';
import { getEmployeesExpanded, getDepartments } from '../api';
import { apiClient } from '@/core/api/client';
import type { EmployeeRow, EmployeeListParams, Department } from '../types';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';

// =============================================
// 공통코드 타입 (직책 조회용, 로컬 정의)
// =============================================
interface CodeDetail {
  code: string;
  code_name: string;
  sort_seq: number | null;
  use_yn: string;
}

interface CodeDetailListResult {
  data: CodeDetail[];
}

// 공통 Select 컴포넌트 인라인 스타일 (재사용 가능)
const selectClassName =
  'h-10 w-full px-3 pr-9 border border-gray-200 rounded-xl text-sm ' +
  'focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none ' +
  'bg-white appearance-none cursor-pointer transition-all text-gray-700';

export function EmployeeListPage() {
  // =============================================
  // State
  // =============================================
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 및 필터
  const [search, setSearch] = useState('');
  const [onWorkYn, setOnWorkYn] = useState<'Y' | 'N' | ''>('Y');
  const [positionCode, setPositionCode] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // [TASK 3] 직책 목록 (공통코드 POSITION)
  const [positions, setPositions] = useState<CodeDetail[]>([]);

  // [TASK 4] 부서 목록 (cm_department)
  const [departments, setDepartments] = useState<Department[]>([]);

  // 상세 모달
  const [selectedEmpNo, setSelectedEmpNo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // =============================================
  // [TASK 3] 직책 목록 조회 (공통코드 POSITION)
  // =============================================
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await apiClient.get<CodeDetailListResult>(
          '/v1/codes/masters/POSITION/details'
        );
        // ServiceResult 래퍼 구조: { data: [...], success: true }
        const data = (response.data as any)?.data ?? response.data;
        const list: CodeDetail[] = Array.isArray(data) ? data : [];
        setPositions(list.filter((p) => p.use_yn === 'Y'));
      } catch (err) {
        console.error('직책 목록 조회 실패:', err);
        // 조회 실패 시 select는 빈 채로 유지
      }
    };
    fetchPositions();
  }, []);

  // =============================================
  // [TASK 4] 부서 목록 조회 (cm_department)
  // =============================================
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments({ use_yn: 'Y' });
        setDepartments(response.items);
      } catch (err) {
        console.error('부서 목록 조회 실패:', err);
      }
    };
    fetchDepartments();
  }, []);

  // =============================================
  // 직원 목록 조회
  // =============================================
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: EmployeeListParams = {
        page,
        size,
      };

      if (search) params.search = search;
      if (onWorkYn) params.on_work_yn = onWorkYn;
      if (positionCode) params.position_code = positionCode;
      if (deptCode) params.dept_code = deptCode;

      const response = await getEmployeesExpanded(params);
      setEmployees(response.items);
      setTotal(response.total);
      setPages(response.pages);
    } catch (err) {
      console.error('직원 목록 조회 실패:', err);
      setError('직원 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    fetchEmployees();
  }, [page, onWorkYn, positionCode, deptCode]);

  // =============================================
  // Handlers
  // =============================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleReset = () => {
    setSearch('');
    setOnWorkYn('Y');
    setPositionCode('');
    setDeptCode('');
    setPage(1);
  };

  const handleRowClick = (empNo: string) => {
    setSelectedEmpNo(empNo);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmpNo(null);
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-[#4950DC]" />
          <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
        </div>
        <p className="text-sm text-gray-500">직원 정보를 조회하고 관리합니다.</p>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 검색어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이름 또는 사번"
                  className="h-10 w-full pl-10 pr-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
                />
              </div>
            </div>

            {/* [TASK 2] 재직 여부 - 공통 Select 스타일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재직 여부
              </label>
              <div className="relative">
                <select
                  value={onWorkYn}
                  onChange={(e) => setOnWorkYn(e.target.value as 'Y' | 'N' | '')}
                  className={selectClassName}
                >
                  <option value="">전체</option>
                  <option value="Y">재직</option>
                  <option value="N">퇴직</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* [TASK 3] 직책 - 공통코드 POSITION 연동 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직책
              </label>
              <div className="relative">
                <select
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">전체</option>
                  {positions.map((pos) => (
                    <option key={pos.code} value={pos.code}>
                      {pos.code_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* [TASK 4] 부서 - cm_department 연동 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서
              </label>
              <div className="relative">
                <select
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">전체</option>
                  {departments.map((dept) => (
                    <option key={dept.dept_code} value={dept.dept_code}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#4950DC] hover:bg-[#3840C5] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Search className="w-4 h-4 inline-block mr-2" />
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
            >
              <Filter className="w-4 h-4 inline-block mr-2" />
              초기화
            </button>
          </div>
        </form>
      </div>

      {/* 직원 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 목록 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              직원 목록
            </h2>
            {/* [TASK 1] 명수 뱃지 - 흰 배경 + 테두리 + 진한 텍스트로 가시성 수정 */}
            <span className="px-2.5 py-0.5 bg-white border border-[#4950DC] text-[#4950DC] rounded-lg text-xs font-semibold">
              {total}명
            </span>
          </div>
        </div>

        {/* 테이블 */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500">직원 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">조회된 직원이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      사번
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      성명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      부서명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      직책명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      재직 여부
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => {
                    // [TASK 7] 겸직 전개 시 동일 emp_no가 여러 ROW로 나타나므로 유일한 key 생성
                    const rowKey = employee.is_concurrent
                      ? `${employee.emp_no}_${employee.dept_code}_${employee.is_main}`
                      : employee.emp_no;
                    // [TASK 7] 겸직 ROW 여부 (is_concurrent=true 이고 is_main='N'이면 겸직 ROW)
                    const isConcurrentRow = employee.is_concurrent && employee.is_main === 'N';

                    return (
                      <tr
                        key={rowKey}
                        onClick={() => handleRowClick(employee.emp_no)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isConcurrentRow ? 'bg-orange-50/30' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {employee.emp_no}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span>{employee.name_kor}</span>
                          {/* [TASK 7] 겸직 ROW에 겸직 라벨 표시 */}
                          {isConcurrentRow && (
                            <span className="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-xs font-medium">
                              겸직
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {employee.dept_name ?? employee.dept_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {employee.position_name ?? employee.position_code}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${employee.on_work_yn === 'Y'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {employee.on_work_yn === 'Y' ? '재직' : '퇴직'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {total}명 중 {(page - 1) * size + 1}-
                  {Math.min(page * size, total)}명 표시
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    이전
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${page === pageNum
                            ? 'bg-[#4950DC] text-white'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 직원 상세 모달 */}
      {isModalOpen && selectedEmpNo && (
        <EmployeeDetailModal
          empNo={selectedEmpNo}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
