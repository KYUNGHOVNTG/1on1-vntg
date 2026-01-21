import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CodeMaster } from '../types';

interface CodeMasterData {
    code_type: string;
    code_type_name: string;
    rmk?: string;
}

interface CodeMasterDialogProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CodeMaster | null;
    onClose: () => void;
    onSave: (data: CodeMasterData) => Promise<void>;
}

export const CodeMasterDialog: React.FC<CodeMasterDialogProps> = ({
    isOpen,
    mode,
    initialData,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = React.useState<CodeMasterData>({
        code_type: '',
        code_type_name: '',
        rmk: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    code_type: initialData.code_type,
                    code_type_name: initialData.code_type_name,
                    rmk: initialData.rmk || '',
                });
            } else {
                setFormData({
                    code_type: '',
                    code_type_name: '',
                    rmk: '',
                });
            }
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            // Error handling usually in parent or toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        {mode === 'create' ? '공통코드 마스터 등록' : '공통코드 마스터 수정'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            코드 타입 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            disabled={mode === 'edit'}
                            value={formData.code_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, code_type: e.target.value.toUpperCase() }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${mode === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300'
                                }`}
                            placeholder="예: ROLE, POSITION"
                        />
                        {mode === 'edit' && <p className="text-xs text-gray-400 mt-1">코드 타입은 수정할 수 없습니다.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            코드 타입명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.code_type_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, code_type_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="예: 역할, 직급"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            비고
                        </label>
                        <textarea
                            value={formData.rmk}
                            onChange={(e) => setFormData(prev => ({ ...prev, rmk: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[80px]"
                            placeholder="설명을 입력하세요"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {isSubmitting ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
