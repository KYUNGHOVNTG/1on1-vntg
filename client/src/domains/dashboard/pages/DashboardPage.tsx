/**
 * Dashboard Page
 *
 * 메인 대시보드 페이지
 */

import React from 'react';
import { Plus, Users, CheckCircle2, MessageSquare, TrendingUp, ListTodo, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '@/core/ui';

/** Mock 데이터: R&R 테이블 */
const mockRnRData = [
  { name: '이서연', role: 'UX Designer', task: '디자인 시스템 고도화', progress: 85, status: '안정', statusColor: 'success' as const },
  { name: '박지훈', role: 'Frontend Lead', task: '대시보드 리팩토링', progress: 45, status: '지연', statusColor: 'error' as const },
  { name: '최유진', role: 'Product Manager', task: 'Q3 로드맵 기획', progress: 60, status: '진행중', statusColor: 'primary' as const },
  { name: '정민호', role: 'Backend Dev', task: 'API 서버 최적화', progress: 92, status: '완료임박', statusColor: 'success' as const },
];

/** Mock 데이터: 1on1 미팅 */
const mockMeetings = [
  { time: '14:00', name: '김철수', role: 'Backend Team', status: '예정' },
  { time: '16:30', name: '이미영', role: 'Product Design', status: '예정' },
];

export const DashboardPage: React.FC = () => {
  return (
    <div className="animate-fade-in-up">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            안녕하세요, 김민수님! 👋
          </h2>
          <p className="text-gray-500 mt-1">
            오늘 예정된 1on1 미팅이{' '}
            <span className="text-[#5B5FED] font-bold">2건</span> 있습니다.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5B5FED] hover:bg-[#4f53d1] text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-0.5">
          <Plus size={16} />
          <span>새 목표 등록</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat 1: 팀원 수 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-[#5B5FED] rounded-xl">
              <Users size={20} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} className="mr-1" /> +12%
            </span>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            총 팀원
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
            24명
          </p>
        </div>

        {/* Stat 2: 목표 달성률 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            평균 목표 달성률
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-gray-900">78%</span>
              <span className="text-gray-400">목표 80%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[78%] rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* Stat 3: 미확인 피드백 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <span className="flex items-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              2건 긴급
            </span>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            미확인 피드백
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">5건</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: R&R Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ListTodo size={20} className="text-gray-400" />팀 R&R 현황
            </h3>
            <button className="text-xs font-semibold text-gray-500 hover:text-[#5B5FED] hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              전체보기
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">담당자</th>
                  <th className="px-6 py-4">핵심 과제 (R&R)</th>
                  <th className="px-6 py-4">진행률</th>
                  <th className="px-6 py-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockRnRData.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{item.task}</td>
                    <td className="px-6 py-4 w-32">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5B5FED] rounded-full"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                          {item.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.statusColor}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: 1on1s */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-gray-400" />
                오늘의 1on1
              </h3>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                Today
              </span>
            </div>
            <div className="space-y-4">
              {mockMeetings.map((meeting, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#5B5FED] hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5B5FED] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-center min-w-[3.5rem] py-1 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                    <p className="text-sm font-bold text-gray-900">{meeting.time}</p>
                    <p className="text-[10px] text-gray-400 font-bold">PM</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{meeting.name}</p>
                    <p className="text-xs text-gray-500">{meeting.role}</p>
                  </div>
                  <button className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:text-white group-hover:bg-[#5B5FED] transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <CheckCircle2 size={16} className="text-gray-400" />
                <span>최근 완료된 미팅</span>
              </div>
              <div className="opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                    L
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 decoration-gray-400">
                      Lee Design Lead
                    </p>
                    <p className="text-xs text-gray-400">어제, 11:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              전체 일정 관리
            </button>
          </div>
        </div>
      </div>

      {/* 애니메이션 정의 */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
