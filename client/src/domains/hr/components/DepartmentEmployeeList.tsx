/**
 * 부서 소속 직원 리스트 컴포넌트
 *
 * 특정 부서에 소속된 직원 목록을 표시합니다.
 */

import { Users, User } from 'lucide-react';
import type { Employee } from '../types';

interface DepartmentEmployeeListProps {
  employees: Employee[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function DepartmentEmployeeList({
  employees,
  total,
  loading,
  error,
}: DepartmentEmployeeListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 리스트 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">
            소속 직원
          </h2>
          <span className="px-2.5 py-0.5 bg-[#4950DC] bg-opacity-10 text-[#4950DC] rounded-lg text-xs font-medium">
            {total}명
          </span>
        </div>
      </div>

      {/* 리스트 본문 */}
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
          <p className="text-sm text-gray-500">소속 직원이 없습니다.</p>
        </div>
      ) : (
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
                  직책
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
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {employee.emp_no}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {employee.name_kor}
                      </span>
                    </div>
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
      )}
    </div>
  );
}
