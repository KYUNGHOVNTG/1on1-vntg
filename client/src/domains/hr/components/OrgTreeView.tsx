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
}

export function OrgTreeView({
  nodes,
  selectedNode,
  onNodeClick,
}: OrgTreeViewProps) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <OrgTreeNodeComponent
          key={node.dept_code}
          node={node}
          level={0}
          selectedNode={selectedNode}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
