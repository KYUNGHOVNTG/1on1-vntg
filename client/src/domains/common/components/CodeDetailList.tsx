import React from 'react';
import type { CodeDetail } from '../types';
import { Badge } from '@/core/ui';

interface CodeDetailListProps {
    details: CodeDetail[];
    loading: boolean;
}

export const CodeDetailList: React.FC<CodeDetailListProps> = ({
    details,
    loading,
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex justify-center items-center h-full">
                <div className="text-gray-500 animate-pulse">상세 코드를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">상세 코드</h3>
                <p className="text-xs text-gray-500 mt-1">총 {details.length}건</p>
            </div>

            <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                        <tr>
                            <th className="px-4 py-3 border-b border-gray-100 w-24">코드</th>
                            <th className="px-4 py-3 border-b border-gray-100">코드명</th>
                            <th className="px-4 py-3 border-b border-gray-100 w-20 text-center">정렬</th>
                            <th className="px-4 py-3 border-b border-gray-100 w-20 text-center">사용</th>
                            <th className="px-4 py-3 border-b border-gray-100">비고</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {details.length > 0 ? (
                            details.map((detail) => (
                                <tr key={detail.code} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{detail.code}</td>
                                    <td className="px-4 py-3 text-gray-700">{detail.code_name}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{detail.sort_seq}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={detail.use_yn === 'Y' ? 'success' : 'neutral'}>
                                            {detail.use_yn === 'Y' ? '사용' : '미사용'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]" title={detail.rmk}>{detail.rmk}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    등록된 상세 코드가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
