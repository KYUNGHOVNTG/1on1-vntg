/**
 * 조직도 페이지
 *
 * 계층형 조직도 트리를 표시하고 부서 정보를 조회합니다.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import { useHRStore } from '../store';
import { OrgTreeView } from '../components/OrgTreeView';
import type { OrgTreeNode } from '../types';

export function OrgChartPage() {
  // =============================================
  // Hooks
  // =============================================
  const navigate = useNavigate();
  const {
    orgTree,
    loading,
    error,
    fetchOrgTree,
  } = useHRStore();

  const [selectedNode, setSelectedNode] = useState<OrgTreeNode | null>(null);

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    fetchOrgTree();
  }, [fetchOrgTree]);

  // =============================================
  // Handlers
  // =============================================
  const handleNodeClick = (node: OrgTreeNode) => {
    setSelectedNode(node);
  };

  const handleViewDetail = () => {
    if (selectedNode) {
      navigate(`/hr/departments/${selectedNode.dept_code}`);
    }
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-[#4950DC]" />
          <h1 className="text-2xl font-bold text-gray-900">조직도</h1>
        </div>
        <p className="text-sm text-gray-500">
          회사의 조직 구조를 확인하고 부서별 정보를 조회합니다.
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 조직도 트리 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* 트리 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  조직 구조
                </h2>
              </div>
            </div>

            {/* 트리 컨텐츠 */}
            <div className="p-6">
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
                />
              )}
            </div>
          </div>
        </div>

        {/* 선택된 부서 정보 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
            {/* 정보 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                부서 정보
              </h2>
            </div>

            {/* 정보 컨텐츠 */}
            {selectedNode ? (
              <div className="p-6">
                {/* 부서명 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-[#4950DC]" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedNode.dept_name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedNode.dept_code}
                  </p>
                </div>

                {/* 부서 정보 */}
                <div className="space-y-4 mb-6">
                  {/* 부서장 */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">
                      부서장
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {selectedNode.dept_head_name || '-'}
                    </dd>
                  </div>

                  {/* 소속 직원 수 */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">
                      소속 직원
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {selectedNode.employee_count}명
                    </dd>
                  </div>

                  {/* 조직 레벨 */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">
                      조직 레벨
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {selectedNode.disp_lvl}단계
                    </dd>
                  </div>
                </div>

                {/* 상세보기 버튼 */}
                <button
                  onClick={handleViewDetail}
                  className="w-full px-5 py-2.5 bg-[#4950DC] hover:bg-[#3840C5] text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  부서 상세보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  부서를 선택하면
                  <br />
                  상세 정보를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
