import React from 'react';
import { Plus, Users, CheckCircle2, MessageSquare, TrendingUp, ListTodo, Calendar, ChevronRight } from 'lucide-react';
import { Badge, Breadcrumb, Button, Card, Avatar, ProgressBar } from '@/core/ui';

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
    <div className="animate-fade-in-up space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: '대시보드' }
        ]}
      />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            안녕하세요, 김민수님! 👋
          </h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            오늘 예정된 1on1 미팅이{' '}
            <span className="text-primary font-bold">2건</span> 있습니다.
          </p>
        </div>
        <Button
          size="md"
          className="gap-2 px-6 shadow-primary/20 shadow-lg"
          icon={<Plus size={16} />}
        >
          새 목표 등록
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: 팀원 수 */}
        <Card className="p-6 transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/5 text-primary rounded-xl">
              <Users size={20} />
            </div>
            <span className="flex items-center text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
              <TrendingUp size={12} className="mr-1" /> +12%
            </span>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            총 팀원
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
            24명
          </p>
        </Card>

        {/* Stat 2: 목표 달성률 */}
        <Card className="p-6 transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            평균 목표 달성률
          </p>
          <div className="mt-4">
            <ProgressBar
              value={78}
              label=""
              color="bg-secondary"
              className="h-2.5"
            />
            <div className="flex justify-between text-[10px] mt-2 font-bold uppercase tracking-tighter">
              <span className="text-secondary">Current: 78%</span>
              <span className="text-gray-400">Target: 80%</span>
            </div>
          </div>
        </Card>

        {/* Stat 3: 미확인 피드백 */}
        <Card className="p-6 transition-all hover:translate-y-[-4px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent/10 text-accent rounded-xl">
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
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: R&R Table */}
        <Card className="xl:col-span-2 overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ListTodo size={20} className="text-primary/60" />팀 R&R 현황
            </h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold">
              전체보기
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-bold text-[10px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">담당자</th>
                  <th className="px-6 py-4">핵심 과제 (R&R)</th>
                  <th className="px-6 py-4">진행률</th>
                  <th className="px-6 py-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockRnRData.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Avatar initials={item.name[0]} size="sm" className="group-hover:border-primary/30 transition-colors" />
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{item.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{item.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{item.task}</td>
                    <td className="px-6 py-4 w-40">
                      <ProgressBar
                        value={item.progress}
                        color={item.status === '지연' ? 'bg-red-500' : 'bg-primary'}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.statusColor}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Col: 1on1s */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-secondary" />
                오늘의 1on1
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md uppercase tracking-wider">
                Today
              </span>
            </div>
            <div className="space-y-3">
              {mockMeetings.map((meeting, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-center min-w-[3.5rem] py-1 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                    <p className="text-sm font-bold text-gray-900">{meeting.time}</p>
                    <p className="text-[8px] text-gray-400 font-black uppercase">PM</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 leading-tight">{meeting.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{meeting.role}</p>
                  </div>
                  <button className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:text-white group-hover:bg-primary transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
                <CheckCircle2 size={14} />
                <span>최근 완료된 미팅</span>
              </div>
              <div className="opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/30">
                  <Avatar initials="L" size="sm" />
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      Lee Design Lead
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">어제, 11:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-6 text-xs font-bold h-11">
              전체 일정 관리
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
