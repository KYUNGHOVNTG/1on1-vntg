/**
 * Menu Management Page
 *
 * 메뉴 관리 페이지
 * - 좌측: 상위 메뉴 목록
 * - 우측: 선택된 메뉴의 상세 정보 및 하위 메뉴 목록
 */

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronRight, Menu as MenuIcon } from 'lucide-react';

import { Button, Card } from '@/core/ui';
import { EmptyState } from '@/core/ui/EmptyState';
import { InlineMessage } from '@/core/ui/InlineMessage';
import { toast } from '@/core/ui/Toast';
import { LoadingManager } from '@/core/loading';
import { ConfirmModal } from '@/core/ui/Modal';

import { getMenuHierarchy, createMenu, updateMenu, deleteMenu } from '../api';
import type { MenuHierarchy, MenuCreateRequest, MenuUpdateRequest } from '../types';
import { MenuDialog } from '../components/MenuDialog';

export const MenuManagementPage: React.FC = () => {
    // State
    const [menus, setMenus] = useState<MenuHierarchy[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<MenuHierarchy | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [dialogInitialData, setDialogInitialData] = useState<MenuHierarchy | null>(null);
    const [dialogParentMenu, setDialogParentMenu] = useState<MenuHierarchy | null>(null);

    // Confirm Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ code: string; name: string } | null>(null);

    // Initial Load
    useEffect(() => {
        fetchMenus();
    }, []);

    // API Calls
    const fetchMenus = async () => {
        try {
            setLoading(true);
            setError(null);
            LoadingManager.show('메뉴 목록을 불러오는 중...');
            const data = await getMenuHierarchy();
            setMenus(data);
        } catch (err) {
            setError('메뉴 목록을 불러오는데 실패했습니다.');
            toast.error('메뉴 목록 로딩 실패');
        } finally {
            setLoading(false);
            LoadingManager.hide();
        }
    };

    // Handlers
    const handleMenuSelect = (menu: MenuHierarchy) => {
        setSelectedMenu(menu);
    };

    // Dialog Handlers
    const openCreateDialog = (parent?: MenuHierarchy) => {
        setDialogMode('create');
        setDialogInitialData(null);
        setDialogParentMenu(parent || null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (menu: MenuHierarchy) => {
        setDialogMode('edit');
        setDialogInitialData(menu);
        setDialogParentMenu(null);
        setIsDialogOpen(true);
    };

    const handleDialogSubmit = async (data: MenuCreateRequest | MenuUpdateRequest) => {
        try {
            LoadingManager.show('처리 중...');

            if (dialogMode === 'create') {
                await createMenu(data as MenuCreateRequest);
                toast.success('메뉴가 생성되었습니다.');
            } else {
                if (!dialogInitialData) return;
                await updateMenu(dialogInitialData.menu_code, data as MenuUpdateRequest);
                toast.success('메뉴가 수정되었습니다.');
            }

            await fetchMenus(); // 목록 갱신
            // 선택된 메뉴 업데이트 (1차 메뉴인 경우)
            if (selectedMenu) {
                // 단순화를 위해 선택 해제하지 않고 유지하려 했으나, 
                // 전체 목록이 갱신되므로 selectedMenu가 stale 상태가 될 수 있음.
                // 여기서는 목록 갱신만 수행하고, 사용자가 다시 클릭하게 하거나
                // useEffect 의존성을 통해 처리할 수 있음.
                // 지금은 fetchMenus 후 selectedMenu와 동일한 코드를 찾아 업데이트하는 로직을
                // handleDelete와 비슷하게 넣는 것이 좋지만, state update 비동기 문제로 복잡해질 수 있음.
                // 일단은 목록만 갱신.
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || '작업 처리에 실패했습니다.';
            toast.error(message);
        } finally {
            LoadingManager.hide();
        }
    };

    // Delete Handlers
    const openDeleteModal = (code: string, name: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteTarget({ code, name });
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            LoadingManager.show('삭제 중...');
            await deleteMenu(deleteTarget.code);
            toast.success('메뉴가 삭제되었습니다.');

            // 목록 갱신
            const updatedMenus = await getMenuHierarchy(); // fetchMenus 직접 호출 대신 데이터 받아서 처리
            setMenus(updatedMenus);

            // 삭제된 메뉴 처리
            if (selectedMenu?.menu_code === deleteTarget.code) {
                setSelectedMenu(null);
            } else if (selectedMenu) {
                // 선택된 메뉴가 삭제된 메뉴가 아니라면(즉, 2차 메뉴 삭제 시), 
                // 갱신된 목록에서 현재 선택된 1차 메뉴를 찾아 상태 업데이트
                const updatedSelected = updatedMenus.find(m => m.menu_code === selectedMenu.menu_code);
                if (updatedSelected) {
                    setSelectedMenu(updatedSelected);
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || '삭제에 실패했습니다.';
            toast.error(message);
        } finally {
            LoadingManager.hide();
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">메뉴 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">시스템 메뉴의 계층 구조를 관리합니다.</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => openCreateDialog()}>
                    상위 메뉴 추가
                </Button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                {/* Left: 1st Level Menus */}
                <Card className="col-span-4 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-gray-900">상위 메뉴 목록</h2>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                            Total: {menus.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading && menus.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">로딩 중...</div>
                        ) : error ? (
                            <InlineMessage variant="error" message={error} />
                        ) : menus.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <MenuIcon className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">등록된 메뉴가 없습니다</span>
                            </div>
                        ) : (
                            menus.map((menu) => (
                                <button
                                    key={menu.menu_code}
                                    onClick={() => handleMenuSelect(menu)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all group ${selectedMenu?.menu_code === menu.menu_code
                                        ? 'bg-primary/5 border-primary/20 text-primary shadow-sm ring-1 ring-primary/20'
                                        : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${selectedMenu?.menu_code === menu.menu_code
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                                            }`}>
                                            {menu.sort_seq}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{menu.menu_name}</div>
                                            <div className="text-xs opacity-60 font-mono mt-0.5">{menu.menu_code}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {menu.use_yn === 'N' && (
                                            <span className="px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 font-medium border border-red-100">
                                                미사용
                                            </span>
                                        )}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedMenu?.menu_code === menu.menu_code ? 'text-primary/60' : 'text-gray-300'
                                            }`} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Right: Detail & 2nd Level Menus */}
                <div className="col-span-8 flex flex-col h-full space-y-6">
                    {selectedMenu ? (
                        <>
                            {/* 1. Selected Menu Detail */}
                            <Card className="p-0 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900 flex items-center">
                                        <span className="w-1.5 h-4 bg-primary rounded-full mr-2"></span>
                                        기본 정보
                                    </h3>
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm" onClick={() => openEditDialog(selectedMenu)}>수정</Button>
                                        <Button variant="secondary" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={() => openDeleteModal(selectedMenu.menu_code, selectedMenu.menu_name)}>삭제</Button>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">메뉴명</label>
                                        <div className="text-sm font-medium text-gray-900">{selectedMenu.menu_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">메뉴 코드</label>
                                        <div className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded w-fit">{selectedMenu.menu_code}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">URL</label>
                                        <div className="text-sm text-gray-700 font-mono">{selectedMenu.menu_url || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${selectedMenu.use_yn === 'Y' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm text-gray-700">{selectedMenu.use_yn === 'Y' ? '사용 중' : '미사용'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">비고</label>
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                                            {selectedMenu.rmk || '내용 없음'}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 2. Sub Menus (2nd Level) */}
                            <Card className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-semibold text-gray-900">하위 메뉴 목록</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-sm font-medium">
                                            {selectedMenu.children.length}
                                        </span>
                                    </div>
                                    <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreateDialog(selectedMenu)}>
                                        하위 메뉴 추가
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-sm text-gray-500 bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 font-medium w-16 text-center">순서</th>
                                                <th className="px-4 py-3 font-medium">메뉴명</th>
                                                <th className="px-4 py-3 font-medium">코드</th>
                                                <th className="px-4 py-3 font-medium">URL</th>
                                                <th className="px-4 py-3 font-medium w-20 text-center">유형</th>
                                                <th className="px-4 py-3 font-medium w-20 text-center">상태</th>
                                                <th className="px-4 py-3 font-medium w-24 text-center">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedMenu.children.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                                        등록된 하위 메뉴가 없습니다.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedMenu.children.map((child) => (
                                                    <tr key={child.menu_code} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-center text-gray-500">{child.sort_seq}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{child.menu_name}</td>
                                                        <td className="px-4 py-3 font-mono text-gray-500 text-xs">{child.menu_code}</td>
                                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{child.menu_url || '-'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${child.menu_type === 'ADMIN'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                }`}>
                                                                {child.menu_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${child.use_yn === 'Y'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {child.use_yn === 'Y' ? '사용' : '미사용'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center space-x-1">
                                                                <button
                                                                    className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                                                    onClick={() => openEditDialog(child)}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                </button>
                                                                <button
                                                                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                                    onClick={() => openDeleteModal(child.menu_code, child.menu_name, undefined)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState
                                icon={MenuIcon}
                                title="메뉴를 선택해주세요"
                                description="왼쪽 목록에서 상위 메뉴를 선택하면 상세 정보와 하위 메뉴를 확인할 수 있습니다."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <MenuDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={handleDialogSubmit}
                initialData={dialogInitialData}
                parentMenu={dialogParentMenu}
                mode={dialogMode}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="메뉴 삭제"
                message={`'${deleteTarget?.name}' 메뉴를 삭제하시겠습니까? 하위 메뉴가 있는 경우 삭제할 수 없습니다.`}
                isDangerous
            />
        </div>
    );
};
