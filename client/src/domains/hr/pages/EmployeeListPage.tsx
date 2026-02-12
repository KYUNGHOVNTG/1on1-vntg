/**
 * 직원 목록 페이지
 *
 * 직원 정보를 조회하고 관리하는 페이지입니다.
 */

import { useState, useEffect } from 'react';
import { Search, Users, Filter } from 'lucide-react';
import { getEmployees } from '../api';
import type { Employee, EmployeeListParams } from '../types';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';

export function EmployeeListPage() {
  // =============================================
  // State
  // =============================================
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  // 상세 모달
  const [selectedEmpNo, setSelectedEmpNo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const response = await getEmployees(params);
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

            {/* 재직 여부 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재직 여부
              </label>
              <select
                value={onWorkYn}
                onChange={(e) => setOnWorkYn(e.target.value as 'Y' | 'N' | '')}
                className="h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
              >
                <option value="">전체</option>
                <option value="Y">재직</option>
                <option value="N">퇴직</option>
              </select>
            </div>

            {/* 직책 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직책
              </label>
              <input
                type="text"
                value={positionCode}
                onChange={(e) => setPositionCode(e.target.value)}
                placeholder="직책 코드"
                className="h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
              />
            </div>

            {/* 부서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서
              </label>
              <input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="부서 코드"
                className="h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
              />
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
            <span className="px-2.5 py-0.5 bg-[#4950DC] bg-opacity-10 text-[#4950DC] rounded-lg text-xs font-medium">
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
                      부서 코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      직책 코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      재직 여부
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr
                      key={employee.emp_no}
                      onClick={() => handleRowClick(employee.emp_no)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {employee.emp_no}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.name_kor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.dept_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.position_code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            employee.on_work_yn === 'Y'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {employee.on_work_yn === 'Y' ? '재직' : '퇴직'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            page === pageNum
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
