/**
 * 리더 즉석 아젠다 추가 Input 컴포넌트 (사전 준비 모달용)
 *
 * 리더가 미팅 전에 아젠다를 직접 추가할 수 있는 입력 폼입니다.
 * 추가된 아젠다는 source=LEADER_ADDED로 등록됩니다.
 */

import { useState, useRef, type KeyboardEvent } from 'react';
import { Plus, X, ListPlus } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface LeaderAgendaInputProps {
  addedItems: string[];
  onAdd: (content: string) => void;
  onRemove: (content: string) => void;
}

export function LeaderAgendaInput({ addedItems, onAdd, onRemove }: LeaderAgendaInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (addedItems.includes(trimmed)) return; // 중복 방지
    onAdd(trimmed);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ListPlus size={16} className="text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">아젠다 직접 추가</h4>
      </div>

      {/* 입력 영역 */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="아젠다 항목을 입력하세요 (Enter로 추가)"
          maxLength={200}
          className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all placeholder:text-gray-300"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={cn(
            'h-10 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1',
            inputValue.trim()
              ? 'bg-[#4950DC] hover:bg-[#3840C5] text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      {/* 추가된 아젠다 목록 */}
      {addedItems.length > 0 && (
        <div className="space-y-1.5">
          {addedItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-2 bg-[#4950DC]/5 rounded-xl border border-[#4950DC]/20"
            >
              <span className="text-xs font-semibold text-[#4950DC] shrink-0">내</span>
              <p className="flex-1 text-sm text-gray-700 leading-relaxed">{item}</p>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="p-1 rounded-lg hover:bg-[#4950DC]/10 transition-colors shrink-0"
                aria-label="아젠다 삭제"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
