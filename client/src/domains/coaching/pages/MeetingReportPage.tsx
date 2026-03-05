/**
 * 미팅 상세 리포트 페이지 (Placeholder)
 *
 * Task 12에서 실제 구현 예정 (Bento Grid)
 */

import { useParams } from 'react-router-dom';

export function MeetingReportPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">미팅 상세 리포트</h1>
      <p className="mt-2 text-sm text-gray-500">미팅 ID: {id}</p>
      <p className="mt-1 text-sm text-gray-500">Task 12에서 구현 예정입니다.</p>
    </div>
  );
}
