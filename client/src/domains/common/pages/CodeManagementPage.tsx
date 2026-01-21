import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Database, Sparkles } from 'lucide-react';
import { Breadcrumb, ConfirmModal } from '@/core/ui';
import { CodeMasterList } from '../components/CodeMasterList';
import { CodeDetailList } from '../components/CodeDetailList';
import { CodeMasterDialog } from '../components/CodeMasterDialog';
import { CodeDetailDialog } from '../components/CodeDetailDialog';
import {
    fetchCodeMasters,
    fetchCodeDetails,
    createCodeMaster,
    updateCodeMaster,
    deleteCodeMaster,
    createCodeDetail,
    updateCodeDetail,
    deleteCodeDetail
} from '../api';
import type { CodeMaster, CodeDetail, CodeDetailCreateRequest } from '../types';

export const CodeManagementPage: React.FC = () => {
    const [masters, setMasters] = useState<CodeMaster[]>([]);
    const [details, setDetails] = useState<CodeDetail[]>([]);
    const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingMaster, setEditingMaster] = useState<CodeMaster | null>(null);

    // Delete Confirmation State (Master)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [masterToDelete, setMasterToDelete] = useState<CodeMaster | null>(null);

    // Detail Dialog State
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [detailDialogMode, setDetailDialogMode] = useState<'create' | 'edit'>('create');
    const [editingDetail, setEditingDetail] = useState<CodeDetail | null>(null);

    // Detail Delete Confirmation State
    const [deleteDetailConfirmOpen, setDeleteDetailConfirmOpen] = useState(false);
    const [detailToDelete, setDetailToDelete] = useState<CodeDetail | null>(null);

    // 마스터 목록 조회
    const loadMasters = async () => {
        try {
            setLoadingMasters(true);
            const data = await fetchCodeMasters();
            setMasters(data);
            return data;
        } catch (err) {
            console.error('Failed to fetch code masters:', err);
            setError('마스터 코드 목록을 불러오는데 실패했습니다.');
            return [];
        } finally {
            setLoadingMasters(false);
        }
    };

    useEffect(() => {
        loadMasters().then((data) => {
            // 첫 번째 항목 자동 선택 (초기 로드 시에만)
            if (data.length > 0 && !selectedMaster) {
                setSelectedMaster(data[0].code_type);
            }
        });
    }, []);

    // 상세 목록 조회 (마스터 변경 시)
    useEffect(() => {
        if (!selectedMaster) {
            setDetails([]);
            return;
        }

        const loadDetails = async () => {
            try {
                setLoadingDetails(true);
                const data = await fetchCodeDetails(selectedMaster);
                setDetails(data);
            } catch (err) {
                console.error('Failed to fetch code details:', err);
                setDetails([]);
            } finally {
                setLoadingDetails(false);
            }
        };

        loadDetails();
    }, [selectedMaster]);

    const handleMasterSelect = (codeType: string) => {
        setSelectedMaster(codeType);
    };

    // CRUD Handlers
    const handleAddMaster = () => {
        setDialogMode('create');
        setEditingMaster(null);
        setIsDialogOpen(true);
    };

    const handleEditMaster = (master: CodeMaster) => {
        setDialogMode('edit');
        setEditingMaster(master);
        setIsDialogOpen(true);
    };

    const handleDeleteMaster = (master: CodeMaster) => {
        setMasterToDelete(master);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!masterToDelete) return;

        try {
            await deleteCodeMaster(masterToDelete.code_type);
            toast.success('마스터 코드가 삭제되었습니다.');

            const newMasters = await loadMasters();
            if (selectedMaster === masterToDelete.code_type) {
                setSelectedMaster(newMasters.length > 0 ? newMasters[0].code_type : null);
            }
        } catch (err) {
            console.error('Failed to delete master:', err);
            toast.error('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleteConfirmOpen(false);
            setMasterToDelete(null);
        }
    };

    const handleSaveMaster = async (data: { code_type: string; code_type_name: string; rmk?: string }) => {
        try {
            if (dialogMode === 'create') {
                await createCodeMaster(data);
                toast.success('마스터 코드가 등록되었습니다.');
            } else {
                await updateCodeMaster(data.code_type, {
                    code_type_name: data.code_type_name,
                    rmk: data.rmk
                });
                toast.success('마스터 코드가 수정되었습니다.');
            }
            await loadMasters();
        } catch (err) {
            console.error('Failed to save master:', err);
            toast.error('저장 중 오류가 발생했습니다.');
            throw err; // Re-throw to keep dialog open or handle in dialog
        }
    };

    // Detail CRUD Handlers
    const handleAddDetail = () => {
        setDetailDialogMode('create');
        setEditingDetail(null);
        setIsDetailDialogOpen(true);
    };

    const handleEditDetail = (detail: CodeDetail) => {
        setDetailDialogMode('edit');
        setEditingDetail(detail);
        setIsDetailDialogOpen(true);
    };

    const handleDeleteDetail = (detail: CodeDetail) => {
        setDetailToDelete(detail);
        setDeleteDetailConfirmOpen(true);
    };

    const handleConfirmDeleteDetail = async () => {
        if (!detailToDelete || !selectedMaster) return;

        try {
            await deleteCodeDetail(selectedMaster, detailToDelete.code);
            toast.success('상세 코드가 삭제되었습니다.');

            // Reload details
            const data = await fetchCodeDetails(selectedMaster);
            setDetails(data);
        } catch (err) {
            console.error('Failed to delete detail:', err);
            toast.error('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleteDetailConfirmOpen(false);
            setDetailToDelete(null);
        }
    };

    const handleSaveDetail = async (data: CodeDetailCreateRequest) => {
        if (!selectedMaster) return;

        try {
            if (detailDialogMode === 'create') {
                await createCodeDetail(selectedMaster, data);
                toast.success('상세 코드가 등록되었습니다.');
            } else {
                await updateCodeDetail(selectedMaster, data.code, {
                    code_name: data.code_name,
                    use_yn: data.use_yn,
                    sort_seq: data.sort_seq,
                    rmk: data.rmk
                });
                toast.success('상세 코드가 수정되었습니다.');
            }

            // Reload details
            const newData = await fetchCodeDetails(selectedMaster);
            setDetails(newData);
        } catch (err) {
            console.error('Failed to save detail:', err);
            toast.error('저장 중 오류가 발생했습니다.');
            throw err;
        }
    };

    const handleSortDetail = async (detail: CodeDetail, direction: 'up' | 'down') => {
        if (!selectedMaster) return;

        const currentIndex = details.findIndex(d => d.code === detail.code);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= details.length) return;

        const targetDetail = details[targetIndex];

        // Swap sort_seq
        // Optimistic update
        const newDetails = [...details];
        const tempSeq = newDetails[currentIndex].sort_seq;
        newDetails[currentIndex].sort_seq = newDetails[targetIndex].sort_seq;
        newDetails[targetIndex].sort_seq = tempSeq;

        // Swap positions in array to reflect visual change immediately (though sort_seq helps)
        newDetails[currentIndex] = { ...newDetails[currentIndex] }; // clone
        newDetails[targetIndex] = { ...targetDetail }; // clone

        // Sort by seq again to be sure? No, just swap in array is enough for now if we rely on array order.
        // But backend relies on sort_seq.
        // Let's swap the array items
        [newDetails[currentIndex], newDetails[targetIndex]] = [newDetails[targetIndex], newDetails[currentIndex]];

        setDetails(newDetails);

        try {
            // Update both items
            await Promise.all([
                updateCodeDetail(selectedMaster, detail.code, { sort_seq: targetDetail.sort_seq }),
                updateCodeDetail(selectedMaster, targetDetail.code, { sort_seq: detail.sort_seq })
            ]);

            // Ideally reload to be safe, but optimistic is better for UI.
            // Maybe silently reload
            fetchCodeDetails(selectedMaster).then(setDetails);

        } catch (err) {
            console.error('Failed to sort details:', err);
            toast.error('정렬 순서 변경에 실패했습니다.');
            // Revert on error
            const originData = await fetchCodeDetails(selectedMaster);
            setDetails(originData);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">오류 발생</h3>
                <p className="text-gray-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in-up">
            {/* 브레드크럼 */}
            <Breadcrumb
                items={[
                    { label: '시스템 관리', href: '/system' },
                    { label: '코드 관리' }
                ]}
                className="mb-4"
            />

            {/* 페이지 타이틀 */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    공통코드 관리
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                    시스템에서 사용되는 공통코드를 조회하고 관리할 수 있습니다.
                </p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
                {/* Left Panel: Master List (4 cols) */}
                <div className="md:col-span-5 lg:col-span-4 h-full min-h-[400px]">
                    {loadingMasters ? (
                        <div className="h-full bg-white rounded-2xl border border-gray-200 p-8 flex justify-center items-center">
                            <div className="text-gray-500 animate-pulse">로딩 중...</div>
                        </div>
                    ) : (
                        <CodeMasterList
                            masters={masters}
                            selectedCodeType={selectedMaster}
                            onSelect={handleMasterSelect}
                            onAdd={handleAddMaster}
                            onEdit={handleEditMaster}
                            onDelete={handleDeleteMaster}
                        />
                    )}
                </div>

                {/* Right Panel: Detail List (8 cols) */}
                <div className="md:col-span-7 lg:col-span-8 h-full min-h-[400px]">
                    {selectedMaster ? (
                        <CodeDetailList
                            details={details}
                            loading={loadingDetails}
                            onAdd={handleAddDetail}
                            onEdit={handleEditDetail}
                            onDelete={handleDeleteDetail}
                            onSort={handleSortDetail}
                        />
                    ) : (
                        <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center p-12">
                            <div className="relative">
                                <Database size={64} className="text-gray-200 mb-4" />
                                <Sparkles size={24} className="text-indigo-400 absolute -top-2 -right-2 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
                                코드 선택 대기중
                            </h3>
                            <p className="text-sm text-gray-400 text-center max-w-xs">
                                좌측 목록에서 마스터 코드를 선택하면<br />
                                상세 코드 정보가 표시됩니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <CodeMasterDialog
                isOpen={isDialogOpen}
                mode={dialogMode}
                initialData={editingMaster}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveMaster}
            />

            {/* Detail Dialog */}
            {selectedMaster && (
                <CodeDetailDialog
                    isOpen={isDetailDialogOpen}
                    mode={detailDialogMode}
                    codeType={selectedMaster}
                    initialData={editingDetail}
                    onClose={() => setIsDetailDialogOpen(false)}
                    onSave={handleSaveDetail}
                />
            )}

            {/* Delete Confirmation Modal (Master) */}
            <ConfirmModal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setMasterToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="마스터 코드 삭제"
                message={`'${masterToDelete?.code_type_name}' (${masterToDelete?.code_type}) 코드를 정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.`}
                confirmText="삭제하기"
                isDangerous
            />

            {/* Delete Confirmation Modal (Detail) */}
            <ConfirmModal
                isOpen={deleteDetailConfirmOpen}
                onClose={() => {
                    setDeleteDetailConfirmOpen(false);
                    setDetailToDelete(null);
                }}
                onConfirm={handleConfirmDeleteDetail}
                title="상세 코드 삭제"
                message={`'${detailToDelete?.code_name}' (${detailToDelete?.code}) 코드를 정말 삭제하시겠습니까?`}
                confirmText="삭제하기"
                isDangerous
            />



            <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>


        </div>
    );
};
