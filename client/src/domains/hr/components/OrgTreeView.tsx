/**
 * 조직도 트리 뷰 컴포넌트
 *
 * 재귀적으로 조직도 트리를 렌더링합니다.
 */

import type { OrgTreeNode } from '../types';
import { OrgTreeNodeComponent } from './OrgTreeNode';

interface OrgTreeViewProps {
  nodes: OrgTreeNode[];
  selectedNode: OrgTreeNode | null;
  onNodeClick: (node: OrgTreeNode) => void;
  expandAll?: boolean; // OrgChartPage에서 제어
  onExpandAllReset?: () => void; // 개별 토글 시 expandAll 리셋
}

export function OrgTreeView({
  nodes,
  selectedNode,
  onNodeClick,
  expandAll,
  onExpandAllReset,
}: OrgTreeViewProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <OrgTreeNodeComponent
          key={node.dept_code}
          node={node}
          level={0}
          selectedNode={selectedNode}
          onNodeClick={onNodeClick}
          expandAll={expandAll}
          onExpandAllReset={onExpandAllReset}
        />
      ))}
    </div>
  );
}
