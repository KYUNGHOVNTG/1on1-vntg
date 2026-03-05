/**
 * AI 추천 질문 컴포넌트 (사전 준비 모달용)
 *
 * AI가 추천한 아젠다 질문 목록을 표시합니다.
 * 각 질문을 체크하여 미팅 아젠다에 포함할 수 있습니다.
 * 로딩 중에는 skeleton UI를 표시합니다.
 */

import { Bot } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface AiSuggestedAgendasProps {
  questions: string[];
  selectedQuestions: Set<string>;
  isLoading: boolean;
  onToggle: (question: string) => void;
}

export function AiSuggestedAgendas({
  questions,
  selectedQuestions,
  isLoading,
  onToggle,
}: AiSuggestedAgendasProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bot size={16} className="text-[#2E81B1]" />
        <h4 className="text-sm font-semibold text-gray-700">AI 추천 질문</h4>
        <span className="text-xs text-gray-400">클릭하여 아젠다에 추가</span>
      </div>

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-xl animate-pulse"
              style={{ width: `${70 + i * 8}%` }}
            />
          ))}
          <p className="text-xs text-gray-400 px-1">AI 추천 질문을 불러오는 중...</p>
        </div>
      )}

      {/* 질문 목록 */}
      {!isLoading && questions.length === 0 && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-400">AI 추천 질문을 불러오지 못했습니다</p>
        </div>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="space-y-1.5">
          {questions.map((question) => {
            const isSelected = selectedQuestions.has(question);
            return (
              <button
                key={question}
                type="button"
                onClick={() => onToggle(question)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'bg-[#2E81B1]/10 border-[#2E81B1]/20 text-[#2E81B1]'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                    isSelected ? 'bg-[#2E81B1] border-[#2E81B1]' : 'border-gray-300'
                  )}
                >
                  {isSelected && (
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
                <span className="text-sm leading-relaxed">{question}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
