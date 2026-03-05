/**
 * 팀원별 미팅 히스토리 페이지 (Placeholder)
 *
 * Task 12에서 실제 구현 예정
 */

import { useParams } from 'react-router-dom';

export function MeetingHistoryPage() {
  const { empNo } = useParams<{ empNo: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">미팅 히스토리</h1>
      <p className="mt-2 text-sm text-gray-500">팀원 사번: {empNo}</p>
      <p className="mt-1 text-sm text-gray-500">Task 12에서 구현 예정입니다.</p>
    </div>
  );
}
