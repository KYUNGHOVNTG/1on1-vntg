/**
 * Menu Dialog
 * 
 * 메뉴 생성 및 수정을 위한 다이얼로그 컴포넌트
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import { Button } from '@/core/ui';
import { InlineMessage } from '@/core/ui/InlineMessage';
import type { MenuHierarchy, MenuCreateRequest, MenuUpdateRequest } from '../types';

interface MenuDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MenuCreateRequest | MenuUpdateRequest) => Promise<void>;
    initialData?: MenuHierarchy | null;
    parentMenu?: MenuHierarchy | null;
    mode: 'create' | 'edit';
}

interface MenuFormValues {
    menu_code: string;
    menu_name: string;
    menu_url: string;
    sort_seq: number;
    use_yn: 'Y' | 'N';
    menu_type: 'COMMON' | 'ADMIN';
    rmk: string;
}

export const MenuDialog: React.FC<MenuDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    parentMenu,
    mode
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<MenuFormValues>({
        defaultValues: {
            menu_code: '',
            menu_name: '',
            menu_url: '',
            sort_seq: 0,
            use_yn: 'Y',
            menu_type: 'COMMON',
            rmk: ''
        }
    });

    // 초기값 설정
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                reset({
                    menu_code: initialData.menu_code,
                    menu_name: initialData.menu_name,
                    menu_url: initialData.menu_url || '',
                    sort_seq: initialData.sort_seq || 0,
                    use_yn: (initialData.use_yn as 'Y' | 'N') || 'Y',
                    menu_type: initialData.menu_type,
                    rmk: initialData.rmk || ''
                });
            } else {
                reset({
                    menu_code: '',
                    menu_name: '',
                    menu_url: '',
                    sort_seq: 0,
                    use_yn: 'Y',
                    menu_type: 'COMMON',
                    rmk: ''
                });
            }
        }
    }, [isOpen, mode, initialData, reset]);

    const handleFormSubmit = async (data: MenuFormValues) => {
        try {
            const submitData: any = {
                ...data,
                // 빈 문자열은 null로 처리
                menu_url: data.menu_url || null,
                rmk: data.rmk || null,
            };

            // 생성 시 추가 필드
            if (mode === 'create') {
                submitData.menu_level = parentMenu ? 2 : 1;
                if (parentMenu) {
                    submitData.up_menu_code = parentMenu.menu_code;
                }
            }
            // 수정 시 불필요한 필드 제거 (menu_code는 URL 파라미터로 전달되므로 제외 가능하지만, 
            // types.ts 정의에 따라 request body에는 포함하지 않음)
            else {
                delete submitData.menu_code; // 수정 시 코드는 변경 불가

                // 1레벨 메뉴 수정 시 상위 코드는 null
                if (initialData?.menu_level === 1) {
                    submitData.up_menu_code = null;
                } else {
                    submitData.up_menu_code = initialData?.up_menu_code;
                }
                submitData.menu_level = initialData?.menu_level;
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Submit Error:', error);
            // 에러 처리는 부모 컴포넌트나 API 레이어에서 Toast로 처리됨
        }
    };

    if (!isOpen) return null;

    const dialogTitle = mode === 'create'
        ? (parentMenu ? '하위 메뉴 추가' : '상위 메뉴 추가')
        : '메뉴 수정';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">{dialogTitle}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">

                    {/* 상위 메뉴 정보 (하위 메뉴 생성 시) */}
                    {mode === 'create' && parentMenu && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 mb-4">
                            <span className="text-xs font-semibold text-primary block mb-1">상위 메뉴</span>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                                {parentMenu.menu_name}
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="font-mono opacity-70">{parentMenu.menu_code}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* 메뉴 코드 (생성 시에만 입력, 수정 시 읽기 전용) */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                메뉴 코드 <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('menu_code', {
                                    required: '메뉴 코드는 필수입니다',
                                    pattern: {
                                        value: /^[A-Z0-9_]+$/,
                                        message: '영문 대문자, 숫자, 언더바(_)만 가능합니다'
                                    }
                                })}
                                disabled={mode === 'edit'}
                                className={`w-full h-10 px-3 border rounded-xl text-sm outline-none transition-all ${errors.menu_code
                                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                    : 'border-gray-200 focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC]'
                                    } ${mode === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="예: M001"
                            />
                            {errors.menu_code && (
                                <InlineMessage variant="error" message={errors.menu_code.message || '오류가 발생했습니다'} />
                            )}
                        </div>

                        {/* 메뉴명 */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                메뉴명 <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('menu_name', { required: '메뉴명은 필수입니다' })}
                                className={`w-full h-10 px-3 border rounded-xl text-sm outline-none transition-all ${errors.menu_name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                    : 'border-gray-200 focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC]'
                                    }`}
                                placeholder="메뉴 이름"
                            />
                            {errors.menu_name && (
                                <InlineMessage variant="error" message={errors.menu_name.message || '오류가 발생했습니다'} />
                            )}
                        </div>

                        {/* URL */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                메뉴 URL
                            </label>
                            <input
                                {...register('menu_url')}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
                                placeholder="/path/to/page"
                            />
                            <p className="text-xs text-gray-500 mt-1 ml-1">프론트엔드 라우트 경로를 입력하세요.</p>
                        </div>

                        {/* 정렬 순서 */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                정렬 순서
                            </label>
                            <input
                                type="number"
                                {...register('sort_seq', { valueAsNumber: true })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all"
                            />
                        </div>

                        {/* 메뉴 타입 */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                메뉴 타입
                            </label>
                            <select
                                {...register('menu_type')}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all bg-white"
                            >
                                <option value="COMMON">일반 (Common)</option>
                                <option value="ADMIN">관리자 (Admin)</option>
                            </select>
                        </div>

                        {/* 사용 여부 */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">사용 여부</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="Y"
                                        {...register('use_yn')}
                                        className="w-4 h-4 text-[#4950DC] border-gray-300 focus:ring-[#4950DC]"
                                    />
                                    <span className="text-sm text-gray-700">사용함</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="N"
                                        {...register('use_yn')}
                                        className="w-4 h-4 text-[#4950DC] border-gray-300 focus:ring-[#4950DC]"
                                    />
                                    <span className="text-sm text-gray-700">사용 안 함</span>
                                </label>
                            </div>
                        </div>

                        {/* 비고 */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비고
                            </label>
                            <textarea
                                {...register('rmk')}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#4950DC] focus:ring-1 focus:ring-[#4950DC] outline-none transition-all resize-none"
                                placeholder="메모할 내용이 있다면 입력하세요."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-2">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            취소
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? '저장 중...' : (mode === 'create' ? '추가' : '저장')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
