/**
 * 부서 정보 카드 컴포넌트
 *
 * 부서의 기본 정보를 카드 형태로 표시합니다.
 */

import { Building2, User, Users, Briefcase } from 'lucide-react';
import type { DepartmentDetail } from '../types';

interface DepartmentInfoCardProps {
  department: DepartmentDetail;
}

export function DepartmentInfoCard({ department }: DepartmentInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#4950DC] to-[#3840C5]">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {department.dept_name}
            </h2>
            <p className="text-sm text-white text-opacity-90 mt-1">
              {department.dept_code}
            </p>
          </div>
        </div>
      </div>

      {/* 카드 본문 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 상위 부서 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <dt className="text-xs font-medium text-gray-500 mb-1">
                상위 부서
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {department.upper_dept_name || '-'}
              </dd>
              {department.upper_dept_code && (
                <dd className="text-xs text-gray-500 mt-0.5">
                  {department.upper_dept_code}
                </dd>
              )}
            </div>
          </div>

          {/* 부서장 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <dt className="text-xs font-medium text-gray-500 mb-1">
                부서장
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {department.dept_head_name || '-'}
              </dd>
              {department.dept_head_position && (
                <dd className="text-xs text-gray-500 mt-0.5">
                  {department.dept_head_position}
                </dd>
              )}
            </div>
          </div>

          {/* 전체 직원 수 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <dt className="text-xs font-medium text-gray-500 mb-1">
                전체 직원
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {department.employee_count}명
              </dd>
            </div>
          </div>

          {/* 주소속 직원 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <dt className="text-xs font-medium text-gray-500 mb-1">
                주소속 / 겸직
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {department.main_employee_count}명 /{' '}
                {department.concurrent_employee_count}명
              </dd>
            </div>
          </div>
        </div>

        {/* 사용 여부 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              사용 상태
            </span>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                department.use_yn === 'Y'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {department.use_yn === 'Y' ? '사용 중' : '사용 안 함'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
