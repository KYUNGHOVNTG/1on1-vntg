/**
 * 조직도 트리 노드 컴포넌트
 *
 * 개별 부서 노드를 렌더링하고 하위 부서를 재귀적으로 표시합니다.
 */

import { useState, useEffect } from 'react';
import { Plus, Minus, Building2, Users } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { OrgTreeNode } from '../types';

interface OrgTreeNodeProps {
  node: OrgTreeNode;
  level: number;
  selectedNode: OrgTreeNode | null;
  onNodeClick: (node: OrgTreeNode) => void;
  expandAll?: boolean; // undefined: 개별 제어, true: 전체 펼침, false: 전체 접기
  onExpandAllReset?: () => void; // 개별 토글 시 부모의 expandAll을 undefined로 리셋
}

const LEVEL_PADDING: Record<number, string> = {
  0: 'pl-0',
  1: 'pl-6',
  2: 'pl-12',
  3: 'pl-[72px]',
};

function getLevelPadding(level: number): string {
  return LEVEL_PADDING[Math.min(level, 3)] ?? 'pl-[72px]';
}

export function OrgTreeNodeComponent({
  node,
  level,
  selectedNode,
  onNodeClick,
  expandAll,
  onExpandAllReset,
}: OrgTreeNodeProps) {
  // =============================================
  // State
  // =============================================
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.dept_code === node.dept_code;

  // =============================================
  // Effects
  // =============================================
  useEffect(() => {
    if (expandAll !== undefined && hasChildren) {
      setIsExpanded(expandAll);
    }
  }, [expandAll, hasChildren]);

  // =============================================
  // Handlers
  // =============================================
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
      onExpandAllReset?.();
    }
  };

  const handleClick = () => {
    onNodeClick(node);
  };

  // =============================================
  // Render
  // =============================================
  return (
    <div className={cn('select-none', getLevelPadding(level))}>
      {/* 노드 본체 */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all',
          isSelected
            ? 'bg-[#4950DC]/10 border-2 border-[#4950DC]'
            : 'hover:bg-gray-50 border-2 border-transparent'
        )}
        onClick={handleClick}
      >
        {/* 확장/축소 버튼 (+/-) */}
        <button
          onClick={handleToggle}
          className={cn(
            'flex-shrink-0 w-5 h-5 border border-gray-300 rounded flex items-center justify-center transition-colors',
            hasChildren
              ? 'hover:bg-gray-100 text-gray-600'
              : 'invisible'
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <Minus className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
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
      </div>

      {/* 하위 부서 (재귀) */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <OrgTreeNodeComponent
              key={child.dept_code}
              node={child}
              level={level + 1}
              selectedNode={selectedNode}
              onNodeClick={onNodeClick}
              expandAll={expandAll}
              onExpandAllReset={onExpandAllReset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
