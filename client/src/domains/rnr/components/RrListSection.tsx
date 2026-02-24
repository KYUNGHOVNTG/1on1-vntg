import React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import type { RrItem } from '../types';
import { RrCard } from './RrCard';
import { EmptyState } from '../../../core/ui/EmptyState/EmptyState';

interface RrListSectionProps {
    items: RrItem[];
    isLoading: boolean;
    onRegisterClick: () => void;
}

export const RrListSection: React.FC<RrListSectionProps> = ({
    items,
    isLoading,
    onRegisterClick,
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#4950DC] animate-spin mb-4" />
                <p className="text-sm text-gray-500">나의 R&R 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6">
                <EmptyState
                    icon={ClipboardList}
                    title="등록된 R&R이 없습니다"
                    description="새 R&R을 등록하여 역할과 책임을 정의해보세요"
                    action={{
                        label: '+ 등록하기',
                        onClick: onRegisterClick,
                        variant: 'primary',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            {items.map((rr) => (
                <RrCard key={rr.rr_id} rr={rr} />
            ))}
        </div>
    );
};
