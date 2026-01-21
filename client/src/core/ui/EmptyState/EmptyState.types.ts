import type { LucideIcon } from 'lucide-react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  /** 아이콘 (Lucide React 아이콘) */
  icon?: LucideIcon;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 */
  action?: EmptyStateAction;
  /** 추가 CSS 클래스 */
  className?: string;
}
