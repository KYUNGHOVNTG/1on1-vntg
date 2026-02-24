import React from 'react';
import type { RrItem } from '../types';
import { TimelineBar } from './TimelineBar';
import { Target, Network } from 'lucide-react';

interface RrCardProps {
    rr: RrItem;
}

export const RrCard: React.FC<RrCardProps> = ({ rr }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            {/* 상단 뱃지 & 상위 R&R */}
            <div className="flex items-center justify-between mb-4 h-6">
                {rr.parent_title ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                        <Network className="w-3.5 h-3.5" />
                        상위: {rr.parent_title}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold">
                        상위 없음
                    </span>
                )}
            </div>

            {/* R&R 명 및 상세 내용 */}
            <div className="flex-1 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
                    {rr.title}
                </h3>
                {rr.content ? (
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                        {rr.content}
                    </p>
                ) : (
                    <p className="text-sm text-gray-400 italic">상세 내용이 없습니다.</p>
                )}
            </div>

            {/* 구분선 */}
            <div className="w-full h-px bg-gray-100 mb-5" />

            {/* 하단: 타임라인 바 */}
            <div className="mt-auto w-full">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-3">
                    <Target className="w-3.5 h-3.5" />
                    수행 기간 ({rr.year}년)
                </div>
                <TimelineBar periods={rr.periods} year={rr.year} />
            </div>
        </div>
    );
};
