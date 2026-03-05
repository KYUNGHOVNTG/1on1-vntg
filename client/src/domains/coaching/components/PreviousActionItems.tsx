/**
 * 이전 미팅 미완료 Action Items 컴포넌트 (사전 준비 모달용)
 *
 * is_first_meeting=false 일 때만 표시됩니다.
 * N-1, N-2 미팅에서 미완료된 Action Item 목록을 보여줍니다.
 */

import { ClipboardList } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { ActionItemBrief } from '../types';

interface PreviousActionItemsProps {
  items: ActionItemBrief[];
}

export function PreviousActionItems({ items }: PreviousActionItemsProps) {
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-700">이전 미완료 Action Items</h4>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-400">이전 미팅의 미완료 항목이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ClipboardList size={16} className="text-amber-500" />
        <h4 className="text-sm font-semibold text-gray-700">이전 미완료 Action Items</h4>
        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
          {items.length}건
        </span>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.action_item_id}
            className="flex items-start gap-3 px-3 py-2.5 bg-amber-50/50 rounded-xl border border-amber-100"
          >
            {/* 미완료 표시 */}
            <div className="w-4 h-4 mt-0.5 rounded border-2 border-amber-300 shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
              {item.assignee && (
                <span
                  className={cn(
                    'inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded-md',
                    item.assignee === 'LEADER'
                      ? 'bg-[#4950DC]/10 text-[#4950DC]'
                      : 'bg-[#14B287]/10 text-[#14B287]'
                  )}
                >
                  {item.assignee === 'LEADER' ? '리더' : '팀원'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 px-1">
        미팅 시작 시 위 항목들이 이번 미팅에 이월됩니다
      </p>
    </div>
  );
}
