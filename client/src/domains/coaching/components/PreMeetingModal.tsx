/**
 * 사전 준비 모달 컴포넌트 (Task 10)
 *
 * 미팅 시작 전 사전 준비를 위한 모달입니다.
 *
 * 플로우:
 * 1. [미팅 시작] 클릭 → POST /meetings → meeting_id 확보 (StartMeetingButton에서 처리)
 * 2. 모달 오픈 → GET /pre-meeting 호출
 * 3. 데이터 로드 완료 → 사전 준비 내용 표시
 * 4. [녹음과 함께 미팅 시작하기] → PATCH /start → 미팅 실행 화면 이동
 * 5. [취소] → ConfirmModal → DELETE /meetings/{id} → 모달 닫힘
 *
 * 예외처리:
 * - 브라우저 뒤로가기/ESC: useEffect cleanup에서 DELETE 처리
 * - 마이크 권한 거부: 시작 버튼 비활성화 + 안내 메시지
 * - AI 추천 질문 로딩 중: skeleton UI 표시
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/core/ui/Modal/Modal';
import { ConfirmModal } from '@/core/ui/Modal/ConfirmModal';
import { toast } from '@/core/ui/Toast';
import { getPreMeeting, deleteMeeting, startMeeting } from '../api';
import type { PreMeetingResponse, AgendaStartItem } from '../types';
import { MemberInfoHeader } from './MemberInfoHeader';
import { PreviousActionItems } from './PreviousActionItems';
import { OnboardingChecklist } from './OnboardingChecklist';
import { AiSuggestedAgendas } from './AiSuggestedAgendas';
import { LeaderAgendaInput } from './LeaderAgendaInput';
import { MeetingStartButton } from './MeetingStartButton';

interface PreMeetingModalProps {
  meetingId: string;
  memberEmpNo: string;
  onClose: () => void;
}

export function PreMeetingModal({ meetingId, memberEmpNo, onClose }: PreMeetingModalProps) {
  const navigate = useNavigate();

  // -------- 데이터 상태 --------
  const [preMeetingData, setPreMeetingData] = useState<PreMeetingResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // -------- 아젠다 선택 상태 --------
  /** 체크된 AI 추천 질문 (content 기준) */
  const [selectedAiQuestions, setSelectedAiQuestions] = useState<Set<string>>(new Set());
  /** 리더가 직접 추가한 아젠다 목록 */
  const [leaderAgendas, setLeaderAgendas] = useState<string[]>([]);

  // -------- 마이크 권한 --------
  /** null: 아직 확인 안함, true: 허용, false: 거부 */
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  // -------- 미팅 시작 처리 --------
  const [isStarting, setIsStarting] = useState(false);

  // -------- 취소 확인 모달 --------
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // -------- 정리(cleanup) 플래그 --------
  /**
   * 미팅이 정상적으로 시작되면 true로 설정합니다.
   * cleanup 시 이 플래그를 확인하여 불필요한 DELETE를 방지합니다.
   */
  const meetingStartedRef = useRef(false);

  // -------- 사전 준비 데이터 로드 --------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await getPreMeeting(meetingId);
        if (!cancelled) {
          setPreMeetingData(data);
        }
      } catch {
        if (!cancelled) {
          toast.error('사전 준비 데이터를 불러오지 못했습니다');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // -------- 마이크 권한 요청 --------
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 권한 확인 후 스트림 즉시 종료 (미팅 시작 전에는 불필요)
        stream.getTracks().forEach((track) => track.stop());
        setHasMicPermission(true);
      } catch {
        setHasMicPermission(false);
      }
    };

    checkMicPermission();
  }, []);

  // -------- 브라우저 뒤로가기/ESC 시 미팅 삭제 --------
  useEffect(() => {
    return () => {
      // 미팅이 시작되지 않은 상태에서 모달이 닫히면 meeting 레코드 삭제
      if (!meetingStartedRef.current) {
        deleteMeeting(meetingId).catch(() => {
          // 삭제 실패는 무시 (이미 닫힌 상태)
        });
      }
    };
  }, [meetingId]);

  // -------- 핸들러 --------

  /** [취소] 버튼 클릭 → ConfirmModal 표시 */
  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  /** ConfirmModal 확인 → DELETE + 모달 닫기 */
  const handleCancelConfirm = useCallback(async () => {
    meetingStartedRef.current = true; // cleanup에서 중복 DELETE 방지
    try {
      await deleteMeeting(meetingId);
    } catch {
      // 삭제 실패해도 모달은 닫음
    }
    onClose();
  }, [meetingId, onClose]);

  /** AI 추천 질문 체크 토글 */
  const handleToggleAiQuestion = useCallback((question: string) => {
    setSelectedAiQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  }, []);

  /** 리더 아젠다 추가 */
  const handleAddLeaderAgenda = useCallback((content: string) => {
    setLeaderAgendas((prev) => [...prev, content]);
  }, []);

  /** 리더 아젠다 삭제 */
  const handleRemoveLeaderAgenda = useCallback((content: string) => {
    setLeaderAgendas((prev) => prev.filter((item) => item !== content));
  }, []);

  /** [녹음과 함께 미팅 시작하기] 클릭 */
  const handleStartMeeting = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);

    // 아젠다 조합: AI 추천 선택 + 리더 직접 추가
    const agendas: AgendaStartItem[] = [
      ...Array.from(selectedAiQuestions).map((content) => ({
        content,
        source: 'AI_SUGGESTED' as const,
      })),
      ...leaderAgendas.map((content) => ({
        content,
        source: 'LEADER_ADDED' as const,
      })),
    ];

    try {
      await startMeeting(meetingId, { agendas });
      meetingStartedRef.current = true; // cleanup에서 DELETE 방지
      navigate(`/coaching/meetings/${meetingId}/active`);
    } catch {
      toast.error('미팅 시작에 실패했습니다. 다시 시도해주세요.');
      setIsStarting(false);
    }
  }, [isStarting, meetingId, selectedAiQuestions, leaderAgendas, navigate]);

  // -------- 데이터 로딩 중 스켈레톤 --------
  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {/* 팀원 정보 스켈레톤 */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>

      {/* 섹션 스켈레톤 */}
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Modal
        isOpen
        onClose={handleCancelClick}
        title="사전 준비"
        size="lg"
        closeOnBackdropClick={false}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
            >
              취소
            </button>

            <MeetingStartButton
              isLoading={isStarting || isLoadingData}
              hasMicPermission={hasMicPermission}
              onStart={handleStartMeeting}
            />
          </div>
        }
      >
        {isLoadingData ? (
          renderSkeleton()
        ) : preMeetingData ? (
          <div className="space-y-5">
            {/* 팀원 정보 */}
            <MemberInfoHeader
              memberInfo={preMeetingData.member_info}
              totalMeetingCount={preMeetingData.is_first_meeting ? 0 : 1}
              isFirstMeeting={preMeetingData.is_first_meeting}
            />

            {/* 구분선 */}
            <hr className="border-gray-100" />

            {/* 이전 미팅 미완료 Action Items 또는 온보딩 체크리스트 */}
            {preMeetingData.is_first_meeting ? (
              <OnboardingChecklist />
            ) : (
              <PreviousActionItems items={preMeetingData.previous_action_items} />
            )}

            {/* 구분선 */}
            <hr className="border-gray-100" />

            {/* AI 추천 질문 */}
            <AiSuggestedAgendas
              questions={preMeetingData.ai_suggested_agendas}
              selectedQuestions={selectedAiQuestions}
              isLoading={false}
              onToggle={handleToggleAiQuestion}
            />

            {/* 팀원 사전 아젠다 v1 안내 문구 */}
            <div className="px-3 py-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                팀원 사전 아젠다 작성 기능은 추후 제공될 예정입니다.
              </p>
            </div>

            {/* 구분선 */}
            <hr className="border-gray-100" />

            {/* 리더 즉석 아젠다 추가 */}
            <LeaderAgendaInput
              addedItems={leaderAgendas}
              onAdd={handleAddLeaderAgenda}
              onRemove={handleRemoveLeaderAgenda}
            />
          </div>
        ) : (
          /* 데이터 로드 실패 */
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">데이터를 불러오지 못했습니다</p>
            <button
              type="button"
              onClick={() => {
                setIsLoadingData(true);
                getPreMeeting(meetingId)
                  .then(setPreMeetingData)
                  .catch(() => toast.error('다시 시도해주세요'))
                  .finally(() => setIsLoadingData(false));
              }}
              className="mt-3 text-sm text-[#4950DC] hover:underline"
            >
              다시 시도
            </button>
          </div>
        )}
      </Modal>

      {/* 취소 확인 다이얼로그 */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelConfirm}
        title="미팅 준비를 취소하시겠습니까?"
        message="취소하면 현재 미팅 준비 내용이 모두 삭제됩니다."
        confirmText="취소하기"
        cancelText="계속 준비"
        isDangerous
      />
    </>
  );
}
