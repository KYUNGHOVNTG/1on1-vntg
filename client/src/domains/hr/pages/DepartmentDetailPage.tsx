/**
 * 부서 상세 페이지
 *
 * 부서의 상세 정보와 소속 직원 목록을 표시합니다.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useHRStore } from '../store';
import { DepartmentInfoCard } from '../components/DepartmentInfoCard';
import { DepartmentEmployeeList } from '../components/DepartmentEmployeeList';

export function DepartmentDetailPage() {
  // =============================================
  // Hooks
  // =============================================
  const { deptCode } = useParams<{ deptCode: string }>();
  const navigate = useNavigate();
  const {
    selectedDepartment,
    departmentEmployees,
    departmentEmployeesTotal,
    loading,
    error,
    fetchDepartmentById,
    fetchDepartmentEmployees,
    clearSelectedDepartment,
  } = useHRStore();

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    if (deptCode) {
      fetchDepartmentById(deptCode);
      fetchDepartmentEmployees(deptCode);
    }

    return () => {
      clearSelectedDepartment();
    };
  }, [deptCode, fetchDepartmentById, fetchDepartmentEmployees, clearSelectedDepartment]);

  // =============================================
  // Handlers
  // =============================================
  const handleBack = () => {
    navigate('/hr/org-chart');
  };

  // =============================================
  // Render
  // =============================================
  if (!deptCode) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-6">
        <div className="max-w-4xl mx-auto py-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">부서 코드가 지정되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          조직도로 돌아가기
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-[#4950DC]" />
          <h1 className="text-2xl font-bold text-gray-900">부서 상세</h1>
        </div>
        <p className="text-sm text-gray-500">
          부서의 상세 정보와 소속 직원을 확인합니다.
        </p>
      </div>

      {/* 로딩/에러 처리 */}
      {loading.department ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500">부서 정보를 불러오는 중...</p>
        </div>
      ) : error.department ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-500">{error.department}</p>
        </div>
      ) : !selectedDepartment ? (
        <div className="py-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">부서 정보를 찾을 수 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 부서 정보 카드 */}
          <DepartmentInfoCard department={selectedDepartment} />

          {/* 소속 직원 리스트 */}
          <DepartmentEmployeeList
            employees={departmentEmployees}
            total={departmentEmployeesTotal}
            loading={loading.departmentEmployees}
            error={error.departmentEmployees}
          />
        </div>
      )}
    </div>
  );
}
