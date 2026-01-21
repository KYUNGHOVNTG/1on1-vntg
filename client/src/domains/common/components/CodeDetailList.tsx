import React from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { CodeDetail } from '../types';
import { Badge, Button, Card } from '@/core/ui';

interface CodeDetailListProps {
    details: CodeDetail[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (detail: CodeDetail) => void;
    onDelete: (detail: CodeDetail) => void;
    onSort: (detail: CodeDetail, direction: 'up' | 'down') => void;
}

export const CodeDetailList: React.FC<CodeDetailListProps> = ({
    details,
    loading,
    onAdd,
    onEdit,
    onDelete,
    onSort,
}) => {
    if (loading) {
        return (
            <Card className="p-8 flex justify-center items-center h-full">
                <div className="text-gray-500 animate-pulse">상세 코드를 불러오는 중...</div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full transition-all hover:shadow-md">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-900">상세 코드</h3>
                    <p className="text-xs text-gray-500 mt-1">총 {details.length}건</p>
                </div>
                <Button
                    size="sm"
                    onClick={onAdd}
                    className="gap-1 px-3"
                >
                    <Plus size={14} />
                    <span>추가</span>
                </Button>
            </div>

            <div className="overflow-y-auto flex-1 dark-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
                        <tr>
                            <th className="px-4 py-3 border-b border-gray-100 w-24">코드</th>
                            <th className="px-4 py-3 border-b border-gray-100">코드명</th>
                            <th className="px-4 py-3 border-b border-gray-100 w-20 text-center">사용</th>
                            <th className="px-4 py-3 border-b border-gray-100">비고</th>
                            <th className="px-4 py-3 border-b border-gray-100 w-24 text-center">정렬</th>
                            <th className="px-4 py-3 border-b border-gray-100 w-20 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {details.length > 0 ? (
                            details.map((detail, index) => (
                                <tr key={detail.code} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{detail.code}</td>
                                    <td className="px-4 py-3 text-gray-700 text-sm">{detail.code_name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={detail.use_yn === 'Y' ? 'success' : 'neutral'}>
                                            {detail.use_yn === 'Y' ? '사용' : '미사용'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-sm truncate max-w-[150px]" title={detail.rmk}>{detail.rmk}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <span className="text-xs text-gray-500 w-4 font-medium">{detail.sort_seq}</span>
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onSort(detail, 'up')}
                                                    disabled={index === 0}
                                                    className="text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => onSort(detail, 'down')}
                                                    disabled={index === details.length - 1}
                                                    className="text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(detail)}
                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                title="수정"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(detail)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    등록된 상세 코드가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
