/**
 * Coaching AI 도메인 Store
 *
 * 1on1 코칭 AI 시스템 관련 상태 관리 (Zustand)
 *
 * ⚠️ 주의: MediaRecorder, audioChunks(Blob[])는 이 Store에 넣지 말 것
 * → useRef로 관리해야 합니다 (브라우저 API 객체, 대용량 바이너리는 직렬화 불가)
 * const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 * const audioChunksRef = useRef<Blob[]>([]);
 */

import { create } from 'zustand';
import type {
  ActiveMeeting,
  ActiveAgendaItem,
  ActiveActionItem,
  ActiveTimelineItem,
  DashboardResponse,
  GetDashboardParams,
  MeetingHistoryResponse,
  MeetingReportResponse,
  RrTreeNode,
} from './types';
import * as coachingApi from './api';

// =============================================
// State 타입 정의
// =============================================

interface CoachingMeetingStore {
  // -------- 대시보드 --------
  dashboard: DashboardResponse | null;

  // -------- 현재 진행 중인 미팅 --------
  activeMeeting: ActiveMeeting | null;

  /** 녹음 경과 시간 (초) */
  recordingSeconds: number;

  /** 녹음 중 여부 */
  isRecording: boolean;

  /** 현재 활성 타임라인 카드 ID */
  activeTimelineId: string | null;

  /**
   * 현재 활성 R&R ID (같은 카드 연속 클릭 방지용)
   * activeTimelineId 비교 불가 → rr_id 기준으로 중복 클릭 판단
   */
  activeRrId: string | null;

  /** 개인 메모 임시 상태 (IndexedDB 저장 대상) */
  draftMemo: string;

  // -------- R&R 트리 --------
  rrTree: RrTreeNode[];

  // -------- 히스토리 + 리포트 --------
  meetingHistory: MeetingHistoryResponse | null;
  meetingReport: MeetingReportResponse | null;

  // -------- 로딩 상태 --------
  isLoading: {
    dashboard: boolean;
    activeMeeting: boolean;
    rrTree: boolean;
    meetingHistory: boolean;
    meetingReport: boolean;
    startMeeting: boolean;
    completeMeeting: boolean;
    uploadAudio: boolean;
  };

  /** GCS 업로드 진행률 (0~100) */
  uploadProgress: number;

  // -------- 에러 상태 --------
  error: {
    dashboard: string | null;
    activeMeeting: string | null;
    rrTree: string | null;
    meetingHistory: string | null;
    meetingReport: string | null;
    startMeeting: string | null;
    completeMeeting: string | null;
    uploadAudio: string | null;
  };

  // =============================================
  // 액션
  // =============================================

  // 대시보드
  fetchDashboard: (params?: GetDashboardParams) => Promise<void>;

  // 미팅 실행 상태
  setActiveMeeting: (meeting: ActiveMeeting) => void;
  clearActiveMeeting: () => void;
  setRecordingSeconds: (seconds: number) => void;
  incrementRecordingSeconds: () => void;
  setIsRecording: (isRecording: boolean) => void;
  setActiveTimelineId: (timelineId: string | null) => void;
  setActiveRrId: (rrId: string | null) => void;
  setDraftMemo: (memo: string) => void;

  // 미팅 실행 중 상태 업데이트
  updateAgendaComplete: (agendaId: string, isCompleted: boolean) => void;
  updateActionItemComplete: (actionItemId: string, isCompleted: boolean) => void;
  addTimeline: (timeline: ActiveTimelineItem) => void;
  updateTimeline: (timelineId: string, updates: Partial<ActiveTimelineItem>) => void;
  addAgendaItem: (agenda: ActiveAgendaItem) => void;

  // R&R 트리
  fetchRrTree: (memberEmpNo: string) => Promise<void>;

  // 히스토리 + 리포트
  fetchMeetingHistory: (memberEmpNo: string) => Promise<void>;
  fetchMeetingReport: (meetingId: string) => Promise<void>;

  // GCS 업로드 진행률
  setUploadProgress: (progress: number) => void;

