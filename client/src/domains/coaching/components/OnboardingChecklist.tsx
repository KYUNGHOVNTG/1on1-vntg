/**
 * 온보딩 체크리스트 컴포넌트 (사전 준비 모달용)
 *
 * is_first_meeting=true 일 때만 표시됩니다.
 * 첫 미팅 진행을 위한 온보딩 체크리스트와 아이스브레이킹 질문을 제공합니다.
 */

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/core/utils/cn';

const ONBOARDING_ITEMS = [
  { id: 'intro', label: '1on1 미팅의 목적과 방식 안내' },
  { id: 'role', label: '팀원의 역할과 기대치 명확화' },
  { id: 'goal', label: '단기/중기 목표 설정 논의' },
  { id: 'style', label: '선호하는 커뮤니케이션 스타일 파악' },
  { id: 'concern', label: '현재 업무 상의 어려움이나 걱정 사항 청취' },
];

const ICEBREAKING_QUESTIONS = [
  '최근 업무에서 가장 보람을 느낀 순간은 언제였나요?',
  '지금 팀에서 가장 잘 되고 있다고 생각하는 부분은 무엇인가요?',
  '이번 분기 가장 집중하고 싶은 목표가 있다면 무엇인가요?',
];

export function OnboardingChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* 온보딩 체크리스트 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#4950DC]" />
          <h4 className="text-sm font-semibold text-gray-700">첫 미팅 체크리스트</h4>
        </div>

        <div className="space-y-1.5">
          {ONBOARDING_ITEMS.map((item) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                  isChecked
                    ? 'bg-[#4950DC]/10 border-[#4950DC]/20 text-[#4950DC]'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                    isChecked ? 'bg-[#4950DC] border-[#4950DC]' : 'border-gray-300'
                  )}
                >
                  {isChecked && (
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={cn('text-sm', isChecked && 'line-through opacity-60')}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 아이스브레이킹 질문 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">아이스브레이킹 질문 예시</h4>
        <div className="space-y-1.5">
          {ICEBREAKING_QUESTIONS.map((question, index) => (
            <div
              key={index}
              className="flex items-start gap-2 px-3 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-200"
            >
              <span className="text-xs font-bold text-gray-400 mt-0.5 w-4 shrink-0">
                Q{index + 1}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{question}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
