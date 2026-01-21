import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CodeMaster } from '../types';
import { Button, Input, Textarea } from '@/core/ui';

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
                    <Input
                        label="코드 타입"
                        required
                        disabled={mode === 'edit'}
                        value={formData.code_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, code_type: e.target.value.toUpperCase() }))}
                        placeholder="예: ROLE, POSITION"
                        helperText={mode === 'edit' ? "코드 타입은 수정할 수 없습니다." : undefined}
                    />

                    <Input
                        label="코드 타입명"
                        required
                        value={formData.code_type_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, code_type_name: e.target.value }))}
                        placeholder="예: 역할, 직급"
                    />

                    <Textarea
                        label="비고"
                        value={formData.rmk}
                        onChange={(e) => setFormData(prev => ({ ...prev, rmk: e.target.value }))}
                        placeholder="설명을 입력하세요"
                        rows={4}
                    />

                    <div className="flex justify-end gap-3 mt-8 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            저장하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
