import React from 'react';
import type { CodeMaster } from '../types';
import { cn } from '@/core/utils/cn';

interface CodeMasterListProps {
    masters: CodeMaster[];
    selectedCodeType: string | null;
    onSelect: (codeType: string) => void;
}

export const CodeMasterList: React.FC<CodeMasterListProps> = ({
    masters,
    selectedCodeType,
    onSelect,
}) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">공통코드 마스터</h3>
                <p className="text-xs text-gray-500 mt-1">총 {masters.length}건</p>
            </div>

            <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                        <tr>
                            <th className="px-4 py-3 border-b border-gray-100">코드타입</th>
                            <th className="px-4 py-3 border-b border-gray-100">코드타입명</th>
                            <th className="px-4 py-3 border-b border-gray-100 text-center">길이</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {masters.length > 0 ? (
                            masters.map((master) => (
                                <tr
                                    key={master.code_type}
                                    onClick={() => onSelect(master.code_type)}
                                    className={cn(
                                        "cursor-pointer transition-colors hover:bg-gray-50",
                                        selectedCodeType === master.code_type ? "bg-indigo-50 hover:bg-indigo-50" : ""
                                    )}
                                >
                                    <td className={cn(
                                        "px-4 py-3 font-medium",
                                        selectedCodeType === master.code_type ? "text-indigo-600" : "text-gray-900"
                                    )}>
                                        {master.code_type}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{master.code_type_name}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{master.code_len}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
