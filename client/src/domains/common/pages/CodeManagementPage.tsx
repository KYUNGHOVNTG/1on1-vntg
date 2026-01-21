import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CodeMasterList } from '../components/CodeMasterList';
import { CodeDetailList } from '../components/CodeDetailList';
import { fetchCodeMasters, fetchCodeDetails } from '../api';
import type { CodeMaster, CodeDetail } from '../types';

export const CodeManagementPage: React.FC = () => {
    const [masters, setMasters] = useState<CodeMaster[]>([]);
    const [details, setDetails] = useState<CodeDetail[]>([]);
    const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 마스터 목록 조회
    useEffect(() => {
        const loadMasters = async () => {
            try {
                setLoadingMasters(true);
                const data = await fetchCodeMasters();
                setMasters(data);

                // 첫 번째 항목 자동 선택
                if (data.length > 0) {
                    setSelectedMaster(data[0].code_type);
                }
            } catch (err) {
                console.error('Failed to fetch code masters:', err);
                setError('마스터 코드 목록을 불러오는데 실패했습니다.');
            } finally {
                setLoadingMasters(false);
            }
        };

        loadMasters();
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
                // 상세 조회 실패는 전체 에러로 처리하지 않음 (해당 섹션만 비움)
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
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    공통코드 관리
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
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
                        />
                    )}
                </div>

                {/* Right Panel: Detail List (8 cols) */}
                <div className="md:col-span-7 lg:col-span-8 h-full min-h-[400px]">
                    {selectedMaster ? (
                        <CodeDetailList
                            details={details}
                            loading={loadingDetails}
                        />
                    ) : (
                        <div className="h-full bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col justify-center items-center text-gray-400 p-8">
                            <AlertCircle size={48} className="mb-4 opacity-20" />
                            <p>좌측에서 마스터 코드를 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Animation Styles */}
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