  // 에러 클리어
  clearError: (key: keyof CoachingMeetingStore['error']) => void;
}

// =============================================
// Store 생성
// =============================================

export const useCoachingStore = create<CoachingMeetingStore>((set, _get) => ({
  // 초기 상태
  dashboard: null,

  activeMeeting: null,
  recordingSeconds: 0,
  isRecording: false,
  activeTimelineId: null,
  activeRrId: null,
  draftMemo: '',

  rrTree: [],

  meetingHistory: null,
  meetingReport: null,

  isLoading: {
    dashboard: false,
    activeMeeting: false,
    rrTree: false,
    meetingHistory: false,
    meetingReport: false,
    startMeeting: false,
    completeMeeting: false,
    uploadAudio: false,
  },

  uploadProgress: 0,

  error: {
    dashboard: null,
    activeMeeting: null,
    rrTree: null,
    meetingHistory: null,
    meetingReport: null,
    startMeeting: null,
    completeMeeting: null,
    uploadAudio: null,
  },

  // =============================================
  // 대시보드 액션
  // =============================================

  /**
   * 대시보드 데이터 조회 (팀원 목록 + 면담 현황 통계)
   *
   * @param params - 필터 파라미터 (dept_code, search_name)
   */
  fetchDashboard: async (params?: GetDashboardParams) => {
    set((state) => ({
      isLoading: { ...state.isLoading, dashboard: true },
      error: { ...state.error, dashboard: null },
    }));

    try {
      const data = await coachingApi.getDashboard(params);
      set((state) => ({
        dashboard: data,
        isLoading: { ...state.isLoading, dashboard: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '대시보드 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, dashboard: false },
        error: { ...state.error, dashboard: errorMessage },
      }));
      throw err;
    }
  },

  // =============================================
  // 미팅 실행 상태 액션
  // =============================================

  setActiveMeeting: (meeting: ActiveMeeting) => {
    set({ activeMeeting: meeting, draftMemo: meeting.private_memo ?? '' });
  },

  clearActiveMeeting: () => {
    set({
      activeMeeting: null,
      recordingSeconds: 0,
      isRecording: false,
      activeTimelineId: null,
      activeRrId: null,
      draftMemo: '',
    });
  },

  setRecordingSeconds: (seconds: number) => {
    set({ recordingSeconds: seconds });
  },

  incrementRecordingSeconds: () => {
    set((state) => ({ recordingSeconds: state.recordingSeconds + 1 }));
  },

  setIsRecording: (isRecording: boolean) => {
    set({ isRecording });
  },

  setActiveTimelineId: (timelineId: string | null) => {
    set({ activeTimelineId: timelineId });
  },

  setActiveRrId: (rrId: string | null) => {
    set({ activeRrId: rrId });
  },

  setDraftMemo: (memo: string) => {
    set({ draftMemo: memo });
  },

  // =============================================
  // 미팅 실행 중 상태 업데이트 액션
  // =============================================

  /**
   * 아젠다 완료 상태 업데이트
   *
   * @param agendaId    - 아젠다 ID
   * @param isCompleted - 완료 여부
   */
  updateAgendaComplete: (agendaId: string, isCompleted: boolean) => {
    set((state) => {
      if (!state.activeMeeting) return {};
      return {
        activeMeeting: {
          ...state.activeMeeting,
          agendas: state.activeMeeting.agendas.map((agenda) =>
            agenda.agenda_id === agendaId ? { ...agenda, is_completed: isCompleted } : agenda
          ),
        },
      };
    });
  },

  /**
   * Action Item 완료 상태 업데이트 (현재 미팅 row만, 원본 미팅 불변)
   *
   * @param actionItemId - Action Item ID
   * @param isCompleted  - 완료 여부
   */
  updateActionItemComplete: (actionItemId: string, isCompleted: boolean) => {
    set((state) => {
      if (!state.activeMeeting) return {};
      return {
        activeMeeting: {
          ...state.activeMeeting,
          action_items: state.activeMeeting.action_items.map((item) =>
            item.action_item_id === actionItemId ? { ...item, is_completed: isCompleted } : item
          ),
        },
      };
    });
  },

  /**
   * 타임라인 카드 추가
   *
   * @param timeline - 추가할 타임라인 카드
   */
  addTimeline: (timeline: ActiveTimelineItem) => {
    set((state) => {
      if (!state.activeMeeting) return {};
      return {
        activeMeeting: {
          ...state.activeMeeting,
          timelines: [...state.activeMeeting.timelines, timeline],
        },
      };
    });
  },

  /**
   * 타임라인 카드 업데이트 (end_time 마감 등)
   *
   * @param timelineId - 타임라인 카드 ID
   * @param updates    - 업데이트할 필드
   */
  updateTimeline: (timelineId: string, updates: Partial<ActiveTimelineItem>) => {
    set((state) => {
      if (!state.activeMeeting) return {};
      return {
        activeMeeting: {
          ...state.activeMeeting,
          timelines: state.activeMeeting.timelines.map((tl) =>
            tl.timeline_id === timelineId ? { ...tl, ...updates } : tl
          ),
        },
      };
    });
  },

  /**
   * 리더 즉석 아젠다 추가
   *
   * @param agenda - 추가할 아젠다 항목
   */
  addAgendaItem: (agenda: ActiveAgendaItem) => {
    set((state) => {
      if (!state.activeMeeting) return {};
      return {
        activeMeeting: {
          ...state.activeMeeting,
          agendas: [...state.activeMeeting.agendas, agenda],
        },
      };
    });
  },

  // =============================================
  // R&R 트리 액션
  // =============================================

  /**
   * 팀원 R&R 계층 구조 조회
   *
   * @param memberEmpNo - 팀원 사번
   */
  fetchRrTree: async (memberEmpNo: string) => {
    set((state) => ({
      isLoading: { ...state.isLoading, rrTree: true },
      error: { ...state.error, rrTree: null },
    }));

    try {
      const response = await coachingApi.getMemberRrTree(memberEmpNo);
      set((state) => ({
        rrTree: response.items,
        isLoading: { ...state.isLoading, rrTree: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'R&R 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, rrTree: false },
        error: { ...state.error, rrTree: errorMessage },
      }));
      throw err;
    }
  },

  // =============================================
  // 히스토리 + 리포트 액션
  // =============================================

  /**
   * 팀원별 미팅 히스토리 목록 조회
   *
   * @param memberEmpNo - 팀원 사번
   */
  fetchMeetingHistory: async (memberEmpNo: string) => {
    set((state) => ({
      isLoading: { ...state.isLoading, meetingHistory: true },
      error: { ...state.error, meetingHistory: null },
    }));

    try {
      const response = await coachingApi.getMeetingHistory(memberEmpNo);
      set((state) => ({
        meetingHistory: response,
        isLoading: { ...state.isLoading, meetingHistory: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '미팅 히스토리 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, meetingHistory: false },
        error: { ...state.error, meetingHistory: errorMessage },
      }));
      throw err;
    }
  },

  /**
   * 미팅 상세 리포트 조회
   *
   * @param meetingId - 미팅 ID
   */
  fetchMeetingReport: async (meetingId: string) => {
    set((state) => ({
      isLoading: { ...state.isLoading, meetingReport: true },
      error: { ...state.error, meetingReport: null },
    }));

    try {
      const report = await coachingApi.getMeetingReport(meetingId);
      set((state) => ({
        meetingReport: report,
        isLoading: { ...state.isLoading, meetingReport: false },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '미팅 리포트 조회 실패';
      set((state) => ({
        isLoading: { ...state.isLoading, meetingReport: false },
        error: { ...state.error, meetingReport: errorMessage },
      }));
      throw err;
    }
  },

  // =============================================
  // 기타 액션
  // =============================================

  setUploadProgress: (progress: number) => {
    set({ uploadProgress: progress });
  },

  clearError: (key: keyof CoachingMeetingStore['error']) => {
    set((state) => ({
      error: { ...state.error, [key]: null },
    }));
  },
}));
