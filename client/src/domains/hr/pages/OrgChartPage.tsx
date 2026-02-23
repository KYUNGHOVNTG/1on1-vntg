/**
 * 조직도 페이지
 *
 * 좌/우 2-패널 레이아웃으로 조직도 트리와 부서 상세 정보를 단일 화면에서 표시합니다.
 * - 좌측: 조직도 트리 (모두 펼치기/접기 버튼 포함)
 * - 우측: 선택된 부서의 상세 정보 및 소속 직원 목록
 */

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useHRStore } from '../store';
import { OrgTreeView } from '../components/OrgTreeView';
import { DepartmentEmployeeList } from '../components/DepartmentEmployeeList';
import type { OrgTreeNode, DepartmentDetail } from '../types';

export function OrgChartPage() {
  // =============================================
  // Hooks
  // =============================================
  const {
    orgTree,
    loading,
    error,
    fetchOrgTree,
    selectedDepartment,
    fetchDepartmentById,
    departmentEmployees,
    departmentEmployeesTotal,
    fetchDepartmentEmployees,
  } = useHRStore();

  const [selectedNode, setSelectedNode] = useState<OrgTreeNode | null>(null);
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    fetchOrgTree();
  }, [fetchOrgTree]);

  // =============================================
  // Handlers
  // =============================================
  const handleNodeClick = async (node: OrgTreeNode) => {
    setSelectedNode(node);
    await Promise.all([
      fetchDepartmentById(node.dept_code),
      fetchDepartmentEmployees(node.dept_code),
    ]);
  };

  const handleExpandAll = () => {
    setExpandAll(true);
  };

  const handleCollapseAll = () => {
    setExpandAll(false);
  };

  const handleExpandAllReset = () => {
    setExpandAll(undefined);
  };

  // =============================================
  // Render helpers
  // =============================================
  function renderDepartmentInfoCard(dept: DepartmentDetail) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#4950DC]" />
          <h3 className="text-base font-semibold text-gray-900">
            {dept.dept_name}
          </h3>
        </div>
        <dl className="space-y-3">
          <div className="flex items-start gap-4">
            <dt className="w-24 flex-shrink-0 text-xs font-medium text-gray-500 pt-0.5">
              부서코드
            </dt>
            <dd className="text-sm text-gray-900">{dept.dept_code}</dd>
          </div>
          <div className="flex items-start gap-4">
            <dt className="w-24 flex-shrink-0 text-xs font-medium text-gray-500 pt-0.5">
              상위부서명
            </dt>
            <dd className="text-sm text-gray-900">
              {dept.upper_dept_name ?? '-'}
            </dd>
          </div>
          <div className="flex items-start gap-4">
            <dt className="w-24 flex-shrink-0 text-xs font-medium text-gray-500 pt-0.5">
              부서장
            </dt>
            <dd className="text-sm text-gray-900">
              {dept.dept_head_name
                ? `${dept.dept_head_name}${dept.dept_head_position ? ` (${dept.dept_head_position})` : ''}`
                : '-'}
            </dd>
          </div>
          <div className="flex items-start gap-4">
            <dt className="w-24 flex-shrink-0 text-xs font-medium text-gray-500 pt-0.5">
              사용여부
            </dt>
            <dd>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium',
                  dept.use_yn === 'Y'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {dept.use_yn === 'Y' ? '사용 중' : '미사용'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  // =============================================
  // Render
  // =============================================
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-[#4950DC]" />
          <h1 className="text-2xl font-bold text-gray-900">조직도 관리</h1>
        </div>
        <p className="text-sm text-gray-500">
          회사의 조직 구조를 확인하고 부서별 상세 정보와 소속 직원을 조회합니다.
        </p>
      </div>

      {/* 메인 2-패널 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 좌측: 조직도 트리 ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* 트리 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                조직도 관리
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-all"
              >
                모두 펼치기
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-all"
              >
                모두 접기
              </button>
            </div>
          </div>

          {/* 트리 컨텐츠 */}
          <div className="p-4 overflow-y-auto flex-1">
            {loading.orgTree ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-sm text-gray-500">
                  조직도를 불러오는 중...
                </p>
              </div>
            ) : error.orgTree ? (
              <div className="py-12 text-center">
                <p className="text-sm text-red-500">{error.orgTree}</p>
              </div>
            ) : orgTree.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  조직도 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <OrgTreeView
                nodes={orgTree}
                selectedNode={selectedNode}
                onNodeClick={handleNodeClick}
                expandAll={expandAll}
                onExpandAllReset={handleExpandAllReset}
              />
            )}
          </div>
        </div>

        {/* ── 우측: 상세 정보 패널 ── */}
        <div className="flex flex-col gap-4">
          {!selectedNode ? (
            /* 부서 미선택 상태 */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col items-center justify-center py-20">
              <Building2 className="w-14 h-14 text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500 mb-1">
                부서를 선택하면
              </p>
              <p className="text-sm text-gray-400">
                상세 정보를 확인할 수 있습니다.
              </p>
            </div>
          ) : loading.department ? (
            /* 부서 정보 로딩 */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-[#4950DC] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-sm text-gray-500">
                  부서 정보를 불러오는 중...
                </p>
              </div>
            </div>
          ) : selectedDepartment ? (
            <>
              {/* 부서 상세 정보 카드 */}
              {renderDepartmentInfoCard(selectedDepartment)}

              {/* 소속 직원 목록 */}
              <DepartmentEmployeeList
                employees={departmentEmployees}
                total={departmentEmployeesTotal}
                loading={loading.departmentEmployees}
                error={error.departmentEmployees}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
