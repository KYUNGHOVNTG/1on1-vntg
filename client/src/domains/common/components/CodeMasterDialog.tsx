import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80">
                    <h3 className="text-lg font-bold text-gray-900">
                        {mode === 'create' ? '공통코드 마스터 등록' : '공통코드 마스터 수정'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            코드 타입 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            disabled={mode === 'edit'}
                            value={formData.code_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, code_type: e.target.value.toUpperCase() }))}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${mode === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300'
                                }`}
                            placeholder="예: ROLE, POSITION"
                        />
                        {mode === 'edit' && <p className="text-xs text-gray-400 mt-1.5 ml-1">코드 타입은 수정할 수 없습니다.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            코드 타입명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.code_type_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, code_type_name: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none hover:border-indigo-300"
                            placeholder="예: 역할, 직급"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            비고
                        </label>
                        <textarea
                            value={formData.rmk}
                            onChange={(e) => setFormData(prev => ({ ...prev, rmk: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] outline-none hover:border-indigo-300 resize-none"
                            placeholder="설명을 입력하세요"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isSubmitting ? '저장 중...' : '저장하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
