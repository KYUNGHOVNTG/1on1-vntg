/**
 * 직원 상세 정보 모달
 *
 * 직원의 상세 정보와 겸직 정보를 표시하는 모달입니다.
 */

import { useState, useEffect } from 'react';
import { X, User, Briefcase, Building2 } from 'lucide-react';
import { getEmployee, getConcurrentPositions } from '../api';
import type { Employee, ConcurrentPosition } from '../types';

interface EmployeeDetailModalProps {
  empNo: string;
  onClose: () => void;
}

export function EmployeeDetailModal({ empNo, onClose }: EmployeeDetailModalProps) {
  // =============================================
  // State
  // =============================================
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [concurrentPositions, setConcurrentPositions] = useState<ConcurrentPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // 직원 정보 조회
  // =============================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [employeeData, concurrentData] = await Promise.all([
          getEmployee(empNo),
          getConcurrentPositions(empNo),
        ]);

        setEmployee(employeeData);
        setConcurrentPositions(concurrentData);
      } catch (err) {
        console.error('직원 정보 조회 실패:', err);
        setError('직원 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empNo]);

  // =============================================
  // Handlers
  // =============================================
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-[#4950DC]" />
            <h2 className="text-lg font-semibold text-gray-900">직원 상세 정보</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500">직원 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : employee ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#4950DC]" />
                  기본 정보
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">사번</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {employee.emp_no}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">성명</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {employee.name_kor}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">사용자 ID</span>
                    <span className="text-sm text-gray-900">{employee.user_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">부서 코드</span>
                    <span className="text-sm text-gray-900">{employee.dept_code}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">직책 코드</span>
                    <span className="text-sm text-gray-900">{employee.position_code}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">재직 여부</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        employee.on_work_yn === 'Y'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {employee.on_work_yn === 'Y' ? '재직' : '퇴직'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 겸직 정보 */}
              {concurrentPositions.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#4950DC]" />
                    겸직 정보
                  </h3>
                  <div className="space-y-2">
                    {concurrentPositions.map((cp, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {cp.dept_code}
                              </span>
                              {cp.is_main === 'Y' && (
                                <span className="px-2 py-0.5 bg-[#4950DC] bg-opacity-10 text-[#4950DC] rounded text-xs font-medium">
                                  주소속
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              직책: {cp.position_code}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
