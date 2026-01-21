import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/core/ui';
import type { CodeDetail, CodeDetailCreateRequest } from '../types';

interface CodeDetailDialogProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    codeType: string;
    initialData?: CodeDetail | null;
    onClose: () => void;
    onSave: (data: CodeDetailCreateRequest) => Promise<void>;
}

export const CodeDetailDialog: React.FC<CodeDetailDialogProps> = ({
    isOpen,
    mode,
    codeType,
    initialData,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = React.useState<CodeDetailCreateRequest>({
        code_type: codeType,
        code: '',
        code_name: '',
        use_yn: 'Y',
        sort_seq: 1,
        rmk: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    code_type: initialData.code_type,
                    code: initialData.code,
                    code_name: initialData.code_name,
                    use_yn: initialData.use_yn,
                    sort_seq: initialData.sort_seq || 1,
                    rmk: initialData.rmk || '',
                });
            } else {
                setFormData({
                    code_type: codeType,
                    code: '',
                    code_name: '',
                    use_yn: 'Y',
                    sort_seq: 1,
                    rmk: '',
                });
            }
        }
    }, [isOpen, mode, initialData, codeType]);

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
                        {mode === 'create' ? '상세코드 등록' : '상세코드 수정'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <Input
                        label="코드"
                        required
                        disabled={mode === 'edit'}
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="예: ROLE_HR, CD001"
                        helperText={mode === 'edit' ? "코드는 수정할 수 없습니다." : undefined}
                    />

                    <Input
                        label="코드명"
                        required
                        value={formData.code_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, code_name: e.target.value }))}
                        placeholder="예: 인사담당자, 팀장"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="사용여부"
                            value={formData.use_yn}
                            onChange={(val) => setFormData(prev => ({ ...prev, use_yn: val }))}
                            options={[
                                { label: '사용', value: 'Y' },
                                { label: '미사용', value: 'N' },
                            ]}
                        />
                        <Input
                            label="정렬순서"
                            type="number"
                            required
                            min={1}
                            value={formData.sort_seq}
                            onChange={(e) => setFormData(prev => ({ ...prev, sort_seq: parseInt(e.target.value) || 0 }))}
                        />
                    </div>

                    <Textarea
                        label="비고"
                        value={formData.rmk}
                        onChange={(e) => setFormData(prev => ({ ...prev, rmk: e.target.value }))}
                        placeholder="설명을 입력하세요"
                        rows={3}
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
