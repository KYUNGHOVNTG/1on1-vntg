/**
 * 조직도 트리 노드 컴포넌트
 *
 * 개별 부서 노드를 렌더링하고 하위 부서를 재귀적으로 표시합니다.
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { OrgTreeNode } from '../types';

interface OrgTreeNodeProps {
  node: OrgTreeNode;
  level: number;
  selectedNode: OrgTreeNode | null;
  onNodeClick: (node: OrgTreeNode) => void;
}

export function OrgTreeNodeComponent({
  node,
  level,
  selectedNode,
  onNodeClick,
}: OrgTreeNodeProps) {
  // =============================================
  // State
  // =============================================
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.dept_code === node.dept_code;

  // =============================================
  // Handlers
  // =============================================
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    onNodeClick(node);
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div className="select-none">
      {/* 노드 본체 */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all',
          isSelected
            ? 'bg-[#4950DC] bg-opacity-10 border-2 border-[#4950DC]'
            : 'hover:bg-gray-50 border-2 border-transparent'
        )}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={handleClick}
      >
        {/* 확장/축소 아이콘 */}
        <button
          onClick={handleToggle}
          className={cn(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors',
            hasChildren
              ? 'hover:bg-gray-200 text-gray-600'
              : 'invisible'
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </button>

        {/* 부서 아이콘 */}
        <Building2
          className={cn(
            'flex-shrink-0 w-5 h-5',
            isSelected ? 'text-[#4950DC]' : 'text-gray-500'
          )}
        />

        {/* 부서 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-sm font-semibold truncate',
                isSelected ? 'text-[#4950DC]' : 'text-gray-900'
              )}
            >
              {node.dept_name}
            </h3>
            <span className="flex-shrink-0 text-xs text-gray-500">
              {node.dept_code}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {/* 부서장 */}
            {node.dept_head_name && (
              <span className="text-xs text-gray-600">
                {node.dept_head_name}
              </span>
            )}
            {/* 직원 수 */}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {node.employee_count}명
              </span>
            </div>
          </div>
        </div>

        {/* 레벨 배지 */}
        <div
          className={cn(
            'flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium',
            level === 0
              ? 'bg-blue-50 text-blue-700'
              : level === 1
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          L{node.disp_lvl}
        </div>
      </div>

      {/* 하위 부서 (재귀) */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <OrgTreeNodeComponent
              key={child.dept_code}
              node={child}
              level={level + 1}
              selectedNode={selectedNode}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
