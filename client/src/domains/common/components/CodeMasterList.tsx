import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { CodeMaster } from '../types';
import { cn } from '@/core/utils/cn';

interface CodeMasterListProps {
    masters: CodeMaster[];
    selectedCodeType: string | null;
    onSelect: (codeType: string) => void;
    onAdd: () => void;
    onEdit: (master: CodeMaster) => void;
    onDelete: (master: CodeMaster) => void;
}

export const CodeMasterList: React.FC<CodeMasterListProps> = ({
    masters,
    selectedCodeType,
    onSelect,
    onAdd,
    onEdit,
    onDelete,
}) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-900">공통코드 마스터</h3>
                    <p className="text-xs text-gray-500 mt-1">총 {masters.length}건</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                    }}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 flex items-center gap-1 text-xs font-semibold"
                >
                    <Plus size={14} />
                    <span>추가</span>
                </button>
            </div>

            <div className="overflow-y-auto flex-1 dark-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider sticky top-0 bg-gray-50 z-10 backdrop-blur-sm bg-opacity-90">
                        <tr>
                            <th className="px-4 py-3 border-b border-gray-100">코드타입</th>
                            <th className="px-4 py-3 border-b border-gray-100">코드타입명</th>
                            <th className="px-4 py-3 border-b border-gray-100 text-right w-16">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {masters.length > 0 ? (
                            masters.map((master) => (
                                <tr
                                    key={master.code_type}
                                    onClick={() => onSelect(master.code_type)}
                                    className={cn(
                                        "cursor-pointer transition-colors hover:bg-gray-50 group",
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
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(master);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-all"
                                                title="수정"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(master);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-all"
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
